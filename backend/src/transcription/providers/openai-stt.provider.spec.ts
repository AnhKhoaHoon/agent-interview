import { devopsTranscriptionPrompt } from '../../roles/devops/devops-transcription-prompt';
import { configuredSttLanguage, transcriptionLanguageFields, usesKeywordGuidance } from './openai-stt.provider';

describe('configuredSttLanguage', () => {
  it('defaults to Vietnamese when no environment override exists', () => {
    const original = process.env.STT_LANGUAGE;
    delete process.env.STT_LANGUAGE;
    expect(configuredSttLanguage()).toBe('vi');
    if (original === undefined) delete process.env.STT_LANGUAGE;
    else process.env.STT_LANGUAGE = original;
  });

  it('accepts the two supported normalized language hints', () => {
    expect(configuredSttLanguage(' VI ')).toBe('vi');
    expect(configuredSttLanguage('en')).toBe('en');
  });

  it('rejects every language outside the V1 interview scope before a provider call', () => {
    expect(() => configuredSttLanguage('auto')).toThrow('STT_LANGUAGE must be vi or en');
    expect(() => configuredSttLanguage('fr')).toThrow('STT_LANGUAGE must be vi or en');
  });
});

describe('devopsTranscriptionPrompt', () => {
  it('uses the selected language while preserving DevOps vocabulary', () => {
    expect(devopsTranscriptionPrompt('vi')).toContain('cuộc phỏng vấn DevOps bằng tiếng Việt');
    expect(devopsTranscriptionPrompt('vi')).toContain('Kubernetes');
    expect(devopsTranscriptionPrompt('en')).toContain('English DevOps technical interview');
    expect(devopsTranscriptionPrompt('en')).toContain('Terraform');
    expect(devopsTranscriptionPrompt('en')).toContain('Do not translate technical names');
  });
});

describe('usesKeywordGuidance', () => {
  it('only enables provider keyword guidance for the model that supports it', () => {
    expect(usesKeywordGuidance('gpt-transcribe')).toBe(true);
    expect(usesKeywordGuidance('gpt-4o-mini-transcribe')).toBe(false);
  });
});

describe('transcriptionLanguageFields', () => {
  it('uses only languages for gpt-transcribe, never language and languages together', () => {
    expect(transcriptionLanguageFields('gpt-transcribe', 'en')).toEqual({ languages: ['en'] });
  });

  it('uses the singular language hint for standard transcription models', () => {
    expect(transcriptionLanguageFields('gpt-4o-mini-transcribe', 'vi')).toEqual({ language: 'vi' });
  });
});
