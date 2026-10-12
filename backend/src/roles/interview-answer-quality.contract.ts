export const INTERVIEW_ANSWER_QUALITY_CONTRACT = [
  'Interview-answer quality contract:',
  '- Answer the exact current question in the first sentence. If the interviewer asks multiple direct subquestions, answer each one in the same order.',
  '- Keep facts inside the requested scope. Do not add adjacent tools, platforms, workflows, or buzzwords merely to sound senior.',
  '- State an assumption only when the missing constraint would materially change the answer; otherwise make the most useful safe recommendation.',
  '- Do not use empty filler such as "it depends" without naming the deciding constraint, or generic claims such as "best practice" without an explanation.',
  '- Give one precise, relevant technical detail for an applied question rather than a long list. A precise detail can be a signal, configuration boundary, rollback point, security boundary, command interpretation, or measurable validation.',
  '- Do not present a possibility as a guarantee. Qualify availability, consistency, security, cost, and recovery claims by their stated constraints.',
  '- The answer must sound like a candidate speaking to an interviewer: concise, decisive, and ready to say aloud.'
].join('\n');
