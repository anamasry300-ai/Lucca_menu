# MENU_AUTHZ_RBAC_DESIGN.md — Server-side Authority + RBAC (Design-Only)
## Principles
- Server-Side Authority: all authorization on server. Client localStorage not trusted (S2,S9).
- RBAC Deny-by-Default: role required per route; unknown/absent → 403.
- Auth per-route (S7): no unauthenticated privilege; GET not bypass for mutating semantics.
- Roles: least privilege (e.g., viewer/editor/admin). Scope per-resource.
