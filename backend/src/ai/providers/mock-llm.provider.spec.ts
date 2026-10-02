import { MockLlmProvider } from './mock-llm.provider';

describe('MockLlmProvider', () => {
  it('streams a deterministic answer without an API key', async () => {
    const originalApiKey = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY;
    try {
      const chunks: string[] = [];
      for await (const chunk of new MockLlmProvider().stream({ instructions: 'ignored', input: 'What is Kubernetes HPA?' })) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.join('')).toContain('Kubernetes HPA');
    } finally {
      if (originalApiKey === undefined) delete process.env.LLM_API_KEY;
      else process.env.LLM_API_KEY = originalApiKey;
    }
  });

  it('returns one concise question for a clarification plan', async () => {
    const chunks: string[] = [];
    for await (const chunk of new MockLlmProvider().stream({ instructions: 'ignored', input: 'Answer opening: Ask one targeted clarifying question.' })) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toMatch(/\?$/);
    expect(chunks.join('').split(/\s+/)).toHaveLength(14);
  });
});
