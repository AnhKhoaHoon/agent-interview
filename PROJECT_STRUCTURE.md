# Target Repository Structure

```text
agent-interview/
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── .env.example
├── docker-compose.yml
├── docs/
├── backend/
│   └── src/
│       ├── interview/
│       ├── transcription/
│       ├── ai/
│       │   ├── classifier/
│       │   ├── context/
│       │   ├── prompt/
│       │   ├── providers/
│       │   ├── formatter/
│       │   └── rag/
│       ├── roles/
│       │   └── devops/
│       ├── database/
│       ├── stream/
│       ├── health/
│       └── common/
├── extension/
│   └── src/
│       ├── background/
│       ├── sidepanel/
│       ├── audio/
│       ├── realtime/
│       ├── api/
│       ├── state/
│       └── types/
└── knowledge/
    └── devops/
        ├── linux/
        ├── networking/
        ├── docker/
        ├── kubernetes/
        ├── aws/
        ├── terraform/
        ├── ansible/
        ├── cicd/
        ├── observability/
        └── security/
```
