import { Injectable } from '@nestjs/common';
import { ConversationMessage } from '../contracts';

@Injectable()
export class ContextBuilderService {
  build(messages: ConversationMessage[]): ConversationMessage[] {
    let start = Math.max(0, messages.length - 10);
    // Do not begin bounded context with an orphaned answer whose question was
    // trimmed. Starting at the next interviewer turn is more useful and safer.
    while (start < messages.length && messages[start].role === 'assistant') start += 1;
    return messages.slice(start).map((message) => ({ ...message }));
  }
}
