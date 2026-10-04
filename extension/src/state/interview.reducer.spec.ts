import { describe, expect, it } from 'vitest';
import { initialPanelState, interviewReducer } from './interview.reducer';

describe('interviewReducer', () => {
  it('renders interviewer and streamed assistant messages separately', () => {
    let state = interviewReducer(initialPanelState, {
      type: 'add-question',
      message: { id: 'q1', role: 'interviewer', content: 'What is Kubernetes HPA?' }
    });
    state = interviewReducer(state, { type: 'streaming', messageId: 'a1', questionId: 'q1' });
    state = interviewReducer(state, { type: 'append-token', messageId: 'a1', questionId: 'q1', text: 'Kubernetes ' });
    state = interviewReducer(state, { type: 'append-token', messageId: 'a1', questionId: 'q1', text: 'HPA scales pods.' });

    expect(state.status).toBe('streaming');
    expect(state.messages).toEqual([
      { id: 'q1', role: 'interviewer', content: 'What is Kubernetes HPA?' },
      { id: 'a1', role: 'assistant', questionId: 'q1', content: 'Kubernetes HPA scales pods.', status: 'streaming' }
    ]);
  });

  it('keeps an error visible for connection failures', () => {
    expect(interviewReducer(initialPanelState, { type: 'error', message: 'Backend connection lost' }))
      .toMatchObject({ status: 'error', error: 'Backend connection lost' });
  });

  it('replaces a transcribing bubble with its final transcript', () => {
    let state = interviewReducer(initialPanelState, { type: 'transcribing', temporaryId: 'segment-1' });
    state = interviewReducer(state, {
      type: 'transcribed',
      temporaryId: 'segment-1',
      message: { id: 'q1', role: 'interviewer', content: 'What is Kubernetes HPA?' }
    });
    expect(state.messages).toEqual([{ id: 'q1', role: 'interviewer', content: 'What is Kubernetes HPA?' }]);
  });

  it('preserves the original transcript while keeping a separate interpretation for the answer', () => {
    let state = interviewReducer(initialPanelState, { type: 'transcribing', temporaryId: 'segment-1' });
    state = interviewReducer(state, {
      type: 'transcribed',
      temporaryId: 'segment-1',
      message: { id: 'q1', role: 'interviewer', content: 'Zen tin là gì?', understoodText: 'Jenkins là gì?' }
    });

    expect(state.messages).toEqual([{
      id: 'q1', role: 'interviewer', content: 'Zen tin là gì?', understoodText: 'Jenkins là gì?'
    }]);
  });

  it('keeps concurrent streamed answers correlated to their questions and returns connected only after both complete', () => {
    let state = interviewReducer(initialPanelState, {
      type: 'add-question',
      message: { id: 'q1', role: 'interviewer', content: 'First question' }
    });
    state = interviewReducer(state, { type: 'streaming', messageId: 'a1', questionId: 'q1' });
    state = interviewReducer(state, {
      type: 'add-question',
      message: { id: 'q2', role: 'interviewer', content: 'Second question' }
    });
    state = interviewReducer(state, { type: 'streaming', messageId: 'a2', questionId: 'q2' });
    state = interviewReducer(state, { type: 'append-token', messageId: 'a1', questionId: 'q1', text: 'First answer' });
    state = interviewReducer(state, { type: 'append-token', messageId: 'a2', questionId: 'q2', text: 'Second answer' });
    state = interviewReducer(state, { type: 'completed', messageId: 'a1', questionId: 'q1' });

    expect(state.status).toBe('streaming');
    expect(state.messages.map(({ id, questionId, content }) => ({ id, questionId, content }))).toEqual([
      { id: 'q1', questionId: undefined, content: 'First question' },
      { id: 'a1', questionId: 'q1', content: 'First answer' },
      { id: 'q2', questionId: undefined, content: 'Second question' },
      { id: 'a2', questionId: 'q2', content: 'Second answer' }
    ]);

    state = interviewReducer(state, { type: 'completed', messageId: 'a2', questionId: 'q2' });
    expect(state.status).toBe('connected');
  });

  it('preserves an interviewer transcript and exposes a failed assistant answer for retry', () => {
    let state = interviewReducer(initialPanelState, {
      type: 'add-question',
      message: { id: 'q1', role: 'interviewer', content: 'What is Kubernetes HPA?' }
    });
    state = interviewReducer(state, { type: 'streaming', messageId: 'a1', questionId: 'q1' });
    state = interviewReducer(state, {
      type: 'answer-error',
      messageId: 'a1',
      questionId: 'q1',
      message: 'Provider timed out',
      retryable: true
    });

    expect(state.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'q1', role: 'interviewer', content: 'What is Kubernetes HPA?' }),
      expect.objectContaining({ id: 'a1', role: 'assistant', questionId: 'q1', status: 'failed', retryable: true })
    ]));
  });

  it('rejects a token whose question correlation does not match the assistant bubble', () => {
    let state = interviewReducer(initialPanelState, {
      type: 'add-question',
      message: { id: 'q1', role: 'interviewer', content: 'First question' }
    });
    state = interviewReducer(state, { type: 'streaming', messageId: 'a1', questionId: 'q1' });
    state = interviewReducer(state, {
      type: 'add-question',
      message: { id: 'q2', role: 'interviewer', content: 'Second question' }
    });
    state = interviewReducer(state, { type: 'streaming', messageId: 'a2', questionId: 'q2' });
    state = interviewReducer(state, { type: 'append-token', messageId: 'a1', questionId: 'q1', text: 'Only A1. ' });
    state = interviewReducer(state, { type: 'append-token', messageId: 'a2', questionId: 'q1', text: 'Must be ignored.' });
    state = interviewReducer(state, { type: 'append-token', messageId: 'a2', questionId: 'q2', text: 'Only A2.' });

    expect(state.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'a1', questionId: 'q1', content: 'Only A1. ' }),
      expect.objectContaining({ id: 'a2', questionId: 'q2', content: 'Only A2.' })
    ]));
  });
});
