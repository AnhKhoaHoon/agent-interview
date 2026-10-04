CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY,
  role VARCHAR(32) NOT NULL CHECK (role = 'devops'),
  status VARCHAR(16) NOT NULL CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL CHECK (role IN ('interviewer', 'assistant')),
  content TEXT NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('completed', 'streaming', 'failed')),
  sequence_no INTEGER NOT NULL CHECK (sequence_no > 0),
  question_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  speech_ended_at_ms BIGINT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (interview_id, sequence_no)
);

CREATE INDEX IF NOT EXISTS messages_interview_sequence_idx
  ON messages (interview_id, sequence_no);

CREATE INDEX IF NOT EXISTS messages_question_idx
  ON messages (question_id) WHERE question_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  message_id UUID NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
  segment_id UUID,
  provider VARCHAR(64) NOT NULL,
  language VARCHAR(32) NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms > 0),
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (interview_id, segment_id)
);

CREATE TABLE IF NOT EXISTS ai_responses (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
  provider VARCHAR(64) NOT NULL,
  model VARCHAR(128),
  prompt_version VARCHAR(128) NOT NULL,
  context_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  first_token_ms INTEGER CHECK (first_token_ms >= 0),
  total_latency_ms INTEGER CHECK (total_latency_ms >= 0),
  speech_end_to_first_answer_ms INTEGER CHECK (speech_end_to_first_answer_ms >= 0),
  token_count INTEGER CHECK (token_count >= 0),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
