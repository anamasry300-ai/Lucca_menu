# Phase 12 — Lucca Menu CMS: Implementation Report

## 1. Overview
A professional management layer was added to the Lucca Menu admin dashboard: **Overview**, **Products**, **Categories**, **Images**, **Location & Contact**, **Settings**, and **Preview** tabs with shared validation and an honest local Draft / Review / Publish pipeline. Everything is browser-local (localStorage) and additive — the public menu and the authoritative data file are untouched.

## 2. Scope & architecture decisions
- Built in `C:\Users\Acer\OneDrive\Desktop\Lucca-Menu-Website` (branch `ui-redesign`), NOT the old `Lucca_menu-` LuccaPOS monolith.
- No new runtime dependencies, no CDN, no Supabase/Auth, no Google Maps API. Geolocation display uses plain links/coordinates only.
- Storage keys (new, additive): `lucca-menu-categories-v1`, `lucca-menu-location-v1`, `lucca-menu-settings-v1`, `lucca-menu-publish-v1`. Product overrides stay `lucca-public-menu-overrides-v1`.
- Script order: `admin-integration.js` → `menu-editor.js` → `admin-cms.js` → inline app script.

## 3. What was built (per tab)

### نظرة عامة (Overview)
- Tab whitelist reduced to the 7 CMS tabs; legacy cashier/POS tabs are no longer reachable from the sidebar.
- Stats use accessible categories; dashboard "إدارة المحتوى" button now opens the Products tab.

### المنتجات (Products)
- Table toolbar: filter by category, text search (also matches English name + aliases), visibility filter, "no trusted image" filter, sort by name / price.
- New item editor fields: order, calories, aliases (comma separated), and size/option editor (ar/en/price per option) with add/remove rows.
- Option rows render on the public card as quick-add pills (no cart "+" when options exist) and in the product sheet as selectable sizes that update price + cart line.
- Duplicate item action (with `(نسخة)` suffix).

### الفئات (Categories)
- List all base + custom categories; rename (AR/EN), reorder (▲▼), hide/show, add, delete (custom only), reset.
- Custom category id rules: lowercase latin, digits, dashes, no duplicates.
- Hiding a category removes its tab + section from the public menu without touching its items (verified).

### الصور (Images)
- Derived inventory: STRONG / VERIFIED / LINK / FALLBACK / UNVERIFIED — all counted, nothing auto-matched.
- The owner's 12 unverified photos are shown for awareness only; manual linking is deferred.

### الموقع والتواصل (Location & Contact)
- Branch name, address AR/EN, maps URL, lat/lng, phone, WhatsApp, Instagram, and working hours (Sat→Fri).
- Live preview card; "فتح في Google Maps" uses the saved URL or a search link from the address.
- Saves to `lucca-menu-location-v1`; the public info-strip appears only when data exists (zero visual regression by default).

### الإعدادات (Settings)
- Default WhatsApp number (fallback when Location has none).
- Export/import JSON backup; "مسح التعديلات المحلية" (reset all).

### المعاينة (Preview)
- Approximate phone-width live preview of the public menu (non-interactive guard overlay), AR/EN by page language.

### النشر (Draft / Review / Publish)
- Honestly local: badge shows Draft → Review (edit count) → Published-locally with timestamp.
- Review modal lists local edits; "نشر" never touches the network and reports `{published:false}`.

## 4. Validation (Phase 9)
Shared `cmsValidateField` used across name (AR or EN required, ≤80 chars), price (numeric ≥0), category id slug, category, URL (`https://…`), phone (≥7 digits, optional), lat/lng ranges, time `HH:MM` (24:00 accepted as midnight), icon length. Inline field errors via `.invalid` + `.field-error`.

## 5. Safety invariants (Phase 10 — verified)
- `menu/menu-data.js` SHA-256: `D6937E0301A1902B2AF33A5E293796DE1782769B8079B1647FC9F8AAD4DD99D7` (unchanged).
- Canonical published-data fingerprint: `9840fde98a7a2400dc6e3ec3620a283051b40fe6ee9408450f160d2d73e91242` (103 items / 14 categories, unchanged).
- `MISLEADING` = 0; no auto-match; UNVERIFIED registry = 12, verified = 0.

## 6. Files changed / created
- `menu/index.html` — header/badge, 7-tab sidebar, tab containers, info-strip, product-sheet options, renderers, boot.
- `menu/admin-cms.js` — NEW: all CMS modules + validation + publish + preview + boot.
- `menu/menu-editor.js` — Products editor enhancements.
- `menu/admin-integration.js` — tab whitelist + dashboard stats integration.
- `menu/admin-styles.css` — tab unlock + all CMS styles.
- `menu/luxury-glass.css` — `.origin-tag.selected`, `.product-sheet-options`.
- `docs/MENU_CMS_IMPLEMENTATION_PLAN.md` — NEW Phase-1 plan.
- `docs/MENU_CMS_PHASE12_REPORT.md` — this report.

## 7. QA results
- `smoke5.js`: 32/32 PASS (no regression).
- `qa6.js`: 74/74 PASS (no regression).
- `cmsqa.js` (new): **76/76 PASS** covering: baseline, products CRUD + options + duplicate + filters + validation, categories add/hide/reorder/delete/reset/alias-safety, images inventory (STRONG=4, FALLBACK=101 after edits, UNVERIFIED=12, MISLEADING=0), location save → info-strip → whatsapp → maps link → persistence across reload, settings precedence, review/publish pipeline, preview, reset-all, zero page errors.

## 8. Bugs found & fixed during QA
- Scroll handler: duplicate `const cats` (parse error) + category-object/`getBoundingClientRect` mismatch → reverted to DOM detection.
- `categoryCmsSave`: preserved icon overrides on base rows; removed dead code.
- `saveLocationCms`: inverted time validation rejected every save → fixed.
- Validator now accepts `24:00` (real midnight closing times).
- Empty product price defaults to `0` (legacy behavior preserved — needed by existing QA).

## 9. Known limitations
- No commit/push performed (per phase rules) — changes are working-tree only.
- Visual verification is the owner's responsibility (model has no vision).
- "Publish" is intentionally local-only; real deployment requires applying changes from the hosting device (or a future deployment mode decision).
- Category hiding hides the whole section (no per-item sale flag on hidden categories yet) — by design.

## 10. Next steps (owner)
1. Open `menu/index.html?menu-admin` and visually verify each tab.
2. Save real location/hours → check the public info-strip.
3. Decide on manual linking of the 12 owner photos when ready.
4. Confirm whether a GitHub push should follow (currently withheld per phase rules).