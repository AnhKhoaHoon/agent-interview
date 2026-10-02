import { ContextBuilderService } from './context-builder.service';

describe('ContextBuilderService', () => {
  it('keeps only the ten most recent messages', () => {
    const messages = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? ('interviewer' as const) : ('assistant' as const),
      content: `message-${index}`
    }));
    const result = new ContextBuilderService().build(messages);
    expect(result).toHaveLength(10);
    expect(result[0].content).toBe('message-2');
  });

  it('does not start bounded history with an answer whose question was trimmed', () => {
    const messages = Array.from({ length: 11 }, (_, index) => ({
      role: index % 2 === 0 ? ('interviewer' as const) : ('assistant' as const),
      content: `message-${index}`
    }));

    const result = new ContextBuilderService().build(messages);

    expect(result).toHaveLength(9);
    expect(result[0]).toEqual({ role: 'interviewer', content: 'message-2' });
  });
});
