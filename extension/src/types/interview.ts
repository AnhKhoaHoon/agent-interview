export type PanelStatus = 'idle' | 'connected' | 'thinking' | 'streaming' | 'error';
export type ChatRole = 'interviewer' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  questionId?: string;
  keywords?: string[];
  status?: 'transcribing' | 'streaming' | 'failed';
  retryable?: boolean;
}

export interface InterviewSession {
  id: string;
  role: 'devops';
  status: 'active' | 'ended';
  createdAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  requestId: string;
}
