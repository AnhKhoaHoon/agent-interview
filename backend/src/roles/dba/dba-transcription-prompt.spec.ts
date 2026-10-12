import { DBA_TRANSCRIPTION_KEYWORDS, dbaTranscriptionPrompt } from './dba-transcription-prompt';

describe('dbaTranscriptionPrompt', () => {
  it('uses the selected language and protects database terms for STT guidance', () => {
    expect(dbaTranscriptionPrompt('en')).toContain('English Database Administrator technical interview');
    expect(dbaTranscriptionPrompt('vi')).toContain('Database Administrator bằng tiếng Việt');
    expect(DBA_TRANSCRIPTION_KEYWORDS).toEqual(expect.arrayContaining(['PostgreSQL', 'PITR', 'GTID', 'RMAN']));
  });
});
