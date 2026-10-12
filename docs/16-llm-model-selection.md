# LLM Model Selection for Agent Interview

This guide selects the **text-answer LLM** only. It does not change the STT
model (`STT_MODEL`) or the embedding model (`EMBEDDING_MODEL`). Provider keys
remain backend-only; never put an LLM key or model credential in the extension.

Model availability, rate limits, and pricing are account- and time-dependent.
Verify the configured model in the OpenAI API model catalog before a paid test.
The figures and recommendations below were checked on 2026-10-05 and must be
reviewed again before a long-running deployment.

## Recommendation

For a personal, live DevOps interview assistant, start with:

```dotenv
LLM_MODEL=gpt-6.1-sol
```

`gpt-6.1-sol` is the recommended balance for this project: it targets complex
professional work, has near-flagship capability, and is materially cheaper than
the flagship model. It is a good default for concise definitions, comparisons,
real-world troubleshooting, and architecture questions where first-token delay
also matters.

Do not change a working model only because it is newer. Compare it with the
current configuration on representative interview questions and retain the
lightest model that meets the quality bar.

## Decision table

| Model ID | Use it for | Do not use it as | Current relative cost | Recommendation |
| --- | --- | --- | --- | --- |
| `gpt-6.1-sol` | Normal live interview answers: DevOps concepts, incidents, trade-offs, and architecture | A guarantee that every transcript is correct | $2 input / $10 output per 1M tokens | **Default choice** after confirming API access. |
| `gpt-6-astra` | Difficult, ambiguous, senior-level system design or incident reasoning where quality matters more than latency/cost | The default for every short definition | $10 input / $50 output per 1M tokens | Use selectively after evaluating it against Sol. |
| `gpt-6-luna` | Cost-sensitive development tests and high-volume, well-scoped automation | The primary candidate-facing answer model without evaluation | $0.10 input / $0.50 output per 1M tokens | Keep for experiments or non-critical tasks. |
| Existing `gpt-5` configuration | A known working configuration while planning a measured migration | An assumed current quality/cost baseline | Check the model catalog for current status and account access | Do not silently change it in production. |

Prices are list prices from the OpenAI model catalog at the date above and can
change. Input, output, cached input, reasoning tokens, and retries all affect
actual spend.

## Apply a model change

1. Keep the key in the root, uncommitted `.env` only.
2. Change only the backend setting, for example:

   ```dotenv
   LLM_PROVIDER=openai
   LLM_MODEL=gpt-6.1-sol
   ```

3. Rebuild and restart the backend:

   ```bash
   docker compose up -d --build backend
   docker compose logs -f backend
   ```

4. Run a controlled interview test. The extension needs no rebuild for an LLM
   model change because it never receives the provider key or model setting.
5. If the provider rejects the model or the result regresses, restore the
   previous `LLM_MODEL` and recreate the backend container.

The runtime uses OpenAI's Responses API with streamed output. It selects the
primary model through `LLM_MODEL` and exposes only validated backend-only
controls: `LLM_REASONING_EFFORT`, `LLM_MAX_OUTPUT_TOKENS`, and
`LLM_VERBOSITY`. Start
with `low` effort and `low` verbosity for live, concise interview answers;
evaluate representative senior scenarios before changing these values. The
output-token cap includes reasoning tokens, so a cap that is too low can return
an incomplete answer.

`LLM_ROUTINE_MODEL` is an optional fast path for well-scoped `definition`,
`comparison`, and `command` questions. The project keeps `LLM_MODEL` for
troubleshooting, scenario, architecture, best-practice, and experience turns,
where the stronger model's reasoning is more valuable. Configure a routine model
only after it passes the same answer-quality and latency evaluation for both
English and Vietnamese questions.

For the configured production profile, `gpt-6.1-sol` answers applied and
senior questions, while `gpt-6-luna` is restricted to bounded definitions,
comparisons, and commands. `LLM_ROUTINE_REASONING_EFFORT`,
`LLM_ROUTINE_MAX_OUTPUT_TOKENS`, and `LLM_ROUTINE_VERBOSITY` override the
primary controls only for that short-answer path. This is intentionally a
latency optimization, not a claim that the faster model is superior for an
incident or architecture decision.

## Evaluate before deciding

Use the same controlled set of questions for each candidate model. Include at
least one question from every type below and use the same answer language,
knowledge index, candidate profile, and backend configuration except for
`LLM_MODEL`.

| Interview type | Example evaluation question | Pass condition |
| --- | --- | --- |
| Definition | `What is Azure Landing Zone?` | Defines only the requested concept; does not drift into unrelated AWS or CI/CD content. |
| Comparison | `What is the difference between GitLab CI and Jenkins?` | States the key distinction, a relevant trade-off, and when to choose each. |
| Troubleshooting | `An AKS workload gets Key Vault 403. How would you investigate?` | Gives evidence, safe remediation, and verification without broadening identity permissions. |
| Architecture | `Design a highly available API platform on Azure.` | Starts from requirements and explains a concrete trade-off plus validation. |
| Unknown knowledge | Ask about a realistic DevOps tool absent from `knowledge/`. | Uses general knowledge or states a safe assumption; does not invent a knowledge source or personal experience. |
| Vietnamese | `Terraform có bao nhiêu loại backend?` | Keeps the chosen Vietnamese language, preserves technical terms, and answers the intended question. |

For every run, record:

- transcript accuracy separately from answer quality;
- speech-end to first-token latency and total answer time;
- directness and technical correctness;
- category drift, hallucinated experience, or cross-cloud service confusion;
- approximate input/output token usage and cost from the provider dashboard.

Do not judge a model from a single answer. A better LLM cannot recover a wrong
transcript, irrelevant RAG chunk, or missing interview context.

## Cost and latency controls

- Keep `RAG_MAX_CHUNKS` bounded so the prompt contains only relevant evidence.
- The backend retrieves RAG and relevant candidate context in parallel. It does
  not send a CV for routine technical definitions/commands, and it limits
  definition prompts to the two most relevant knowledge chunks.
- Keep definition answers short; a stronger model should improve accuracy, not
  make a simple definition verbose.
- Preserve `LLM_TIMEOUT_MS` and `LLM_MAX_RETRIES` as bounded safety controls.
  A retry can increase cost and latency, so investigate recurring failures.
- Do not route every question automatically to the most expensive model before
  collecting representative evaluation evidence.
- Use a model snapshot only after checking the provider's current snapshot and
  deprecation policy; a stable alias is easier for initial local testing but
  can change behavior over time.

## Troubleshooting model changes

| Symptom | Check first |
| --- | --- |
| `LLM_API_KEY`/model rejection | Account/project access, the exact `LLM_MODEL` ID, and backend logs. Do not expose the key in the extension or logs. |
| First token is slow | Provider latency, selected model, prompt/RAG size, retry behavior, and network. Measure before changing VAD timing. |
| Answer is technically weak | Verify transcript text, classifier category, retrieved knowledge, prompt version, then compare the same question on a stronger model. |
| Answer is verbose | Keep the prompt's answer mode and word range strict; changing models alone is not a reliable verbosity control. |
| Costs rise | Review output length, retries, RAG context size, provider usage, and traffic volume before downgrading quality. |

## Official references

- [OpenAI model catalog](https://developers.openai.com/api/docs/models)
- [OpenAI model-selection guide](https://developers.openai.com/api/docs/guides/model-selection)
- [Using GPT-6 and migration considerations](https://developers.openai.com/api/docs/guides/latest-model)
