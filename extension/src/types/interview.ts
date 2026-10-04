export type PanelStatus = 'idle' | 'connected' | 'thinking' | 'streaming' | 'error';
export type ChatRole = 'interviewer' | 'assistant';
export type TranscriptionLanguage = 'vi' | 'en';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Backend interpretation of a recognized DevOps term; content remains the raw STT transcript. */
  understoodText?: string;
  questionId?: string;
  keywords?: string[];
  status?: 'transcribing' | 'streaming' | 'failed';
  retryable?: boolean;
}

export interface InterviewSessionSummary {
  id: string;
  role: 'devops';
  status: 'active' | 'ended';
  createdAt: string;
  endedAt?: string;
}

export interface InterviewSession extends InterviewSessionSummary {
  /** Ephemeral per-session credential. Never persisted in extension storage. */
  accessToken: string;
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  requestId: string;
}
