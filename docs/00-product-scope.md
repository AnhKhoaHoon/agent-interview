# Product Scope

## Product name

Agent Interview

## Supported interview roles

- DevOps Engineer (`devops`)
- Database Administrator (`dba`)

## V1 use case

A Chrome Extension Side Panel listens to audio from a user-selected interview browser tab, converts interviewer speech to text, and shows a short AI-generated answer as text.

The generated text must be a candidate-ready interview answer, rather than a generic documentation excerpt. It is intended for mock interviews, practice, or interviews where AI assistance is explicitly permitted.

## User experience

```text
Interview tab
    |
    | audio
    v
Agent Interview Side Panel

Interviewer:
What is Kubernetes HPA?

AI Assistant:
Kubernetes HPA automatically adjusts the number of pod
replicas based on metrics such as CPU, memory or custom metrics.

Keywords:
HPA • Metrics • Scaling
```

## V1 functional scope

- Chrome Side Panel
- explicit start/stop capture
- selected tab audio capture
- voice activity detection
- utterance segmentation
- STT
- final transcript
- automatic AI invocation
- streamed answer text
- conversation context
- role-specific prompt/classification rules
- candidate-ready, spoken-answer guidance for each question type
- interview history
- latency metrics
- error recovery
- optional per-interview CV/profile and job-description context, used only for
  verified experience-aware answers

## Out of scope for first production release

- mobile
- desktop native app
- multi-user organization features
- billing
- full meeting recording
- automatic speaker identity
- autonomous actions outside answering
- fine-tuning pipeline
- additional interview roles beyond DevOps and DBA

## Future roles

The role interface should allow later addition of:

- Backend
- Frontend
- QA
- Security
- Data
- Cloud
- System Engineer
