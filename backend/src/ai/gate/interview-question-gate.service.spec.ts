import { QuestionClassifierService } from '../classifier/question-classifier.service';
import { TranscriptNormalizerService } from '../normalizer/transcript-normalizer.service';
import { InterviewQuestionGateService } from './interview-question-gate.service';

describe('InterviewQuestionGateService', () => {
  const service = new InterviewQuestionGateService(new TranscriptNormalizerService(), new QuestionClassifierService());

  it('normalizes and accepts a complete DevOps question', () => {
    expect(service.assess(' Um, what is Kubernetes HPA? ')).toMatchObject({
      normalizedQuestion: 'what is Kubernetes HPA?',
      decision: 'answer',
      classification: { category: 'kubernetes', responseMode: 'technical_definition' }
    });
  });

  it('uses clarification mode only for a truly incomplete question', () => {
    expect(service.assess('What about?')).toMatchObject({
      decision: 'clarify',
      classification: { responseMode: 'clarification' }
    });
  });

  it('answers a short follow-up from the previous DevOps question', () => {
    expect(service.assess('Why?', [
      { role: 'interviewer', content: 'What is Kubernetes HPA?' },
      { role: 'assistant', content: 'HPA scales pods from observed metrics.' }
    ])).toMatchObject({
      normalizedQuestion: 'Why?',
      decision: 'answer',
      isFollowUp: true,
      referenceQuestion: 'What is Kubernetes HPA?',
      classification: { category: 'kubernetes', responseMode: 'technical_definition' }
    });
  });

  it('inherits topic and level while respecting a follow-up answer shape', () => {
    expect(service.assess('What about cost?', [
      { role: 'interviewer', content: 'As a senior engineer, design a highly available AWS platform.' }
    ])).toMatchObject({
      decision: 'answer',
      isFollowUp: true,
      classification: {
        category: 'aws',
        type: 'architecture',
        level: 'senior',
        responseMode: 'technical_architecture'
      }
    });
  });
});
