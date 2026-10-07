# LUCCA MENU — ARCHITECTURE AUDIT (PHASE 0)

> **نوع التقرير:** Audit only — بدون أي تعديل على source code.
> **التاريخ:** 2026-10-03
> **الهدف المنشور:** https://anamasry300-ai.github.io/Lucca_menu/menu/
> **الريبو:** https://github.com/anamasry300-ai/Lucca_menu
> **الحالة:** ⛔ **BLOCKED — لا تبدأ أي Phase أخرى قبل حل阻断 النقطة 1.**

---

## 0. الخلاصة التنفيذية (TL;DR)

| # | النتيجة |
|---|---|
| 1 | ⛔ **الموقع المنشور مبني من branch اسمه `master` وليس `main`.** النسختان تختلفان في كل ملف. |
| 2 | ⛔ **لا يوجد أي مسار إدارة أصناف يعمل.** لا في `main` ولا في `master`. |
| 3 | ⛔ **لوحة الإدارة كلها غير قابلة للوصول في الإنتاج** — لا يوجد Backend منشور. |
| 4 | ⛔ **3 ثغرات حادة:** بيانات دخول افتراضية مكتوبة في الصفحة، تجاوز تسجيل الدخول عبر `localStorage`، وتزوير الجلسات بسبب secret مثبّت في الكود. |
| 5 | 🔴 **كل الصور (102 صورة / 6.6 MB) معطّلة** — دالة واحدة معطوبة. |
| 6 | 🟡 **"Lucca AI" ليس ذكاء اصطناعي** — محرك قواعد 330 سطر بدون أي LLM. |
| 7 | 🟡 **3 مصادر بيانات متنافسة** للمنتجات، لا يوجد مصدر حقيقة واحد. |
| 8 | 🟢 **~1.0 MB من الكود ميت** (13 ملف orphan + مجلد `backend/` كامل). |

---

## 1. ⛔ acuity النتيجة الحاسمة — هناك فرعين مختلفان تماماً

هذا أهم ما في التقرير، لأنه يحدد أي فرع نعمل عليه.

الريبو فيه فرعان فقط:

| Branch | Commit | الحالة |
|---|---|---|
| **`master`** | `86a1c25` — *"feat: add Red Velvet dessert (95 EGP)"* | ✅ **هذا هو المنشور على GitHub Pages** |
| `main` | `57dd667` — *"دمج كامل للمحاسبة في صفحة المنيو…"* | ❌ **ليس المنشور** |

### الدليل (byte-level)

```
master/menu/index.html  = 135,193 bytes  sha=0985671EA9D7  == النسخة المنشورة بالضبط ✅
main/menu/index.html    =  97,201 bytes  sha=838CF339A8AA  != النسخة المنشورة ❌
```

### مقارنة المحتوى

| الملف | `master` (منشور) | `main` (غير منشور) |
|---|---|---|
| `menu/index.html` | **135,193** ب — بوت ذكاء اصطناعي + صور | 97,201 ب — **لا بوت، لا صور** |
| `menu/images.js` | ✅ موجود (784 ب) | ❌ غير موجود |
| `menu/images/` | ✅ **102 صورة حقيقية (6.6 MB)** | ❌ غير موجودة |
| `menu/menu-data.json` | ✅ 20,447 ب | ❌ غير موجود |
| `menu/talabat-menu.html` | ✅ موجود | ❌ غير موجود |
| `menu/admin-integration.js` | ❌ غير موجود | ✅ 557 سطر (لوحة محاسبة داخل المنيو) |
| `menu/sw.js` | `lucca-menu-v4` | `lucca-menu-v2` |
| `admin/login.html` | ✅ موجود | ❌ غير موجود |
| `admin/dashboard.html` | ✅ موجود (CRUD أصناف) | ❌ غير موجود |
| `admin/pos-engine.js` | ✅ 20,980 ب | ❌ غير موجود |
| `backend/` (TypeScript) | ✅ موجود | ❌ غير موجود |
| `server.js` (الجذر) | ✅ 5,444 ب | ❌ غير موجود |

### ⛔ الأهم: النسخة المحلية الحالية خاطئة

مجلد العمل الحالي `C:\Users\Acer\OneDrive\Desktop\Lucca-Menu-Website`
مبني من branch **`main`** — أي **النسخة التي لا يراها العميل**.

> ⚠️ **أي تعديل نبنيه على هذه النسخة لن يظهر على الموقع المنشور.**
> والأسوأ: لو دفعنا `main`، **سنحذف من الموقع كل هذهFeatures**: البوت الذكي، الصور، `menu-data.json`، `dashboard.html`، `talabat-menu.html`.
>
> كما أن **التعديلين السابقين اللذين أجريتهما** (انظر §15) وقعا على `main`، أي على ملفات لا علاقة لها بما يعرضه الموقع.

### ❓ سؤال يجب حسمه قبل أي عمل

> **هل نعمل على `master` (النسخة الحية، بها كل المميزات) — أم ندمج `main` فيها — أم نعتبر `main` خطأ متروك؟**
>
> لا يمكنني الإجابة عن هذا بدون قرار منك. كل Phase تالية تعتمد عليه.

---

## 2. Current Architecture — `master` (النسخة الحية)

```
GitHub Pages (static, branch=master, /menu/ folder only)
   │
   ├── menu/index.html   ← 137 KB، 2,180 سطر
   │     ├── <style> inline ......... ~950 سطر (CSS حقيقي، ليس styles.css)
   │     ├── <script> images.js ..... دوال slug() و getItemImage() — محمّلة لكن لا تُستدعى
   │     ├── CATEGORIES .............. 14 قسم، menu/index.html:1078–1093
   │     ├── DATA ................... 117 صنف، menu/index.html:1124–1270  ← المصدر الحي
   │     ├── CALORIES ............... بيانات سعرات
   │     ├── _LANG ................. ترجمة ar/en كاملة
   │     ├── renderItem/renderMenu .. العرض
   │     ├── cart + WhatsApp ........ السلة وطلب واتساب
   │     └── botKnows() ............. محرك البوت (330 سطر، rules فقط)
   ├── menu/images/ ................. 102 JPG (6.6 MB) — لا تُحمّل حالياً
   ├── menu-data.json ............... بيانات بديلة (يقرأها server.js فقط)
   ├── menu-data.js ................. بيانات قديمة بمخطط مختلف (128 صنف)
   ├── sw.js ........................ Service Worker، cache = lucca-menu-v4
   └── menu/talabat-menu.html ....... نسخة قريبة من المنيو، غير مرتبطة
        ↑ لا شيء من هذا يعمل على Pages بدون server
```

```
server.js  (Express + multer + express-session)  ← ❌ NOT DEPLOYED
   ├── POST /api/login           plaintext === على password واحد (متجاهل username)
   ├── PUT  /api/menu            كتابة كاملة لـ menu-data.json
   ├── POST /api/upload/...      multer، اسم الملف من الـURL بدون تعقيم
   ├── DELETE /api/image/...     fs.unlinkSync على مسار من الـURL
   └── GET /admin/*              sendFile بمسار من الـURL
        ↑ session secret = 'lucca-secret-2024' مثبّت في الكود
```

---

## 3. Files Inventory

### 3.1 حي (يُحمّل فعلاً في الإنتاج)
| الملف | الحجم | الدور |
|---|---|---|
| `menu/index.html` | 137 KB | صفحة العميل — **كل المنيو والـCSS والـJS مدمج** |
| `menu/sw.js` | 1,860 ب | Service Worker |
| `menu/manifest.json` | 567 ب | PWA |
| `menu/icon.svg` / `logo.svg` | 1.5 / 3 KB | أيقونات |
| `menu/images.js` | 784 ب | محمّل لكن **معطّل** |

### 3.2 ميت / يتيم (13 ملف)
| الملف | السبب |
|---|---|
| `main.js` | **0 بايت**، ولا مرجع له |
| `menu/academy-script.js` | **0 بايت**، ولا مرجع له |
| `preload.js` | Electron preload، لا يوجد Electron |
| `index.html` (الجذر) | لا يخدمه أحد (server.js يعيد التوجيه) |
| `admin/admin.html` | **180 KB — اللوحة الرئيسية، لا يخدمها أي شيء** |
| `admin/firebase-config.js` | ESM + placeholders + يتيم |
| `admin/menu-integration.js` | يتيم، فيه `eval()`، مخططه قديم |
| `admin/styles.css` | يتيم — CSS مكرر داخل `admin.html` |
| `menu/styles.css` | يتيم — CSS مكرر داخل `index.html` |
| `menu/talabat-menu.html` | يتيم |
| `menu/menu-data.json` | يقرأه `server.js` فقط، لا تقرأه أي صفحة |
| `backend/` (9 ملفات) | **كود ميت تمامًا** — لا أحد يستورده |
| `server/index.js` + `test-api.js` + `railway.json` + `render.yaml` | سيرفر قديم موازي |

**≈ 1.0 MB من 1.4 MB كود غير صورة غير قابل للوصول.**

### 3.3 شبه حي
- `admin/login.html` + `admin/dashboard.html` — يخدمهما `server.js:158,160` فقط، وهو غير منشور.
- `admin/database.js` (46,991 ب) — IndexedDB، 11 object store، يُحمّل في `admin.html`.
- `admin/pos-engine.js` (20,980 ب) — يُحمّل في `admin.html`.
- `menu/menu-data.js` (16,975 ب) — **مخطط مختلف تمامًا**، تحميله `admin/admin.html:1812`.

---

## 4. Data Model

### 4.1 المخطط الحي (في `menu/index.html:1124–1270`)
```js
{ n: 'V60',                    // الاسم العربي  (مطلوب)
  en: 'V60',                   // الاسم الإنجليزي (مطلوب فعليًا للصور)
  p: '80',                     // السعر: string أو string[]  ['40','80']
  d: 'قهوة مفلترة يدوياً...',   // وصف عربي  (اختياري)
  de: 'Hand-poured V60...',    // وصف إنجليزي (اختياري)
  origins: ['🇪🇹 إثيوبي', ...], // محاصيل القهوة (اختياري)
  b: 'popular' }               // badge: popular|new|specialty (اختياري)
```

**ملاحظات جوهرية على المخطط:**

| الملاحظة | الأثر |
|---|---|
| **لا يوجد `id` لأي صنف** | الأصناف تُعنى بـ **رقم其在 المصفوفة** (`items[cat][idx]`) — أي إعادة ترتيب تكسر كل المراجع |
| **`p` نصي وليس رقميًا** | `'80'` — سبب جذري لأخطاء السلة والفرز |
| **`img` موثّقة في الكود ولا تُستخدم** | `menu/index.html:1112` يوثّقها، **0 صنف يملكها**، و`getImg()` لا تقرأها |
| **لا يوجد `available` / `is_active`** | لا يمكن إخفاء صنف |
| **لا يوجد `sku` / `tags` / `oldPrice` / `prepTime`** | كل ما طلبه المواصفات غير موجود |

### 4.2 مخطط `menu-data.json` (يستخدمه `dashboard.html`)
```json
{ "categories": { "coffee": "Coffee", ... },
  "items": { "coffee": [ { "n","en","p","b","d","de","origins" } ] },
  "calories": { "coffee||Cappuccino": 130 } }
```

### 4.3 مخطط `menu/menu-data.js` (ما يحمّله POS) — **مخطط ثالث مختلف**
```js
{ id: 'coffee', title: 'القهوة', icon: '☕',
  items: [ { name: 'إسبريسو', price: 45, description: '...', image: 'https://images.unsplash.com/...' } ] }
```
- 128 صنف، أسعار **رقمية**، صور **روابط Unsplash خارجية**، معرّفات أقسام مختلفة (`hot`, `iced`, `cans`).

### 4.4 مخطط IndexedDB (`admin/database.js`)
- `DB_NAME = 'lucca_caffe_db'`، `DB_VERSION = 3`
- 11 store: `users, tables, orders, customers, settings, inventory, purchases, employees, attendance, expenses, shifts`
- **لا يوجد store للمنيو أو التصنيفات أو الأصناف.**

### 4.5 مخطط `backend/src/db.ts` (11 جدول SQLite عبر sql.js) — **الأكثر تماسكًا، وهو ميت**
`users, tables, orders, customers, settings, inventory, purchases, employees, attendance, expenses, shifts`
- `products` / `categories` **غير موجودة فيه إطلاقًا.**

---

## 5. Product Source — 3 مصادر متنافسة، ولا واحد منهاinally يعمل

| # | المصدر | الأصناف | متى يُستخدم | الحالة |
|---|---|---|---|---|
| **1** | `menu/index.html` → `DATA` | **117** | ✅ **هذا ما يراه العميل الآن** | Authority فعلي، لكنه **inline في HTML** — لا يمكن تعديله من Dashboard |
| 2 | `menu/menu-data.json` | 117 | `server.js` فقط | `dashboard.html` يكتب هنا، **ولا صفحة تقرأه** |
| 3 | `menu/menu-data.js` | **128** | `admin/admin.html` فقط | مخطط مختلف تمامًا، يُحمّل في POS |

### 5.1 ⛔ لماذا `dashboard.html` (CRUD الموجود) معطّل تمامًا

三重的原因:

1. **غير منشور** — `server.js` هو الوحيد الذي يخدمه، ولا يوجد Node على Pages.
2. **حتى لو نُشر:** `saveAll()` (`:328–340`) يرسل `{categories, items}` فقط، بينما `server.js:64` يشترط:
   ```js
   if (!data.items || !data.categories || !data.calories) return 400
   ```
   → **`dashboard.html` لا يرسل `calories` أبدًا ⇒ يفشل الحفظ بـ HTTP 400 دائمًا.**
3. **حتى لو نجح:** صفحة العميل لا تقرأ `menu-data.json` إطلاقًا — فيها `fetch` واحد فقط وهو `/api/menu` (`index.html:2168`) مع `.catch(()=>{})`.

> **النتيجة: لا يوجد أي مسار من المدير إلى العميل.** هذا هو العائق المعماري الأساسي.

### 5.2 لا يوجد CRUD في `admin/admin.html`
الأقسام الـ11: `dashboard, tables, orders, customers, settings, purchases, employees, attendance, reports, kitchen, cashier`
**لا يوجد قسم أصناف.** `MenuSync` (`database.js:989–1028`) يكتب مرة واحدة فقط (`if (!existing.length)`) في `settings` تحت المفتاح `sharedMenuCatalog` ثم **يتجمد**.

---

## 6. Image Source — 102 صورة، **كلها معطّلة**

### 6.1 السبب — سطر واحد
```js
// menu/index.html:1097
function getImg(catId, item) { return ''; }
```
تُرجع نصًا فارغًا دائمًا. في `renderItem` (`:2056`):
```js
const imgTag = imgUrl
  ? `<div class="item-img-wrap"><img class="item-img" src="${imgUrl}" ... loading="lazy">...`
  : `<div class="item-img-wrap"><div class="item-img-placeholder">${fallbackIcon}</div></div>`;
```
`imgUrl` فارغ دائمًا ⇒ **0 من 117 بطاقة تحتوي `<img>`** — كلها placeholder إيموجي.

### 6.2 `menu/images.js` محمّل لكنه لا يُستدعى
```js
// menu/images.js:6–15
function slug(name) { ... .replace(/[🇪🇹🇧🇷🇮🇳🇨🇴]/g,'') ... }
function getItemImage(catId, itemName) { return 'images/'+catId+'/'+slug(itemName)+'.jpg'; }  // :17–19
function itemImg(catId, itemName) { ... }                                                   // :21–24
function getItemImage(catId, itemName) { return itemImg(catId, itemName); }                 // :26–28 ← هذه تفوز
```
⚠️ `getItemImage` **معرّفة مرتين** — الثانية تتقدم بسبب hoisting.
⚠️ `slug()` **يحذف الحروف العربية** —_passage_ لا يصلح للأسماء العربية، ف(Image URL لا بد أن يُبنى من `item.en`).

### 6.3 تغطية الصور: **101/117 = 86.3%**

| الحالة | العدد | التفاصيل |
|---|---|---|
| ✅ تُحل | **101** | اختبار كامل على كل الأصناف |
| ❌ لا تُحل | **16** | 15 ملف ناقص + 1 خطأ تسمية |

**الـ16 المفقودة:**

| القسم | الصنف | السبب |
|---|---|---|
| `specialty` | V60 | الملف اسمه **`v60 (2).jpg`** بدل `v60.jpg` — خطأ تنزيل من المتصفح |
| `coffee` | Double Espresso · Turkish Coffee · White Mocha · French Press | لا ملفات |
| `desserts` | **Red Velvet** | أُضيف في آخر commit ولم تُضف صورته |
| `breakfast` | 11 صنف (كرواسون/سياباتا/باغيت) | **القسم كبر 17 صنف والصور 6 فقط** |

### 6.4 13 صورة مكرّرة بايت-ببايت (placeholder)
```
[4x] jelly-cola | mojito-flavor | birell | twist
[4x] lucca-mix | pina-colada | sunshine | firoz
[3x] cherry-cola | redbull-flavor | red-bull
[2x] mojito | pepsi   [2x] mixed-berry | passion-pineapple
[2x] herbal-mix | herbal-tea   [2x] crepe-fettuccine | crepe-roll
[2x] nuts | om-ali-with-nuts
```
**7 من 12 صنف `soda` و5 من 6 في `soft-drinks` هي نفس الصورة.**

### 6.5 إحصائيات
| المقياس | القيمة |
|---|---|
| عدد الملفات | 102 (`jpg` فقط) |
| الحجم الكلي | 6,601,813 B ≈ **6.30 MB** |
| أكبر ملف | `pizza/seafood-pizza.jpg` — 137 KB |
| أصغر ملف | `soda/sunrise.jpg` — 24.9 KB |
| **محتوى فريد (MD5)** | **89 من 102** ⇒ 13 مكرر |
| `lazy loading` | موجود في الفرع الميت فقط |
| `decoding="async"` | **غير موجود** |
| Precache في `sw.js` | **لا** — الصور خارج `urlsToCache` |

> **النتيجة: 6.6 MB في الريبو، لا يطلبها متصفح واحد.**

---

## 7. Categories — 14 قسمًا

### المصدر الحي (`menu/index.html:1078–1093`)
```js
{ icon: '<svg …>', name: () => t('catNames').specialty, id: 'specialty' }
{ icon: '☕',       name: () => t('catNames').coffee,      id: 'coffee' }
```
المخطط: `{ icon: string, name: () => string, id: string }` — الاسم **دالة كسولة** تقرأ من `_LANG.catNames[lang]`.

**المعرّفات:** `specialty, coffee, hot-drinks, iced-coffee, milkshake, juice, desserts, smoothie, soda, winter, breakfast, pizza, soft-drinks, addons`

### ⚠️ تضارب في تسمية الأقسام بين المصادر
| `master/index.html` | `menu-data.json` | `menu-data.js` (POS) |
|---|---|---|
| `hot-drinks` | `hot-drinks` | **`hot`** |
| `iced-coffee` | `iced-coffee` | **`iced`** |
| `soft-drinks` | `soft-drinks` | **`cans`** |

**لا يوجد `sortOrder`، ولا `hidden`، ولا صورة للقسم.** الترتيب ثابت في مصفوفة.

---

## 8. Dependencies

### 8.1 Root `package.json` (v2.0.0)
```json
{ "name": "lucca-menu", "version": "2.0.0", "main": "server.js",
  "scripts": { "start": "node server.js", "dev": "node server.js" },
  "dependencies": { "express": "^4.18.2", "multer": "^1.4.5-lts.1", "express-session": "^1.17.3" } }
```
**لا يوجد build step، ولا framework، ولا bundler، ولا TypeScript في الجذر.**
⚠️ لا يوجد `test` script.

### 8.2 `backend/package.json`
`express ^4.21.0`, `cors`, `dotenv`, `sql.js ^1.10.3` + dev: `tsx`, `typescript`, `@types/*`
- `sql.js` = SQLite مُصرَّف لـ WASM، يُحمّل بالكامل في الذاكرة ويُكتب كملف كامل بعد **كل** عملية كتابة.
- `JWT_SECRET` معرّف في `.env.example` و**لا يُقرأ في أي مكان**.

### 8.3 `server/package.json` (القديم)
`express ^4.18.2`, `cors` فقط — **بدون أي مكتبة auth.**

### 8.4 المكتبات الخارجية في الواجهة (CDN)
| الملف | السطر | المصدر |
|---|---|---|
| `menu/index.html` | 13–15 | Google Fonts (Cairo, Tajawal, Playfair Display) |
| `menu/index.html` | 16 | `cdnjs` — `qrcodejs@1.0.0` (**~7 سنوات، بلا SRI**) |
| `admin/admin.html` | — | `html2canvas`, `jspdf`, `chart.js@4.4.1` |
| `admin/firebase-config.js` | 4–6 | `gstatic` firebase (يتيم) |
| `menu/menu-data.js` | — | `images.unsplash.com` (روابط خارجية، لا تُعرض) |

- **لا يوجد `integrity` (SRI) على أي `<script>`.**
- **لا يوجد CSP.**
- `preconnect` فقط لـ fonts — **ليس لـ cdnjs أو jsdelivr**.

---

## 9. Deployment

| البند | الحالة |
|---|---|
| المنصة | **GitHub Pages — static فقط** |
| الفرع | **`master`** (مضبوط من GitHub UI، غير مرئي من الكود) |
| المسار المنشور | `/menu/` فقط (لأن الرابط المنشور فيه `/menu/`) |
| `.github/workflows` | **غير موجود — صفر CI** |
| `.nojekyll` | غير موجود (غير مطلوب هنا — لا مجلد يبدأ بـ `_` ولا `Gemfile`) |
| `CNAME` | غير موجود |
| `render.yaml` / `vercel.json` / `netlify.toml` (جذر) | **غير موجودة** |
| `server/render.yaml` + `railway.json` | موجودان لكنهما يستهدفان `server/index.js` القديم، لا `server.js` ولا `backend/` |
| **هل هناك Backend منشور؟** | ❌ **لا يوجد أي دليل.** لا Process، لا hostname في الكود |

### النتيجة المباشرة
كل `fetch('/api/...')` في المنتج يُحل إلى `https://anamasry300-ai.github.io/api/...` ⇒ **404**:
- `menu/index.html:2168` → `fetch('/api/menu').catch(()=>{})` → المنيو يعمل بالـ`DATA` inline.
- `admin/login.html:31` → `fetch('/api/login')` → 404 → **اللوحة كلها لا تُفتح**.

### 9.1 Service Worker (`menu/sw.js`)
```js
const CACHE = 'lucca-menu-v4';                 // السطر 1
const urlsToCache = ['.', 'index.html', 'icon.svg', 'manifest.json'];   // 4 فقط
```
| الفرع | السطر | الاستراتيجية |
|---|---|---|
| fonts | 33–44 | cache-first |
| cdnjs | 46–61 | cache-first + **يرجّع `200` بجسم فارغ عند فشل الشبكة** ⚠️ |
| navigate | 63–68 | **network-first** ✅ (أفضل من `main`) |
| أي شيء آخر | 70–75 | cache-first + **fallback يرجّع صفحة HTML مكان CSS/JS** ⚠️ |

⚠️ `images.js` **غير precached** رغم أنه محمّل في `index.html:17`.

### 9.2 PWA
- أيقونة **SVG واحدة فقط** (`sizes: "any"`) — **لا PNG 192/512** ⇒ `apple-touch-icon` مكسور على iOS (iOS لا يدعم SVG) + فشل PWA installability.
- `"screenshots": []` ⇒ تجربة تثبيت degraded.
- لا `favicon` كلاسيكي.

### 9.3 SEO — شبه معدوم
| العنصر | الحالة |
|---|---|
| `<title>` | ✅ `Lucca Café - Specialty Coffee` (بلا "menu" ولا موقع) |
| `meta description` | ❌ **غير موجود** |
| **OpenGraph** | ❌ **غائب بالكامل** ⇒ **مشاركة رابط واتساب/فيسبوك بلا معاينة** |
| Twitter Card | ❌ غائب |
| `canonical` | ❌ غائب |
| `hreflang` (ar/en) | ❌ غائب رغم دعم اللغتين |
| **JSON-LD (`Restaurant`/`Menu`/`Offer`)** | ❌ **غائب** — وهو أهم عنصر لمنيو 117 صنف |
| `robots.txt` / `sitemap.xml` | ❌ غير موجودين |
| `noindex` على `/admin/` | ❌ غير موجود ⇒ **اللوحة indexable** |
| viewport | ⚠️ `user-scalable=no` ⇒ **انتهاك WCAG 1.4.4** (يمنع التكبير) |

---

## 10. Security — ⛔ حرج

### 10.1 🔴 CRITICAL: بيانات دخول افتراضية مكتوبة في الصفحة
```html
<!-- admin/admin.html:997–999 -->
<p style="margin-top: 20px; font-size: 0.8rem; color: #666;">
    افتراضي: admin / 123456
</p>
```
كل من يفتح `/admin/admin.html` يرى البيانات في مصدر الصفحة.

### 10.2 🔴 CRITICAL: تجاوز تسجيل الدخول بالكامل
```js
// admin/database.js:282  — هذا هو قرار "هل المستخدم داخل؟"
getCurrentUser() { const user = localStorage.getItem('currentUser'); return user ? JSON.parse(user) : null; },
```
```js
// admin/admin.html:3777
const user = LuccaDB.Users.getCurrentUser();
if (user) { /* تخطّي شاشة الدخول مباشرة */ }
```
**DevTools → `localStorage.setItem('currentUser','{"name":"x","role":"admin"}')` → لوحة كاملة بدون كلمة مرور.**
وكذلك `role` نفسه يقرأ من `localStorage` ⇒ RBAC قابل للتزوير.

### 10.3 🔴 CRITICAL: تجاوز المصادقة بالكامل بدون أي credential
```js
// server.js:16
app.use(session({ secret: 'lucca-secret-2024', resave: false, saveUninitialized: true }));
```
الـ secret **مثبّت في الكود**. توقيع `connect.sid` هو HMAC-SHA256 على `sid` فقط ⇒ **anyone يقدر يصنع cookie صالح ويenter كلوحة الإدارة.** لا يحتاج كلمة مرور.

### 10.4 🔴 CRITICAL: 3 أنظمة مصادقة متنافسة، لا واحد منها يعمل

| النظام | يستخدمه | المشكلة |
|---|---|---|
| **أ.** `server.js` session | `login.html`, `dashboard.html` | secret مثبّت + password واحد + `username` متجاهَل |
| **ب.** `admin.html` token | `admin.html:1819` | **contract mismatch:** يتوقع `{token, user, apiKey}` لكن `server.js:36` يرجّع `{success:true}` فقط ⇒ `data.user.name` يرمي `TypeError` ⇒ يسقط تلقائيًا للمسار المحلي |
| **ج.** IndexedDB plaintext | `admin.html:1848` | `database.js:247` → `valid = (user.password === password)` |

نتيجة **ب**: نظام **ب** و**ج** يعملان فقط. ⇒ `admin.html` **دائمًا** ينتهي على تجاوز `localStorage`.

### 10.5 🔴 CRITICAL: كلمة المرور مكتوبة في سجل الخادم
```js
// server.js:170–174
console.log(`Default password: ${ADMIN_PASSWORD}`);
```
`ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lucca2024'` — **قيمة fallback حقيقية** (ليست placeholder).

### 10.6 🔴 CRITICAL: Path Traversal + كتابة/حذف ملفات عشوائية
```js
// server.js:75–97  — Multer
filename: (req, file, cb) => { cb(null, req.params.filename); },   // اسم الملف من الـURL، بدون تعقيم
fileFilter: (req, file, cb) => { if (!file.mimetype.startsWith('image/')) ... }  // Content-Type من العميل فقط
```
```js
// server.js:99–107  — DELETE
const fp = path.join(IMAGES_DIR, req.params.catId, req.params.filename);
if (fs.existsSync(fp)) fs.unlinkSync(fp);          // ⚠️ حذف أي ملف على القرص
```
```js
// server.js:163–167  — تسريب ملفات
app.get('/admin/*', (req, res) => {
  const fp = path.join(__dirname, 'admin', req.params[0]);
  if (fs.existsSync(fp)) return res.sendFile(fp);   // ⚠️ غير مصادَق ⇒ /admin/../server.js
});
```
⇒ `/admin/..%2F..%2Fserver.js` يكشف **كلمة المرور والـ session secret**.

### 10.7 🔴 كل قراءات `backend/` عامة + كلمات مرور plaintext
```ts
// backend/src/index.ts:19
if (req.method === 'GET') return next();     // ⚠️ كل GET مفتوح
// backend/src/index.ts:27–29
app.get('/api/public-key', …) => res.json({ apiKey: API_KEY })   // ⚠️ ينشر مفتاح الكتابة
```
```ts
// backend/src/db.ts:224 — seed
INSERT INTO users (username, password, name, role) VALUES ('admin','123456','مدير النظام','admin')
```
و`users` ضمن `SAFE_TABLES` في `crud.ts:33` ⇒ **`GET /api/users` يعرض كل كلمات المرور.**
(و`backend/` ميت — لكن الخطر موجود إن تم تنشيطه.)

### 10.8 🟡 مصفوفة الأسرار

| القيمة | النوع | مكان |
|---|---|---|
| `123456` | كلمة مرور admin | `admin.html:998` · `database.js:301` · `db.ts:224` · `.env.example:3` |
| `lucca2024` | password السيرفر | `server.js:11` |
| `lucca-secret-2024` | session secret | `server.js:16` |
| `lucca-secret-key` | API key ×7 | `database.js:1090,1123,1149` · `admin.html:2721` · `backend/src/index.ts:9` · `server/index.js:8` · `test-api.js:2` |
| `YOUR_API_KEY` | placeholder | `firebase-config.js:10,14,15` |
| `service_role` | **غير موجود** ✅ | 0 hits |
| `_adminForceLogin` / `bypass` | **غير موجود** ✅ | 0 hits |
| `bcrypt` / `jsonwebtoken` | **غير موجود** | لا تشفير، لا JWT |

⚠️ **`.gitignore` في الجذر سطر واحد فقط: `node_modules/`.** ⇒ `.env` و`data/` و`pos-sync.json` **غير مستبعدة** ⇒ تسريب secrets عند أول commit.

### 10.9 🟡 RBAC غير موجود فعليًا
- دوران فقط: `admin`, `cashier`.
- **فحص واحد فقط** في كل المشروع: `admin.html:2548` (`editOrder`).
- `admin/dashboard.html` — **لا يوجد فيه أي فحص صلاحيات إطلاقًا**.

### 10.10 🟡 XSS مخزّن — يصبح هجومًا حقيقيًا بعد تفعيل إدارة الأصناف
```js
// menu/index.html:2037
const safeName = item.n.replace(/'/g, "\\'");     // ⚸️ لا يوجد تهريب للـ double-quote
// :2046
onclick="addToCart('${safeName}', ${price}, ...)"
```
**اقتباس `"` في اسم صنف يكسر الـ attribute ⇒ تنفيذ JS عشوائي.**
و`dashboard.html:187–199` يمرّر `item.n/en/d` إلى `innerHTML` + `onclick` **بدون أي تهريب**.
و`renderMD()` → `innerHTML` (`:1438`) يستقبل أسماء أصناف قابلة للكتابة عبر `PUT /api/menu`.

> ⚠️ **هذه vulnerabilities مكتومة اليوم لأن الأصناف inline. بمجرد ربط Dashboard she'll تتحول لـ stored XSS.**

### 10.11 🟡 Privacy
- `menu/talabat-menu.html` غير مرتبط + بلا canonical ⇒ **duplicate content**.
- `admin/admin.html` بلا `noindex` ⇒ الداشبورد + تلميح كلمة المرور قابلان للفهرسة.
- `server.js:110` `pos-sync.json` = بيانات طلبات العميل، وغير مستبعدة من git.

---

## 11. Problems — مرتبة بالخطورة

| # | المشكلة | الأثر | الموقع |
|---|---|---|---|
| **P1** | الموقع المنشور من `master` والنسخة المحلية من `main` | **عمل ضائع / فقدان مميزات** | repo |
| **P2** | لا توجد مصادقة فعالة (3 أنظمة متنافسة) | اختراق كامل | `server.js:16` · `database.js:247` · `admin.html:3777` |
| **P3** | `localStorage.currentUser` يتجاوز الدخول | اختراق كامل بلا password | `database.js:282` |
| **P4** | Path traversal: حذف/كتابة/قراءة أي ملف | اختراق كامل | `server.js:83,101,163` |
| **P5** | لا Backend منشور | اللوحة كلها ميتة | deployment |
| **P6** | `dashboard.html` الحفظ يفشل بـ 400 دائمًا | لا إدارة أصناف | `dashboard.html:330` vs `server.js:64` |
| **P7** | `getImg()` ترجع `''` | **102 صورة معطّلة** | `index.html:1097` |
| **P8** | 3 مصادر بيانات متنافسة (117 / 117 / 128) | تضارب أسعار | 3 ملفات |
| **P9** | لا `id` للأصناف — تُعرَّف برقم المصفوفة | إعادة الترتيب تكسر المراجع | `index.html:1124` |
| **P10** | `p` نصي لا رقمي | أخطاء حسابية | `index.html:1124` |
| **P11** | لا `available` field | لا يمكن إخفاء صنف | schema |
| **P12** | لا OpenGraph / JSON-LD | مشاركة بلا معاينة، لا rich results | `index.html:4–15` |
| **P13** | SW fallback يرجّع HTML مكان أصول | أخطاء تحميل | `sw.js:73` |
| **P14** | أيقونة SVG فقط | PWA install + iOS icon مكسور | `manifest.json:14` |
| **P15** | 13 ملف ميت + `backend/` كامل | تشويش + ثغرات مخفية | §3.2 |
| **P16** | 13 صورة مكرّرة بايت-ببايت | صور placeholder | `menu/images/` |
| **P17** | `.gitignore` سطر واحد | تسريب `.env` | root |

---

## 12. Risks

| # | الخطر | الاحتمال | الأثر | التخفيف |
|---|---|---|---|---|
| R1 | **العمل على `main` والـpush** يمسح البوت والصور من الموقع الحي | عالٍ جدًا | **كارثي** | حسم قرار الفرع **قبل** أي كتابة |
| R2 | تخزين صور ضخمة / base64 في JS كما طلب المواصفات | متوسط | بطء المنيو | §13-Option B |
| R3 | ربط Dashboard قبل إصلاح P4 يخلق **RCE/arbitrary write** عبر رفع صورة | متوسط | حرج | إصلاح traversal **أولًا** |
| R4 | Dashboardeditor → أسماء أصناف → **stored XSS** (P10) | عالٍ بعد التفعيل | حرج | تهريب صحيح + `textContent` قبل تفعيل CRUD |
| R5 | Supabase بأسوأ من IndexedDB + session | — | — | **لا تضف Supabase** (§13) |
| R6 | JWT/localStorage token = نفس المشاكل الحالية | — | — | لا تعيد بناء نفس الفكرة |
| R7 | AI يكتب الأسعار أو يحذف أصناف | — | حرج | deterministic tools فقط |
| R8 | Fleet scale-to-zero يمسح `menu-data.json` | مؤكد | عالٍ | لا تعتمد على ملف JSON للنشر |
| R9 | لا CI ولا اختبارات ⇒ كل تعديل مخاطرة | مؤكد | عالٍ | Tests قبل Phase 3 (§26) |
| R10 | SW cache-first قد يخفي الأخطاء عنك | متوسط | متوسط | bump الإصدار + اختبار حقيقي |

---

## 13. Recommended Architecture

> **المبدأ:** لا تكسر المنيو، لا تخترع Backend جديد، ولا تفترض Supabase.

### 🚫 الخيارات المرفوضة
- **❌ Supabase** — لا يوجد في المشروع إطلاقًا. إضافة RLS + Auth + Storage الآن = تغيير جذري + إعادة كتابة. `backend/src/db.ts` (SQLite 11 جدول) هو البديل الأنضج.
- **❌ JWT في localStorage** — نفس ضعف الحالي.
- **❌图片 base64 في JS** — 6.6 MB صور في ملف JS = كارثة أداء. **مرفوض.**
- **❌ AI يقرر الأسعار** — مرفوض صريح.

### 🌟 الخيار الموصى به — "Static-first + JSON واحد" ⭐

```
GitHub Pages (static)
  └── menu/data/menu.json      ← مصدر الحقيقة الوحيد (117 صنف + صور)
  └── menu/data/calories.json
  └── menu/index.html          ← يقرأ menu.json (fallback للـ DATA inline)
  └── admin/                   ← Dashboard (repo خاص/غير منشور)
         └── يصدر menu.json    ← تنزيل ملف / commit
```
**لماذا؟** يطابق_constraint当前的 Deployment تمامًا (static)، لا يحتاج Backend، لا secrets، مصدر حقيقة واحد، والتغييرات تُرفع بـ commit.

| المزايا | العيوب |
|---|---|
| ✅ صفر بنية جديدة | ❌ يتطلب commit لكل تعديل |
| ✅ لا secrets | ❌ لا real-time |
| ✅ يعمل offline | ❌ التحديث يحتاج redeploy (② SW bump) |
| ✅ JSON قابل للـdiff والـreview | |

### الخيار B — "خادم صغير" (لو أردت حفظ فوري)
`server.js` موجود فعلاً فيه multer + session. **يُصلَّح** بدل استبداله:
1. `ADMIN_PASSWORD` من env فقط (بلا fallback).
2. `session.secret` من env، `saveUninitialized: false`, `cookie.secure/sameSite`.
3. bcrypt/argon2 + أدوار (admin/manager/editor/viewer).
4. تعقيم `catId`/`filename` + `path.basename` + تحقق من المسار.
5. تخزين **ملف منفصل** `data/menu.json` لا `menu/menu-data.json`.
6. نشر على Render/Railway **مع volume دائم** + `/api/menu`成为唯一真相.

### الخيار C — "الاستمرار على现状" ❌
يبقى 117 صنفًا hardcoded ⇒ لا dashboard ⇒ لا يساوي demandé المشروع.

### الترتيب الموصى به
```
Phase 0 (هذا التقرير) → حسم الفرع  ← ⛔ نتوقف هنا
Phase 1  Data Model: id + price number + available + img   (JSON, مع fallback)
Phase 2  Admin Shell: dashboard يقرأ ويكتب JSON
Phase 3  Product CRUD + Availability
Phase 4  Category CRUD + sort
Phase 5  Media: img paths + precache + إصلاح 16 صورة + استبدال 13 مكرر
Phase 7  Public Menu يقرأ المصدر الجديد
Phase 8  POS: قراءة فقط عبر stable id (syncId)
Phase 9  Batman: Intent→Validation→Tool→Audit (deterministic فقط)
Phase 10 Security + UAT
```

---

## 14. Migration Strategy

### 14.1 Guardrails إجبارية
1. **لا تكتب في `main` حتى يُحسم قرار الفرع.**
2. **احتفظ بالـ `DATA` inline كـ fallback** — لا تحذفها في أي مرحلة.
3. **Snapshot قبل كل مرحلة:** احفظ `menu/index.html` الحالي كنقطة رجوع.
4. **`sw.js` bump إلزامي** بعد كل تعديل (v4 → v5 …)، وإلا لم ي("$.old")``.

### 14.2 الترحيل خطوة بخطوة (مع rollback في كل خطوة)

| الخطوة | التغيير | المخرج | الرجوع |
|---|---|---|---|
| **M1** | إنشاء `menu/data/menu.json` من `DATA` الحالية آليًا | ملف JSON + سكربت تحويل | حذف الملف |
| **M2** | إضافة `id` مستقر لكل صنف + تحويل `p` لرقم + `available:true` | لا تغيير سلوك | حذف الحقول |
| **M3** | `index.html:fetch('data/menu.json')` مع **fallback** للـ `DATA` | نفس العرض 100% | إزالة الـ fetch |
| **M4** | إصلاح `getImg()` + `loading="lazy"` + precache الصور | **الصور تظهر** | رجوع الدالة لـ `return ''` |
| **M5** | تصحيح `v60 (2).jpg` + إضافة 15 صورة | تغطية 117/117 | — |
| **M6** | Admin shell يقرأ `menu.json` فقط (قراءة) | لا تغيير على العميل | إزالة التبويب |
| **M7** | Product CRUD → يكتب `menu.json` + تحميل | تغييرات تظهر بعد commit | `git revert` |
| **M8** | Category CRUD + sort | — | `git revert` |
| **M9** | Availability toggle | — | `git revert` |
| **M10** | Audit log + Soft delete (`is_active`) | — | `git revert` |
| **M11** | إصلاح SEO + PWA icons + SW | — | `git revert` |
| **M12** | **Security fixes** (traversal, session, plaintext, `.gitignore`) | — | — |

### 14.3 Safety: Soft Delete
```json
{ "id": "coffee-cappuccino", "is_active": true, "deleted_at": null }
```
- **لا تحذف صنفًا أبدًا** — كل صنف يمكن أن يكون مرتبطًا بطلب POS أو فاتورة.
- الأصناف المحذوفة تُخفى من المنيو ولا تُحذف من البيانات.

### 14.4 مخطط البيانات المقترح (JSON)
```json
{ "version": 5, "generated_at": "2026-10-03T…",
  "cafe": { "name_ar": "Lucca", "name_en": "Lucca Café",
            "phone": "201010058989", "whatsapp": "201010058989",
            "address_ar": "شارع محمد علي - بورسعيد", "currency": "EGP" },
  "categories": [ { "id":"coffee","sort":2,"hidden":false,
                    "name_ar":"قهوة","name_en":"Coffee","icon":"☕","image":null } ],
  "items": [ { "id":"coffee-cappuccino","category_id":"coffee","sort":10,
               "name_ar":"كابتشينو","name_en":"Cappuccino",
               "desc_ar":"…","desc_en":"…",
               "price":85,"old_price":null,"currency":"EGP",
               "image":"images/coffee/cappuccino.jpg",
               "badge":"popular","featured":true,
               "available":true,"is_active":true,
               "sku":"COF-CAP-01","tags":[],"prep_minutes":null,
               "calories":130,"updated_at":"2026-10-03T…" } ] }
```

---

## 15. ⚠️ انحراف عن الـ baseline — تعديلان سابقان (قبل هذا التقرير)

** translucent صريح:** وُضع هذا المواصفة **بعد** أن كنت قد عدّلت ملفين. كلاهما على branch **`main`** (غير المنشور)، فلم affects الموقع الحي — لكنه خرق لقاعدة "لا تعديل في Phase 0".

| الملف | التعديل | التحقق |
|---|---|---|
| `admin/database.js:388` | حذف `if (tableId) {` الزائدة التي كانت تُسبب `SyntaxError: Unexpected token ','` | ✅ `node --check` نجح |
| `admin/admin.html:~3454–3475` | إعادة ترتيب `if (res.ok)` / `try–catch` / `if (token)` + إضافة `}` ناقصة | ⚠️ **لم يُفحص بعد** — آخر فحص كان `Unexpected end of input` |

**ملاحظات مهمة:**
- كلاهما في **`main`**؛ نظائره في `master` مختلفة الحجم (`database.js` 46,991 vs 48,197 · `admin.html` 176,539 vs 164,290).
- `admin.html` في `main` أصله مكسور (catch في غير مكانه) ⇒ **اللوحة لا تعمل أصلاً في `main`**.
- **لم يُعمل commit، ولم يُعمل push.**

> ❓ **قرار مطلوب:** هل أرجّع التعديلين؟ أم أبقتهما (إصلاح أخطاء حقيقية)؟ أم أطبّق نفس الإصلاح على `master`؟

---

## 16. Deliverables Checklist — PHASE 0

| المطلوب | الحالة |
|---|---|
| فحص repository | ✅ |
| فحص Git status / branches / history | ✅ (فرعان: `master` `86a1c25` / `main` `57dd667`) |
| فحص `package.json` (3 ملفات) | ✅ |
| اكتشاف entry points | ✅ (`menu/index.html` = الحي · `server.js` = غير منشور) |
| اكتشاف product data | ✅ (3 مصادر متنافسة) |
| اكتشاف category data | ✅ (14 قسمًا، 3 تسميات مختلفة) |
| اكتشاف image system | ✅ (102 صورة، كلها معطّلة) |
| اكتشاف order system | ✅ (WhatsApp فقط — ⚠️ **الطلبات غير محفوظة**) |
| **اكتشاف AI system** | ✅ (**لا يوجد LLM — محرك قواعد 330 سطر**) |
| اكتشاف deployment | ✅ (**Pages / `master` / لا Backend**) |
| اكتشاف Supabase | ✅ **غير موجود إطلاقًا** |
| اكتشاف Backend | ✅ (3 backends: `server.js` ميت، `server/index.js` ميت، `backend/` ميت) |
| اكتشاف authentication | ✅ (**3 أنظمة، كلها مكسورة**) |
| اكتشاف POS connection | ✅ (POS في ريبو منفصل — لم يُدمج بعد، لا stable id) |
| كتابة التقرير | ✅ |

---

## 17. ⛔ BLOCKERS — يجب حلها قبل Phase 1

1. **حسم الفرع:** `master` (حي) أم `main`؟ — **[الأهم]**
2. **حسم التعديلين السابقين:** إرجاع أم إبقاء؟
3. **قرار Deployment:** هل نوافق على تشغيل Backend حقيقي (خيار B) أم نبقي static + JSON (خيار A)؟
4. **قرار Storage للصور:** هل تُخزَّن في GitHub Pages (repo) أم Supabase Storage أم قرص محلي؟
5. **قائمة الأصناف الجديدة المطلوبة** لم تُرسل بعد.

---

*نهاية PHASE 0 —Audit only. لم يُعدَّل أي source code أثناء إنتاج هذا التقرير. في انتظار الموافقة.*
