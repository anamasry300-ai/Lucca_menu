# خطة تنفيذ Lucca Menu CMS (المرحلة 1 — الأودت والخطة)

> التاريخ: 2026-10-07 — المسار: `Lucca-Menu-Website/menu/`
> هذه مرحلة **الأودت فقط + كتابة الخطة**. بلا أي تعديل كود بعد في هذه المرحلة.

---

## 1) خلاصة الأودت (أين نحن الآن)

| المصدر | الحقيقة الفعلية (مُقرأة كودًا) |
|---|---|
| `menu/index.html` (2024 سطر) | المنيو العام + الإدارة في نفس الملف. `_LANG`/`t()`، `CATEGORIES` (14 فئة، const السطر 1351)، `DATA` (const السطر 1368، canonical 103 صنف بلا صور inline)، `IMAGE_CATEGORY_MAP` + `IMAGE_FALLBACKS` (1375-1485)، `getProductImage` (1486)، `openProductDetail` (1493)، سلة/تايم (1524-1638)، موظفون معطّلون منذ 1642، adminWrapper (953)، boot `?menu-admin` (2009-2014) |
| `menu/menu-editor.js` (424 سطر) | مخزن `lucca-public-menu-overrides-v1` → `{overrides:{},custom:{}}`؛ `getPublishedItems(includeHidden)`؛ `CURATED_PRODUCT_IMAGES` (4)؛ `MENU_EDITOR_UNCERTAIN_CATEGORIES` (6 فئات)؛ `MenuRepository`/`LocalMenuRepository` (getProducts/create/update/hide/updateImage/removeImage/deleteCustom/resetOverride/publish)؛ جدول المنتجات + نموذج + رفع صورة → canvas 512 |
| `menu/admin-integration.js` (563 سطر) | `openAdminPanel/closeAdminPanel/showAdminTab` (يقبل **`dashboard` و`menu-editor` فقط** — الباقي يهبط لـ`menu-editor`)؛ `openMenuDashboard`؛ `loadDashboardStats`؛ دوال POS قديمة (cr/purchases/employees/reports/kitchen/settings) موجودة لكنها **غير قابلة للوصول** من التبويبات |
| `menu/admin-styles.css` (187 سطر) | جميع مكونات القهوة جاهزة: `.admin-sidebar-btn`، `.stats-grid/.stat-card`، `.section-card`، `.admin-input/.admin-select/.admin-btn(.primary|secondary|danger|sm)`، `.admin-table`، `.admin-overlay/.admin-modal`، `.admin-toast`، `.img-badge(.img-fb|img-strong|img-verified|img-link)`، `.menu-prod-thumb`، `.row-hidden` — **السطر 167 يقفل كل تبويب عدا dashboard وmenu-editor** (`display:none !important`) |
| `menu-data.js` | لم يُمس — SHA256 `D6937E0301A1902B2AF33A5E293796DE1782769B8079B1647FC9F8AAD4DD99D7` |
| `docs/` | `MENU_DASHBOARD_IMPLEMENTATION_REPORT.md` (10 أقسام) + أودت قديم `MENU_ARCHITECTURE_AUDIT.md` (Blocker تاريخي: master/main) |

**الخلاصة**: البنية الحالية **Draft/Local** صارمة (لا شبكة، لا Supabase، لا تعديل على البيانات). كل ما نضيفه يجب أن يتبع نفس النمط: **طبقة override في localStorage فوق const متوفرة، وبقاء عرض المنيو العام كما هو افتراضيًا**.

---

## 2) قرارات معماريّة (آمنة/إضافية — لا تغيّر المعمارية الجوهرية)

1. **الفئات**: `CATEGORIES` و`DATA` و`renderMenu()` و`renderTabs()` تبقى canonical دون مساس. نضيف **دالة تجميع** `getAccessibleCategories()` (في ملف CMS جديد) تقرأ override من localStorage (إخفاء/إعادة ترتيب/تعديل اسم/إضافة فئة بخصائصها) وتعيد القائمة الفعلية. بدون أي override → السلوك الحالي حرفيًا.
2. **المنتجات**: نُمَدّد مخزن الأصناف القائم بحقول جديدة كلها اختيارية/nullable: `options[]` (مقاسات بأسماء ar/en + سعر)، `order`، `calories`، `aliases[]`. الـ renderer العام يقرأ `options` **إن وُجد فقط** وإلا يعمل بالإعداد القديم (`p` نص/مصفوفة). لا تغيير على الـ 103 canonical IDs.
3. **الموقع/التواصل/الإعدادات**: مخازن localStorage جديدة (`lucca-menu-location-v1`, `lucca-menu-settings-v1`, `lucca-menu-publish-v1`). **بلا Google Maps API وبلا مفاتيح** — نخزّن فقط URL/إحداثيات/أرقام.
4. **الدمج في المنيو العام (المرحلة 7)**: كتلة معلومات أسفل المنيو (`info-strip`) تُبنى **فقط إذا وُجدت بيانات موقع محفوظة**؛ بدون بيانات → لا شيء يُعرض، وبذلك public regression يبقى صفريًا افتراضيًا. أزرار 📍/📞/💬/📷 بهوية التصميم القائم (Luxury Glass + RTL/LTR).
5. **Draft/Review/Publish**: يبقى صادقًا — `publish()` يعيد `{published:false}` دائمًا؛ نضيف "مراجعة قبل النشر" (checklist) وطابع `lastPublishedAt` محلي (للإبلاغ فقط، لا نشر فعلي).
6. **ملفات جديدة**: `menu/admin-cms.js` (كل وحدات CMS الجديدة) يُحمَّل بعد `menu-editor.js`؛ تعديل `admin-styles.css` (أنماط الحقول/الخطأ/المقاسات/الجدول) و`index.html` (أزرار الـsidebar + حاويات التبويبات + كتلة info العامة) و`admin-integration.js` (توسيع whitelist + loaders). `showAdminTab` يقبل الآن 7 تبويبات فقط.

---

## 3) معايير الأمان الثابتة عبر كل المراحل (لا كسر أبدًا)

- `menu-data.js` لا يُمس؛ SHA يُعاد فحصه في نهاية التنفيذ.
- لا تغيير على canonical DATA (103/14)؛ لا حذف صنف أساسي من DATA (الحذف = custom فقط، أو إخفاء للأساسي).
- لا إزالة fallback؛ `MISLEADING` يظل 0. لا اشتقاق صورة من فئة أو اسم جزئي.
- **لا auto-match** للصور الـ12 الحقيقية (تبقى UNVERIFIED قيد السرد فقط، الربط اليدوي لاحقًا).
- لا deps خارجية، لا Supabase/شبكة، لا Auth، لا Google Maps API، لا مفاتيح، لا localStorage كـ RBAC.
- لا كسر لـ aliases: `hot→hot-drinks`, `iced→iced-coffee`, `cans→soft-drinks` (قيم الترجمة في `_LANG.catNames` تُحفظ ولا تُكسر).
- الـ QA القائم (smoke 32 + 6 مقاسات 74) يجب أن يظل **pass** كما هو.

---

## 4) خطة المراحل بالتفصيل

### Phase 2 — الهيكل الاحترافي (Shell)
- Sidebar (Desktop-first RTL): **نظرة عامة** · **المنتجات** · **الفئات** · **الصور** · **الموقع والتواصل** · **الإعدادات** · **المعاينة**.
- توسيع `showAdminTab` إلى `['dashboard','products','categories','images','location','settings','preview']` (مع خريطة قديمة `menu-editor→products`).
- حاويات `#at-*` جديدة في `index.html` + تحديث قفل CSS السطر 167.
- شريط علوي: شارة الحالة (Draft/Local) + زر "معاينة عامة (فتح العامة)" + زر إغلاق/خروج.
- حالات تحميل/فارغ/خطأ لكل قسم (`.`admin-loading`، `.admin-empty`، `.admin-error`).

### Phase 3 — منتجات CMS كاملة (تحسين `renderMenuEditor`)
- أداة بحث/تصفية: بحث بالاسم (ar/en) + تصفية الفئة + **فلتر الظهور (كل/ظاهر/مخفي)** + **فلتر بدون صورة** + **فرز** (الافتراضي/السعر/الاسم).
- إجراءات جديدة: **تكرار صنف** (ينشئ custom نسخة) + حذف آمن (custom فقط قابل للحذف؛ الأساسي يُخفي).
- شكل النموذج (تبويبات فرعية داخل النموذج):
  - **أساسي**: الاسم ar/en، الوصف ar/en، الفئة، الظهور، ترتيب العرض `order`.
  - **التسعير**: السعر الأساسي + **متغيرات/مقاسات** (سطر لكل مقاس: اسم ar + اسم en + سعر) تُخزَّن في `options[]` وتُعرض في المنيو العام كمقاسات قابلة للاختيار.
  - **الصورة**: الموجود (رفع/معاينة/رابط/إزالة/لا صورة) مع حالة الـ badge.
  - **إضافي**: سعرات `calories`، أسماء بديلة `aliases[]` (تُستخدم للبحث فقط).
- Validation لكل حقل مباشرة تحت الحقل (المرحلة 9).

### Phase 4 — الفئات
- قائمة + إضافة/تعديل/إخفاء/إعادة ترتيب + اسم ar/en.
- آليات: `getAccessibleCategories()`، مخزن override `lucca-menu-categories-v1`.
- التحقق: id (slug) مطلوب وفريد وأحرف لاتينية صغيرة + ligatures، لا تكرار، حماية aliases المذكورة، **لا فئة بدون id**.
- لا تلمس `_LANG.catNames`؛ الفئة الجديدة تحمل أسماء خاصة بها (ar/en) في الـ override.

### Phase 5 — الصور
- جدول جرد اشتقاقي من `getPublishedItems(includeHidden)` + `CURATED` + سجل الـ12 صورة UNVERIFIED (أسماء فقط، بلا ربط تلقائي):
  - **مستخدمة/موصولة** (STRONG/VERIFIED/LINK) · **بدون صورة (FALLBACK=99)** · **غير مؤكدة (12)** · **مضللة=0**.
  - لكل صف: معاينة مصغّرة، اسم الصنف، الفئة، الحالة، مسار الملف/الرابط، صاحب الربط.
- زر "ربط يدوي لاحقًا" تعليمي (لا ينفذ auto-match إطلاقًا).

### Phase 6 — الموقع والتواصل
- نموذج: اسم الفرع، العنوان ar/en، رابط Google Maps (URL) + زر "فتح في Google Maps"، الإحداثيات lat/lng، الهاتف، واتساب، إنستجرام، **ساعات العمل السبت–الجمعة** (مفتوح/مغلق + وقت فتح + وقت إغلاق لكل يوم).
- Validation: URL صحيح، lat∈[-90,90]، lng∈[-180,180]، أرقام غير مقيدة.
- معاينة مباشرة للتنسيق/الكتلة قبل الحفظ.

### Phase 7 — دمج المنيو العام (آمن)
- كتلة `info-strip` في `index.html` بعد آخر فئة: 📍 (maps)، 📞 (tel:)، 💬 (wa.me + نص جاهز)، 📷 (instagram).
- تُرسم فقط عند وجود بيانات؛ تحترم RTL/LTR؛ بلا شبكة إطلاقًا (روابط خارجية فقط عند النقر).
- إذا ثبت تعارض معماري → ابني adapter فقط وأوقف الدمج (لا كسر).

### Phase 8 — مسودة → مراجعة → نشر
- حالة الأصناف: DRAFT (بلا override) / REVIEW (تعديلات محلية) / PUBLISHED (محليًا مؤقتًا) عبر `lucca-menu-publish-v1`.
- شاشة "مراجعة قبل النشر": جدول التعديلات معلّمة (يمكن التراجع لكل بند أو الكل) + checklist.
- `publish()` يظل صادقًا `{published:false}` — لا نشر فعلي من هذا المتصفح.

### Phase 9 — Validation مشترك
- دالة `cmsValidate(field, value, ctx)` تعيد نص الخطأ أو null:
  - الاسم (ar أو en على الأقل)، الفئة، السعر ≥ 0، أسعار المقاسات ≥ 0، عدد غير منتهٍ، URL، هاتف/واتساب، lat/lng، تكرار slug، فئة بلا id، صنف بلا id.
- عرض الخطأ تحت الحقل (`field-error`) ومنع الحفظ عند وجود أخطاء.

### Phase 10 — الأمان (تطبيق القيود أعلاه ضمنيًا في كل ذلك)

### Phase 11 — QA
- إعادة تشغيل **smoke5 (32)** و**qa6 (74)** كما هما (يجب أن تبقى pass).
- اختبارات جديدة: Product add/edit/hide/show/duplicate + variants (حفظ/استرجاع/عرض في public)، Categories (add/hide/reorder + alias safety)، Images (جرد وعدم auto-match)، Location (save/load + كتلة info + فتح الرابط بدون API)، Settings، Validation (كل الحالات أعلاه)، Refresh persistence، **Public regression على 6 مقاسات + RTL/LTR باردة** (public بلا بيانات موقع = 0 فرق).

### Phase 12 — التقرير
- `docs/MENU_CMS_PHASE12_REPORT.md` بـ14 قسمًا (الطلب/الكلية/الملفات/المخازن/الاختبارات/…).
- **بلا commit وbلا push** في هذه المرحلة.

---

## 5) المخاطر والتوقف
- أي حاجة لتغيير معماري جوهري (مثل: تعديل canonical DATA، أو ربط صور UNVERIFIED تلقائيًا، أو نشر فعلي) ⇒ **توقف فوري + شرح + طلب قرار المالك**. لن يحدث هذا في التنفيذ الحالي.
- التقنيات الحالية كلها إضافية وقابلة للإلغاء بمسح localStorage — لا أثر دائم على المنيو العام.

## 6) الموافقة
عند موافقتك: أنفّذ **المراحل 2→10** (بالترتيب)، ثم **11** (QA) ثم **12** (التقرير) — بلا commit/push.