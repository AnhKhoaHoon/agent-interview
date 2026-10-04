export type CandidateContextKind = 'profile' | 'job_description';

export interface UploadedCandidateDocument {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
}

export interface CandidateContextSummary {
  kind: CandidateContextKind;
  sourceFilename: string;
  characterCount: number;
  updatedAt: string;
}

export interface CandidatePromptContext {
  profile?: string;
  jobDescription?: string;
}
