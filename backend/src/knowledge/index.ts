import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { KnowledgeIndexerService } from './knowledge-indexer.service';

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try { await app.get(KnowledgeIndexerService).index(); } finally { await app.close(); }
}
void run();
