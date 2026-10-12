import { mergeResponseControls, responseControlsFromEnvironment } from './openai-llm.provider';

describe('responseControlsFromEnvironment', () => {
  it('reads supported live-interview latency controls', () => {
    expect(responseControlsFromEnvironment({
      LLM_REASONING_EFFORT: 'low',
      LLM_MAX_OUTPUT_TOKENS: '600',
      LLM_VERBOSITY: 'low'
    })).toEqual({ reasoningEffort: 'low', maxOutputTokens: 600, verbosity: 'low' });
  });

  it('ignores invalid controls instead of forwarding an invalid provider request', () => {
    expect(responseControlsFromEnvironment({
      LLM_REASONING_EFFORT: 'fast',
      LLM_MAX_OUTPUT_TOKENS: '-1',
      LLM_VERBOSITY: 'brief'
    })).toEqual({});
  });

  it('allows a routine request to override the default response controls', () => {
    expect(mergeResponseControls(
      { reasoningEffort: 'low', maxOutputTokens: 600, verbosity: 'low' },
      { reasoningEffort: 'minimal', maxOutputTokens: 300 }
    )).toEqual({ reasoningEffort: 'minimal', maxOutputTokens: 300, verbosity: 'low' });
  });
});
