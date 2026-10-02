# Security and Privacy

## Threat model priorities

1. API key leakage
2. unauthorized backend use
3. overbroad extension permissions
4. accidental audio retention
5. sensitive logs
6. abuse / cost explosion

## Provider keys

Keys exist only on backend.

Never expose:
- LLM_API_KEY
- STT_API_KEY
- DATABASE_URL
- signing secrets

## Chrome permissions

Use minimum permissions.

Expected:
- sidePanel
- activeTab
- storage
- tabCapture

Do not request broad host access without a concrete requirement.

## CORS

Development may allow localhost and current extension ID.

Production must use strict allowlist.

## API protection

For personal use:
- static bearer token or authenticated session may be enough

For broader use:
- proper user auth
- rate limit
- per-user quotas
- request validation
- audit logs

## Data retention

Default:
- retain transcript/history if enabled
- discard raw audio
- allow history deletion

## Logging

Never log:
- API keys
- authorization headers
- full raw audio
- unnecessary personal data

Prefer structured event logs with request/session IDs.

## TLS

Production backend must use HTTPS/WSS only.
