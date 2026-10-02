import type { ChatMessage } from '../../types/interview';

interface ChatBubbleProps {
  message: ChatMessage;
  onRetryTranscription?: (messageId: string) => void;
  onRetryAnswer?: (questionId: string) => void;
}

export function ChatBubble({ message, onRetryTranscription, onRetryAnswer }: ChatBubbleProps): JSX.Element {
  const isInterviewer = message.role === 'interviewer';
  const label = isInterviewer ? 'Interviewer' : 'AI answer';
  const detail = isInterviewer
    ? message.status === 'transcribing' ? 'Transcribing question' : 'Interview question'
    : message.status === 'streaming' ? 'Streaming answer' : 'Candidate-ready answer';
  return (
    <article className={`chat-bubble ${message.role}`}>
      <header className="chat-bubble-header">
        <span className="chat-role-avatar" aria-hidden="true">{isInterviewer ? 'I' : 'AI'}</span>
        <span>
          <h3>{label}</h3>
          <small>{detail}</small>
        </span>
        {message.status === 'streaming' && <span className="streaming-indicator" aria-label="Answer is streaming"><i /><i /><i /></span>}
      </header>
      <p>{message.content || '…'}</p>
      {message.status === 'failed' && message.retryable && message.role === 'interviewer' && onRetryTranscription && <button className="retry-button" type="button" onClick={() => onRetryTranscription(message.id)}>Retry transcription</button>}
      {message.status === 'failed' && message.retryable && message.role === 'assistant' && message.questionId && onRetryAnswer && <button className="retry-button" type="button" onClick={() => onRetryAnswer(message.questionId!)}>Retry answer</button>}
      {message.keywords && <div className="keywords">{message.keywords.join(' • ')}</div>}
    </article>
  );
}
