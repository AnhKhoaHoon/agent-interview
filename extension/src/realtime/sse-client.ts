import type { InterviewEvent, InterviewEventName } from '../types/events';

const eventNames = new Set<InterviewEventName>([
  'session.ready', 'question.transcribing', 'question.transcribed', 'question.cancelled', 'answer.started',
  'answer.token', 'answer.keywords', 'answer.completed', 'answer.error', 'session.error'
]);

export interface SseHandlers {
  onOpen: () => void;
  onEvent: (event: InterviewEvent) => void;
  onError: () => void;
}

export interface SseConnection {
  close: () => void;
}

export function connectInterviewEvents(url: string, accessToken: string, handlers: SseHandlers): SseConnection {
  const controller = new AbortController();
  void reconnectingStream(url, accessToken, handlers, controller.signal);
  return { close: () => controller.abort() };
}

async function reconnectingStream(
  url: string,
  accessToken: string,
  handlers: SseHandlers,
  signal: AbortSignal
): Promise<void> {
  while (!signal.aborted) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'text/event-stream', Authorization: `Bearer ${accessToken}` },
        signal
      });
      if (!response.ok || !response.body) throw new Error(`SSE connection failed with ${response.status}`);
      handlers.onOpen();
      await consumeEventStream(response.body, handlers, signal);
      if (!signal.aborted) handlers.onError();
    } catch {
      if (!signal.aborted) handlers.onError();
    }
    if (!signal.aborted) await abortableDelay(1_000, signal);
  }
}

async function consumeEventStream(stream: ReadableStream<Uint8Array>, handlers: SseHandlers, signal: AbortSignal): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        dispatchFrame(buffer.slice(0, boundary), handlers);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function dispatchFrame(frame: string, handlers: SseHandlers): void {
  let eventName: string | undefined;
  const dataLines: string[] = [];
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  if (!eventName || !eventNames.has(eventName as InterviewEventName) || dataLines.length === 0) return;
  try {
    handlers.onEvent({
      type: eventName as InterviewEventName,
      data: JSON.parse(dataLines.join('\n')) as Record<string, unknown>
    });
  } catch {
    handlers.onError();
  }
}

function abortableDelay(durationMs: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timeout = window.setTimeout(resolve, durationMs);
    signal.addEventListener('abort', () => {
      window.clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}
