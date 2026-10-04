import { Module } from '@nestjs/common';
import { QuestionClassifierService } from './classifier/question-classifier.service';
import { ContextBuilderService } from './context/context-builder.service';
import { PromptBuilderService } from './prompt/prompt-builder.service';
import { LlmProviderFactory } from './providers/llm-provider.factory';
import { OpenAiLlmProvider } from './providers/openai-llm.provider';
import { AnswerValidatorService } from './validator/answer-validator.service';
import { TranscriptNormalizerService } from './normalizer/transcript-normalizer.service';
import { InterviewQuestionGateService } from './gate/interview-question-gate.service';
import { InterviewAnswerPlannerService } from './planner/interview-answer-planner.service';
import { InterviewAnswerQualityService } from './quality/interview-answer-quality.service';

@Module({
  providers: [
    QuestionClassifierService,
    ContextBuilderService,
    PromptBuilderService,
    OpenAiLlmProvider,
    LlmProviderFactory,
    AnswerValidatorService,
    TranscriptNormalizerService,
    InterviewQuestionGateService,
    InterviewAnswerPlannerService,
    InterviewAnswerQualityService
  ],
  exports: [
    QuestionClassifierService,
    ContextBuilderService,
    PromptBuilderService,
    LlmProviderFactory,
    AnswerValidatorService,
    InterviewQuestionGateService,
    InterviewAnswerPlannerService,
    InterviewAnswerQualityService
  ]
})
export class AiModule {}
