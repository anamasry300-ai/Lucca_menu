# MENU_SECURITY_HARDENING_2H.md — Phase 2H (Design-Only)
## Purpose
Design-only hardening to satisfy P0 gates before any write path. No production/runtime changes.

## P0 Blockers Mapping
| ID | Issue | Required Design (Pre-Write) | Status (Design) |
|---|------|----------------------------|----------------|
| S2 | localStorage.currentUser as authority | Server-side authority only; client never trust source of truth | Design-only |
| S3 | Hardcoded session secret | Env-only secrets; boot-time fail if missing (no defaults) | Design-only |
| S4 | Fallback secrets/keys | No fallbacks; explicit env required | Design-only |
| S5 | Path traversal | Allowlist + canonicalization + sandboxed root | Design-only |
| S7 | GET bypass + public-key leak | Auth per-route; no public privileged endpoints; least privilege | Design-only |
| S9 | RBAC via localStorage | Server-side RBAC (Deny-by-Default), roles from session/token | Design-only |

## Principles
- Deny-by-Default, Least Privilege, Defense-in-Depth
- Server-Side Authority only
- Boot-time validation (env-only, fail-fast)
- Immutable Audit Append-Only
- Feature Flags OFF by default

## Gates (Hard Gate)
Pre-Write Hard Gate requires all P0 CLOSED + evidence. Design-only.
