// tables.js - نظام إدارة الطاولات والحضور (مثال للمطاعم/المقاهي)

const tableManagement = {
    tables: [],

    init: function() {
        // تحميل بيانات الطاولات المحفوظة من التخزين المحلي
        const storedTables = localStorage.getItem("tables");
        if (storedTables) {
            this.tables = JSON.parse(storedTables);
        } else {
            // بيانات طاولات افتراضية
            this.tables = [
                { id: 1, name: "طاولة 1", capacity: 4, status: "available", currentOccupancy: 0 },
                { id: 2, name: "طاولة 2", capacity: 2, status: "occupied", currentOccupancy: 2 },
                { id: 3, name: "طاولة 3", capacity: 6, status: "available", currentOccupancy: 0 }
            ];
            localStorage.setItem("tables", JSON.stringify(this.tables));
        }
        this.renderTables();
    },

    addTable: function(name, capacity) {
        const newTable = {
            id: this.tables.length > 0 ? Math.max(...this.tables.map(t => t.id)) + 1 : 1,
            name: name,
            capacity: capacity,
            status: "available",
            currentOccupancy: 0
        };
        this.tables.push(newTable);
        localStorage.setItem("tables", JSON.stringify(this.tables));
        this.renderTables();
        alert("تم إضافة الطاولة بنجاح!");
    },

    updateTableStatus: function(id, status, occupancy = 0) {
        const tableIndex = this.tables.findIndex(t => t.id === id);
        if (tableIndex !== -1) {
            this.tables[tableIndex].status = status;
            this.tables[tableIndex].currentOccupancy = occupancy;
            localStorage.setItem("tables", JSON.stringify(this.tables));
            this.renderTables();
            alert(`تم تحديث حالة الطاولة ${id} إلى ${status}.`);
        } else {
            alert("الطاولة غير موجودة.");
        }
    },

    renderTables: function() {
        const tablesSection = document.getElementById("tables");
        if (!tablesSection) return;

        let tablesHtml = `
            <h2>إدارة الطاولات</h2>
            <button id="addTableButton">إضافة طاولة جديدة</button>
            <div id="addTableFormContainer" style="display:none;">
                <h3>إضافة طاولة</h3>
                <form id="addTableForm">
                    <label for="tableName">اسم الطاولة:</label>
                    <input type="text" id="tableName" required><br><br>
                    <label for="tableCapacity">السعة:</label>
                    <input type="number" id="tableCapacity" min="1" value="4" required><br><br>
                    <button type="submit">حفظ الطاولة</button>
                </form>
            </div>
            <h3>الطاولات الحالية</h3>
        `;

        if (this.tables.length === 0) {
            tablesHtml += "<p>لا توجد طاولات حالياً.</p>";
        } else {
            tablesHtml += `
                <table border="1" style="width:100%; text-align:right;">
                    <thead>
                        <tr>
                            <th>رقم الطاولة</th>
                            <th>الاسم</th>
                            <th>السعة</th>
                            <th>الحالة</th>
                            <th>الإشغال الحالي</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            this.tables.forEach(table => {
                tablesHtml += `
                    <tr>
                        <td>${table.id}</td>
                        <td>${table.name}</td>
                        <td>${table.capacity}</td>
                        <td>${table.status === "available" ? "متاحة" : "مشغولة"}</td>
                        <td>${table.currentOccupancy}</td>
                        <td>
                            <button onclick="tableManagement.updateTableStatus(${table.id}, 'occupied', ${table.capacity})">شغل</button>
                            <button onclick="tableManagement.updateTableStatus(${table.id}, 'available', 0)">إفراغ</button>
                        </td>
                    </tr>
                `;
            });
            tablesHtml += `
                    </tbody>
                </table>
            `;
        }
        tablesSection.innerHTML = tablesHtml;

        document.getElementById("addTableButton").addEventListener("click", () => {
            document.getElementById("addTableFormContainer").style.display = "block";
        });

        document.getElementById("addTableForm").addEventListener("submit", (e) => {
            e.preventDefault();
            const tableName = document.getElementById("tableName").value;
            const tableCapacity = parseInt(document.getElementById("tableCapacity").value);
            this.addTable(tableName, tableCapacity);
            document.getElementById("addTableFormContainer").style.display = "none";
            e.target.reset();
        });
    }
};

// تهيئة نظام إدارة الطاولات عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    tableManagement.init();
});
