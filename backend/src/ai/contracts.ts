export type QuestionType =
  | 'definition'
  | 'comparison'
  | 'troubleshooting'
  | 'scenario'
  | 'architecture'
  | 'command'
  | 'experience'
  | 'best-practice';

export type ResponseMode =
  | 'technical_definition'
  | 'technical_comparison'
  | 'technical_troubleshooting'
  | 'technical_scenario'
  | 'technical_architecture'
  | 'technical_command'
  | 'behavioral_experience'
  | 'clarification';

export type InterviewLanguage = 'vi' | 'en';

export interface Classification {
  role: 'devops';
  category: string;
  type: QuestionType;
  level: 'junior' | 'middle' | 'senior';
  intent: string;
  responseMode: ResponseMode;
}

export interface ConversationMessage {
  role: 'interviewer' | 'assistant';
  content: string;
}

export interface RetrievedKnowledge {
  sourcePath: string;
  category: string;
  text: string;
  score: number;
}

export interface InterviewQuestionAssessment {
  normalizedQuestion: string;
  classification: Classification;
  decision: 'answer' | 'clarify';
  isFollowUp: boolean;
  referenceQuestion?: string;
  reason?: string;
}

export interface InterviewAnswerPlan {
  promptVersion: 'devops-interview-answer-v3';
  responseMode: ResponseMode;
  opening: string;
  deliverySteps: string[];
  requiredPoints: string[];
  qualityChecks: string[];
  requiresOperationalDetail: boolean;
  minWords: number;
  maxWords: number;
}

export interface PromptInput {
  question: string;
  classification: Classification;
  history: ConversationMessage[];
  plan: InterviewAnswerPlan;
  answerLanguage?: InterviewLanguage;
  knowledge?: RetrievedKnowledge[];
  candidateProfile?: string;
  jobDescription?: string;
  followUp?: {
    referenceQuestion: string;
  };
}

export interface LlmGenerationInput {
  instructions: string;
  input: string;
}

export interface LlmProvider {
  readonly name: string;
  stream(input: LlmGenerationInput): AsyncIterable<string>;
}
