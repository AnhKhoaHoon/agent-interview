import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../persistence/database.service';
import { InterviewRole } from '../roles/interview-role';

export interface KnowledgeDocumentInput { id: string; role: InterviewRole; category: string; sourcePath: string; sourceHash: string; version: string; content: string; }
export interface KnowledgeChunkInput { id: string; chunkIndex: number; text: string; embedding: number[]; metadata: Record<string, string | number>; }
export interface RetrievedKnowledgeChunk { sourcePath: string; category: string; text: string; score: number; }
export interface KeywordKnowledgeChunk extends RetrievedKnowledgeChunk { keywordScore: number; }

function vector(values: number[]): string { return `[${values.join(',')}]`; }

@Injectable()
export class KnowledgeRepository {
  constructor(private readonly database: DatabaseService) {}

  async sourceHash(sourcePath: string): Promise<string | undefined> {
    const result = await this.database.query<{ source_hash: string }>('SELECT source_hash FROM knowledge_documents WHERE source_path = $1', [sourcePath]);
    return result.rows[0]?.source_hash;
  }

  async replace(input: KnowledgeDocumentInput, chunks: KnowledgeChunkInput[]): Promise<void> {
    await this.database.transaction(async (client) => {
      await client.query('DELETE FROM knowledge_documents WHERE source_path = $1', [input.sourcePath]);
      await client.query(
        `INSERT INTO knowledge_documents (id, role, category, source_path, source_hash, version, content)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [input.id, input.role, input.category, input.sourcePath, input.sourceHash, input.version, input.content]
      );
      for (const chunk of chunks) {
        await client.query(
          `INSERT INTO knowledge_chunks (id, document_id, chunk_index, chunk_text, embedding, metadata)
           VALUES ($1, $2, $3, $4, $5::vector, $6::jsonb)`,
          [chunk.id, input.id, chunk.chunkIndex, chunk.text, vector(chunk.embedding), JSON.stringify(chunk.metadata)]
        );
      }
    });
  }

  async semanticSearch(role: InterviewRole, queryEmbedding: number[], categories: string[], maxChunks: number): Promise<RetrievedKnowledgeChunk[]> {
    if (!categories.length) return [];
    const result = await this.database.query<{ source_path: string; category: string; chunk_text: string; score: string }>(
      `SELECT d.source_path, d.category, c.chunk_text, (1 - (c.embedding <=> $1::vector)) AS score
         FROM knowledge_chunks c JOIN knowledge_documents d ON d.id = c.document_id
        WHERE d.role = $2 AND d.category = ANY($3::text[])
        ORDER BY c.embedding <=> $1::vector ASC LIMIT $4`,
      [vector(queryEmbedding), role, categories, maxChunks]
    );
    return result.rows.map((row) => ({ sourcePath: row.source_path, category: row.category, text: row.chunk_text, score: Number(row.score) }));
  }

  async keywordSearch(role: InterviewRole, terms: string[], categories: string[], maxChunks: number): Promise<KeywordKnowledgeChunk[]> {
    if (!terms.length || !categories.length) return [];
    const result = await this.database.query<{ source_path: string; category: string; chunk_text: string; keyword_score: string }>(
      `WITH terms AS (SELECT DISTINCT unnest($1::text[]) AS term)
       SELECT d.source_path, d.category, c.chunk_text,
              COUNT(DISTINCT terms.term)::float / $4::float AS keyword_score
         FROM knowledge_chunks c
         JOIN knowledge_documents d ON d.id = c.document_id
         JOIN terms ON to_tsvector('simple', c.chunk_text) @@ plainto_tsquery('simple', terms.term)
        WHERE d.role = $2 AND d.category = ANY($3::text[])
        GROUP BY c.id, d.source_path, d.category, c.chunk_text
        ORDER BY keyword_score DESC, length(c.chunk_text) ASC
        LIMIT $5`,
      [terms, role, categories, terms.length, maxChunks]
    );
    return result.rows.map((row) => ({
      sourcePath: row.source_path,
      category: row.category,
      text: row.chunk_text,
      score: Number(row.keyword_score),
      keywordScore: Number(row.keyword_score)
    }));
  }
}
