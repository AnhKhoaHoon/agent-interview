import type { ChatMessage, PanelStatus } from '../types/interview';

export interface PanelState {
  status: PanelStatus;
  messages: ChatMessage[];
  activeAnswerIds: string[];
  error?: string;
}

export type PanelAction =
  | { type: 'connected' }
  | { type: 'thinking' }
  | { type: 'streaming'; messageId: string; questionId: string }
  | { type: 'add-question'; message: ChatMessage }
  | { type: 'transcribing'; temporaryId: string }
  | { type: 'transcribed'; temporaryId: string; message: ChatMessage }
  | { type: 'transcription-error'; temporaryId: string; message: string; retryable: boolean }
  | { type: 'discard-question'; questionId: string }
  | { type: 'append-token'; messageId: string; questionId: string; text: string }
  | { type: 'keywords'; messageId: string; questionId: string; keywords: string[] }
  | { type: 'completed'; messageId: string; questionId: string }
  | { type: 'answer-error'; messageId: string; questionId: string; message: string; retryable: boolean }
  | { type: 'error'; message: string }
  | { type: 'reset' };

export const initialPanelState: PanelState = { status: 'idle', messages: [], activeAnswerIds: [] };

export function interviewReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'connected':
      return { ...state, status: 'connected', error: undefined };
    case 'thinking':
      return { ...state, status: 'thinking', error: undefined };
    case 'streaming':
      {
        const existing = state.messages.find((message) => message.id === action.messageId);
        if (existing && existing.questionId !== action.questionId) return state;
        const assistant: ChatMessage = { id: action.messageId, role: 'assistant', content: '', questionId: action.questionId, status: 'streaming' };
        const questionIndex = state.messages.findIndex((message) => message.id === action.questionId);
        const messages = existing
          ? state.messages.map((message) => message.id === action.messageId
            ? { ...message, content: '', questionId: action.questionId, status: 'streaming' as const, retryable: undefined }
            : message)
          : questionIndex >= 0
            ? [...state.messages.slice(0, questionIndex + 1), assistant, ...state.messages.slice(questionIndex + 1)]
            : [...state.messages, assistant];
      return {
        ...state,
        status: 'streaming',
        activeAnswerIds: state.activeAnswerIds.includes(action.messageId)
          ? state.activeAnswerIds
          : [...state.activeAnswerIds, action.messageId],
        messages
      };
      }
    case 'add-question':
      return {
        ...state,
        messages: state.messages.some((message) => message.id === action.message.id)
          ? state.messages
          : [...state.messages, action.message]
      };
    case 'transcribing':
      return {
        ...state,
        messages: state.messages.some((message) => message.id === action.temporaryId)
          ? state.messages.map((message) => message.id === action.temporaryId
            ? { ...message, content: 'Transcribing…', status: 'transcribing', retryable: undefined }
            : message)
          : [...state.messages, { id: action.temporaryId, role: 'interviewer', content: 'Transcribing…', status: 'transcribing' }]
      };
    case 'transcribed':
      return {
        ...state,
        messages: state.messages.some((message) => message.id === action.message.id)
          ? state.messages.filter((message) => message.id !== action.temporaryId)
          : state.messages.map((message) => message.id === action.temporaryId ? action.message : message)
      };
    case 'transcription-error':
      return {
        ...state,
        messages: state.messages.map((message) => message.id === action.temporaryId
          ? { ...message, content: action.message, status: 'failed', retryable: action.retryable }
          : message)
      };
    case 'discard-question': {
      const removedAnswerIds = new Set(
        state.messages
          .filter((message) => message.questionId === action.questionId)
          .map((message) => message.id)
      );
      const activeAnswerIds = state.activeAnswerIds.filter((messageId) => !removedAnswerIds.has(messageId));
      return {
        ...state,
        status: state.status === 'streaming' && activeAnswerIds.length === 0 ? 'connected' : state.status,
        activeAnswerIds,
        messages: state.messages.filter((message) => message.id !== action.questionId && message.questionId !== action.questionId)
      };
    }
    case 'append-token':
      return {
        ...state,
        messages: state.messages.map((message) => message.id === action.messageId && message.questionId === action.questionId
          ? { ...message, content: `${message.content}${action.text}` }
          : message)
      };
    case 'keywords':
      return {
        ...state,
        messages: state.messages.map((message) => message.id === action.messageId && message.questionId === action.questionId
          ? { ...message, keywords: action.keywords }
          : message)
      };
    case 'completed': {
      const answer = state.messages.find((message) => message.id === action.messageId);
      if (!answer || answer.questionId !== action.questionId) return state;
      const activeAnswerIds = state.activeAnswerIds.filter((messageId) => messageId !== action.messageId);
      return {
        ...state,
        activeAnswerIds,
        status: activeAnswerIds.length ? 'streaming' : 'connected',
        messages: state.messages.map((message) => message.id === action.messageId && message.questionId === action.questionId
          ? { ...message, status: undefined }
          : message)
      };
    }
    case 'answer-error': {
      const answer = state.messages.find((message) => message.id === action.messageId);
      if (!answer || answer.questionId !== action.questionId) return state;
      const activeAnswerIds = state.activeAnswerIds.filter((messageId) => messageId !== action.messageId);
      return {
        ...state,
        activeAnswerIds,
        status: activeAnswerIds.length ? 'streaming' : 'connected',
        messages: state.messages.map((message) => message.id === action.messageId && message.questionId === action.questionId
          ? { ...message, content: `Answer failed: ${action.message}`, questionId: action.questionId, status: 'failed', retryable: action.retryable }
          : message)
      };
    }
    case 'error':
      return { ...state, status: 'error', error: action.message };
    case 'reset':
      return initialPanelState;
  }
}
