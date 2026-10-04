ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS access_token_hash CHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS interviews_access_token_hash_idx
  ON interviews (access_token_hash)
  WHERE access_token_hash IS NOT NULL;
