# MENU_SECURITY_BOOT_VALIDATION.md — Boot-Time Validation (Design-Only)
## Goal
Fail-fast at startup if required security config missing. Env-only, no fallbacks.

## Requirements
- Required env vars: SESSION_SECRET, AUTH_ISSUER, AUTH_AUDIENCE (or equivalent). Must be non-empty.
- No default secrets. Missing → startup abort (BOOT_VALIDATION_FAILED).
- Validate format/length (non-trivial). No hardcoded values.
- Read-only checks, no mutation.
