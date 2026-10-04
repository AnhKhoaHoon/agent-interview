import { Injectable } from '@nestjs/common';
import { Classification, InterviewAnswerPlan, ResponseMode } from '../contracts';

type PlanTemplate = Omit<InterviewAnswerPlan, 'promptVersion' | 'responseMode'>;

const PLAN_BY_MODE: Record<ResponseMode, PlanTemplate> = {
  technical_definition: {
    opening: 'State the definition directly in the first sentence.',
    deliverySteps: ['explain the core principle or key distinction', 'state why it is used', 'give exactly one relevant practical example or caveat'],
    requiredPoints: ['definition in scope', 'why it matters', 'one practical detail only'],
    qualityChecks: ['direct answer', 'scope matched', 'no unrelated troubleshooting checklist'],
    requiresOperationalDetail: true,
    minWords: 40,
    maxWords: 85
  },
  technical_comparison: {
    opening: 'State the key distinction before comparing options.',
    deliverySteps: ['explain the fundamental model difference', 'translate that difference into operational consequences', 'choose an option for a concrete constraint and state the trade-off'],
    requiredPoints: ['material trade-off', 'when to choose each option'],
    qualityChecks: ['clear distinction', 'decision guidance'],
    requiresOperationalDetail: true,
    minWords: 60,
    maxWords: 120
  },
  technical_troubleshooting: {
    opening: 'Lead with the safest first diagnostic check.',
    deliverySteps: ['name the likely failure domains', 'give ordered commands, logs, metrics, or configuration checks', 'fix the isolated cause and verify recovery'],
    requiredPoints: ['likely causes', 'ordered checks', 'remediation', 'verification'],
    qualityChecks: ['safe sequence', 'explicit verification'],
    requiresOperationalDetail: true,
    minWords: 60,
    maxWords: 120
  },
  technical_scenario: {
    opening: 'Give the recommended approach before its detail.',
    deliverySteps: ['state the governing principle or assumption', 'describe the implementation sequence', 'close with a risk, trade-off, and measurable validation'],
    requiredPoints: ['practical steps', 'trade-off or risk', 'validation'],
    qualityChecks: ['actionable recommendation', 'validation'],
    requiresOperationalDetail: true,
    minWords: 60,
    maxWords: 120
  },
  technical_architecture: {
    opening: 'Recommend the architecture before naming its components.',
    deliverySteps: ['state the design goal and principle', 'map components to traffic, data, security, and failure handling', 'explain rollout, observability, and one cost or reliability trade-off'],
    requiredPoints: ['key components', 'reliability, security, or cost trade-off', 'validation or rollout'],
    qualityChecks: ['clear recommendation', 'trade-off', 'validation'],
    requiresOperationalDetail: true,
    minWords: 60,
    maxWords: 120
  },
  technical_command: {
    opening: 'Start with a safe command or inspection step.',
    deliverySteps: ['state what needs to be established', 'give a safe command or check and the expected signal', 'interpret the result and name the next action'],
    requiredPoints: ['what to inspect', 'what the result establishes', 'safe next action'],
    qualityChecks: ['no claim that a command was run', 'safe next step'],
    requiresOperationalDetail: true,
    minWords: 50,
    maxWords: 120
  },
  behavioral_experience: {
    opening: 'Use a verified STAR answer, or explicitly label an Adaptable answer.',
    deliverySteps: ['set the verified situation and task', 'describe a specific technical action and decision', 'close with a verified result or lesson and how it was measured'],
    requiredPoints: ['situation', 'task', 'action', 'result or verified lesson'],
    qualityChecks: ['no unsupported first-person claim'],
    requiresOperationalDetail: false,
    minWords: 60,
    maxWords: 120
  },
  clarification: {
    opening: 'Ask one targeted clarifying question.',
    deliverySteps: ['identify the single missing constraint needed for a correct answer'],
    requiredPoints: ['the missing technical context'],
    qualityChecks: ['one concise question only'],
    requiresOperationalDetail: false,
    minWords: 1,
    maxWords: 30
  }
};

@Injectable()
export class InterviewAnswerPlannerService {
  plan(classification: Classification): InterviewAnswerPlan {
    return {
      promptVersion: 'devops-interview-answer-v2',
      responseMode: classification.responseMode,
      ...PLAN_BY_MODE[classification.responseMode]
    };
  }
}
