# Data Model

## interviews

Phase 1 uses an in-memory implementation of this model. PostgreSQL tables and migrations are introduced in Phase 8.

- id UUID PK
- role VARCHAR
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
- created_at TIMESTAMP

Roles:
- interviewer
- assistant

## transcriptions

- id UUID PK
- interview_id UUID FK
- message_id UUID FK
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
- first_token_ms INTEGER
- total_latency_ms INTEGER
- token_count INTEGER
- created_at TIMESTAMP

## candidate_profiles (later)

- id UUID
- role
- level
- profile_json JSONB

## job_descriptions (later)

- id UUID
- title
- content
- extracted_json JSONB

## knowledge_documents (RAG later)

- id UUID
- role
- category
- source
- version
- content

## knowledge_chunks

- id UUID
- document_id UUID
- chunk_text
- embedding VECTOR
- metadata JSONB

## Raw audio

Do not store by default.
