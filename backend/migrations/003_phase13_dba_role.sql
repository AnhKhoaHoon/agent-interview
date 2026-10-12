ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_role_check;
ALTER TABLE interviews
  ADD CONSTRAINT interviews_role_check CHECK (role IN ('devops', 'dba'));

ALTER TABLE knowledge_documents DROP CONSTRAINT IF EXISTS knowledge_documents_role_check;
ALTER TABLE knowledge_documents
  ADD CONSTRAINT knowledge_documents_role_check CHECK (role IN ('devops', 'dba'));
