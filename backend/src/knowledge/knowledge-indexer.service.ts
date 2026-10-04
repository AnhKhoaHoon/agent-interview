import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { EmbeddingProviderFactory } from './embedding-provider.factory';
import { KnowledgeRepository } from './knowledge.repository';

const MAX_CHARS = 1_400;

@Injectable()
export class KnowledgeIndexerService {
  private readonly logger = new Logger(KnowledgeIndexerService.name);
  constructor(private readonly embeddings: EmbeddingProviderFactory, private readonly repository: KnowledgeRepository) {}

  async index(): Promise<{ indexed: number; skipped: number; chunks: number }> {
    const root = process.env.KNOWLEDGE_DIRECTORY ?? '/app/knowledge';
    const files = (await markdownFiles(root)).filter((file) => /[\\/]devops[\\/]/.test(file));
    let indexed = 0; let skipped = 0; let chunks = 0;
    for (const file of files) {
      const content = await readFile(file, 'utf8');
      const sourcePath = relative(root, file).replaceAll('\\', '/');
      const sourceHash = createHash('sha256').update(content).digest('hex');
      if (await this.repository.sourceHash(sourcePath) === sourceHash) { skipped += 1; continue; }
      const textChunks = chunkMarkdown(content);
      const vectors = await this.embeddings.getConfiguredProvider().embed(textChunks);
      if (vectors.length !== textChunks.length) throw new Error(`Embedding count mismatch for ${sourcePath}`);
      const category = sourcePath.split('/')[1] ?? 'general';
      await this.repository.replace(
        { id: randomUUID(), category, sourcePath, sourceHash, version: sourceHash.slice(0, 12), content },
        textChunks.map((text, chunkIndex) => ({ id: randomUUID(), chunkIndex, text, embedding: vectors[chunkIndex], metadata: { sourcePath, category, chunkIndex } }))
      );
      indexed += 1; chunks += textChunks.length;
    }
    this.logger.log(JSON.stringify({ event: 'rag.index.completed', indexed, skipped, chunks }));
    return { indexed, skipped, chunks };
  }
}

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.isFile() && entry.name.endsWith('.md') ? Promise.resolve([path]) : Promise.resolve([]);
  }));
  return nested.flat();
}

export function chunkMarkdown(content: string): string[] {
  const sections = content.replaceAll('\r\n', '\n').split(/(?=^#{1,3}\s)/m).map((section) => section.trim()).filter(Boolean);
  const chunks: string[] = [];
  for (const section of sections) {
    if (section.length <= MAX_CHARS) { chunks.push(section); continue; }
    for (let offset = 0; offset < section.length; offset += MAX_CHARS) chunks.push(section.slice(offset, offset + MAX_CHARS));
  }
  return chunks;
}
