# MENU_AUDIT_ENFORCEMENT_2H.md — Audit Enforcement (Design-Only)
## Enforcement
- Append-Only, immutable, tamper-evident (hash chain).
- All security-relevant actions logged (authz deny/allow, publish, mutation attempts).
- PII redaction. Actor from server session only (not client claim).
- Write-before-exec or after with rollback; no silent drops.
