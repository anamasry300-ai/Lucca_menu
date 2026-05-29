// ==================== Lucca Accounting - Full Integration ====================
let _adminTab = 'dashboard';

function openAdminPanel() {
    document.getElementById('adminWrapper').classList.add('show');
    document.getElementById('staffToggleBtn').style.display = 'none';
    document.body.style.overflow = 'hidden';
    showAdminTab('dashboard');
}

function closeAdminPanel() {
    document.getElementById('adminWrapper').classList.remove('show');
    document.getElementById('staffToggleBtn').style.display = '';
    document.body.style.overflow = '';
    renderMenu();
    renderTabs();
}

function showAdminTab(tab) {
    _adminTab = tab;
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('at-' + tab)?.classList.add('active');
    document.querySelectorAll('.admin-sidebar-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.admin-sidebar-btn[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
    if (tab === 'kitchen') { stopKitchenPolling(); }
    switch(tab) {
        case 'dashboard': loadDashboardStats(); break;
        case 'cashier': crLoadDay(); break;
        case 'purchases': loadPurchases(); break;
        case 'employees': loadEmployees(); loadAttendanceRecords(); break;
        case 'reports': loadReport(); break;
        case 'kitchen': loadKitchen(); startKitchenPolling(); break;
        case 'settings': loadSettings(); break;
    }
}

function showAdminToast(msg) {
    const el = document.getElementById('adminToast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._hide);
    el._hide = setTimeout(() => el.classList.remove('show'), 2000);
}

// ==================== DASHBOARD ====================
async function loadDashboardStats() {
    try {
        const orders = await LuccaDB.Orders.getDailySales() || [];
        const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
        document.getElementById('dash-orders').textContent = orders.length;
        document.getElementById('dash-sales').textContent = totalSales.toFixed(0);
        const cash = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + (o.total || 0), 0);
        const card = orders.filter(o => o.paymentMethod === 'visa').reduce((s, o) => s + (o.total || 0), 0);
        document.getElementById('dash-cash').textContent = cash.toFixed(0);
        document.getElementById('dash-card').textContent = card.toFixed(0);
        const url = window.location.href;
        document.getElementById('dash-menu-url').textContent = url;
    } catch(e) { /* ignore */ }
}

// ==================== CASH REGISTER ====================
function crLoadDay() {
    const date = document.getElementById('crDate').value || new Date().toISOString().split('T')[0];
    document.getElementById('crDate').value = date;
    (async () => {
        try {
            const shift = await LuccaDB.Shifts.get(date);
            const orders = await LuccaDB.Orders.getByDateRange(date, date) || [];
            const expenses = await LuccaDB.Expenses.getByDate(date) || [];
            if (shift && shift.status === 'open') {
                document.getElementById('crShiftStatus').textContent = '🔓 الوردية مفتوحة';
                document.getElementById('crOpenBtn').disabled = true;
                document.getElementById('crCloseBtn').style.display = '';
                document.getElementById('crOpeningSection').style.display = shift.openingBalance ? 'none' : '';
            } else if (shift) {
                document.getElementById('crShiftStatus').textContent = '🔒 الوردية مقفلة';
                document.getElementById('crOpenBtn').disabled = false;
                document.getElementById('crCloseBtn').style.display = 'none';
                document.getElementById('crOpeningSection').style.display = 'none';
            } else {
                document.getElementById('crShiftStatus').textContent = '— الوردية لم تفتح بعد';
                document.getElementById('crOpenBtn').disabled = false;
                document.getElementById('crCloseBtn').style.display = 'none';
                document.getElementById('crOpeningSection').style.display = '';
            }
            const cashSales = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + (o.total || 0), 0);
            const cardSales = orders.filter(o => o.paymentMethod === 'visa').reduce((s, o) => s + (o.total || 0), 0);
            const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
            const opening = shift?.openingBalance || 0;
            const expectedCash = opening + cashSales;
            document.getElementById('cr-cash').textContent = cashSales.toFixed(0);
            document.getElementById('cr-card').textContent = cardSales.toFixed(0);
            document.getElementById('cr-total').textContent = (cashSales + cardSales).toFixed(0);
            document.getElementById('cr-exp').textContent = totalExpenses.toFixed(0);
            document.getElementById('cr-expected').textContent = expectedCash.toFixed(0);
            if (shift?.status === 'closed') {
                document.getElementById('cr-actual-row').style.display = '';
                document.getElementById('cr-diff-row').style.display = '';
                document.getElementById('cr-actual').textContent = (shift.actualCash || 0).toFixed(0);
                const diff = (shift.actualCash || 0) - expectedCash;
                document.getElementById('cr-diff').textContent = diff.toFixed(0);
                document.getElementById('cr-diff').style.color = diff >= 0 ? 'var(--gold)' : '#e74c3c';
            } else {
                document.getElementById('cr-actual-row').style.display = 'none';
                document.getElementById('cr-diff-row').style.display = 'none';
            }
            crLoadExpensesTable();
        } catch(e) { /* ignore */ }
    })();
}

async function crOpenShift() {
    const date = document.getElementById('crDate').value || new Date().toISOString().split('T')[0];
    try {
        await LuccaDB.Shifts.open(date, 0, '');
        showAdminToast('🔓 تم فتح الوردية');
        crLoadDay();
    } catch(e) { showAdminToast('❌ فشل فتح الوردية'); }
}

async function crSaveOpening() {
    const date = document.getElementById('crDate').value;
    const amount = parseFloat(document.getElementById('crOpeningAmount').value) || 0;
    try {
        const shift = await LuccaDB.Shifts.get(date);
        if (shift) {
            shift.openingBalance = amount;
            await LuccaDB.db.put('shifts', shift);
        } else {
            await LuccaDB.Shifts.open(date, amount, '');
        }
        showAdminToast('✅ تم حفظ رصيد الافتتاح');
        crLoadDay();
    } catch(e) { showAdminToast('❌ فشل الحفظ'); }
}

function crCloseShiftDialog() {
    document.getElementById('closeShiftModal').style.display = 'flex';
    document.getElementById('closeShiftOverlay').style.display = 'block';
    document.getElementById('cs-actual').value = '';
    document.getElementById('cs-actual').focus();
}

async function crConfirmClose() {
    const actual = parseFloat(document.getElementById('cs-actual').value);
    if (isNaN(actual)) { showAdminToast('❌ أدخل المبلغ الفعلي'); return; }
    const date = document.getElementById('crDate').value;
    try {
        await LuccaDB.Shifts.close(date, actual, '');
        document.getElementById('closeShiftModal').style.display = 'none';
        document.getElementById('closeShiftOverlay').style.display = 'none';
        showAdminToast('🔒 تم إقفال الوردية');
        crLoadDay();
    } catch(e) { showAdminToast('❌ فشل الإقفال'); }
}

async function crLoadExpensesTable() {
    const date = document.getElementById('crDate').value || new Date().toISOString().split('T')[0];
    try {
        const expenses = await LuccaDB.Expenses.getByDate(date) || [];
        const tbody = document.getElementById('cr-expenses-body');
        if (expenses.length === 0) {
            tbody.innerHTML = '<tr class="empty"><td colspan="4">لا توجد مصروفات</td></tr>';
            return;
        }
        tbody.innerHTML = expenses.map(e => `
            <tr>
                <td>${e.category || '—'}</td>
                <td>${(e.amount || 0).toFixed(0)} ج.م</td>
                <td>${e.notes || '—'}</td>
                <td><button class="admin-btn-icon" onclick="crDeleteExpense(${e.id})" title="حذف">🗑️</button></td>
            </tr>
        `).join('');
    } catch(e) { /* ignore */ }
}

async function crAddExpense() {
    const cat = document.getElementById('crExpCat').value;
    const amt = parseFloat(document.getElementById('crExpAmt').value);
    const note = document.getElementById('crExpNote').value.trim();
    if (!amt) { showAdminToast('❌ أدخل المبلغ'); return; }
    const date = document.getElementById('crDate').value || new Date().toISOString().split('T')[0];
    try {
        await LuccaDB.Expenses.add({ category: cat, amount: amt, notes: note, date });
        document.getElementById('crExpAmt').value = '';
        document.getElementById('crExpNote').value = '';
        showAdminToast('✅ تم إضافة المصروف');
        crLoadDay();
    } catch(e) { showAdminToast('❌ فشل الإضافة'); }
}

async function crDeleteExpense(id) {
    if (!confirm('حذف هذا المصروف؟')) return;
    try {
        await LuccaDB.Expenses.delete(id);
        showAdminToast('🗑️ تم الحذف');
        crLoadDay();
    } catch(e) { showAdminToast('❌ فشل الحذف'); }
}

// ==================== PURCHASES ====================
async function addPurchase() {
    const name = document.getElementById('pur-item').value.trim();
    const qty = parseFloat(document.getElementById('pur-qty').value) || 1;
    const cost = parseFloat(document.getElementById('pur-cost').value);
    if (!name || !cost) { showAdminToast('❌ أكمل البيانات'); return; }
    try {
        await LuccaDB.Purchases.add({
            name, quantity: qty, total: cost,
            date: new Date().toISOString().split('T')[0]
        });
        document.getElementById('pur-item').value = '';
        document.getElementById('pur-qty').value = '1';
        document.getElementById('pur-cost').value = '';
        showAdminToast('✅ تم حفظ المشتريات');
        loadPurchases();
    } catch(e) { showAdminToast('❌ فشل الحفظ'); }
}

async function loadPurchases() {
    try {
        const purchases = await LuccaDB.Purchases.getAll() || [];
        const tbody = document.getElementById('purchases-body');
        if (purchases.length === 0) {
            tbody.innerHTML = '<tr class="empty"><td colspan="5">لا توجد مشتريات</td></tr>';
            document.getElementById('pur-total-cost').textContent = '0';
            return;
        }
        const totalCost = purchases.reduce((s, p) => s + (p.total || 0), 0);
        document.getElementById('pur-total-cost').textContent = totalCost.toFixed(0);
        tbody.innerHTML = purchases.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.quantity || 1}</td>
                <td>${(p.total || 0).toFixed(0)} ج.م</td>
                <td>${p.date || '—'}</td>
                <td><button class="admin-btn-icon" onclick="deletePurchase(${p.id})" title="حذف">🗑️</button></td>
            </tr>
        `).join('');
    } catch(e) { /* ignore */ }
}

async function deletePurchase(id) {
    if (!confirm('حذف هذه المشتريات؟')) return;
    try {
        await LuccaDB.Purchases.delete(id);
        showAdminToast('🗑️ تم الحذف');
        loadPurchases();
    } catch(e) { showAdminToast('❌ فشل الحذف'); }
}

// ==================== EMPLOYEES ====================
async function addEmployee() {
    const name = document.getElementById('emp-name').value.trim();
    const phone = document.getElementById('emp-phone').value.trim();
    const role = document.getElementById('emp-role').value || 'موظف';
    if (!name) { showAdminToast('❌ أدخل اسم الموظف'); return; }
    try {
        await LuccaDB.Employees.add({ name, phone, role });
        document.getElementById('emp-name').value = '';
        document.getElementById('emp-phone').value = '';
        showAdminToast('✅ تم إضافة الموظف');
        loadEmployees();
    } catch(e) { showAdminToast('❌ فشل الإضافة'); }
}

async function loadEmployees() {
    try {
        const employees = await LuccaDB.Employees.getAll() || [];
        const list = document.getElementById('employees-list');
        if (employees.length === 0) {
            list.innerHTML = '<div style="color:var(--coffee-300);padding:10px;">لا يوجد موظفون</div>';
            return;
        }
        list.innerHTML = employees.map(e => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <div>
                    <div style="color:var(--foam);font-weight:500;">${e.name}</div>
                    <div style="color:var(--coffee-300);font-size:0.8rem;">${e.phone || '—'} · ${e.role || 'موظف'}</div>
                </div>
                <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteEmployee(${e.id})">حذف</button>
            </div>
        `).join('');
        const sel = document.getElementById('att-emp');
        sel.innerHTML = employees.filter(e => e.active !== false).map(e =>
            `<option value="${e.id}">${e.name}</option>`
        ).join('');
    } catch(e) { /* ignore */ }
}

async function deleteEmployee(id) {
    if (!confirm('حذف هذا الموظف؟')) return;
    try {
        await LuccaDB.Employees.delete(id);
        showAdminToast('🗑️ تم الحذف');
        loadEmployees();
    } catch(e) { showAdminToast('❌ فشل الحذف'); }
}

// ---- Attendance ----
async function checkInEmployee() {
    const empId = parseInt(document.getElementById('att-emp').value);
    if (!empId) { showAdminToast('❌ اختر موظفاً'); return; }
    const notes = document.getElementById('att-notes').value.trim();
    try {
        await LuccaDB.Attendance.checkIn(empId, notes);
        document.getElementById('att-notes').value = '';
        showAdminToast('✅ تم تسجيل الحضور');
        loadAttendanceRecords();
    } catch(e) { showAdminToast(e.message || '❌ فشل التسجيل'); }
}

async function checkOutEmployee() {
    const empId = parseInt(document.getElementById('att-emp').value);
    if (!empId) { showAdminToast('❌ اختر موظفاً'); return; }
    try {
        await LuccaDB.Attendance.checkOut(empId);
        showAdminToast('✅ تم تسجيل الانصراف');
        loadAttendanceRecords();
    } catch(e) { showAdminToast(e.message || '❌ فشل التسجيل'); }
}

async function loadAttendanceRecords() {
    try {
        const records = await LuccaDB.Attendance.getToday() || [];
        const tbody = document.getElementById('att-body');
        if (records.length === 0) {
            tbody.innerHTML = '<tr class="empty"><td colspan="6">لا توجد سجلات اليوم</td></tr>';
            return;
        }
        const employees = await LuccaDB.Employees.getAll() || [];
        const empMap = {};
        employees.forEach(e => empMap[e.id] = e.name);
        tbody.innerHTML = records.map(r => `
            <tr>
                <td>${empMap[r.employeeId] || '—'}</td>
                <td>${r.checkIn ? new Date(r.checkIn).toLocaleTimeString('ar-EG', {hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                <td>${r.checkOut ? new Date(r.checkOut).toLocaleTimeString('ar-EG', {hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                <td>${r.lateMinutes ? r.lateMinutes + ' د' : '—'}</td>
                <td>${r.bonus ? r.bonus + ' ج.م' : ''}${r.deduction ? ' / -' + r.deduction + ' ج.م' : ''}</td>
                <td><button class="admin-btn-icon" onclick="editAttendanceBonus(${r.id})" title="تعديل">⚡</button></td>
            </tr>
        `).join('');
    } catch(e) { /* ignore */ }
}

async function editAttendanceBonus(id) {
    const bonus = prompt('المكافأة (ج.م):', '0');
    if (bonus === null) return;
    const deduction = prompt('الخصم (ج.م):', '0');
    if (deduction === null) return;
    try {
        await LuccaDB.Attendance.updateRecord(id, { bonus: parseFloat(bonus) || 0, deduction: parseFloat(deduction) || 0 });
        showAdminToast('✅ تم التحديث');
        loadAttendanceRecords();
    } catch(e) { showAdminToast('❌ فشل التحديث'); }
}

// ==================== REPORTS ====================
function setDefaultReportDates() {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    document.getElementById('rpt-from').value = first.toISOString().split('T')[0];
    document.getElementById('rpt-to').value = now.toISOString().split('T')[0];
}

async function loadReport() {
    const from = document.getElementById('rpt-from').value;
    const to = document.getElementById('rpt-to').value;
    if (!from || !to) return;
    try {
        const orders = await LuccaDB.Orders.getByDateRange(from, to) || [];
        const expenses = await LuccaDB.Expenses.getByDateRange(from, to) || [];
        const allPurchases = await LuccaDB.Purchases.getAll() || [];
        const purchases = allPurchases.filter(p => p.date >= from && p.date <= to);

        const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
        const cashTotal = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + (o.total || 0), 0);
        const visaTotal = orders.filter(o => o.paymentMethod === 'visa').reduce((s, o) => s + (o.total || 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const totalCOGS = purchases.reduce((s, p) => s + (p.total || 0), 0);
        const netProfit = totalSales - totalCOGS - totalExpenses;
        const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

        document.getElementById('rpt-orders').textContent = orders.length;
        document.getElementById('rpt-sales').textContent = totalSales.toFixed(0);
        document.getElementById('rpt-cash').textContent = cashTotal.toFixed(0);
        document.getElementById('rpt-visa').textContent = visaTotal.toFixed(0);
        document.getElementById('rpt-avg').textContent = orders.length > 0 ? (totalSales / orders.length).toFixed(0) : '0';
        document.getElementById('rpt-expenses').textContent = totalExpenses.toFixed(0);
        document.getElementById('rpt-cogs').textContent = totalCOGS.toFixed(0);
        document.getElementById('rpt-profit').textContent = netProfit.toFixed(0);
        document.getElementById('rpt-profit').style.color = netProfit >= 0 ? 'var(--gold)' : '#e74c3c';
        document.getElementById('rpt-margin').textContent = profitMargin + '%';
        document.getElementById('rpt-margin').style.color = netProfit >= 0 ? 'var(--gold)' : '#e74c3c';

        const tbody = document.getElementById('rpt-body');
        if (orders.length === 0) {
            tbody.innerHTML = '<tr class="empty"><td colspan="6">لا توجد طلبات</td></tr>';
            return;
        }
        tbody.innerHTML = orders.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>${o.tableId || '—'}</td>
                <td>${o.total || 0} ج.م</td>
                <td>${o.paymentMethod === 'cash' ? '💵 كاش' : '💳 فيزا'}</td>
                <td>${o.status || 'pending'}</td>
                <td>${o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-EG') : o.date || '—'}</td>
            </tr>
        `).join('');
    } catch(e) { /* ignore */ }
}

// ==================== KITCHEN ====================
let kitchenSoundEnabled = true;
let kitchenPrevCount = 0;
let kitchenPollInterval = null;

function toggleKitchenSound() {
    kitchenSoundEnabled = document.getElementById('kitchen-sound').checked;
}

function playOrderNotification() {
    if (!kitchenSoundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 1320;
            osc2.type = 'sine';
            gain2.gain.value = 0.3;
            osc2.start();
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc2.stop(ctx.currentTime + 0.3);
        }, 200);
    } catch(e) { /* audio not available */ }
}

async function loadKitchen() {
    try {
        const showAll = document.getElementById('kitchen-all')?.checked;
        let orders;
        if (showAll) {
            orders = await LuccaDB.Orders.getAll() || [];
        } else {
            orders = await LuccaDB.Orders.getDailySales() || [];
        }
        const pending = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
        const count = pending.length;
        if (count > kitchenPrevCount) playOrderNotification();
        kitchenPrevCount = count;
        document.getElementById('kitchen-count').textContent = count;
        const grid = document.getElementById('kitchen-grid');
        if (pending.length === 0) {
            grid.innerHTML = '<div style="text-align:center;color:var(--coffee-300);padding:30px;">✅ لا توجد طلبات معلقة</div>';
            return;
        }
        grid.innerHTML = pending.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map(o => {
            const isNew = (o.status === 'pending');
            const isDone = (o.status === 'completed');
            const items = (o.items || []).map(item => `
                <div class="k-item"><span>${item.name || item}</span><span class="qty">×${item.quantity || 1}</span></div>
            `).join('');
            const notes = o.notes ? `<div class="k-note">📝 ${o.notes}</div>` : '';
            const time = o.createdAt ? new Date(o.createdAt).toLocaleTimeString('ar-EG', {hour:'2-digit',minute:'2-digit'}) : '';
            return `
                <div class="kitchen-card ${isNew ? 'new-order' : ''} ${isDone ? 'completed' : ''}">
                    <div class="k-header">
                        <span class="k-number">#${o.id}</span>
                        <span class="k-table">🍽️ ${o.tableId ? 'طاولة ' + o.tableId : 'تيك أواي'}</span>
                    </div>
                    <div class="k-time">🕐 ${time}</div>
                    <div class="k-items">${items}</div>
                    ${notes}
                    <div class="k-actions">
                        ${o.status === 'pending' ? `<button class="btn-prep" onclick="kitchenUpdateStatus(${o.id},'preparing')">👨‍🍳 تحت التجهيز</button>` : ''}
                        ${o.status === 'preparing' ? `<button class="btn-ready" onclick="kitchenUpdateStatus(${o.id},'completed')">✅ جاهز</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch(e) { /* ignore */ }
}

async function kitchenUpdateStatus(orderId, status) {
    try {
        await LuccaDB.Orders.updateStatus(orderId, status);
        showAdminToast('✅ تم تحديث حالة الطلب');
        loadKitchen();
    } catch(e) { showAdminToast('❌ فشل التحديث'); }
}

function startKitchenPolling() {
    stopKitchenPolling();
    kitchenPollInterval = setInterval(() => loadKitchen(), 5000);
}

function stopKitchenPolling() {
    if (kitchenPollInterval) { clearInterval(kitchenPollInterval); kitchenPollInterval = null; }
}

// ==================== SETTINGS ====================
function loadSettings() {
    document.getElementById('set-whatsapp').value = localStorage.getItem('luccaWhatsApp') || '';
    document.getElementById('set-workstart').value = localStorage.getItem('luccaWorkStart') || '09:00';
}

function saveSettings() {
    const wa = document.getElementById('set-whatsapp').value.trim();
    const ws = document.getElementById('set-workstart').value;
    localStorage.setItem('luccaWhatsApp', wa);
    localStorage.setItem('luccaWorkStart', ws);
    showAdminToast('✅ تم حفظ الإعدادات');
}

async function exportAllData() {
    try {
        const data = await LuccaDB.DataSync.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lucca-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showAdminToast('✅ تم تصدير البيانات');
    } catch(e) { showAdminToast('❌ فشل التصدير'); }
}

function triggerImport() { document.getElementById('import-file').click(); }

async function importData(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        await LuccaDB.DataSync.importAll(data);
        showAdminToast('✅ تم استيراد البيانات');
        fileInput.value = '';
    } catch(e) { showAdminToast('❌ فشل الاستيراد'); }
}
