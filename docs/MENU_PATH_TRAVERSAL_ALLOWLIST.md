# MENU_PATH_TRAVERSAL_ALLOWLIST.md — Path Traversal Controls (Design-Only)
## Controls (S5)
- Root sandbox: all file ops under allowlisted roots only.
- Canonicalization: resolve real path, ensure under root.
- Allowlist: extensions/paths per operation (read-only vs write). 
- Reject .., symlink escapes, absolute paths outside root. Return 400/403.
