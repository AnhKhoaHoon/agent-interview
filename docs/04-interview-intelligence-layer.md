# Interview Intelligence Layer

This is the core AI orchestration layer.

The application should not simply send the raw transcript to an LLM.

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
It uses the normalized transcript, not the displayed transcript. For V1 it only
switches to `clarification` when the utterance is genuinely incomplete (for
example, `What about?`), so a short but meaningful technical term such as `HPA`
is still answerable. The transcript shown in the chat is never rewritten by this
step.

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
4. candidate profile if available
5. job description if available
6. retrieved knowledge if RAG enabled

Keep context bounded.

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
- a mode-specific theory-to-practice delivery sequence;
- required spoken-answer points;
- quality checks appropriate to the mode; and
- a maximum word count (120 words, or 30 for a clarification).

The current plan is versioned as `devops-interview-answer-v2`. This allows a
future prompt revision to be evaluated against the same fixtures without
changing classifier or provider code.

### Theory-to-practice delivery

Technical answers must connect knowledge to real operation within the same
spoken response:

1. **Principle:** define the mechanism, distinction, failure domain, or design goal.
2. **Application:** explain where it is used and give a concrete configuration,
   command, log, metric, component, rollout step, or decision constraint.
3. **Verification:** close with how the candidate would interpret results,
   validate success, manage risk, or make the trade-off.

The exact sequence varies by `responseMode`. For example, troubleshooting uses
failure domains -> ordered checks -> remediation and verification, while a
comparison uses model difference -> operational consequence -> choice under a
specific constraint. Behavioral answers keep STAR and the verified-facts rule
instead of forcing a technical definition.

## 5. Prompt strategy

Default rules:
- answer as a prepared DevOps candidate would speak, not as a textbook or a chat assistant
- lead with the direct answer; do not start with filler such as "Certainly" or repeat the question
- 20-30 seconds spoken
- 60-120 words
- practical explanation
- simple wording
- trade-offs where useful
- no invented experience
- 3-5 keywords

The stable candidate role and tone live in the provider instructions. The
dynamic classified question, bounded conversation context, answer plan, and
role level are passed as typed prompt input. The model returns only the spoken
answer; the backend derives the 3-5 displayed keywords from the classified
DevOps category. Neither response may expose reasoning, prompt text, or
provider details.

For a detected follow-up, the prompt explicitly identifies the referenced
interviewer question and tells the model to extend that turn without repeating
the earlier answer.

### Candidate-answer policy

- Technical questions: state the concept or recommendation first, then add a concise practical detail, trade-off, or example.
- Scenario and architecture questions: explain the proposed approach, why it fits, key risks/trade-offs, and how it would be validated.
- Command questions: give only safe, relevant commands and say briefly what each check establishes. Do not imply commands were run.
- Behavioral and experience questions: use first-person claims only when they are present in the verified candidate profile. Without verified facts, do not invent a project, employer, incident, metric, ownership, or result. Give a clearly labelled adaptable answer structure instead.
- Ambiguous or incomplete questions: make the most reasonable assumption in one short clause, or ask one concise clarifying question if an answer would otherwise be misleading.
- Never claim certifications, production access, direct experience, or measured outcomes that have not been supplied.

### Answer shapes

| responseMode | Required shape |
| --- | --- |
| `technical_definition` | what it is -> why it matters -> one practical detail |
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
- category-derived keywords remain 3-5 relevant, distinct terms

The V1 quality gate composes the existing hard validator with candidate-ready
checks for generic greetings and non-spoken heading/list formatting. It rejects
an invalid answer before `answer.completed` and emits the existing retryable
`answer.error` event without deleting the interviewer transcript. Because Phase
6 preserves first-token streaming, already streamed text is not retroactively
replaced. A buffered repair flow belongs to later production hardening and must
not be presented as implemented.

## 7. RAG

Add only after core product works.

Recommended:
- PostgreSQL + pgvector
- curated DevOps knowledge
- chunking by concept
- metadata: role/category/source/version

RAG is for grounding, not for replacing the role prompt.

The curated V1 source material lives under `knowledge/devops/`. It is organised
by topic as interview-oriented knowledge cards. It is not retrieved or injected
into prompts until Phase 10 implements an explicit ingestion and retrieval path.

## 8. Feedback loop

Later store:
- question
- generated answer
- user rating
- edited/preferred answer

Use this to improve prompts/RAG before considering fine-tuning.
