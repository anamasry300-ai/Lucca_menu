# FINAL BRAND + PRODUCT IMAGE REVIEW

> **التاريخ:** 2026-10-06 · **الفرع:** `ui-redesign` · **HEAD:** `a288041`
> **نطاق:** مراجعة فقط — **لا commit، لا push، لا reset، لا clean**
> **قيود معلنة مقدّمًا:** هذا النموذج (big-pickle) **لا يقبل إدخال صور/PDF** — فحص اللوجو
> والصور تم بالطرق البرمجية: قراءة ملفات SVG كنص XML، فحص بكسل عبر Chrome canvas (مقاس،
> متوسط إضاءة، انحراف معياري، تنوع ألوان)، وتدقيق DOM. **التأكيد البصري النهائي يقع على صاحب المشروع.**

---

## 1. Official Logo

| السؤال | الجواب |
|---|---|
| Asset path المستخدم حاليًا | `menu/logo.svg` في 4 مواضع: topbar (`index.html:830`)، hero (`index.html:839`)، نافذة تسجيل موظف (`:901`)، رأس لوحة الإدارة (`:957`) |
| هل هو نفس اللوجو الرسمي المرفوع؟ | **NO** — `logo.svg` هو **wordmark مولّد** (نص "Lucca" بلون كريمي + سطر "SPECIALTY COFFEE")، وليس الشعار الدائري الأسود/البني الذي يحمل "Lucca" + "Hub Cafe" |
| Header | **FAIL** — يعرض `logo.svg` المولّد (`index.html:830`) |
| Hero | **FAIL** — يعرض `logo.svg` المولّد (`index.html:839`) |
| أي monogram/بديل مكان الرسمي؟ | **YES** — اللوجو الرسمي غير مستخدم في أي موضع؛ البديل المولّد موجود في الأماكن الأربعة أعلاه |

**السبب:** لم تتمكن أي وسيلة من الوصول إلى ملف اللوجو الرسمي، والتقصّي الموسّع أُجري مجددًا في هذه المراجعة:
- غير موجود كملف في المشروع أو المجلدات الشائعة (Desktop/Downloads/Pictures/OneDrive).
- لم يصل إلى هذه المحادثة كصورة/ملف (تلقّيت النص فقط، ولا يوجد مسار أو attachment).
- **فحص مخزن opencode (SQLite `opencode.db`):** لا يوجد type `image` على الإطلاق بين أجزاء الرسائل طوال التاريخ؛ الـ19 ملفًا مرفقًا في جلسات قديمة (أبريل–يوليو) كلها Screenshots/PDF/أكواد عامة — لا يوجد أي ملف اسمه logo أو بداخله شعار.
- **فحص OCR شامل (Windows.Media.Ocr)** لكل صور Downloads+Pictures + أيقونات `Lucca_menu-` بحثًا عن نص "Hub": **لا توجد أي صورة تحتوي "Hub Cafe"**. بعض فواتير LUCCA تظهر header "LUCCA Caffe Italiano" — ليس الشعار المطلوب. صورتا WhatsApp (1024×1536 بوستران) تحتوي منهما واحدة نص "lucca" فقط بدون "Hub Cafe".
- الأيقونات الموجودة (`menu/icon.svg`, `Lucca_menu-\icon.svg`، etc.) كلها تصاميم مولّدة بكوب قهوة — **لا يوجد أي منها بالنص "Hub Cafe"**.
- **الخلاصة:** لا يوجد أي أثر لعبارة "Hub Cafe" على القرص ولا في أي رسالة مخزّنة؛ فرضية "الصورة المرفوعة في المحادثة" غير قابل للإثبات من أي مصدر يمكنني الوصول إليه.

---

## 2. Product Image Audit

| Match | Count |
| ----: | ----: |
| EXACT | 0 |
| STRONG | 4 |
| FALLBACK | 99 |
| MISLEADING | **0** |

- **الـ 4 STRONG** (صور حقيقية 1920×1920، مفصّلة من لقطات `master`، مطابقة بالاسم للصنف — تأكيد بصري بصريّ الشخصي معلّق):
  | الصنف | الفئة | الملف |
  |---|---|---|
  | V60 | specialty | `assets/product-v60.jpg` |
  | تشيز كيك | desserts | `assets/product-cheesecake.jpg` |
  | توست ميكس جبن | breakfast | `assets/product-toast.jpg` |
  | بيتزا مارجريتا | pizza | `assets/product-margherita-pizza.jpg` |
- **الـ 99 FALLBACK**: لا صورة موثقة → fallback premium (monogram + `<em>` + `<strong>`)، ليس broken image ولا صورة عشوائية.
- **MISLEADING = 0**: لا يوجد منتج يستخدم صورة لا تمثله (لا coffee عامة لإسبريسو، لا cheesecake لـ Red Velvet، إلخ).

---

## 3. Products Requiring Attention (غير EXACT)

- **4 بصفات مملوكة** — تحتاج تأكيدك البصري أنها تطابق الصنف تمامًا (طرحت STRONG لا EXACT بسبب عدم قدرتي على الرؤية):
  `V60 → الصورة قهوة V60؟ → STRONG (صورتها قيد التأكيد)`
  `تشيز كيك → الصورة تشيز كيك؟ → STRONG (قيد التأكيد)`
  `توست ميكس جبن → الصورة توست الجبن المختلط؟ → STRONG (قيد التأكيد)`
  `بيتزا مارجريتا → الصورة مارجريتا؟ → STRONG (قيد التأكيد)`
- **99 صنف بدون صورة** → FALLBACK متين (بحسب التصميم، لا MISLEADING).
- **اكتشاف مفيد للمرحلة القادمة (خارج نطاق هذه المراجعة):** صور المنتجات الحقيقية لصاحب المشروع موجودة في
  `OneDrive\Pictures` (2026-07-04) لـ 12 صنفًا: V60، إسبيريسو دابل، ايس دريب، قهوة اليوم، قهوة بندق، قهوة تركي،
  قهوة فرنساوي، لاتيه، ميكاتو، نسكافيه، وايت موكا، هوت شوكليت — يمكن رفعها لاحقًا من Tier-3→STRONG/EXACT بعد تأكيدك.

---

## 4. Visual Review

| Area | Score /10 |
| ---- | --------: |
| Brand identity | 7 |
| Logo | 4 (يُرافِع: placeholder غير رسمي) |
| Hero | 8 |
| Product imagery | 6 |
| Cards | 8 |
| Typography | 8 |
| Spacing | 8 |
| Mobile UX | 8 |
| Desktop UX | 8 |
| Overall | 7 |

> الدرجات **مبدئية** (مبنية على فحص DOM/هندسي/بكسل). التأكيد البصري النهائي مطلوب منك على
> لقطات `%LOCALAPPDATA%\Temp\opencode\shots\after-*.png`.

---

## 5. Functional Regression

`PASS` — verify4: **24/24** (103 منتج · 14 فئة · hero · touch targets · fallback · sheets ·
cart thumbs+FIX2 · no-results ar · search V60 · lang en · staff hidden · cart drawer 1440 ·
لا overflow في 360/390/430/768/1024/1440 · لا أخطاء console) + Regression وظيفي
(جمع/طرح/حذف السلة، فتح sheet من بطاقة، close 44px، تبويب يوسّع القسم، Google translate، QR حي).

## 6. Data Integrity

`PASS` — `menu/menu-data.js` **byte-identical** مع HEAD (git diff --quiet → exit 0، sha256 ثابت).
لم تُمسّ IDs/names/prices/descriptions/categories/variants/origins — الـ 4 صور Tier-1 خارج `menu-data.js`
(خريطة في `menu/menu-editor.js` فقط).

## 7. Git Status

```
 M menu/admin-styles.css
 M menu/index.html
?? README.md · admin/* · docs/ · menu/.manus/
?? menu/admin-integration.js · menu/assets/ · menu/icon.svg · menu/logo.svg · menu/luxury-glass.css
?? menu/manifest.json · menu/menu-editor.js · menu/sw.js · server/
```
```
diff --stat: menu/index.html +137−45 · admin-styles.css +3
```
(لا يوجد commit أو push — يُحترم القيد.)

---

## 8. FINAL DECISION

**`NOT READY — REQUIRES FIXES`**

**السبب:** الـofficial logo ("Lucca Hub Cafe" الدائري) **غير موجود كملف وبالتالي غير مستخدم فعليًا** في header/hero.
لا أقدر على الإنشاء دون الأصل؛ أنا مُنع من رسم/تخييل الشعار.

**الإصلاح المطلوب (خطوة واحدة):** ضع ملف اللوجو الرسمي في:
`C:\Users\Acer\OneDrive\Desktop\Lucca-Menu-Website\menu\assets\lucca-logo.png` (أو أرسل مساره)،
وسأنفّذ بعدها فقط:
1. استبداله في المواضع الأربعة (`index.html:830, 839, 901, 957`) + على أي PNG مخدوم.
2. إنشاء web asset منه عبر Chrome canvas (قصّ الهوامش مع الحفاظ على الدائرة والنسب، دون إعادة رسم).
3. إعادة فحص التباين/الحجم/التوازن في المواضع الأربعة وإعادة verify.
4. حصر أي monogram فائض (يُبقى monogram للصور Tier-3 فقط، لا لللوجو).

**توقفت هنا. لا commit ولا push.**