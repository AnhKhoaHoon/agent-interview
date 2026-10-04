export const SUPPORTED_CANDIDATE_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown'
]);

export function candidateContextConfiguration(): { maxBytes: number; maxCharacters: number; promptMaxCharacters: number } {
  return {
    maxBytes: Number(process.env.CANDIDATE_CONTEXT_MAX_BYTES ?? 2 * 1024 * 1024),
    maxCharacters: Number(process.env.CANDIDATE_CONTEXT_MAX_CHARACTERS ?? 30_000),
    promptMaxCharacters: Number(process.env.CANDIDATE_CONTEXT_PROMPT_MAX_CHARACTERS ?? 8_000)
  };
}
