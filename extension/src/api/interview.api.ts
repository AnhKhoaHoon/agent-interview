import { API_BASE_URL, ApiClientError, requestJson } from './client';
import type { ApiError, InterviewSession } from '../types/interview';

export interface QuestionAccepted {
  questionId: string;
  accepted: true;
}

export interface TranscriptionAccepted {
  messageId: string;
  questionId: string;
  text: string;
  language: string;
  durationMs: number;
}

export function createInterview(): Promise<InterviewSession> {
  return requestJson<InterviewSession>('/interviews', {
    method: 'POST',
    body: JSON.stringify({ role: 'devops' })
  });
}

export function endInterview(interviewId: string): Promise<InterviewSession> {
  return requestJson<InterviewSession>(`/interviews/${encodeURIComponent(interviewId)}/end`, { method: 'POST' });
}

export function askQuestion(interviewId: string, question: string): Promise<QuestionAccepted> {
  return requestJson<QuestionAccepted>(`/interviews/${encodeURIComponent(interviewId)}/questions`, {
    method: 'POST',
    body: JSON.stringify({ question })
  });
}

export function eventStreamUrl(interviewId: string): string {
  return `${API_BASE_URL}/interviews/${encodeURIComponent(interviewId)}/events`;
}

export async function uploadTranscription(
  interviewId: string,
  audio: Blob,
  durationMs: number,
  segmentId: string,
  speechEndedAtMs: number
): Promise<TranscriptionAccepted> {
  const body = new FormData();
  body.append('audio', audio, 'utterance.webm');
  body.append('durationMs', String(Math.round(durationMs)));
  body.append('segmentId', segmentId);
  body.append('speechEndedAtMs', String(Math.round(speechEndedAtMs)));
  const response = await fetch(`${API_BASE_URL}/interviews/${encodeURIComponent(interviewId)}/transcriptions`, {
    method: 'POST',
    body
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      code: 'NETWORK_ERROR',
      message: `Backend request failed with ${response.status}`,
      retryable: response.status >= 500,
      requestId: 'unavailable'
    }))) as ApiError;
    throw new ApiClientError(error, response.status);
  }
  return response.json() as Promise<TranscriptionAccepted>;
}

export interface AnswerRetryAccepted {
  questionId: string;
  answerMessageId: string;
  accepted: true;
}

export function retryAnswer(interviewId: string, questionId: string): Promise<AnswerRetryAccepted> {
  return requestJson<AnswerRetryAccepted>(
    `/interviews/${encodeURIComponent(interviewId)}/questions/${encodeURIComponent(questionId)}/answer/retry`,
    { method: 'POST' }
  );
}
