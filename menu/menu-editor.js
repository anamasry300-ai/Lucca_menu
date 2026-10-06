// Lucca public menu editor: reversible browser-stored overrides over the published DATA.
const MENU_EDITOR_STORAGE_KEY = 'lucca-public-menu-overrides-v1';
const MENU_EDITOR_UNCERTAIN_CATEGORIES = new Set(['breakfast', 'soda', 'winter', 'soft-drinks', 'addons', 'hot-drinks']);

function readMenuEditorState() {
    try { return JSON.parse(localStorage.getItem(MENU_EDITOR_STORAGE_KEY) || '{"overrides":{},"custom":{}}'); }
    catch (_) { return { overrides: {}, custom: {} }; }
}
function writeMenuEditorState(state) { localStorage.setItem(MENU_EDITOR_STORAGE_KEY, JSON.stringify(state)); }
function menuItemKey(categoryId, name) { return `${categoryId}::${name}`; }
function getMenuEditorImage(item, categoryId) {
    // Existing registry images remain available only where their visual meaning is reasonably clear.
    if (MENU_EDITOR_UNCERTAIN_CATEGORIES.has(categoryId)) return null;
    return item.image;
}
function getPublishedItems(categoryId) {
    const state = readMenuEditorState();
    const base = (DATA[categoryId] || []).map(item => {
        const key = menuItemKey(categoryId, item.n);
        const override = state.overrides[key] || {};
        const published = { ...item, ...override, __sourceName: item.n };
        if (Object.prototype.hasOwnProperty.call(override, 'image')) published.image = override.image;
        else if (MENU_EDITOR_UNCERTAIN_CATEGORIES.has(categoryId)) published.image = null;
        else if (item.image) published.image = item.image;
        const sourceData = typeof menuData !== 'undefined' ? menuData : [];
        const sourceCategory = sourceData.find(c => c.title === IMAGE_CATEGORY_MAP?.[categoryId]);
        const source = sourceCategory?.items?.find(entry => entry.name === item.n);
        if (!published.d && source?.description) published.d = source.description;
        return published;
    });
    return base.concat((state.custom[categoryId] || []).map(item => ({ ...item, image: item.image || null })));
}
function applyMenuOverrides() { return true; }
function menuEditorCategoryLabel(id) { return CATEGORIES.find(c => c.id === id)?.name() || id; }
function escapeMenuEditor(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch])); }

function renderMenuEditor() {
    const root = document.getElementById('menu-editor-root');
    if (!root) return;
    const state = readMenuEditorState();
    const categories = CATEGORIES.map(c => `<option value="${c.id}">${escapeMenuEditor(menuEditorCategoryLabel(c.id))}</option>`).join('');
    root.innerHTML = `
        <div class="menu-editor-head"><div><h3>✦ محرر المنيو العام</h3><p>عدّل الوصف والصورة والسعر أو أضف صنفًا جديدًا. التغييرات تحفظ على هذا المتصفح فقط.</p></div><button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="resetMenuEditor()">↺ استعادة الأساس</button></div>
        <div class="menu-editor-grid">
            <div class="section-card"><h4>اختيار الصنف</h4><label>الفئة</label><select id="menuEditorCategory" class="admin-select full" onchange="populateMenuEditorItems()">${categories}</select><label>الصنف</label><select id="menuEditorItem" class="admin-select full" onchange="loadMenuEditorItem()"></select><button class="admin-btn admin-btn-secondary" onclick="prepareNewMenuItem()">＋ إضافة صنف جديد</button></div>
            <div class="section-card"><h4 id="menuEditorFormTitle">بيانات الصنف</h4><input type="hidden" id="menuEditorMode" value="edit"><label>الاسم</label><input id="menuEditorName" class="admin-input full" placeholder="اسم الصنف"><label>الوصف المختصر</label><textarea id="menuEditorDescription" class="admin-input full" rows="3" placeholder="وصف واضح ومختصر للمنتج"></textarea><label>السعر</label><input id="menuEditorPrice" class="admin-input full" type="text" placeholder="مثال: 85 أو 80 / 95"><label>رابط الصورة المطابقة (اختياري)</label><input id="menuEditorImage" class="admin-input full" type="url" placeholder="https://..."><label class="menu-editor-check"><input id="menuEditorNoImage" type="checkbox"> لا توجد صورة موثوقة — استخدم fallback بدل التخمين</label><div class="menu-editor-actions"><button class="admin-btn admin-btn-primary" onclick="saveMenuEditorItem()">💾 حفظ التعديل</button><button class="admin-btn admin-btn-danger" onclick="deleteMenuEditorItem()">حذف الصنف المضاف</button></div><div id="menuEditorMessage" class="menu-editor-message"></div></div>
        </div>`;
    populateMenuEditorItems();
    const first = document.getElementById('menuEditorItem'); if (first?.options.length) first.selectedIndex = 0;
    loadMenuEditorItem();
    if (Object.keys(state.overrides).length || Object.values(state.custom).some(items => items.length)) showMenuEditorMessage('تم تحميل تعديلاتك المحفوظة.');
}
function populateMenuEditorItems() {
    const cat = document.getElementById('menuEditorCategory')?.value;
    const select = document.getElementById('menuEditorItem'); if (!select || !cat) return;
    select.innerHTML = getPublishedItems(cat).map((item, index) => `<option value="${index}">${escapeMenuEditor(item.n)}</option>`).join('');
}
function loadMenuEditorItem() {
    const cat = document.getElementById('menuEditorCategory')?.value;
    const index = Number(document.getElementById('menuEditorItem')?.value);
    const item = getPublishedItems(cat)[index]; if (!item) return;
    document.getElementById('menuEditorMode').value = 'edit';
    document.getElementById('menuEditorFormTitle').textContent = 'بيانات الصنف';
    document.getElementById('menuEditorName').value = item.n || '';
    document.getElementById('menuEditorDescription').value = item.d || '';
    document.getElementById('menuEditorPrice').value = Array.isArray(item.p) ? item.p.join(' / ') : (item.p || '');
    document.getElementById('menuEditorImage').value = item.image || '';
    document.getElementById('menuEditorNoImage').checked = !item.image;
}
function prepareNewMenuItem() {
    document.getElementById('menuEditorMode').value = 'new';
    document.getElementById('menuEditorFormTitle').textContent = 'إضافة صنف جديد';
    ['menuEditorName','menuEditorDescription','menuEditorPrice','menuEditorImage'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('menuEditorNoImage').checked = true;
    showMenuEditorMessage('أدخل بيانات الصنف الجديد ثم اضغط حفظ.');
}
function parseMenuEditorPrice(value) { const parts = String(value).split('/').map(v => v.trim()).filter(Boolean); return parts.length > 1 ? parts : (parts[0] || '0'); }
function saveMenuEditorItem() {
    const cat = document.getElementById('menuEditorCategory').value;
    const name = document.getElementById('menuEditorName').value.trim();
    if (!name) return showMenuEditorMessage('اكتب اسم الصنف أولًا.', true);
    const item = { n: name, p: parseMenuEditorPrice(document.getElementById('menuEditorPrice').value), d: document.getElementById('menuEditorDescription').value.trim() };
    const noImage = document.getElementById('menuEditorNoImage').checked;
    item.image = noImage ? null : (document.getElementById('menuEditorImage').value.trim() || null);
    const state = readMenuEditorState();
    if (document.getElementById('menuEditorMode').value === 'new') {
        state.custom[cat] = state.custom[cat] || [];
        state.custom[cat].push(item);
    } else {
        const current = getPublishedItems(cat)[Number(document.getElementById('menuEditorItem').value)];
        if (!current) return showMenuEditorMessage('اختر صنفًا صالحًا.', true);
        state.overrides[menuItemKey(cat, current.__sourceName || current.n)] = { n: item.n, p: item.p, d: item.d, image: item.image };
    }
    writeMenuEditorState(state); renderMenu(); renderTabs(); renderMenuEditor(); showMenuEditorMessage('تم الحفظ وتحديث المنيو العام.');
}
function deleteMenuEditorItem() {
    const cat = document.getElementById('menuEditorCategory').value;
    const current = getPublishedItems(cat)[Number(document.getElementById('menuEditorItem').value)];
    if (!current) return;
    const state = readMenuEditorState();
    state.custom[cat] = (state.custom[cat] || []).filter(item => item.n !== current.n);
    delete state.overrides[menuItemKey(cat, current.__sourceName || current.n)];
    writeMenuEditorState(state); renderMenu(); renderMenuEditor(); showMenuEditorMessage('تم حذف التعديل المحلي فقط.');
}
function resetMenuEditor() { if (!confirm('استعادة بيانات المنيو الأصلية وحذف التعديلات المحلية؟')) return; localStorage.removeItem(MENU_EDITOR_STORAGE_KEY); renderMenu(); renderTabs(); renderMenuEditor(); showMenuEditorMessage('تمت الاستعادة.'); }
function showMenuEditorMessage(message, error = false) { const el = document.getElementById('menuEditorMessage'); if (el) { el.textContent = message; el.style.color = error ? '#f08b78' : 'var(--gold)'; } }
