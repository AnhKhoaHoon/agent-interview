import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmGenerationInput, LlmProvider, LlmReasoningEffort, LlmResponseControls, LlmVerbosity } from '../contracts';

export type { LlmResponseControls } from '../contracts';

@Injectable()
export class OpenAiLlmProvider implements LlmProvider {
  readonly name = 'openai';

  async *stream(input: LlmGenerationInput, options?: { signal?: AbortSignal }): AsyncIterable<string> {
    const apiKey = process.env.LLM_API_KEY;
    const model = input.model ?? process.env.LLM_MODEL;
    if (!apiKey || !model) {
      throw new ServiceUnavailableException('OpenAI requires LLM_API_KEY and LLM_MODEL');
    }

    const client = new OpenAI({
      apiKey,
      timeout: Number(process.env.LLM_TIMEOUT_MS ?? 15_000),
      maxRetries: Number(process.env.LLM_MAX_RETRIES ?? 2)
    });
    const controls = mergeResponseControls(responseControlsFromEnvironment(), input.responseControls);
    const stream = await client.responses.create({
      model,
      instructions: input.instructions,
      input: input.input,
      stream: true,
      store: false,
      ...(input.promptCacheKey ? { prompt_cache_key: input.promptCacheKey } : {}),
      ...(controls.reasoningEffort ? { reasoning: { effort: controls.reasoningEffort } } : {}),
      ...(controls.maxOutputTokens ? { max_output_tokens: controls.maxOutputTokens } : {}),
      ...(controls.verbosity ? { text: { verbosity: controls.verbosity } } : {})
    }, { signal: options?.signal });

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') yield event.delta;
      if (event.type === 'error') throw new ServiceUnavailableException(event.message);
    }
  }
}

export function responseControlsFromEnvironment(environment: NodeJS.ProcessEnv = process.env): LlmResponseControls {
  const reasoningEffort = parseOneOf(environment.LLM_REASONING_EFFORT, ['minimal', 'low', 'medium', 'high'] as const);
  const verbosity = parseOneOf(environment.LLM_VERBOSITY, ['low', 'medium', 'high'] as const);
  const maxOutputTokens = parsePositiveInteger(environment.LLM_MAX_OUTPUT_TOKENS);
  return {
    ...(reasoningEffort ? { reasoningEffort } : {}),
    ...(verbosity ? { verbosity } : {}),
    ...(maxOutputTokens ? { maxOutputTokens } : {})
  };
}

export function mergeResponseControls(base: LlmResponseControls, override?: LlmResponseControls): LlmResponseControls {
  return {
    ...base,
    ...(override?.reasoningEffort ? { reasoningEffort: override.reasoningEffort } : {}),
    ...(override?.maxOutputTokens ? { maxOutputTokens: override.maxOutputTokens } : {}),
    ...(override?.verbosity ? { verbosity: override.verbosity } : {})
  };
}

function parseOneOf<T extends LlmReasoningEffort | LlmVerbosity>(value: string | undefined, accepted: readonly T[]): T | undefined {
  return value && accepted.includes(value as T) ? value as T : undefined;
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}
