// app.js - ملف JavaScript الرئيسي للوظائف العامة وتهيئة المكونات

document.addEventListener("DOMContentLoaded", () => {
    // تهيئة جميع الأنظمة عند تحميل الصفحة
    // auth.init(), invoiceSystem.init(), و tableManagement.init() يتم استدعاؤها بالفعل داخل ملفاتها الخاصة عند DOMContentLoaded
    // productManagement.init() يتم استدعاؤها أيضاً داخل ملفها الخاص

    console.log("النظام المحاسبي المتكامل جاهز للعمل!");

    // وظيفة للتنقل بين الأقسام
    document.querySelectorAll("nav ul li a").forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            const targetId = this.getAttribute("href").substring(1);
            document.querySelectorAll("main section").forEach(section => {
                section.style.display = "none";
            });
            document.getElementById(targetId).style.display = "block";
        });
    });

    // عرض لوحة التحكم افتراضياً
    document.querySelectorAll("main section").forEach(section => {
        section.style.display = "none";
    });
    document.getElementById("dashboard").style.display = "block";
});
