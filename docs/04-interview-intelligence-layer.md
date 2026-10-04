# Interview Intelligence Layer

This is the core AI orchestration layer.

The application should not simply send the raw transcript to an LLM.

For the supported Vietnamese and English interview modes, the language selected
in the Side Panel is passed through the transcription/manual-question request
and requires the answer to use that selected language. This is deliberate: an
English answer can be requested for a Vietnamese transcript, or the reverse,
without relying on language guessing. Standard DevOps commands and product
names may remain in their usual technical form.

## Pipeline

```text
Transcript
-> Normalizer
-> Question Gate + Question Classifier
-> Context Builder
-> Interview Answer Planner
-> Prompt Builder
-> LLM Provider
-> Interview Answer Quality Gate
-> Response Formatter
```

## 1. Normalizer

Responsibilities:
- trim repeated filler
- fix obvious STT punctuation
- preserve technical terms
- avoid aggressive rewriting

The original provider transcript remains the interviewer message and is the
audit trail for what was heard. For answer orchestration only, the normalizer
may apply a small, controlled alias list for unambiguous DevOps STT mistakes
(for example, a phonetic `Zen tin` corrected to `Jenkins`). It never invents a
sentence, translates the question, or silently replaces the displayed text.
When an alias is applied, the Side Panel shows the interpreted text separately.

## 2. Question Classifier

Output:

```json
{
  "role": "devops",
  "category": "kubernetes",
  "type": "troubleshooting",
  "level": "middle",
  "intent": "diagnose CrashLoopBackOff",
  "responseMode": "technical_troubleshooting"
}
```

DevOps categories:
- linux
- networking
- git
- docker
- docker-compose
- kubernetes
- aws
- iac
- terraform
- ansible
- cicd
- jenkins
- gitlab-ci
- argocd
- observability
- prometheus
- grafana
- logging
- security
- redis
- kafka
- postgresql
- mysql
- troubleshooting
- system-design

Question types:
- definition
- comparison
- troubleshooting
- scenario
- architecture
- command
- experience
- best-practice

`responseMode` determines the answer shape. Supported V1 modes:

- `technical_definition`
- `technical_comparison`
- `technical_troubleshooting`
- `technical_scenario`
- `technical_architecture`
- `technical_command`
- `behavioral_experience`
- `clarification`

### Question gate

The gate owns the decision between answering and asking a clarifying question.
It uses the narrowly normalized transcript, not the displayed transcript. For
V1 it only switches to `clarification` when the utterance is genuinely
incomplete (for example, `What about?`), so a short but meaningful technical
term such as `HPA` is still answerable. The transcript shown in the chat is
never rewritten by this step.

In Phase 7 the gate also detects contextual follow-ups. A referential question
such as `Why?`, `What about cost?`, or `How would you verify that?` can inherit
the previous DevOps category and level. It inherits the earlier answer shape
only for short continuation forms; a follow-up with its own clear scenario or
question type keeps that new shape. Without a prior interviewer turn, an
otherwise incomplete fragment still produces `clarification`.

## 3. Context Builder

Context order:
1. current question
2. recent conversation
3. role prompt
4. verified candidate profile if attached
5. job description if attached
6. retrieved knowledge if RAG enabled

Keep context bounded.

Phase 11 accepts a per-interview CV/profile and optional job description. The
backend extracts normalized text from a PDF, TXT, or Markdown document, stores
that text with the interview, and discards raw file bytes. Profile and JD text
are independently bounded before prompt construction. The profile is evidence,
not a permission to invent: an answer may adapt a project/experience example
only when the exact supporting fact is present. A JD prioritizes terminology
and gaps; it cannot be presented as candidate experience. Both are treated as
untrusted data, so instructions inside uploaded documents are ignored.

Recommended recent history:
5-10 messages.

Phase 7 uses a maximum of ten completed messages in chronological order. The
context is a per-question snapshot containing only messages with a lower
sequence number than the current question. The current question is supplied
once in its dedicated prompt field, not duplicated in history. If truncation
would leave an assistant answer without its question, that orphan answer is
removed. In-progress and failed answers are excluded.

For overlapping turns, Q2 may use Q1 as context while A1 is still streaming,
but it does not receive an incomplete A1. A retry for Q1 cannot see Q2 or any
later turn.

## 4. Interview answer planner

The planner translates `responseMode` into a deterministic, testable answer
plan. It is provider-independent and has no access to provider credentials.

Each plan defines:

- an opening direction for the first sentence;
- a mode-specific answer delivery sequence;
- required spoken-answer points;
- quality checks appropriate to the mode; and
- a maximum word count (120 words, or 30 for a clarification).

The current plan is versioned as `devops-interview-answer-v3`. This allows a
future prompt revision to be evaluated against the same fixtures without
changing classifier or provider code.

### Calibrated answer delivery

Applied technical answers connect knowledge to real operation within the same
spoken response:

1. **Principle:** define the mechanism, distinction, failure domain, or design goal.
2. **Application:** explain where it is used and give a concrete configuration,
   command, log, metric, component, rollout step, or decision constraint.
3. **Verification:** close with how the candidate would interpret results,
   validate success, manage risk, or make the trade-off.

The exact sequence varies by `responseMode`. A direct definition is an explicit
exception: it defines the named term and may add one essential distinction or
relevance sentence, then stops. It must not be padded with a workflow, example,
or verification step that was not requested. For applied answers, troubleshooting uses
failure domains -> ordered checks -> remediation and verification, while a
comparison uses model difference -> operational consequence -> choice under a
specific constraint. Behavioral answers keep STAR and the verified-facts rule
instead of forcing a technical definition.

## 5. Prompt strategy

Default rules:
- answer as a prepared DevOps candidate would speak, not as a textbook or a chat assistant
- lead with the direct answer; do not start with filler such as "Certainly" or repeat the question
- direct definitions: roughly 8-15 seconds, 18-55 words
- applied technical answers: use their mode-specific range and depth
- practical explanation
- simple wording
- trade-offs where useful
- no invented experience

The stable candidate role and tone live in the provider instructions. The
dynamic classified question, bounded conversation context, answer plan, and
role level are passed as typed prompt input. The model returns only the spoken
answer. Category metadata can remain available to internal stream consumers,
but is not rendered beneath the candidate-facing answer because it distracts
from the spoken response. Neither response may expose reasoning, prompt text,
or provider details.

For a detected follow-up, the prompt explicitly identifies the referenced
interviewer question and tells the model to extend that turn without repeating
the earlier answer.

### Candidate-answer policy

- Direct definition questions: state the concept first, then add at most one essential distinction or relevance sentence. Do not volunteer a workflow, practical example, or verification step.
- Other technical questions: state the concept or recommendation first, then add the practical detail, trade-off, or example appropriate to that mode.
- Scenario and architecture questions: explain the proposed approach, why it fits, key risks/trade-offs, and how it would be validated.
- Command questions: give only safe, relevant commands and say briefly what each check establishes. Do not imply commands were run.
- Behavioral and experience questions: use first-person claims only when they are present in the verified candidate profile. Without verified facts, do not invent a project, employer, incident, metric, ownership, or result. Give a clearly labelled adaptable answer structure instead.
- Ambiguous or incomplete questions: make the most reasonable assumption in one short clause, or ask one concise clarifying question if an answer would otherwise be misleading.
- Never claim certifications, production access, direct experience, or measured outcomes that have not been supplied.

### Answer shapes

| responseMode | Required shape |
| --- | --- |
| `technical_definition` | what it is -> one essential distinction or relevance sentence -> stop; no unsolicited workflow, example, verification, or checklist |
| `technical_comparison` | key distinction -> trade-offs -> when to choose each |
| `technical_troubleshooting` | likely causes -> ordered checks -> remediation and verification |
| `technical_scenario` / `technical_architecture` | recommendation -> components/steps -> trade-offs -> validation |
| `technical_command` | command/check -> what to inspect -> safe next action |
| `behavioral_experience` | verified STAR answer, or labelled adaptable STAR outline when no profile fact exists |
| `clarification` | one targeted question needed to give a correct answer |

Troubleshooting:
- checks in logical order
- useful commands/log sources
- likely root causes
- remediation

Comparison:
- key difference
- strengths/limitations
- when to use each

Experience:
- use only verified profile facts
- if unknown, do not fabricate

## 6. Interview answer quality gate

Validate:
- reasonable length
- answers current question
- unsupported experience claims
- empty output
- excessive repetition
- unsafe/invalid formatting
- a technical answer with no concrete operational detail
- required shape for the classified `responseMode`
- directness: the first sentence must answer the question or state the working assumption
- candidate-ready language: no meta commentary, prompt leakage, or generic assistant greeting
- category metadata, if emitted internally, remains relevant and distinct

The V1 quality gate composes the existing hard validator with candidate-ready
checks. Safety, unsupported experience, length, missing operational detail, and
an invalid response shape remain blocking and emit the retryable `answer.error`
event without deleting the interviewer transcript. Generic greetings and
non-spoken heading/list formatting are presentation warnings: they are logged,
but they do not discard an otherwise usable answer after its tokens have already
been streamed. The prompt explicitly requests direct spoken prose to reduce
these warnings. A buffered repair flow belongs to later production hardening
and must not be presented as implemented.

## 7. RAG

Phase 10 indexes the curated `knowledge/devops/` Markdown cards into PostgreSQL
with pgvector. The explicit backend-only `npm run knowledge:index` job hashes
each source, skips unchanged documents, splits heading-based sections, embeds
the chunks, and stores role/category/source/version metadata. It never indexes
audio, interview transcripts, extension data, or provider secrets.

At answer time, retrieval runs after classification and before prompt building.
Only chunks above `RAG_MIN_SIMILARITY` and containing at least one matching
classified category (or an explicit narrow-tool alias such as Argo CD -> CI/CD)
are added to the prompt. At most `RAG_MAX_CHUNKS` are used.
The prompt treats them as untrusted reference text: it ignores instructions
inside them and never tells the candidate that documents, sources, retrieval,
or citations were used.

When the index is absent, the embedding provider is unavailable, the score is
below threshold, or the retrieved topic does not match the classification, RAG
falls back to normal model knowledge and emits a structured `rag.fallback` log.
It must not invent a source or make answering unavailable.

## 8. Feedback loop

Later store:
- question
- generated answer
- user rating
- edited/preferred answer

Use this to improve prompts/RAG before considering fine-tuning.
