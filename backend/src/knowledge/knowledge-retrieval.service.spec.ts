import { KnowledgeRetrievalService } from './knowledge-retrieval.service';

describe('KnowledgeRetrievalService', () => {
  const original = process.env.RAG_MIN_SIMILARITY;
  afterEach(() => {
    if (original === undefined) delete process.env.RAG_MIN_SIMILARITY;
    else process.env.RAG_MIN_SIMILARITY = original;
  });

  it('uses only sufficiently similar chunks that match the classified topic', async () => {
    process.env.RAG_MIN_SIMILARITY = '0.72';
    const service = new KnowledgeRetrievalService(
      { getConfiguredProvider: () => ({ embed: async () => [[0.1, 0.2]] }) } as never,
      { search: async () => [
        { sourcePath: 'devops/docker/README.md', category: 'docker', text: 'Docker image and container.', score: 0.91 },
        { sourcePath: 'devops/kubernetes/README.md', category: 'kubernetes', text: 'Pod.', score: 0.83 }
      ] } as never
    );

    await expect(service.retrieve('Docker là gì?', 'docker')).resolves.toEqual(expect.objectContaining({
      chunks: [expect.objectContaining({ category: 'docker' }), expect.objectContaining({ category: 'kubernetes' })]
    }));
  });

  it('falls back when retrieval is below threshold or has no topic match', async () => {
    const service = new KnowledgeRetrievalService(
      { getConfiguredProvider: () => ({ embed: async () => [[0.1, 0.2]] }) } as never,
      { search: async () => [{ sourcePath: 'devops/aws/README.md', category: 'aws', text: 'AWS.', score: 0.95 }] } as never
    );
    await expect(service.retrieve('Docker là gì?', 'docker')).resolves.toBeUndefined();
  });

  it('allows an explicit related knowledge category for a narrow classified tool', async () => {
    process.env.RAG_MIN_SIMILARITY = '0.72';
    const service = new KnowledgeRetrievalService(
      { getConfiguredProvider: () => ({ embed: async () => [[0.1, 0.2]] }) } as never,
      { search: async () => [{ sourcePath: 'devops/cicd/README.md', category: 'cicd', text: 'Argo CD uses GitOps.', score: 0.95 }] } as never
    );
    await expect(service.retrieve('Argo CD là gì?', 'argocd')).resolves.toEqual(expect.objectContaining({ chunks: expect.any(Array) }));
  });

  it('allows Terraform knowledge for an IaC question when the dedicated card is not the top match', async () => {
    process.env.RAG_MIN_SIMILARITY = '0.72';
    const service = new KnowledgeRetrievalService(
      { getConfiguredProvider: () => ({ embed: async () => [[0.1, 0.2]] }) } as never,
      { search: async () => [{ sourcePath: 'devops/terraform/README.md', category: 'terraform', text: 'State and reviewed plans.', score: 0.95 }] } as never
    );
    await expect(service.retrieve('What is Infrastructure as Code?', 'iac')).resolves.toEqual(expect.objectContaining({ chunks: expect.any(Array) }));
  });

  it('retrieves the Azure card and permits directly related Azure operational context', async () => {
    process.env.RAG_MIN_SIMILARITY = '0.72';
    const service = new KnowledgeRetrievalService(
      { getConfiguredProvider: () => ({ embed: async () => [[0.1, 0.2]] }) } as never,
      { search: async () => [
        { sourcePath: 'devops/azure/README.md', category: 'azure', text: 'AKS uses workload identities for Azure access.', score: 0.95 },
        { sourcePath: 'devops/networking/README.md', category: 'networking', text: 'Trace DNS and routes.', score: 0.89 }
      ] } as never
    );
    await expect(service.retrieve('Why cannot my AKS workload reach Key Vault?', 'azure')).resolves.toEqual(expect.objectContaining({
      chunks: [expect.objectContaining({ category: 'azure' }), expect.objectContaining({ category: 'networking' })]
    }));
  });
});
