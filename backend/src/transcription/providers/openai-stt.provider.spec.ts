import { devopsTranscriptionPrompt } from '../../roles/devops/devops-transcription-prompt';
import { configuredSttLanguage } from './openai-stt.provider';

describe('configuredSttLanguage', () => {
  it('defaults to Vietnamese when no environment override exists', () => {
    const original = process.env.STT_LANGUAGE;
    delete process.env.STT_LANGUAGE;
    expect(configuredSttLanguage()).toBe('vi');
    process.env.STT_LANGUAGE = original;
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
  });
});
