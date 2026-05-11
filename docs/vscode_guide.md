# 💻 دليل استخدام Visual Studio Code للتعديل على منيو Lucca

## 📥 **الخطوة 1: تثبيت VS Code**

### تحميل وتثبيت:
1. روح على: https://code.visualstudio.com/
2. حمّل النسخة لنظام التشغيل بتاعك
3. ثبّت البرنامج (Next → Next → Install)

---

## 🔌 **الخطوة 2: تثبيت الإضافات المهمة**

افتح VS Code واضغط على أيقونة **Extensions** (أو `Ctrl+Shift+X`)

### الإضافات الأساسية:

1. **Live Server** (مهم جداً! ⭐)
   - ابحث عن: `Live Server`
   - من: Ritwick Dey
   - اضغط Install
   - **الفائدة**: يفتح المنيو في المتصفح ويحدّث تلقائياً عند التعديل

2. **Arabic Language Pack**
   - ابحث عن: `Arabic Language Pack`
   - **الفائدة**: يخلي VS Code بالعربي

3. **Prettier - Code Formatter**
   - ابحث عن: `Prettier`
   - **الفائدة**: يرتب الكود تلقائياً

4. **HTML CSS Support**
   - ابحث عن: `HTML CSS Support`
   - **الفائدة**: اقتراحات للـ CSS داخل HTML

5. **Auto Rename Tag**
   - ابحث عن: `Auto Rename Tag`
   - **الفائدة**: لما تغيّر tag يغير الإغلاق تلقائياً

---

## 📂 **الخطوة 3: إنشاء مجلد المشروع**

```
Lucca_menu/
├── index.html          (الملف الأساسي)
├── images/             (مجلد الصور - إنشاؤه لاحقاً)
│   ├── coffee/
│   ├── desserts/
│   └── drinks/
├── README.md           (معلومات المشروع)
└── .gitignore         (لـ Git)
```

### كيفية إنشاء المشروع:

1. **في الكمبيوتر**:
   - إنشاء مجلد جديد اسمه `Lucca_menu`
   
2. **في VS Code**:
   - File → Open Folder
   - اختار المجلد `Lucca_menu`

3. **إنشاء الملف**:
   - اضغط على أيقونة **New File** (أو `Ctrl+N`)
   - احفظه باسم `index.html` (`Ctrl+S`)
   - الصق كود المنيو الجديد
   - احفظ (`Ctrl+S`)

---

## 🚀 **الخطوة 4: تشغيل المنيو محلياً**

### طريقة Live Server (الأفضل):

1. افتح ملف `index.html` في VS Code
2. اضغط كليك يمين → **Open with Live Server**
3. أو اضغط على **Go Live** في الشريط السفلي
4. المنيو هيفتح تلقائياً في المتصفح على: `http://localhost:5500`

### الميزة الرهيبة:
- **أي تعديل تعمله → يظهر مباشرة في المتصفح!**
- مش محتاج تعمل refresh يدوي

---

## ✏️ **الخطوة 5: كيفية التعديل**

### **مثال 1: تغيير سعر منتج**

ابحث في الكود عن:
```html
<div class="item-name">إسبريسو</div>
```

تحته هتلاقي:
```html
<div class="item-price">45 <span class="price-unit">ج.م</span></div>
```

غيّر `45` للسعر الجديد → احفظ → شوف التغيير في المتصفح فوراً!

---

### **مثال 2: إضافة منتج جديد**

انسخ البلوك ده:
```html
<div class="menu-item">
    <div class="item-name">إسبريسو</div>
    <div class="item-price">45 <span class="price-unit">ج.م</span></div>
</div>
```

والصقه تحته، وغيّر الاسم والسعر:
```html
<div class="menu-item">
    <div class="item-name">قهوة تركي</div>
    <div class="item-price">35 <span class="price-unit">ج.م</span></div>
</div>
```

---

### **مثال 3: تغيير الألوان**

في أول الكود، هتلاقي:
```css
:root {
    --terracotta: #C85A3E;
    --olive: #697259;
    --cream: #F5F1E8;
}
```

غيّر أي كود لون → احفظ → شوف الفرق!

مثلاً لو عايز لون أحمر بدل terracotta:
```css
--terracotta: #D32F2F;
```

---

### **مثال 4: إضافة صورة**

بدل:
```html
<div class="item-image">☕</div>
```

بـ:
```html
<img src="images/coffee/espresso.jpg" alt="إسبريسو" class="item-image">
```

⚠️ **مهم**: الصورة لازم تكون في مجلد `images/coffee/`

---

## 🔍 **مميزات VS Code المفيدة:**

### 1. **البحث والاستبدال** (`Ctrl+H`):
- ابحث عن: `45 ج.م`
- استبدل بـ: `50 ج.م`
- اضغط **Replace All** → كل الأسعار 45 تتغير لـ 50!

### 2. **Multi-Cursor** (`Alt+Click`):
- اضغط Alt وكليك في أماكن متعددة
- اكتب مرة واحدة → يكتب في كل الأماكن!

### 3. **Format Document** (`Shift+Alt+F`):
- يرتب الكود كله بشكل جميل تلقائياً

### 4. **Comment/Uncomment** (`Ctrl+/`):
- يحول السطر لـ comment علشان ما ينفذش

مثال:
```html
<!-- <div class="menu-item">منتج قديم</div> -->
```

### 5. **Fold/Unfold Code** (`Ctrl+Shift+[` / `]`):
- يطوي أو يفتح أجزاء من الكود

---

## 🌐 **الخطوة 6: رفع التعديلات على GitHub**

### أول مرة:
```bash
cd Lucca_menu
git init
git add .
git commit -m "تحديث المنيو"
git remote add origin https://github.com/anamasry300-ai/Lucca_menu.git
git push -u origin main
```

### كل تعديل جديد:
```bash
git add .
git commit -m "وصف التعديل"
git push
```

---

## ⚡ **اختصارات مفيدة:**

| الاختصار | الوظيفة |
|---------|---------|
| `Ctrl+S` | حفظ الملف |
| `Ctrl+F` | بحث في الملف |
| `Ctrl+H` | بحث واستبدال |
| `Ctrl+/` | تحويل لـ comment |
| `Ctrl+D` | تحديد الكلمة التالية المشابهة |
| `Alt+↑/↓` | نقل السطر لأعلى/أسفل |
| `Ctrl+Shift+K` | حذف السطر |
| `Ctrl+Space` | اقتراحات الكود |
| `F12` | الذهاب لتعريف |

---

## 📱 **اختبار على الموبايل:**

### 1. **على نفس الشبكة:**
- افتح CMD في الويندوز
- اكتب: `ipconfig`
- ابحث عن `IPv4 Address` (مثلاً: 192.168.1.5)
- في الموبايل، افتح: `http://192.168.1.5:5500`

### 2. **باستخدام ngrok** (للاختبار من أي مكان):
```bash
ngrok http 5500
```
هيديك لينك تقدر تفتحه من أي موبايل في العالم!

---

## 🐛 **حل المشاكل الشائعة:**

### المشكلة: Live Server مش شغال
✅ **الحل**: 
1. تأكد إنك ضاغط على ملف HTML (مش مجلد)
2. جرب اقفل وافتح VS Code
3. تأكد إن الإضافة مثبتة صح

### المشكلة: الألوان مش ظاهرة
✅ **الحل**:
1. تأكد إنك عامل Save (`Ctrl+S`)
2. جرب Refresh في المتصفح (`F5`)
3. امسح الـ Cache (`Ctrl+Shift+R`)

### المشكلة: QR Code مش ظاهر
✅ **الحل**:
1. تأكد من وجود السطر:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
```
2. تأكد من الإنترنت

---

## 🎯 **Workflow المقترح:**

### كل يوم:
1. ✅ افتح VS Code
2. ✅ افتح المشروع
3. ✅ شغّل Live Server
4. ✅ اعمل التعديلات
5. ✅ احفظ (`Ctrl+S`)
6. ✅ شوف النتيجة في المتصفح
7. ✅ ارفع على GitHub
8. ✅ اختبر الرابط النهائي

### كل أسبوع:
1. ✅ backup للملفات
2. ✅ اختبار على موبايلات مختلفة
3. ✅ جمع feedback من العملاء

---

## 📚 **مصادر تعليمية:**

### VS Code:
- https://code.visualstudio.com/docs
- قناة YouTube: Traversy Media

### HTML/CSS:
- https://www.w3schools.com
- قناة YouTube: Elzero Web School (عربي)

### Git/GitHub:
- https://try.github.io
- قناة YouTube: Big Data Arabic (عربي)

---

## ✨ **نصيحة أخيرة:**

**لا تخاف من التجربة!** 
- الكود مش هينكسر
- دايماً تقدر ترجع للنسخة القديمة (`Ctrl+Z`)
- Git بيحفظ كل التغييرات
- جرب، اتعلم، طور! 💪

---

**Happy Coding! 🚀☕**

*أي سؤال، أنا هنا! 😊*
