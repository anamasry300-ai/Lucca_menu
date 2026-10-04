# MENU_MOBILE_UI_SPEC.md
## Mobile Responsive Spec (Docs-Only, No Production Changes)

> الهدف: تحسين العرض للموبايل بدون لمس inline DATA أو HTML الهيكلي أو منطق JS. تغييرات CSS-only فقط.

## 1. الأهداف
- تحسين القراءة والتصفح على شاشات أقل من 768px
- جعل الواجهة touch-friendly وتقليل التمرير الزائد
- الحفاظ على التوافق مع Desktop
- عدم لمس البيانات أو getImg() أو منطق التقديم
- CSS-only مع Progressive Enhancement

## 2. النطاق الآمن
نسمح بـ: CSS media queries، المسافات، الخطوط، Flex/Grid، overflow، aspect-ratio، border-radius.
**ممنوع:** let DATA = [...]، getImg()، منطق JS، Product/Category IDs، أسماء/أسعار، إعادة ترتيب DOM.

## 3. نقاط الفصل (Breakpoints)
| نقطة الفصل | الهدف |
|---|---|
| max-width: 480px | موبايل صغير |
| max-width: 576px | موبايل |
| max-width: 768px | تابلت عمودي |
| min-width: 769px | ديسكتوب (لا يتغير) |

## 4. مقترحات CSS-only
- حاوية: تقليل padding على < 768px
- التصنيفات: تمرير أفقي (overflow-x auto) + snap + إخفاء scrollbar
- بطاقات المنتجات: عمود واحد على < 768px + نسبة صورة ثابتة
- الخطوط: تصغير عناوين قليلاً + line-height مناسب
- عناصر اللمس: min-height ≥ 44px
- مسافات: تقليل الفواصل
- الهيدر/بحث: عرض كامل بدون تجاوز
- الصور: object-fit: cover + متجاوبة

## 5. قواعد الأمان
إضافة فقط داخل <style>، Mobile-first داخل media queries، عدم تغيير DOM/IDs/classes المستخدمة في JS.

## 6. مسار التطبيق (يحتاج موافقة)
1. إضافة بلوك CSS إضافي فقط في menu/index.html
2. اختبار على 360–430px
3. التأكد من عدم تأثر Desktop
4. التأكد من عدم تغيير DATA أو أي hash للإنتاج

## 7. غير مستهدف
تغيير منطق التقديم، إعادة هيكلة HTML، تغيير مصدر البيانات
