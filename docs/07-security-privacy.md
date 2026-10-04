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
- tabCapture

Do not request broad host access without a concrete requirement.

## CORS

Development may allow localhost and current extension ID.

Production must use strict allowlist.

## API protection

Implemented V1 controls:

- a new session receives a random 256-bit bearer token;
- PostgreSQL stores only its SHA-256 hash;
- all interview-specific REST and SSE requests require that token;
- the extension keeps it in memory only and never puts it in an SSE URL;
- Redis rate limits session creation, transcription, and general API calls when
  production hardening is enabled;
- rate limiting fails closed if its required Redis dependency is unavailable.

This is interview-resource authorization, not human identity. For an internet-
facing multi-user product, place the private backend behind an identity-aware
edge or add proper OIDC/OAuth user authentication and per-user quota/accounting.

For broader use:
- proper user identity
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

Production startup rejects a wildcard/empty CORS allowlist, disabled rate
limiting, and an unprotected metrics endpoint. TLS termination and edge identity
remain deployment responsibilities.
