// products.js - نظام إدارة المنتجات والمخزون

const productManagement = {
    products: [],

    init: function() {
        // تحميل المنتجات من ملف JSON الذي تم استخراجه
        fetch('lucca_products.json')
            .then(response => response.json())
            .then(data => {
                this.products = data.map(p => ({ ...p, stock: 100 })); // إضافة مخزون افتراضي
                this.renderProducts();
            })
            .catch(error => console.error('Error loading products:', error));
    },

    getProductById: function(id) {
        return this.products.find(p => p.id === id);
    },

    updateStock: function(productId, quantityChange) {
        const product = this.getProductById(productId);
        if (product) {
            product.stock += quantityChange;
            // هنا يمكن إضافة منطق لحفظ المخزون في localStorage أو قاعدة بيانات
            this.renderProducts();
            return true;
        }
        return false;
    },

    renderProducts: function() {
        const productsSection = document.getElementById('products');
        if (!productsSection) return;

        let productsHtml = `
            <h2>إدارة المنتجات والمخزون</h2>
            <table border="1" style="width:100%; text-align:right;">
                <thead>
                    <tr>
                        <th>الفئة</th>
                        <th>الاسم</th>
                        <th>السعر (ج.م)</th>
                        <th>المخزون</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (this.products.length === 0) {
            productsHtml += `<tr><td colspan="5">لا توجد منتجات حالياً.</td></tr>`;
        } else {
            this.products.forEach((product, index) => {
                productsHtml += `
                    <tr>
                        <td>${product.category}</td>
                        <td>${product.name}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>${product.stock}</td>
                        <td>
                            <button onclick="productManagement.updateStock(${index}, -1)">بيع واحد</button>
                            <button onclick="productManagement.updateStock(${index}, 1)">إضافة واحد</button>
                        </td>
                    </tr>
                `;
            });
        }

        productsHtml += `
                </tbody>
            </table>
        `;
        productsSection.innerHTML = productsHtml;
    }
};

// تهيئة نظام إدارة المنتجات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    productManagement.init();
});
