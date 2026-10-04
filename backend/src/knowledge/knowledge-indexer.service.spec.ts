import { chunkMarkdown } from './knowledge-indexer.service';

describe('chunkMarkdown', () => {
  it('keeps heading-based knowledge sections independent for grounded retrieval', () => {
    expect(chunkMarkdown('# Docker\n\nImage and container.\n\n## Operations\n\nUse logs first.')).toEqual([
      '# Docker\n\nImage and container.',
      '## Operations\n\nUse logs first.'
    ]);
  });
});
