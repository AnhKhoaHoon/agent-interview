import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmGenerationInput, LlmProvider } from '../contracts';

@Injectable()
export class OpenAiLlmProvider implements LlmProvider {
  readonly name = 'openai';

  async *stream(input: LlmGenerationInput): AsyncIterable<string> {
    const apiKey = process.env.LLM_API_KEY;
    const model = process.env.LLM_MODEL;
    if (!apiKey || !model) {
      throw new ServiceUnavailableException('OpenAI requires LLM_API_KEY and LLM_MODEL');
    }

    const client = new OpenAI({ apiKey, timeout: Number(process.env.LLM_TIMEOUT_MS ?? 15_000) });
    const stream = await client.responses.create({
      model,
      instructions: input.instructions,
      input: input.input,
      stream: true,
      store: false
    });

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') yield event.delta;
      if (event.type === 'error') throw new ServiceUnavailableException(event.message);
    }
  }
}
