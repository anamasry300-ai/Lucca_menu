// auth.js - نظام تسجيل الدخول والمزامنة

const auth = {
    isLoggedIn: false,
    user: null,

    init: function() {
        // تحقق مما إذا كان المستخدم مسجلاً الدخول بالفعل (مثلاً من التخزين المحلي)
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.user = JSON.parse(storedUser);
            this.isLoggedIn = true;
            this.updateUI();
        }
    },

    login: function(username, password) {
        // هنا يجب أن يكون هناك استدعاء API للتحقق من بيانات الاعتماد
        // للمثال، سنستخدم بيانات وهمية
        if (username === 'user' && password === 'password') {
            this.user = { username: username, id: '123' };
            this.isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(this.user));
            alert('تم تسجيل الدخول بنجاح!');
            this.updateUI();
            return true;
        } else {
            alert('اسم المستخدم أو كلمة المرور غير صحيحة.');
            return false;
        }
    },

    logout: function() {
        this.user = null;
        this.isLoggedIn = false;
        localStorage.removeItem('currentUser');
        alert('تم تسجيل الخروج.');
        this.updateUI();
    },

    register: function(username, password) {
        // هنا يجب أن يكون هناك استدعاء API لتسجيل مستخدم جديد
        alert('وظيفة التسجيل غير مفعلة في هذا المثال.');
        return false;
    },

    updateUI: function() {
        const authSection = document.getElementById('auth');
        if (!authSection) return;

        authSection.innerHTML = ''; // مسح المحتوى الحالي

        if (this.isLoggedIn) {
            authSection.innerHTML = `
                <h2>أهلاً بك، ${this.user.username}!</h2>
                <p>أنت مسجل الدخول حالياً.</p>
                <button id="logoutButton">تسجيل الخروج</button>
            `;
            document.getElementById('logoutButton').addEventListener('click', () => this.logout());
        } else {
            authSection.innerHTML = `
                <h2>تسجيل الدخول / التسجيل</h2>
                <form id="loginForm">
                    <label for="username">اسم المستخدم:</label>
                    <input type="text" id="username" name="username" required><br><br>
                    <label for="password">كلمة المرور:</label>
                    <input type="password" id="password" name="password" required><br><br>
                    <button type="submit">تسجيل الدخول</button>
                </form>
                <p>ليس لديك حساب؟ <a href="#" id="registerLink">سجل الآن</a></p>
            `;
            document.getElementById('loginForm').addEventListener('submit', (e) => {
                e.preventDefault();
                const username = e.target.username.value;
                const password = e.target.password.value;
                this.login(username, password);
            });
            document.getElementById('registerLink').addEventListener('click', (e) => {
                e.preventDefault();
                alert('وظيفة التسجيل غير مفعلة في هذا المثال. يرجى التواصل مع المسؤول.');
            });
        }
    }
};

// تهيئة نظام المصادقة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    auth.init();
});
