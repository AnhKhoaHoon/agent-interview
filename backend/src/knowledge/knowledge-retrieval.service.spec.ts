import { KeywordKnowledgeChunk, RetrievedKnowledgeChunk } from './knowledge.repository';
import { KnowledgeRetrievalService, retrievalTerms } from './knowledge-retrieval.service';

function retrievalService(
  semantic: RetrievedKnowledgeChunk[] = [],
  keyword: KeywordKnowledgeChunk[] = []
): KnowledgeRetrievalService {
  return new KnowledgeRetrievalService(
    { getConfiguredProvider: () => ({ embed: async () => [[0.1, 0.2]] }) } as never,
    {
      semanticSearch: async () => semantic,
      keywordSearch: async () => keyword
    } as never
  );
}

describe('KnowledgeRetrievalService', () => {
  const originalSimilarity = process.env.RAG_MIN_SIMILARITY;
  const originalKeywordCoverage = process.env.RAG_MIN_KEYWORD_COVERAGE;

  afterEach(() => {
    if (originalSimilarity === undefined) delete process.env.RAG_MIN_SIMILARITY;
    else process.env.RAG_MIN_SIMILARITY = originalSimilarity;
    if (originalKeywordCoverage === undefined) delete process.env.RAG_MIN_KEYWORD_COVERAGE;
    else process.env.RAG_MIN_KEYWORD_COVERAGE = originalKeywordCoverage;
  });

  it('keeps only the classified topic even when a repository returns an unrelated high-score chunk', async () => {
    process.env.RAG_MIN_SIMILARITY = '0.72';
    const service = retrievalService([
      { sourcePath: 'devops/docker/README.md', category: 'docker', text: 'Docker image and container.', score: 0.91 },
      { sourcePath: 'devops/kubernetes/README.md', category: 'kubernetes', text: 'Pod.', score: 0.99 }
    ]);

    await expect(service.retrieve('Docker là gì?', 'devops', 'docker')).resolves.toEqual(expect.objectContaining({
      chunks: [expect.objectContaining({ category: 'docker' })]
    }));
  });

  it('falls back when retrieval is below threshold or has no topic match', async () => {
    const service = retrievalService([
      { sourcePath: 'devops/aws/README.md', category: 'aws', text: 'AWS.', score: 0.95 }
    ]);
    await expect(service.retrieve('Docker là gì?', 'devops', 'docker')).resolves.toBeUndefined();
  });

  it('allows an explicit related knowledge category for a narrow classified tool', async () => {
    process.env.RAG_MIN_SIMILARITY = '0.72';
    const service = retrievalService([
      { sourcePath: 'devops/cicd/README.md', category: 'cicd', text: 'Argo CD uses GitOps.', score: 0.95 }
    ]);
    await expect(service.retrieve('Argo CD là gì?', 'devops', 'argocd')).resolves.toEqual(expect.objectContaining({ chunks: expect.any(Array) }));
  });

  it('allows Terraform knowledge for an IaC question when the dedicated card is not the top match', async () => {
    process.env.RAG_MIN_SIMILARITY = '0.72';
    const service = retrievalService([
      { sourcePath: 'devops/terraform/README.md', category: 'terraform', text: 'State and reviewed plans.', score: 0.95 }
    ]);
    await expect(service.retrieve('What is Infrastructure as Code?', 'devops', 'iac')).resolves.toEqual(expect.objectContaining({ chunks: expect.any(Array) }));
  });

  it('retrieves the Azure card and permits directly related Azure operational context', async () => {
    process.env.RAG_MIN_SIMILARITY = '0.72';
    const service = retrievalService([
      { sourcePath: 'devops/azure/README.md', category: 'azure', text: 'AKS uses workload identities for Azure access.', score: 0.95 },
      { sourcePath: 'devops/networking/README.md', category: 'networking', text: 'Trace DNS and routes.', score: 0.89 }
    ]);
    await expect(service.retrieve('Why cannot my AKS workload reach Key Vault?', 'devops', 'azure')).resolves.toEqual(expect.objectContaining({
      chunks: [expect.objectContaining({ category: 'azure' }), expect.objectContaining({ category: 'networking' })]
    }));
  });

  it('uses technical keyword coverage to rescue a relevant chunk with a weak semantic score', async () => {
    process.env.RAG_MIN_SIMILARITY = '0.72';
    process.env.RAG_MIN_KEYWORD_COVERAGE = '0.35';
    const azureChunk = { sourcePath: 'devops/azure/README.md', category: 'azure', text: 'Azure Logic Apps starts workflows from triggers and connectors.', score: 0.68 };
    const service = retrievalService([azureChunk], [{ ...azureChunk, keywordScore: 0.8 }]);

    await expect(service.retrieve('What is Azure Logic Apps?', 'devops', 'azure')).resolves.toEqual(expect.objectContaining({
      chunks: [expect.objectContaining({ category: 'azure', text: azureChunk.text })]
    }));
  });

  it('keeps DBA retrieval within the DBA categories', async () => {
    process.env.RAG_MIN_SIMILARITY = '0.72';
    const service = retrievalService([
      { sourcePath: 'dba/postgresql/README.md', category: 'postgresql', text: 'PITR needs a base backup and retained WAL.', score: 0.95 },
      { sourcePath: 'devops/docker/README.md', category: 'docker', text: 'Container.', score: 0.99 }
    ]);

    await expect(service.retrieve('How does PostgreSQL PITR work?', 'dba', 'postgresql')).resolves.toEqual(expect.objectContaining({
      chunks: [expect.objectContaining({ category: 'postgresql' })]
    }));
  });
});

describe('retrievalTerms', () => {
  it('keeps exact DevOps terms and useful phrases while excluding question filler', () => {
    expect(retrievalTerms('What is Azure Logic Apps and how does it work?')).toEqual(expect.arrayContaining([
      'azure', 'logic', 'apps', 'azure logic', 'logic apps'
    ]));
    expect(retrievalTerms('What is AKS?')).toEqual(['aks']);
  });
});
