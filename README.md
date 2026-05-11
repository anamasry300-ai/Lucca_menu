# Lucca Menu Workspace

هذا المجلد أصبح مرتبًا إلى ثلاث مناطق واضحة:

## Current App

النسخة الحالية التي نعمل عليها الآن:

```text
Lucca-menu/
├── menu/
│   ├── index.html
│   ├── menu-data.js
│   └── styles.css
├── admin/
│   ├── admin.html
│   ├── database.js
│   ├── firebase-config.js
│   ├── menu-integration.js
│   └── styles.css
└── README.md
```

- افتح `menu/index.html` للمنيو التفاعلي.
- افتح `admin/admin.html` للوحة الإدارة والنظام المحاسبي.

## Docs

ملفات الشرح والمساعدة:

```text
docs/
└── vscode_guide.md
```

## Legacy

نسخ قديمة أو مراجع احتفظنا بها حتى لا تضيع، لكنها ليست المسار الرئيسي للتشغيل:

```text
legacy/
├── root-app/
│   ├── lucca_menu_final.html
│   └── menu-data.js
└── references/
    └── accounting-system-reference/
```

## Notes

- تم نقل الملفات القديمة من جذر المشروع حتى يبقى الجذر نظيفًا.
- تم تصحيح مسارات تحميل بيانات المنيو داخل لوحة الإدارة.
- إذا أردنا لاحقًا، أستطيع تنفيذ مرحلة ثانية من التنظيم:
  - توحيد بيانات المنتجات في ملف واحد فقط.
  - إضافة `assets/` للصور المحلية.
  - إضافة `archive/` أو `backups/` بدلاً من `legacy/` إذا تفضّل تسمية مختلفة.
