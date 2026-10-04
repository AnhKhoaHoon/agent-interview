import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { ConversationMessage } from '../ai/contracts';
import { Interview, InterviewMessage, InterviewStatus, MessageRole, MessageStatus } from '../interview/interview.types';
import { DatabaseService } from './database.service';
import {
  CompleteAiResponseInput,
  InterviewRepository,
  PersistedTranscription,
  SaveTranscriptionInput,
  StartAiResponseInput
} from './interview.repository';

interface InterviewRow {
  id: string;
  role: 'devops';
  status: InterviewStatus;
  created_at: Date;
  ended_at: Date | null;
}

interface MessageRow {
  id: string;
  interview_id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  sequence_no: number;
  question_id: string | null;
  speech_ended_at_ms: string | null;
  created_at: Date;
}

@Injectable()
export class PostgresInterviewRepository extends InterviewRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async createInterview(interview: Interview, accessTokenHash: string): Promise<void> {
    await this.database.query(
      `INSERT INTO interviews (id, role, status, started_at, created_at, access_token_hash)
       VALUES ($1, $2, $3, $4, $4, $5)`,
      [interview.id, interview.role, interview.status, interview.createdAt, accessTokenHash]
    );
  }

  async hasAccess(interviewId: string, accessTokenHash: string): Promise<boolean> {
    const result = await this.database.query(
      'SELECT 1 FROM interviews WHERE id = $1 AND access_token_hash = $2',
      [interviewId, accessTokenHash]
    );
    return result.rowCount === 1;
  }

  async findInterview(id: string): Promise<Interview | undefined> {
    const result = await this.database.query<InterviewRow>(
      'SELECT id, role, status, created_at, ended_at FROM interviews WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      role: row.role,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      ...(row.ended_at ? { endedAt: row.ended_at.toISOString() } : {}),
      messages: await this.listMessages(id)
    };
  }

  async listMessages(interviewId: string): Promise<InterviewMessage[]> {
    const result = await this.database.query<MessageRow>(
      `SELECT id, interview_id, role, content, status, sequence_no, question_id,
              speech_ended_at_ms, created_at
         FROM messages
        WHERE interview_id = $1
        ORDER BY sequence_no ASC`,
      [interviewId]
    );
    return result.rows.map((row) => this.toMessage(row));
  }

  async endInterview(interviewId: string, endedAt: string): Promise<void> {
    await this.database.query(
      `UPDATE interviews
          SET status = 'ended', ended_at = $2
        WHERE id = $1 AND status = 'active'`,
      [interviewId, endedAt]
    );
  }

  async appendMessage(message: Omit<InterviewMessage, 'sequenceNo'>): Promise<InterviewMessage> {
    return this.database.transaction(async (client) => {
      const interview = await client.query<{ status: InterviewStatus }>(
        'SELECT status FROM interviews WHERE id = $1 FOR UPDATE',
        [message.interviewId]
      );
      if (!interview.rows[0]) throw new Error('INTERVIEW_NOT_FOUND');
      if (interview.rows[0].status !== 'active') throw new Error('INTERVIEW_NOT_ACTIVE');
      const sequence = await client.query<{ next_sequence: number }>(
        'SELECT COALESCE(MAX(sequence_no), 0) + 1 AS next_sequence FROM messages WHERE interview_id = $1',
        [message.interviewId]
      );
      const sequenceNo = Number(sequence.rows[0].next_sequence);
      await this.insertMessage(client, message, sequenceNo);
      return { ...message, sequenceNo };
    });
  }

  async updateMessage(message: Pick<InterviewMessage, 'id' | 'content' | 'status'>): Promise<void> {
    await this.database.query(
      'UPDATE messages SET content = $2, status = $3, updated_at = NOW() WHERE id = $1',
      [message.id, message.content, message.status]
    );
  }

  async findTranscriptionBySegment(interviewId: string, segmentId: string): Promise<PersistedTranscription | undefined> {
    const result = await this.database.query<{
      message_id: string;
      content: string;
      language: string;
      duration_ms: number;
    }>(
      `SELECT t.message_id, m.content, t.language, t.duration_ms
         FROM transcriptions t
         JOIN messages m ON m.id = t.message_id
        WHERE t.interview_id = $1 AND t.segment_id = $2`,
      [interviewId, segmentId]
    );
    const row = result.rows[0];
    return row ? { messageId: row.message_id, questionId: row.message_id, text: row.content, language: row.language, durationMs: row.duration_ms } : undefined;
  }

  async saveTranscription(input: SaveTranscriptionInput): Promise<void> {
    await this.database.query(
      `INSERT INTO transcriptions
         (id, interview_id, message_id, segment_id, provider, language, duration_ms, latency_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [input.id, input.interviewId, input.messageId, input.segmentId ?? null, input.provider, input.language, input.durationMs, input.latencyMs]
    );
  }

  async findAnswerContext(messageId: string): Promise<ConversationMessage[] | undefined> {
    const result = await this.database.query<{ context_snapshot: ConversationMessage[] }>(
      'SELECT context_snapshot FROM ai_responses WHERE message_id = $1',
      [messageId]
    );
    return result.rows[0]?.context_snapshot;
  }

  async startAiResponse(input: StartAiResponseInput): Promise<void> {
    await this.database.query(
      `INSERT INTO ai_responses
         (id, message_id, provider, model, prompt_version, context_snapshot, started_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
       ON CONFLICT (message_id) DO UPDATE SET
         provider = EXCLUDED.provider,
         model = EXCLUDED.model,
         prompt_version = EXCLUDED.prompt_version,
         started_at = NOW(),
         completed_at = NULL,
         first_token_ms = NULL,
         total_latency_ms = NULL,
         speech_end_to_first_answer_ms = NULL`,
      [input.id, input.messageId, input.provider, input.model ?? null, input.promptVersion, JSON.stringify(input.contextSnapshot)]
    );
  }

  async completeAiResponse(input: CompleteAiResponseInput): Promise<void> {
    await this.database.query(
      `UPDATE ai_responses
          SET first_token_ms = $2,
              total_latency_ms = $3,
              speech_end_to_first_answer_ms = $4,
              completed_at = NOW()
        WHERE message_id = $1`,
      [input.messageId, input.firstTokenMs, input.totalLatencyMs, input.speechEndToFirstAnswerMs ?? null]
    );
  }

  private async insertMessage(client: PoolClient, message: Omit<InterviewMessage, 'sequenceNo'>, sequenceNo: number): Promise<void> {
    await client.query(
      `INSERT INTO messages
         (id, interview_id, role, content, status, sequence_no, question_id,
          speech_ended_at_ms, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
      [
        message.id,
        message.interviewId,
        message.role,
        message.content,
        message.status,
        sequenceNo,
        message.questionId ?? null,
        message.speechEndedAtMs ?? null,
        message.createdAt
      ]
    );
  }

  private toMessage(row: MessageRow): InterviewMessage {
    return {
      id: row.id,
      interviewId: row.interview_id,
      role: row.role,
      content: row.content,
      status: row.status,
      sequenceNo: row.sequence_no,
      createdAt: row.created_at.toISOString(),
      ...(row.question_id ? { questionId: row.question_id } : {}),
      ...(row.speech_ended_at_ms ? { speechEndedAtMs: Number(row.speech_ended_at_ms) } : {})
    };
  }
}
