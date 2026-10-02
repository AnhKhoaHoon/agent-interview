import { Injectable } from '@nestjs/common';
import { LlmGenerationInput, PromptInput } from '../contracts';
import { DEVOPS_SYSTEM_INSTRUCTION } from '../../roles/devops/devops-role.config';

@Injectable()
export class PromptBuilderService {
  build({ question, classification, history, plan, followUp }: PromptInput): LlmGenerationInput {
    const previous = history.length
      ? history.map((message) => `${message.role}: ${message.content}`).join('\n')
      : 'No previous conversation.';
    return {
      instructions: `${DEVOPS_SYSTEM_INSTRUCTION}\nResponse mode: ${classification.responseMode}.\nLevel guidance: ${this.levelGuidance(classification.level)}`,
      input: `Prompt version: ${plan.promptVersion}\nInterview level: ${classification.level}\nQuestion type: ${classification.type}\nCategory: ${classification.category}\nConversation relation: ${followUp ? 'follow-up' : 'new question'}${followUp ? `\nReferenced interviewer question: ${followUp.referenceQuestion}\nAnswer the current question in relation to that turn without repeating the earlier answer.` : ''}\nAnswer opening: ${plan.opening}\nTheory-to-practice flow:\n${plan.deliverySteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\nRequired answer points: ${plan.requiredPoints.join('; ')}\nQuality checks: ${plan.qualityChecks.join('; ')}\nMaximum words: ${plan.maxWords}\nRecent conversation:\n${previous}\n\nCurrent interviewer question: ${question}`
    };
  }

  private levelGuidance(level: PromptInput['classification']['level']): string {
    const guidance: Record<PromptInput['classification']['level'], string> = {
      junior: 'Explain the core concept accurately and describe safe, supervised operational steps.',
      middle: 'Include operational trade-offs, a sensible debugging order, or ownership of a bounded service change.',
      senior: 'Include system-wide reliability, security, or cost trade-offs, rollout strategy, and measurable validation.'
    };
    return guidance[level];
  }
}
