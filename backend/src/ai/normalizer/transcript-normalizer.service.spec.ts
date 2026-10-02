import { TranscriptNormalizerService } from './transcript-normalizer.service';

describe('TranscriptNormalizerService', () => {
  const service = new TranscriptNormalizerService();

  it('removes repeated leading filler and normalizes whitespace', () => {
    expect(service.normalize('  Um, uh,   what is Kubernetes HPA?  ')).toBe('what is Kubernetes HPA?');
  });

  it('preserves technical terms instead of rewriting them', () => {
    expect(service.normalize('Explain tfstate and kubectl get pods')).toBe('Explain tfstate and kubectl get pods');
  });
});
