import { useLayoutEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/interview';
import { ChatBubble } from './ChatBubble';

const BOTTOM_THRESHOLD_PX = 72;

interface ChatWindowProps {
  messages: ChatMessage[];
  hasSession: boolean;
  onRetryTranscription?: (messageId: string) => void;
  onRetryAnswer?: (questionId: string) => void;
}

export function ChatWindow({ messages, hasSession, onRetryTranscription, onRetryAnswer }: ChatWindowProps): JSX.Element {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom <= BOTTOM_THRESHOLD_PX) container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <section className="conversation-panel" aria-label="Interview conversation">
      <header className="conversation-panel-header">
        <div>
          <span className="conversation-eyebrow">Live conversation</span>
          <h2>Interview chat</h2>
        </div>
        <span className={`conversation-state ${hasSession ? 'is-ready' : ''}`} aria-live="polite">
          {messages.length ? `${messages.length} message${messages.length === 1 ? '' : 's'}` : hasSession ? 'Waiting' : 'Not started'}
        </span>
      </header>
      <div className="chat-window" ref={scrollContainerRef}>
        {messages.length === 0 ? (
          <section className="interview-chat-preview" aria-label="Interview chat preview">
            <p className="preview-introduction">{hasSession ? 'Listening for the interviewer. This is how each turn will appear.' : 'Start a session to turn this preview into your live interview conversation.'}</p>
            <article className="chat-bubble interviewer preview-bubble">
              <header className="chat-bubble-header">
                <span className="chat-role-avatar" aria-hidden="true">I</span>
                <span><h3>Interviewer</h3><small>Interview question</small></span>
              </header>
              <p>Your transcribed interview question will appear here.</p>
            </article>
            <article className="chat-bubble assistant preview-bubble">
              <header className="chat-bubble-header">
                <span className="chat-role-avatar" aria-hidden="true">AI</span>
                <span><h3>AI answer</h3><small>Candidate-ready answer</small></span>
              </header>
              <p>A concise DevOps answer will stream here, linked to that question.</p>
            </article>
            <p className="preview-footnote">Listen → Transcribe → Answer → Continue</p>
          </section>
        ) : messages.map((message) => <ChatBubble key={message.id} message={message} onRetryTranscription={onRetryTranscription} onRetryAnswer={onRetryAnswer} />)}
      </div>
    </section>
  );
}
