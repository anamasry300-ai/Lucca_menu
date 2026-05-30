// ==================== Lucca Accounting - Full Integration ====================

function openAdminPanel() {
    document.getElementById('adminWrapper').classList.add('show');
    document.getElementById('staffToggleBtn').style.display = 'none';
    document.body.style.overflow = 'hidden';
    showAdminTab('dashboard');
}

function closeAdminPanel() {
    stopKitchenPolling();
    document.getElementById('adminWrapper').classList.remove('show');
    document.getElementById('staffToggleBtn').style.display = '';
    document.body.style.overflow = '';
}

function showAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    const target = document.getElementById('at-' + tab);
    if (target) target.classList.add('active');
    document.querySelectorAll('.admin-sidebar-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.admin-sidebar-btn[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
    if (tab !== 'kitchen') stopKitchenPolling();
    if (tab === 'dashboard') loadDashboardStats();
    else if (tab === 'cashier') crLoadDay();
    else if (tab === 'purchases') loadPurchases();
    else if (tab === 'employees') { loadEmployees().then(loadAttendanceRecords); }
    else if (tab === 'reports') loadReport();
    else if (tab === 'kitchen') { loadKitchen(); startKitchenPolling(); }
    else if (tab === 'settings') loadSettings();
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
        document.getElementById('dash-menu-url').textContent = window.location.href;
        checkServerStatus();
    } catch(e) { console.error('Dashboard:', e); }
}

// ==================== CASH REGISTER ====================
const _cr = { date: null };
function crLoadDay() {
    _cr.date = document.getElementById('crDate').value || new Date().toISOString().split('T')[0];
    document.getElementById('crDate').value = _cr.date;
    (async () => {
        try {
            const [shift, orders, expenses] = await Promise.all([
                LuccaDB.Shifts.get(_cr.date),
                LuccaDB.Orders.getByDateRange(_cr.date, _cr.date),
                LuccaDB.Expenses.getByDate(_cr.date)
            ]);
            const cashSales = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + (o.total || 0), 0);
            const cardSales = orders.filter(o => o.paymentMethod === 'visa').reduce((s, o) => s + (o.total || 0), 0);
            const totalSales = cashSales + cardSales;
            const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
            const opening = shift?.openingBalance || 0;
            const expectedCash = opening + cashSales;
            if (shift?.status === 'open') {
                document.getElementById('crShiftStatus').textContent = '🔓 الوردية مفتوحة';
                document.getElementById('crOpenBtn').disabled = true;
                document.getElementById('crCloseBtn').style.display = '';
                document.getElementById('crOpeningSection').style.display = shift.openingBalance ? 'none' : '';
            } else if (shift?.status === 'closed') {
                document.getElementById('crShiftStatus').textContent = '🔒 الوردية مقفلة';
                document.getElementById('crOpenBtn').disabled = false;
                document.getElementById('crCloseBtn').style.display = 'none';
                document.getElementById('crOpeningSection').style.display = 'none';
                document.getElementById('cr-actual-row').style.display = '';
                document.getElementById('cr-diff-row').style.display = '';
                document.getElementById('cr-actual').textContent = (shift.actualCash || 0).toFixed(0);
                const diff = (shift.actualCash || 0) - expectedCash;
                document.getElementById('cr-diff').textContent = diff.toFixed(0);
                document.getElementById('cr-diff').style.color = diff >= 0 ? 'var(--gold)' : '#e74c3c';
            } else {
                document.getElementById('crShiftStatus').textContent = '— الوردية لم تفتح بعد';
                document.getElementById('crOpenBtn').disabled = false;
                document.getElementById('crCloseBtn').style.display = 'none';
                document.getElementById('crOpeningSection').style.display = '';
                document.getElementById('cr-actual-row').style.display = 'none';
                document.getElementById('cr-diff-row').style.display = 'none';
            }
            document.getElementById('cr-cash').textContent = cashSales.toFixed(0);
            document.getElementById('cr-card').textContent = cardSales.toFixed(0);
            document.getElementById('cr-total').textContent = totalSales.toFixed(0);
            document.getElementById('cr-exp').textContent = totalExpenses.toFixed(0);
            document.getElementById('cr-expected').textContent = expectedCash.toFixed(0);
            crLoadExpensesTable();
        } catch(e) { console.error('Cashier:', e); }
    })();
}

async function crOpenShift() {
    try {
        await LuccaDB.Shifts.open(_cr.date, 0, '');
        showAdminToast('🔓 تم فتح الوردية');
        crLoadDay();
    } catch(e) { showAdminToast('❌ فشل فتح الوردية'); }
}

async function crSaveOpening() {
    const amount = parseFloat(document.getElementById('crOpeningAmount').value) || 0;
    try {
        const shift = await LuccaDB.Shifts.get(_cr.date);
        if (shift) {
            shift.openingBalance = amount;
            await LuccaDB.db.put('shifts', shift);
        } else {
            await LuccaDB.Shifts.open(_cr.date, amount, '');
        }
        showAdminToast('✅ تم حفظ رصيد الافتتاح');
        crLoadDay();
    } catch(e) { showAdminToast('❌ فشل الحفظ'); }
}

function crCloseShiftDialog() {
    document.getElementById('cs-actual').value = '';
    document.getElementById('closeShiftOverlay').style.display = 'block';
    document.getElementById('closeShiftModal').style.display = 'flex';
    document.getElementById('cs-actual').focus();
}

async function crConfirmClose() {
    const actual = parseFloat(document.getElementById('cs-actual').value);
    if (isNaN(actual)) { showAdminToast('❌ أدخل المبلغ الفعلي'); return; }
    try {
        await LuccaDB.Shifts.close(_cr.date, actual, '');
        document.getElementById('closeShiftOverlay').style.display = 'none';
        document.getElementById('closeShiftModal').style.display = 'none';
        showAdminToast('🔒 تم إقفال الوردية');
        crLoadDay();
    } catch(e) { showAdminToast('❌ فشل الإقفال'); }
}

async function crLoadExpensesTable() {
    try {
        const expenses = await LuccaDB.Expenses.getByDate(_cr.date) || [];
        const tbody = document.getElementById('cr-expenses-body');
        tbody.innerHTML = expenses.length
            ? expenses.map(e => `<tr><td>${e.category || '—'}</td><td>${(e.amount || 0).toFixed(0)} ج.م</td><td>${e.notes || '—'}</td><td><button class="admin-btn-icon" onclick="crDeleteExpense(${e.id})" title="حذف">🗑️</button></td></tr>`).join('')
            : '<tr class="empty"><td colspan="4">لا توجد مصروفات</td></tr>';
    } catch(e) { console.error('Expenses:', e); }
}

async function crAddExpense() {
    const amt = parseFloat(document.getElementById('crExpAmt').value);
    if (!amt) { showAdminToast('❌ أدخل المبلغ'); return; }
    try {
        await LuccaDB.Expenses.add({
            category: document.getElementById('crExpCat').value,
            amount: amt,
            notes: document.getElementById('crExpNote').value.trim(),
            date: _cr.date
        });
        document.getElementById('crExpAmt').value = '';
        document.getElementById('crExpNote').value = '';
        showAdminToast('✅ تم إضافة المصروف');
        crLoadDay();
    } catch(e) { showAdminToast('❌ فشل الإضافة'); }
}

async function crDeleteExpense(id) {
    if (!confirm('حذف هذا المصروف؟')) return;
    try { await LuccaDB.Expenses.delete(id); showAdminToast('🗑️ تم الحذف'); crLoadDay(); }
    catch(e) { showAdminToast('❌ فشل الحذف'); }
}

// ==================== PURCHASES ====================
async function addPurchase() {
    const name = document.getElementById('pur-item').value.trim();
    const cost = parseFloat(document.getElementById('pur-cost').value);
    if (!name || !cost) { showAdminToast('❌ أكمل البيانات'); return; }
    try {
        await LuccaDB.Purchases.add({
            name, quantity: parseFloat(document.getElementById('pur-qty').value) || 1, total: cost,
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
        const total = purchases.reduce((s, p) => s + (p.total || 0), 0);
        document.getElementById('pur-total-cost').textContent = total.toFixed(0);
        tbody.innerHTML = purchases.length
            ? purchases.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                .map(p => `<tr><td>${p.name}</td><td>${p.quantity || 1}</td><td>${(p.total || 0).toFixed(0)} ج.م</td><td>${p.date || '—'}</td><td><button class="admin-btn-icon" onclick="deletePurchase(${p.id})" title="حذف">🗑️</button></td></tr>`).join('')
            : '<tr class="empty"><td colspan="5">لا توجد مشتريات</td></tr>';
    } catch(e) { console.error('Purchases:', e); }
}

async function deletePurchase(id) {
    if (!confirm('حذف هذه المشتريات؟')) return;
    try { await LuccaDB.Purchases.delete(id); showAdminToast('🗑️ تم الحذف'); loadPurchases(); }
    catch(e) { showAdminToast('❌ فشل الحذف'); }
}

// ==================== EMPLOYEES ====================
async function addEmployee() {
    const name = document.getElementById('emp-name').value.trim();
    if (!name) { showAdminToast('❌ أدخل اسم الموظف'); return; }
    try {
        await LuccaDB.Employees.add({
            name,
            phone: document.getElementById('emp-phone').value.trim(),
            role: document.getElementById('emp-role').value || 'موظف'
        });
        document.getElementById('emp-name').value = '';
        document.getElementById('emp-phone').value = '';
        showAdminToast('✅ تم إضافة الموظف');
        loadEmployees();
    } catch(e) { showAdminToast('❌ فشل الإضافة'); }
}

let _empMap = {};
async function loadEmployees() {
    try {
        const employees = await LuccaDB.Employees.getAll() || [];
        _empMap = {};
        employees.forEach(e => _empMap[e.id] = e.name);
        const list = document.getElementById('employees-list');
        if (employees.length === 0) {
            list.innerHTML = '<div style="color:var(--coffee-300);padding:10px;">لا يوجد موظفون</div>';
        } else {
            list.innerHTML = employees.map(e => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div><div style="color:var(--foam);font-weight:500;">${e.name}</div><div style="color:var(--coffee-300);font-size:0.8rem;">${e.phone || '—'} · ${e.role || 'موظف'}</div></div>
                    <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteEmployee(${e.id})">حذف</button>
                </div>`).join('');
        }
        const sel = document.getElementById('att-emp');
        sel.innerHTML = employees.filter(e => e.active !== false).length
            ? '<option value="">— اختر موظفاً —</option>' + employees.filter(e => e.active !== false).map(e => `<option value="${e.id}">${e.name}</option>`).join('')
            : '<option value="">— لا يوجد موظفون —</option>';
    } catch(e) { console.error('Employees:', e); }
}

async function deleteEmployee(id) {
    if (!confirm('حذف هذا الموظف؟')) return;
    try { await LuccaDB.Employees.delete(id); showAdminToast('🗑️ تم الحذف'); loadEmployees(); }
    catch(e) { showAdminToast('❌ فشل الحذف'); }
}

// ---- Attendance ----
async function checkInEmployee() {
    const empId = parseInt(document.getElementById('att-emp').value);
    if (!empId) { showAdminToast('❌ اختر موظفاً'); return; }
    try {
        await LuccaDB.Attendance.checkIn(empId, document.getElementById('att-notes').value.trim());
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
        tbody.innerHTML = records.length
            ? records.map(r => `<tr><td>${_empMap[r.employeeId] || '—'}</td><td>${r.checkIn ? new Date(r.checkIn).toLocaleTimeString('ar-EG', {hour:'2-digit',minute:'2-digit'}) : '—'}</td><td>${r.checkOut ? new Date(r.checkOut).toLocaleTimeString('ar-EG', {hour:'2-digit',minute:'2-digit'}) : '—'}</td><td>${r.lateMinutes ? r.lateMinutes + ' د' : '—'}</td><td>${r.bonus ? r.bonus + ' ج.م' : ''}${r.deduction ? ' / -' + r.deduction + ' ج.م' : ''}</td><td><button class="admin-btn-icon" onclick="editAttendanceBonus(${r.id})" title="تعديل">⚡</button></td></tr>`).join('')
            : '<tr class="empty"><td colspan="6">لا توجد سجلات اليوم</td></tr>';
    } catch(e) { console.error('Attendance:', e); }
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
    document.getElementById('rpt-from').value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('rpt-to').value = now.toISOString().split('T')[0];
}

async function loadReport() {
    const from = document.getElementById('rpt-from').value;
    const to = document.getElementById('rpt-to').value;
    if (!from || !to) return;
    try {
        const [orders, expenses, allPurchases] = await Promise.all([
            LuccaDB.Orders.getByDateRange(from, to),
            LuccaDB.Expenses.getByDateRange(from, to),
            LuccaDB.Purchases.getAll()
        ]);
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
        document.getElementById('rpt-avg').textContent = orders.length ? (totalSales / orders.length).toFixed(0) : '0';
        document.getElementById('rpt-expenses').textContent = totalExpenses.toFixed(0);
        document.getElementById('rpt-cogs').textContent = totalCOGS.toFixed(0);
        document.getElementById('rpt-profit').textContent = netProfit.toFixed(0);
        document.getElementById('rpt-profit').style.color = netProfit >= 0 ? 'var(--gold)' : '#e74c3c';
        document.getElementById('rpt-margin').textContent = profitMargin + '%';
        document.getElementById('rpt-margin').style.color = netProfit >= 0 ? 'var(--gold)' : '#e74c3c';

        const tbody = document.getElementById('rpt-body');
        tbody.innerHTML = orders.length
            ? orders.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                .map(o => `<tr><td>#${o.id}</td><td>${o.tableId || '—'}</td><td>${o.total || 0} ج.م</td><td>${o.paymentMethod === 'cash' ? '💵 كاش' : '💳 فيزا'}</td><td>${o.status || 'pending'}</td><td>${o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-EG') : o.date || '—'}</td></tr>`).join('')
            : '<tr class="empty"><td colspan="6">لا توجد طلبات</td></tr>';
    } catch(e) { console.error('Report:', e); }
}

// ==================== KITCHEN ====================
let kitchenSoundEnabled = true;
let kitchenPrevCount = 0;
let kitchenPollInterval = null;

function toggleKitchenSound() { kitchenSoundEnabled = document.getElementById('kitchen-sound').checked; }

function playOrderNotification() {
    if (!kitchenSoundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [880, 1320].forEach((freq, i) => {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.value = freq; osc.type = 'sine'; gain.gain.value = 0.3;
                osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.stop(ctx.currentTime + 0.3);
            }, i * 200);
        });
    } catch(e) { /* audio not available */ }
}

async function loadKitchen() {
    try {
        const showAll = document.getElementById('kitchen-all')?.checked;
        const orders = showAll ? await LuccaDB.Orders.getAll() : await LuccaDB.Orders.getDailySales();
        const pending = (orders || []).filter(o => o.status !== 'completed' && o.status !== 'cancelled');
        const count = pending.length;
        if (count > kitchenPrevCount) playOrderNotification();
        kitchenPrevCount = count;
        document.getElementById('kitchen-count').textContent = count;
        const grid = document.getElementById('kitchen-grid');
        if (!pending.length) { grid.innerHTML = '<div style="text-align:center;color:var(--coffee-300);padding:30px;">✅ لا توجد طلبات معلقة</div>'; return; }
        grid.innerHTML = pending.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map(o => {
            const time = o.createdAt ? new Date(o.createdAt).toLocaleTimeString('ar-EG', {hour:'2-digit',minute:'2-digit'}) : '';
            return `<div class="kitchen-card ${o.status === 'pending' ? 'new-order' : ''}">
                <div class="k-header"><span class="k-number">#${o.id}</span><span class="k-table">🍽️ ${o.tableId ? 'طاولة ' + o.tableId : 'تيك أواي'}</span></div>
                <div class="k-time">🕐 ${time}</div>
                <div class="k-items">${(o.items || []).map(item => `<div class="k-item"><span>${item.name || item}</span><span class="qty">×${item.quantity || 1}</span></div>`).join('')}</div>
                ${o.notes ? `<div class="k-note">📝 ${o.notes}</div>` : ''}
                <div class="k-actions">${o.status === 'pending' ? `<button class="btn-prep" onclick="kitchenUpdateStatus(${o.id},'preparing')">👨‍🍳 تحت التجهيز</button>` : ''}${o.status === 'preparing' ? `<button class="btn-ready" onclick="kitchenUpdateStatus(${o.id},'completed')">✅ جاهز</button>` : ''}</div>
            </div>`;
        }).join('');
    } catch(e) { console.error('Kitchen:', e); }
}

async function kitchenUpdateStatus(orderId, status) {
    try { await LuccaDB.Orders.updateStatus(orderId, status); showAdminToast('✅ تم تحديث حالة الطلب'); loadKitchen(); }
    catch(e) { showAdminToast('❌ فشل التحديث'); }
}

function startKitchenPolling() { stopKitchenPolling(); kitchenPollInterval = setInterval(() => loadKitchen(), 5000); }
function stopKitchenPolling() { if (kitchenPollInterval) { clearInterval(kitchenPollInterval); kitchenPollInterval = null; } }

// ==================== SETTINGS ====================
function loadSettings() {
    document.getElementById('set-whatsapp').value = localStorage.getItem('luccaWhatsApp') || '';
    document.getElementById('set-workstart').value = localStorage.getItem('luccaWorkStart') || '09:00';
    document.getElementById('set-server-url').value = localStorage.getItem('luccaServerUrl') || 'http://localhost:3000';
    checkServerStatus();
}

function saveSettings() {
    const url = document.getElementById('set-server-url').value.trim();
    if (url) localStorage.setItem('luccaServerUrl', url);
    localStorage.setItem('luccaWhatsApp', document.getElementById('set-whatsapp').value.trim());
    localStorage.setItem('luccaWorkStart', document.getElementById('set-workstart').value);
    showAdminToast('✅ تم حفظ الإعدادات');
}

async function checkServerStatus() {
    const els = ['server-status', 'dash-server-status'].map(id => document.getElementById(id)).filter(Boolean);
    els.forEach(el => { el.textContent = '⏳...'; el.style.color = 'var(--coffee-300)'; });
    try {
        const ok = await LuccaDB.ServerSync.testConnection();
        els.forEach(el => {
            if (ok) { el.textContent = '✅ متصل'; el.style.color = '#2ecc71'; }
            else { el.textContent = '❌ غير متصل'; el.style.color = '#e74c3c'; }
        });
    } catch {
        els.forEach(el => { el.textContent = '❌ غير متصل'; el.style.color = '#e74c3c'; });
    }
}

async function testServerConnection() {
    const el = document.getElementById('server-status');
    const url = document.getElementById('set-server-url').value.trim();
    if (url) localStorage.setItem('luccaServerUrl', url);
    el.textContent = '⏳ جاري الفحص...';
    el.style.color = 'var(--coffee-300)';
    try {
        const res = await fetch(url + '/api/public-key');
        if (res.ok) {
            const data = await res.json();
            if (data.apiKey) localStorage.setItem('luccaApiKey', data.apiKey);
            el.textContent = '✅ متصل';
            el.style.color = '#2ecc71';
            showAdminToast('✅ تم الاتصال بالسيرفر');
        } else {
            el.textContent = '❌ فشل الاتصال';
            el.style.color = '#e74c3c';
            showAdminToast('❌ فشل الاتصال');
        }
    } catch {
        el.textContent = '❌ غير متصل';
        el.style.color = '#e74c3c';
        showAdminToast('❌ السيرفر غير متاح');
    }
}

async function syncNow() {
    showAdminToast('⏳ جاري المزامنة...');
    try {
        const result = await LuccaDB.ServerSync.pushAll();
        if (result.success) {
            showAdminToast('✅ تم رفع البيانات للسيرفر');
            checkServerStatus();
        } else {
            showAdminToast('❌ ' + (result.message || 'فشلت المزامنة'));
        }
    } catch(e) {
        showAdminToast('❌ فشلت المزامنة');
    }
}

async function exportAllData() {
    try {
        const data = await LuccaDB.DataSync.exportAll();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `lucca-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click(); URL.revokeObjectURL(url);
        showAdminToast('✅ تم تصدير البيانات');
    } catch(e) { showAdminToast('❌ فشل التصدير'); }
}

function triggerImport() { document.getElementById('import-file').click(); }

async function importData(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;
    try {
        await LuccaDB.DataSync.importAll(JSON.parse(await file.text()));
        showAdminToast('✅ تم استيراد البيانات');
    } catch(e) { showAdminToast('❌ فشل الاستيراد'); }
    fileInput.value = '';
}
