CREATE TABLE IF NOT EXISTS interview_candidate_contexts (
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  kind VARCHAR(32) NOT NULL CHECK (kind IN ('profile', 'job_description')),
  source_filename VARCHAR(255) NOT NULL,
  extracted_text TEXT NOT NULL CHECK (char_length(extracted_text) > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (interview_id, kind)
);
