// invoice.js - نظام الفواتير المحاسبي المتقدم

const invoiceSystem = {
    invoices: [],
    taxRate: 0.14, // 14% ضريبة القيمة المضافة (مثال)
    discountRate: 0.05, // 5% خصم افتراضي (مثال)

    init: function() {
        const storedInvoices = localStorage.getItem("invoices");
        if (storedInvoices) {
            this.invoices = JSON.parse(storedInvoices);
        }
        this.renderInvoices();
    },

    generateInvoice: function(customerName, items) {
        let subtotal = 0;
        const invoiceItems = items.map(item => {
            const product = productManagement.getProductById(item.productId);
            if (product) {
                const itemTotal = product.price * item.quantity;
                subtotal += itemTotal;
                // تحديث المخزون عند إنشاء الفاتورة
                productManagement.updateStock(item.productId, -item.quantity);
                return { ...product, quantity: item.quantity, itemTotal: itemTotal };
            } else {
                return null; // أو التعامل مع المنتج غير الموجود بشكل مناسب
            }
        }).filter(item => item !== null);

        const taxAmount = subtotal * this.taxRate;
        const discountAmount = subtotal * this.discountRate;
        const totalAmount = subtotal + taxAmount - discountAmount;

        const newInvoice = {
            id: this.invoices.length + 1,
            customer: customerName,
            date: new Date().toLocaleDateString(),
            items: invoiceItems,
            subtotal: subtotal,
            tax: taxAmount,
            discount: discountAmount,
            total: totalAmount
        };
        this.invoices.push(newInvoice);
        localStorage.setItem("invoices", JSON.stringify(this.invoices));
        this.renderInvoices();
        alert("تم إنشاء الفاتورة بنجاح!");
    },

    renderInvoices: function() {
        const invoicesSection = document.getElementById("invoices");
        if (!invoicesSection) return;

        let productsOptions = productManagement.products.map((p, index) => 
            `<option value="${index}">${p.name} (${p.price.toFixed(2)} ج.م)</option>`
        ).join("");

        let invoicesHtml = `
            <h2>نظام الفواتير</h2>
            <button id="newInvoiceButton">إنشاء فاتورة جديدة</button>
            <div id="invoiceFormContainer" style="display:none;">
                <h3>فاتورة جديدة</h3>
                <form id="invoiceForm">
                    <label for="customerName">اسم العميل:</label>
                    <input type="text" id="customerName" required><br><br>
                    <div id="invoiceItems">
                        <div class="invoice-item">
                            <label for="productSelect_0">المنتج:</label>
                            <select class="productSelect" id="productSelect_0" required>
                                <option value="">اختر منتجاً</option>
                                ${productsOptions}
                            </select>
                            <label for="itemQuantity_0">الكمية:</label>
                            <input type="number" class="itemQuantity" id="itemQuantity_0" min="1" value="1" required>
                        </div>
                    </div>
                    <button type="button" id="addItemButton">إضافة منتج</button><br><br>
                    <button type="submit">حفظ الفاتورة</button>
                </form>
            </div>
            <h3>الفواتير الحالية</h3>
        `;

        if (this.invoices.length === 0) {
            invoicesHtml += "<p>لا توجد فواتير حالياً.</p>";
        } else {
            invoicesHtml += `
                <table border="1" style="width:100%; text-align:right;">
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>العميل</th>
                            <th>التاريخ</th>
                            <th>الإجمالي الكلي</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            this.invoices.forEach(invoice => {
                invoicesHtml += `
                    <tr>
                        <td>${invoice.id}</td>
                        <td>${invoice.customer}</td>
                        <td>${invoice.date}</td>
                        <td>${invoice.total.toFixed(2)}</td>
                        <td><button onclick="invoiceSystem.viewInvoice(${invoice.id})">عرض</button></td>
                    </tr>
                `;
            });
            invoicesHtml += `
                    </tbody>
                </table>
            `;
        }
        invoicesSection.innerHTML = invoicesHtml;

        document.getElementById("newInvoiceButton").addEventListener("click", () => {
            document.getElementById("invoiceFormContainer").style.display = "block";
        });

        document.getElementById("addItemButton").addEventListener("click", () => {
            const itemIndex = document.querySelectorAll(".invoice-item").length;
            const newItemHtml = `
                <div class="invoice-item">
                    <label for="productSelect_${itemIndex}">المنتج:</label>
                    <select class="productSelect" id="productSelect_${itemIndex}" required>
                        <option value="">اختر منتجاً</option>
                        ${productsOptions}
                    </select>
                    <label for="itemQuantity_${itemIndex}">الكمية:</label>
                    <input type="number" class="itemQuantity" id="itemQuantity_${itemIndex}" min="1" value="1" required>
                </div>
            `;
            document.getElementById("invoiceItems").insertAdjacentHTML("beforeend", newItemHtml);
        });

        document.getElementById("invoiceForm").addEventListener("submit", (e) => {
            e.preventDefault();
            const customerName = document.getElementById("customerName").value;
            const items = [];
            document.querySelectorAll(".invoice-item").forEach(itemDiv => {
                const productId = parseInt(itemDiv.querySelector(".productSelect").value);
                const itemQuantity = parseFloat(itemDiv.querySelector(".itemQuantity").value);
                items.push({ productId: productId, quantity: itemQuantity });
            });
            this.generateInvoice(customerName, items);
            document.getElementById("invoiceFormContainer").style.display = "none";
            e.target.reset();
        });
    },

    viewInvoice: function(id) {
        const invoice = this.invoices.find(inv => inv.id === id);
        if (invoice) {
            let details = `
                <h3>تفاصيل الفاتورة رقم ${invoice.id}</h3>
                <p><strong>العميل:</strong> ${invoice.customer}</p>
                <p><strong>التاريخ:</strong> ${invoice.date}</p>
                <table border="1" style="width:100%; text-align:right;">
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            invoice.items.forEach(item => {
                details += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>${item.itemTotal.toFixed(2)}</td>
                    </tr>
                `;
            });
            details += `
                    </tbody>
                </table>
                <p><strong>المجموع الفرعي:</strong> ${invoice.subtotal.toFixed(2)}</p>
                <p><strong>الخصم (${(this.discountRate * 100).toFixed(0)}%):</strong> ${invoice.discount.toFixed(2)}</p>
                <p><strong>الضريبة (${(this.taxRate * 100).toFixed(0)}%):</strong> ${invoice.tax.toFixed(2)}</p>
                <p><strong>الإجمالي الكلي:</strong> ${invoice.total.toFixed(2)}</p>
                <button onclick="invoiceSystem.printInvoice(${invoice.id})">طباعة الفاتورة</button>
                <button onclick="invoiceSystem.sendInvoice(${invoice.id})">إرسال الفاتورة</button>
            `;
            const invoicesSection = document.getElementById("invoices");
            if (invoicesSection) {
                invoicesSection.innerHTML = details;
            }
        } else {
            alert("الفاتورة غير موجودة.");
        }
    },

    printInvoice: function(id) {
        alert(`وظيفة طباعة الفاتورة رقم ${id} غير مفعلة في هذا المثال.`);
    },

    sendInvoice: function(id) {
        alert(`وظيفة إرسال الفاتورة رقم ${id} غير مفعلة في هذا المثال.`);
    }
};

// تهيئة نظام الفواتير عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    invoiceSystem.init();
});
