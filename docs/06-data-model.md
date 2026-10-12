# Data Model

## interviews

Phase 8 uses PostgreSQL as the runtime source of truth. Migration state is
recorded in `schema_migrations`; `npm run db:migrate` applies pending files in
lexical order under an advisory lock.

- id UUID PK
- role VARCHAR (`devops` or `dba`)
- status VARCHAR
- started_at TIMESTAMP
- ended_at TIMESTAMP
- created_at TIMESTAMP

## messages

- id UUID PK
- interview_id UUID FK
- role VARCHAR
- content TEXT
- status VARCHAR
- sequence_no INTEGER
- question_id UUID FK, nullable for interviewer messages
- speech_ended_at_ms BIGINT, nullable
- created_at TIMESTAMP
- updated_at TIMESTAMP

Roles:
- interviewer
- assistant

## transcriptions

- id UUID PK
- interview_id UUID FK
- message_id UUID FK
- segment_id UUID, unique per interview when present
- provider VARCHAR
- language VARCHAR
- duration_ms INTEGER
- latency_ms INTEGER
- created_at TIMESTAMP

## ai_responses

- id UUID PK
- message_id UUID FK
- provider VARCHAR
- model VARCHAR
- prompt_version VARCHAR
- context_snapshot JSONB
- first_token_ms INTEGER
- total_latency_ms INTEGER
- token_count INTEGER
- speech_end_to_first_answer_ms INTEGER
- started_at TIMESTAMP
- completed_at TIMESTAMP
- created_at TIMESTAMP

## interview_candidate_contexts (Phase 11)

- interview_id UUID FK
- kind VARCHAR (`profile` or `job_description`), unique per interview
- source_filename VARCHAR
- extracted_text TEXT
- updated_at TIMESTAMP

The raw uploaded CV/JD file is not stored. Only bounded, normalized extracted
text is persisted and it is deleted when the owning interview is deleted.
Context metadata APIs return filename, kind, length, and timestamp, never the
stored text. The owner can also remove either context explicitly before the
interview is deleted.

## knowledge_documents (Phase 10)

- id UUID
- role
- category
- source_path (unique)
- source_hash
- version
- content
- indexed_at

## knowledge_chunks

- id UUID
- document_id UUID
- chunk_text
- embedding VECTOR
- metadata JSONB

Chunks are tied to a source document and deleted/replaced atomically when that
source changes. They contain curated knowledge only, never raw interview audio
or candidate data.

## Raw audio

Do not store by default.

The Phase 8 schema stores transcript text and answer text, but never uploaded
audio bytes. Audio exists only in memory for the transcription request.
