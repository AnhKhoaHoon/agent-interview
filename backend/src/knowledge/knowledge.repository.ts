import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../persistence/database.service';

export interface KnowledgeDocumentInput { id: string; category: string; sourcePath: string; sourceHash: string; version: string; content: string; }
export interface KnowledgeChunkInput { id: string; chunkIndex: number; text: string; embedding: number[]; metadata: Record<string, string | number>; }
export interface RetrievedKnowledgeChunk { sourcePath: string; category: string; text: string; score: number; }

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
         VALUES ($1, 'devops', $2, $3, $4, $5, $6)`,
        [input.id, input.category, input.sourcePath, input.sourceHash, input.version, input.content]
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

  async search(queryEmbedding: number[], maxChunks: number): Promise<RetrievedKnowledgeChunk[]> {
    const result = await this.database.query<{ source_path: string; category: string; chunk_text: string; score: string }>(
      `SELECT d.source_path, d.category, c.chunk_text, (1 - (c.embedding <=> $1::vector)) AS score
         FROM knowledge_chunks c JOIN knowledge_documents d ON d.id = c.document_id
        WHERE d.role = 'devops'
        ORDER BY c.embedding <=> $1::vector ASC LIMIT $2`,
      [vector(queryEmbedding), maxChunks]
    );
    return result.rows.map((row) => ({ sourcePath: row.source_path, category: row.category, text: row.chunk_text, score: Number(row.score) }));
  }
}
