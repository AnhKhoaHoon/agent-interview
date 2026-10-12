import { Injectable } from '@nestjs/common';
import { ConversationMessage, InterviewQuestionAssessment } from '../contracts';
import { QuestionClassifierService } from '../classifier/question-classifier.service';
import { TranscriptNormalizerService } from '../normalizer/transcript-normalizer.service';
import { InterviewRole } from '../../roles/interview-role';

const NEEDS_CONTEXT = /^(?:and(?: then)?|then|why|how|what about(?: that)?|can you(?: elaborate)?|please|okay|right)[?.!]*$/i;
const FOLLOW_UP_CUE = /^(?:and\b|also\b|then\b|how about\b|what about\b|what if\b|can you elaborate\b)|^(?:why|how)[?.!]*$|\b(?:that|those|this approach|it)\b/i;
const INHERIT_PREVIOUS_MODE = /^(?:and\b|also\b|then\b|how about\b|what about\b)|^(?:why|how)[?.!]*$/i;
const EXPLICIT_LEVEL = /\b(?:junior|entry|middle|mid-level|senior|staff|principal)\b/i;

@Injectable()
export class InterviewQuestionGateService {
  constructor(
    private readonly normalizer: TranscriptNormalizerService,
    private readonly classifier: QuestionClassifierService
  ) {}

  assess(transcript: string, history: ConversationMessage[] = [], role: InterviewRole = 'devops'): InterviewQuestionAssessment {
    const normalizedQuestion = this.normalizer.normalize(transcript, role);
    const currentClassification = this.classifier.classify(normalizedQuestion, role);
    const previousQuestion = [...history].reverse().find((message) => message.role === 'interviewer')?.content;
    const isFollowUp = Boolean(previousQuestion && FOLLOW_UP_CUE.test(normalizedQuestion));

    if (isFollowUp && previousQuestion) {
      const previousClassification = this.classifier.classify(previousQuestion, role);
      const inheritMode = INHERIT_PREVIOUS_MODE.test(normalizedQuestion) && currentClassification.type === 'definition';
      return {
        normalizedQuestion,
        classification: {
          ...currentClassification,
          category: currentClassification.category === 'general' ? previousClassification.category : currentClassification.category,
          type: inheritMode ? previousClassification.type : currentClassification.type,
          level: EXPLICIT_LEVEL.test(normalizedQuestion) ? currentClassification.level : previousClassification.level,
          intent: `Follow up on the previous question: ${normalizedQuestion}`,
          responseMode: inheritMode ? previousClassification.responseMode : currentClassification.responseMode
        },
        decision: 'answer',
        isFollowUp: true,
        referenceQuestion: previousQuestion
      };
    }

    if (!normalizedQuestion || NEEDS_CONTEXT.test(normalizedQuestion)) {
      return {
        normalizedQuestion,
        classification: { ...currentClassification, responseMode: 'clarification', intent: 'Clarify an incomplete interviewer question' },
        decision: 'clarify',
        isFollowUp: false,
        reason: 'The transcript does not contain enough interview context to answer safely.'
      };
    }

    return { normalizedQuestion, classification: currentClassification, decision: 'answer', isFollowUp: false };
  }
}
