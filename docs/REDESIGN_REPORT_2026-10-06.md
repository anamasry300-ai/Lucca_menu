# LUCCA MENU — REDESIGN v4 (PHASE D) — التقرير النهائي

> **تاريخ:** 2026-10-06 · **الفرع:** `ui-redesign` · **HEAD:** `a288041`
> **المشروع على القرص:** `C:\Users\Acer\OneDrive\Desktop\Lucca-Menu-Website`
> **الحالة العامة:** ✅ مكتمل — **بدون أي commit أو push** (بالتأكيد كما طُلب)
> **التحقق الآلي:** **24/24 PASS** في `verify4.js` + Regression وظيفي كامل + فحص overflow في 6 viewports

---

## 1. البطاقة التنفيذية (Executive Summary)

| البند | النتيجة |
|---|---|
| الطبقة الجديدة | `menu/luxury-glass.css` **v4** (إعادة كتابة كاملة، replace للنسخة القديمة) |
| لوحة الألوان | Espresso `#120D0A` / Cocoa `#4A2E1C` / Cream `#F6EDE2` / Bronze `#C79B5E` / Gold `#E3BE87` |
| الهوية في المقدمة | Hero يبدأ باللوجو (بدون أي صورة فوتوغرافية) + kicker + tagline + CTA |
| سياسة الصور | Tier-1: 4 أصول موثقة فقط · Tier-3: fallback جمالي (monogram) لكل ما عداها |
| 데이터 البيانات | **لم تُمسّ**: 103 منتج منشور عبر 14 فئة، كل الأسعار والنصوص كما هي |
| الوظائف | جميعها محفوظة: search / tabs / detail sheet / cart / WhatsApp / lang / QR / staff hidden |
| الجودة | 24/24 فحص آلي، ZERO overflow أفقي (360→1440)، ZERO أخطاء console |

---

## 2. الهوية البصرية في المقدمة (Brand-First Hero)

- **الـ hero** الآن يبدأ بكيكر `EST. 2024 · SPECIALTY COFFEE · PORT SAID` ثم قفل اللوجو
  (`<h1 class="hero-lockup">` + `menu/logo.svg?v=7`) ثم tagline عربية/إنجليزية ثم CTA
  `تصفح القائمة` (`heroBrowse`, ارتفاع 48px ≥ 44px) ثم الموقع والهاتف.
- **قرار تصميمي موثق:** لا صورة hero إطلاقًا — خلفية gradient/aura/grain برمجية
  (أداء: حفظ ~4.7MB · سلامة: لا صور معتمدة مائيًا أو عامة). نقطة القدوم:
  عند وصول اللوجو الرسمي "Hub Cafe" يُستبدل `menu/logo.svg` بـ `assets/lucca-logo.png`
  (نفس المسار `logo.svg?v=7` يُزيّد بصريًا فقط).
- Topbar عائم بشكل pill — اللوجو يرتفع من 40px إلى 68px حسب الشاشات
  (`--lg-topbar-h`: 102/110/120/134/150/158).

## 3. لوحة الألوان والنظام البصري (Tokens)

- متغيرات موحدة في `:root`: `--lg-espresso`, `--lg-cocoa`, `--lg-cream`,
  `--lg-bronze`, `--lg-gold` + درجات الشفافية للزجاج (`--lg-glass-*`).
- قاعدة **glass** الهادئة المعتمدة على `backdrop-filter` مع fallback لمتصفحات
  لا تدعمها (تبقى الخلفية espresso ثابتة).
- `prefers-reduced-motion` يوقف الحركات/التأثيرات؛ `prefers-contrast` يرفع التباين.

## 4. بطاقات المنتجات وصورها (Visual Cards)

- بطاقة رأسية `image-first`: منطقة صورة بارتفاع ثابت (شاشة صغيرة) ثم الاسم/الوصف/السعر.
- **Semantic image policy** — صورتان فقط:
  - **Tier-1 (موثق):** 4 أصول محلية عبر `CURATED_PRODUCT_IMAGES` + overrides.
  - **Tier-3:** monogram جمالي: `data-fb` (حرف أول) + `<em>` glyph + `<strong>` التصنيف.
- أزرار الإضافة **46×46px** (أكبر من الحد المطلوب 44). التاج المزدوج السعر يُعرض بشكل صحيح
  (صنفان سعريان) والـ origin tag بارتفاع 44px.
- تبويبات الفئات: pills زجاجية sticky dock تحت البحث، 14 قسمًا بأيقوناتها.

## 5. تجربة السلة والشراء (Cart & Checkout)

- **جوال:** bottom sheet متمركز (يتحرك من أسفل، يغطي حتى 844px على 390/844).
- **≥768:** drawer جانبي يمين بملء الارتفاع (محل الإصدار: `L1020 R1440` @1440).
- **FIX1** (`--lg-fab-spacing` للصفحة عند فتح السلة) و **FIX2**
  (`body:has(#cartPanel.show)`) يحجبان search + tabs خلف السلة المفتوحة — محفوظان.
- صور مصغرة في صفوف السلة (`cartImageFor`): صورة موثقة أو fallback
  (تحقق: V60 → صورة، إسبريسو → fallback).
- العدّادات +/− / حذف / المبلغ الكلي / زر WhatsApp — تم اختبار جمع 170 جنيه (2×45+80) بدقة.
- QR الحي في الـ footer (`#qrcode` canvas) يعمل ويظاهر.

## 6. الاستجابة (Responsive Grid)

| العرض | الأعمدة |
|---|---|
| <412px | 1 |
| 412–767 | 2 |
| 768–1023 | 2 |
| 1024–1279 | 3 |
| ≥1280 | 4 |

- شيك كامل overflow أفقي في: 360 / 390 / 430 / 768 / 1024 / 1440 → **zero**.
- الكيكر (0.34em) يبقى داخل الشاشة حتى في 360 (scrollW=boxW=334).
- الطبقات تشبه الأحجام بغض النظر عن RTL/LTR.

## 7. الأداء (Performance)

- صورة hero محذوفة من الحَمل (لم يعد يُطلب `lucca-hero-cafe.jpg` 4.7MB).
- كل صور البطاقات local صغيرة + lazy حيثما أمكن؛ fallback monogram = DOM خفيف.
- بدون أي مكتبة جديدة — إضافة CSS واحدة فقط داخل الملف الحالي.

## 8. قابلية الوصول (Accessibility & Touch)

- كل أهداف اللمس ≥44px: add/tab/topbar/search/floating/close sheet (44×44) ✔
- `aria-label` إلى Convergence comp, `role="dialog" aria-modal` على الـ sheet.
- `prefers-reduced-motion` + `prefers-contrast` + الفوع relative.
- ملاحظة: `user-scalable=no` موروثة من النسخة الحية — **لم تُغيَّر** (خارج نطاق هذا التصميم؛ يُنصح بتعديله لاحقًا).

## 9. سلامة البيانات (Data Integrity)

- 103 منتجًا منشورًا عبر 14 فئة — مطابقة تمامًا (لا "117").
- Diff للملف: **لا يوجد أي تعديل على أسطر `DATA`** — لا أسعار، لا أسماء، لا أقسام.
- أُضيفت مفاتيح ترجمة فقط (`noResults`, `heroTagline`, `heroBrowse`) وحراس null
  لـ `staffToggleBtn` (الزر غير موجود في DOM أصلاً — إصلاح دفاعي لمنع تعطّل دخول المدير).

## 10. الجودة والاختبار (QA Evidence)

- **`verify4.js` → 24/24 PASS** (103 items · 14 cats · hero · touch · fallback ·
  sheets · cart thumbs + FIX2 · no-results ar · search V60 · lang en · staff hidden ·
  cart drawer 1440 · overflow six viewports · console clean).
- **Regression وظيفي:** جمع/طرح/حذف السلة، فتح sheet من بطاقة، close 44px،
  تبويب يوسّع القسم، تبديل EN→LTR، QR حي، location/phone، bottom sheet بدقة
  (top 373 / bottom 844 على 390×844).
- **لقطات الشاشة** (قبل/بعد) في:
  `%LOCALAPPDATA%\Temp\opencode\shots\after-{360,390,430,768,1024,1440}.png`
  (540→809KB لكل viewport).

## 11. التسليم والنقاط المعلقة (Handover & Pending)

### تم التسليم
| الملف | الحالة |
|---|---|
| `menu/index.html` | مُعدَّل (hero · _LANG · applyLang · renderItem · openProductDetail · updateCartUI+cartImageFor · scrollToMenu · no-results · cache-bust `?v=4` · staff guards) |
| `menu/luxury-glass.css` | **v4 جديد كامل** |
| `menu/logo.svg` | مستخدم مؤقتًا في hero/topbar (`?v=7`) |

### ينتظر المستخدم (أدوات تحويل عمل)
1. **اللوجو الرسمي** "Hub Cafe" لإتمام البديل (النقطة الموثقة في §2).
2. **صور المنتجات الموثقة** لرفع المزيد من الأصناف من Tier-3 إلى Tier-1.
3. **المراجعة البصرية النهائية** على لقطات `after-*.png` (النموذج لا يقرأ الصور).

### Git
- **لا شيء مُلتزم ولا مدفوع.** للتسليم يدويًا:
  `git -C … add menu/index.html menu/luxury-glass.css` ثم commit/push أنت.

---

*نهاية تقرير PHASE D — إعادة تصميم v4. لم يتم commit أو push.*