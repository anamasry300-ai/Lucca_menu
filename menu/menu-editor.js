// Lucca public menu editor: reversible browser-stored overrides over the published DATA.
const MENU_EDITOR_STORAGE_KEY = 'lucca-public-menu-overrides-v1';
const MENU_EDITOR_UNCERTAIN_CATEGORIES = new Set(['breakfast', 'soda', 'winter', 'soft-drinks', 'addons', 'hot-drinks']);
const CURATED_PRODUCT_IMAGES = {
    'specialty::V60': 'assets/product-v60.jpg',
    'breakfast::توست ميكس جبن': 'assets/product-toast.jpg',
    'pizza::بيتزا مارجريتا': 'assets/product-margherita-pizza.jpg',
    'desserts::تشيز كيك': 'assets/product-cheesecake.jpg'
};

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
function getPublishedItems(categoryId, opts = {}) {
    const { includeHidden = false } = opts || {};
    const state = readMenuEditorState();
    const base = (DATA[categoryId] || []).map(item => {
        const key = menuItemKey(categoryId, item.n);
        const override = state.overrides[key] || {};
        const published = { ...item, ...override, __sourceName: item.n, __sourceKey: key, __isCustom: false };
        if (Object.prototype.hasOwnProperty.call(override, 'image')) published.image = override.image;
        else if (CURATED_PRODUCT_IMAGES[key]) published.image = CURATED_PRODUCT_IMAGES[key];
        else if (MENU_EDITOR_UNCERTAIN_CATEGORIES.has(categoryId)) published.image = null;
        else if (item.image) published.image = item.image;
        if (!Object.prototype.hasOwnProperty.call(override, 'visible')) published.visible = true;
        const sourceData = typeof menuData !== 'undefined' ? menuData : [];
        const sourceCategory = sourceData.find(c => c.title === IMAGE_CATEGORY_MAP?.[categoryId]);
        const source = sourceCategory?.items?.find(entry => entry.name === item.n);
        if (!published.d && source?.description) published.d = source.description;
        return published;
    }).filter(item => includeHidden || item.visible !== false);
    return base.concat((state.custom[categoryId] || []).map(item => {
        const published = { ...item, image: item.image || null, visible: item.visible !== false, __isCustom: true };
        return published;
    }).filter(item => includeHidden || item.visible !== false));
}
function applyMenuOverrides() { return true; }
function menuEditorCategoryLabel(id) {
    if (typeof getAccessibleCategories === 'function') {
        const cat = getAccessibleCategories(true).find(c => c.id === id);
        if (cat) return cat.name();
    }
    const base = CATEGORIES.find(c => c.id === id);
    return base ? base.name() : id;
}
function escapeMenuEditor(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch])); }

const MENU_REPOSITORY_MODE = 'Local / Draft';

const MenuRepository = {
    async getProducts() {
        return CATEGORIES.flatMap(c => getPublishedItems(c.id, { includeHidden: true }).map(it => ({ ...it, categoryId: c.id })));
    },
    async createProduct(payload, categoryId) {
        const state = readMenuEditorState();
        state.custom[categoryId] = state.custom[categoryId] || [];
        state.custom[categoryId].push({ ...payload, visible: payload.visible !== false });
        writeMenuEditorState(state);
        return { ok: true, mode: MENU_REPOSITORY_MODE };
    },
    async updateProduct(categoryId, index, patch) {
        const state = readMenuEditorState();
        const current = getPublishedItems(categoryId, { includeHidden: true })[index];
        if (!current) return { ok: false, error: 'item missing' };
        if (current.__isCustom) {
            const baseCount = (DATA[categoryId] || []).length;
            const customIdx = index - baseCount;
            state.custom[categoryId][customIdx] = { ...state.custom[categoryId][customIdx], ...patch };
        } else {
            state.overrides[current.__sourceKey] = { ...(state.overrides[current.__sourceKey] || {}), ...patch };
        }
        writeMenuEditorState(state);
        return { ok: true, mode: MENU_REPOSITORY_MODE };
    },
    async deleteCustomProduct(categoryId, index) {
        const state = readMenuEditorState();
        const current = getPublishedItems(categoryId, { includeHidden: true })[index];
        if (!current || !current.__isCustom) return { ok: false, error: 'not a custom product' };
        const baseCount = (DATA[categoryId] || []).length;
        state.custom[categoryId].splice(index - baseCount, 1);
        writeMenuEditorState(state);
        return { ok: true };
    },
    async resetOverride(categoryId, index) {
        const state = readMenuEditorState();
        const current = getPublishedItems(categoryId, { includeHidden: true })[index];
        if (!current) return { ok: false, error: 'item missing' };
        if (!current.__isCustom) delete state.overrides[current.__sourceKey];
        writeMenuEditorState(state);
        return { ok: true };
    },
    async hideProduct(categoryId, index, hidden) {
        await this.updateProduct(categoryId, index, { visible: !hidden });
        return { ok: true, mode: MENU_REPOSITORY_MODE };
    },
    async updateImage(categoryId, index, imageData) {
        await this.updateProduct(categoryId, index, { image: imageData });
        return { ok: true, mode: MENU_REPOSITORY_MODE };
    },
    async removeImage(categoryId, index) {
        await this.updateProduct(categoryId, index, { image: null });
        return { ok: true, mode: MENU_REPOSITORY_MODE };
    },
    async publish() {
        return { published: false, note: MENU_REPOSITORY_MODE + ' — التغييرات تُحفظ على هذا المتصفح فقط. لِلنشر الفعلي يُعدَّل ملف البيانات من الجهاز المستضيف.' };
    }
};
const LocalMenuRepository = MenuRepository;

let _menuFormCtx = null; // { mode:'edit'|'new', cat, idx }

function menuEditorImageStatus(item) {
    if (!item || !item.image) return { label: 'FALLBACK', cls: 'img-fb' };
    const key = item.__sourceKey || '';
    if (CURATED_PRODUCT_IMAGES[key] === item.image) return { label: 'STRONG', cls: 'img-strong' };
    if (typeof item.image === 'string' && item.image.startsWith('data:')) return { label: 'VERIFIED · محليًّا', cls: 'img-verified' };
    return { label: 'LINK · غير مؤكد بصريًّا', cls: 'img-link' };
}

function menuEditorAllItems(includeHidden = true) {
    const cats = (typeof getAccessibleCategories === 'function') ? getAccessibleCategories(true) : CATEGORIES;
    return cats.flatMap(c => getPublishedItems(c.id, { includeHidden }).map((it, idx) => ({ ...it, categoryId: c.id, index: idx })));
}

function refreshMenuStats() {
    if (typeof loadDashboardStats === 'function') loadDashboardStats();
    renderMenu();
    renderTabs();
}

function renderMenuEditor() {
    const root = document.getElementById('menu-editor-root');
    if (!root) return;
    _menuFormCtx = null;
    const all = menuEditorAllItems(true);
    const withImage = all.filter(i => i.image).length;
    const cats = (typeof getAccessibleCategories === 'function') ? getAccessibleCategories(true) : CATEGORIES;
    root.innerHTML = `
        <div class="menu-editor-head">
            <div>
                <h3>✎ لوحة إدارة المنتجات</h3>
                <p>إضافة وتعديل الأصناف والمقاسات والصور والمظهر. الحالة: <strong style="color:var(--gold);">${MENU_REPOSITORY_MODE}</strong></p>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="cmsReviewOpen()">📋 مراجعة قبل النشر</button>
                <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="resetMenuEditor()">↺ استعادة الأساس</button>
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card"><div class="val">${cats.length}</div><div class="lbl">الفئات</div></div>
            <div class="stat-card"><div class="val">${all.length}</div><div class="lbl">الأصناف</div></div>
            <div class="stat-card"><div class="val">${withImage}</div><div class="lbl">صور مؤكدة</div></div>
            <div class="stat-card"><div class="val">${all.length - withImage}</div><div class="lbl">بدون صورة</div></div>
            <div class="stat-card"><div class="val">${Object.keys(readMenuEditorState().overrides || {}).length + Object.values(readMenuEditorState().custom || {}).flat().length}</div><div class="lbl">تعديلات محفوظة</div></div>
        </div>
        <div class="section-card menu-editor-toolbar">
            <select id="menuProdCat" class="admin-select sm" onchange="renderMenuEditorRows()">
                <option value="">كل الفئات</option>
                ${cats.map(c => `<option value="${c.id}">${escapeMenuEditor(menuEditorCategoryLabel(c.id))}${c.hidden ? ' (مخفية)' : ''}</option>`).join('')}
            </select>
            <input id="menuProdSearch" class="admin-input md" placeholder="بحث بالاسم..." oninput="renderMenuEditorRows()">
            <select id="menuProdVis" class="admin-select sm" onchange="renderMenuEditorRows()">
                <option value="">كل الظهور</option>
                <option value="visible">ظاهر فقط</option>
                <option value="hidden">مخفي فقط</option>
            </select>
            <label class="menu-editor-check" title="الأصناف بدون صورة موثوقة"><input type="checkbox" id="menuProdNoImg" onchange="renderMenuEditorRows()"> بدون صورة</label>
            <select id="menuProdSort" class="admin-select sm" onchange="renderMenuEditorRows()">
                <option value="">الترتيب الافتراضي</option>
                <option value="name">الاسم</option>
                <option value="price-asc">السعر ↑</option>
                <option value="price-desc">السعر ↓</option>
            </select>
            <button class="admin-btn admin-btn-primary" onclick="menuEditorNewItem()">＋ إضافة صنف جديد</button>
            <button class="admin-btn admin-btn-secondary" onclick="LocalMenuRepository.publish().then(r => showMenuEditorMessage(r.note))">📤 اختبار النشر (تشخيص)</button>
        </div>
        <div class="section-card">
            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead><tr><th>الصورة</th><th>الصنف</th><th>الفئة</th><th>السعر</th><th>حالة الصورة</th><th>الظهور</th><th>إجراءات</th></tr></thead>
                    <tbody id="menuProductsBody"></tbody>
                </table>
            </div>
        </div>
        <div id="menuEditorFormWrap"></div>
        <div id="menuEditorMessage" class="menu-editor-message"></div>`;
    renderMenuEditorRows();
}

function renderMenuEditorRows() {
    const tbody = document.getElementById('menuProductsBody');
    if (!tbody) return;
    const catFilter = document.getElementById('menuProdCat')?.value || '';
    const term = (document.getElementById('menuProdSearch')?.value || '').toLowerCase().trim();
    const vis = document.getElementById('menuProdVis')?.value || '';
    const noImg = !!(document.getElementById('menuProdNoImg')?.checked);
    const sort = document.getElementById('menuProdSort')?.value || '';
    let rows = menuEditorAllItems(true);
    if (catFilter) rows = rows.filter(r => r.categoryId === catFilter);
    if (vis === 'visible') rows = rows.filter(r => r.visible !== false);
    if (vis === 'hidden') rows = rows.filter(r => r.visible === false);
    if (noImg) rows = rows.filter(r => !r.image);
    if (term) rows = rows.filter(r => {
        const hay = [r.n || '', r.en || '', ...(Array.isArray(r.aliases) ? r.aliases.map(a => a || '') : [])].join(' ').toLowerCase();
        return hay.includes(term);
    });
    if (sort === 'name') {
        rows = rows.slice().sort((a, b) => String(a.n || '').localeCompare(String(b.n || ''), 'ar'));
    } else if (sort === 'price-asc' || sort === 'price-desc') {
        const priceOf = it => { const p = Array.isArray(it.p) ? it.p[0] : it.p; return Number(p) || 0; };
        rows = rows.slice().sort((a, b) => (sort === 'price-asc' ? 1 : -1) * (priceOf(a) - priceOf(b)));
    }
    if (!rows.length) {
        tbody.innerHTML = '<tr class="empty"><td colspan="7">لا توجد أصناف مطابقة</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(r => {
        const thumb = r.image
            ? `<div class="menu-prod-thumb img-${menuEditorImageStatus(r).cls}"><img src="${r.image}" alt=""></div>`
            : `<div class="menu-prod-thumb is-fallback img-fb"><span>${IMAGE_FALLBACKS[r.categoryId] || '🍽️'}</span></div>`;
        const st = menuEditorImageStatus(r);
        const hidden = r.visible === false;
        const nameLine = `${escapeMenuEditor(r.n)}${r.en ? ' <small style="color:var(--coffee-300);">' + escapeMenuEditor(r.en) + '</small>' : ''}`;
        const sub = [r.origin, r.variant, (Array.isArray(r.options) && r.options.length ? r.options.length + ' مقاس' : ''), (r.calories ? r.calories + ' سعرة' : '')].filter(Boolean).join(' · ');
        const priceCell = Array.isArray(r.p) ? r.p.join(' / ') : r.p;
        return `
            <tr class="${hidden ? 'row-hidden' : ''}">
                <td>${thumb}</td>
                <td><div>${nameLine}</div>${sub ? `<div style="color:var(--coffee-300);font-size:0.8rem;">${escapeMenuEditor(sub)}</div>` : ''}</td>
                <td style="font-size:0.85rem;">${escapeMenuEditor(menuEditorCategoryLabel(r.categoryId))}</td>
                <td>${priceCell} ج.م</td>
                <td><span class="img-badge ${st.cls}">${st.label}</span></td>
                <td>${hidden ? 'مخفي' : 'ظاهر'}</td>
                <td class="menu-prod-actions">
                    <button class="admin-btn admin-btn-sm ${hidden ? 'admin-btn-secondary' : 'admin-btn'}" onclick="toggleMenuItemVisibility('${r.categoryId}', ${r.index})" title="${hidden ? 'إظهار' : 'إخفاء'}">${hidden ? '👁 إظهار' : '🙈 إخفاء'}</button>
                    <button class="admin-btn admin-btn-sm admin-btn-primary" onclick="duplicateMenuEditorItem('${r.categoryId}', ${r.index})" title="تكرار الصنف">⧉ تكرار</button>
                    <button class="admin-btn admin-btn-sm admin-btn-secondary" onclick="openMenuEditorItem('${r.categoryId}', ${r.index})">✎ تعديل</button>
                    <button class="admin-btn admin-btn-sm admin-btn-secondary" onclick="openMenuEditorItem('${r.categoryId}', ${r.index}, 'image')">🖼 صورة</button>
                    <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="removeMenuItemImage('${r.categoryId}', ${r.index})">🗑 إزالة صورة</button>
                </td>
            </tr>`;
    }).join('');
}

function openMenuEditorItem(cat, index, focus = '') {
    const item = getPublishedItems(cat, { includeHidden: true })[index];
    if (!item) return;
    _menuFormCtx = { mode: 'edit', cat, index };
    const st = menuEditorImageStatus(item);
    document.getElementById('menuEditorFormWrap').innerHTML = menuEditorForm(item, st, focus);
    document.getElementById('menuEditorFormWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focus === 'image') document.getElementById('menuEditorImageInput')?.click();
}

function menuEditorNewItem() {
    _menuFormCtx = { mode: 'new', cat: 'specialty', index: -1 };
    const placeholder = { n: '', en: '', p: '', d: '', de: '', origin: '', variant: '', image: null, visible: true, options: [], order: '', calories: '', aliases: [] };
    document.getElementById('menuEditorFormWrap').innerHTML = menuEditorForm(placeholder, { label: 'FALLBACK', cls: 'img-fb' }, '');
    document.getElementById('menuEditorFormWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function menuEditorAddOption() {
    const wrap = document.getElementById('menuEditorOptionsWrap');
    if (!wrap) return;
    const idx = wrap.querySelectorAll('.cms-opt-row').length;
    const row = document.createElement('div');
    row.className = 'cms-opt-row';
    row.innerHTML = `<input class="admin-input sm" data-op="ar" placeholder="العربية" style="width:110px;">
        <input class="admin-input sm" data-op="en" placeholder="English" dir="ltr" style="width:100px;">
        <input class="admin-input money" data-op="p" placeholder="85" dir="ltr" style="width:70px;"> ج.م
        <button type="button" class="cms-opt-del" onclick="menuEditorRemoveOption(${idx})" title="حذف المقاس">✕</button>`;
    wrap.appendChild(row);
}

function menuEditorRemoveOption(idx) {
    const wrap = document.getElementById('menuEditorOptionsWrap');
    if (!wrap) return;
    const rows = wrap.querySelectorAll('.cms-opt-row');
    if (!rows[idx]) return;
    rows[idx].remove();
    wrap.querySelectorAll('.cms-opt-row').forEach((r, i) => {
        const btn = r.querySelector('.cms-opt-del');
        if (btn) btn.setAttribute('onclick', `menuEditorRemoveOption(${i})`);
    });
}

function duplicateMenuEditorItem(cat, index) {
    const item = getPublishedItems(cat, { includeHidden: true })[index];
    if (!item) return;
    if (!confirm(`تكرار الصنف «${item.n}» كصنف مضاف جديد؟`)) return;
    const copy = {
        n: (item.n || '') + ' (نسخة)',
        en: item.en,
        p: item.p,
        d: item.d, de: item.de,
        origin: item.origin, variant: item.variant,
        image: item.image || null,
        visible: item.visible !== false,
        options: Array.isArray(item.options) ? item.options.map(o => ({ ...o })) : [],
        order: item.order, calories: item.calories,
        aliases: Array.isArray(item.aliases) ? item.aliases.slice() : []
    };
    LocalMenuRepository.createProduct(copy, cat).then(r => {
        showMenuEditorMessage(r.ok ? '⧉ تم إنشاء نسخة (مسودة محلية).' : '❌ فشل التكرار', !r.ok);
        renderMenuEditor(); refreshMenuStats();
    });
}

function menuEditorForm(item, st, focus) {
    const cats = (typeof getAccessibleCategories === 'function') ? getAccessibleCategories(true) : CATEGORIES;
    const catOpts = cats.map(c => `<option value="${c.id}" ${c.id === (_menuFormCtx ? _menuFormCtx.cat : 'specialty') ? 'selected' : ''}>${escapeMenuEditor(menuEditorCategoryLabel(c.id))}</option>`).join('');
    const priceStr = Array.isArray(item.p) ? item.p.join(' / ') : (item.p || '');
    const options = Array.isArray(item.options) ? item.options : [];
    const aliasesStr = Array.isArray(item.aliases) ? item.aliases.join(', ') : (item.aliases || '');
    const preview = item.image
        ? `<img src="${item.image}" alt="معاينة" style="max-width:160px;max-height:120px;border-radius:10px;border:1px solid rgba(212,168,90,0.4);display:block;">`
        : `<div class="menu-prod-thumb is-fallback img-fb" style="width:160px;height:120px;border-radius:10px;"><span>${IMAGE_FALLBACKS[_menuFormCtx ? _menuFormCtx.cat : 'specialty'] || '🍽️'}</span></div>`;
    return `
        <div class="section-card menu-editor-form">
            <h4>${_menuFormCtx?.mode === 'new' ? '＋ إضافة صنف جديد' : '✎ تعديل الصنف'}</h4>
            <input type="hidden" id="menuEditorMode" value="${_menuFormCtx?.mode || 'new'}">
            <div class="menu-editor-grid">
                <div>
                    <label>اسم الصنف (عربي) *</label>
                    <input id="menuEditorName" class="admin-input full" value="${escapeMenuEditor(item.n || '')}" placeholder="مثال: لاتيه" oninput="if(window.cmsSetFieldError)cmsSetFieldError(this,'')">
                    <label>الاسم بالإنجليزية (اختياري)</label>
                    <input id="menuEditorEnName" class="admin-input full" dir="ltr" value="${escapeMenuEditor(item.en || '')}" placeholder="Latte">
                    <label>الفئة *</label>
                    <select id="menuEditorCategory" class="admin-select full" ${_menuFormCtx?.mode === 'edit' ? 'disabled' : ''}>${catOpts}</select>
                    <label>السعر (ج.م — اكتب "85 / 95" لسعرين)</label>
                    <input id="menuEditorPrice" class="admin-input full" value="${escapeMenuEditor(priceStr)}" placeholder="85 أو 80 / 95">
                    <label>المقاسات / الخيارات (اختياري — تُقَدَّم للزائر بزرّ لكل مقاس)</label>
                    <div id="menuEditorOptionsWrap">
                        ${options.map((op, oi) => `<div class="cms-opt-row">
                            <input class="admin-input sm" data-op="ar" placeholder="العربية" value="${escapeMenuEditor(op.ar || '')}" style="width:110px;">
                            <input class="admin-input sm" data-op="en" placeholder="English" dir="ltr" value="${escapeMenuEditor(op.en || '')}" style="width:100px;">
                            <input class="admin-input money" data-op="p" placeholder="85" dir="ltr" value="${escapeMenuEditor(op.p != null ? op.p : '')}" style="width:70px;"> ج.م
                            <button type="button" class="cms-opt-del" onclick="menuEditorRemoveOption(${oi})" title="حذف المقاس">✕</button>
                        </div>`).join('')}
                    </div>
                    <div class="menu-editor-actions" style="margin-top:6px;"><button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" onclick="menuEditorAddOption()">＋ إضافة مقاس</button></div>
                    <label>الترتيب (اختياري — رقم صغير = أول)</label>
                    <input id="menuEditorOrder" class="admin-input full" type="number" min="0" value="${escapeMenuEditor(item.order ?? '')}" placeholder="0">
                    <label>السعرات (اختياري)</label>
                    <input id="menuEditorCalories" class="admin-input full" dir="ltr" value="${escapeMenuEditor(item.calories || '')}" placeholder="220">
                    <label>أسماء بديلة للبحث (اختياري — مفصولة بفاصلة)</label>
                    <input id="menuEditorAliases" class="admin-input full" dir="ltr" value="${escapeMenuEditor(aliasesStr)}" placeholder="latte, لاتيه">
                    <label>الأصل (اختياري)</label>
                    <input id="menuEditorOrigin" class="admin-input full" value="${escapeMenuEditor(item.origin || '')}" placeholder="مثال: 🇪🇹 إثيوبي">
                    <label>النوع / الخيار (اختياري)</label>
                    <input id="menuEditorVariant" class="admin-input full" value="${escapeMenuEditor(item.variant || '')}" placeholder="مثال: نص / كامل">
                    <label>الوصف (عربي)</label>
                    <textarea id="menuEditorDescription" class="admin-input full" rows="2" placeholder="وصف واضح ومختصر للمنتج">${escapeMenuEditor(item.d || '')}</textarea>
                    <label>الوصف بالإنجليزية (اختياري)</label>
                    <textarea id="menuEditorEnDesc" class="admin-input full" rows="2" dir="ltr" placeholder="Short description">${escapeMenuEditor(item.de || '')}</textarea>
                </div>
                <div>
                    <label>معاينة الصورة</label>
                    <div id="menuEditorPreview">${preview}</div>
                    <div><span class="img-badge ${st.cls}">${st.label}</span></div>
                    <label class="menu-editor-check"><input id="menuEditorNoImage" type="checkbox" ${!item.image ? 'checked' : ''}> لا صورة موثوقة — استخدم fallback</label>
                    <div class="menu-editor-actions">
                        <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="menuEditorChooseImage()">📥 اختيار صورة من الجهاز</button>
                        <input type="file" id="menuEditorImageInput" accept="image/*" style="display:none;" onchange="menuEditorUploadImage(this)">
                        <input id="menuEditorImageUrl" class="admin-input full" dir="ltr" placeholder="أو رابط صورة https://..." value="${escapeMenuEditor(typeof item.image === 'string' && !item.image.startsWith('data:') ? item.image : '')}">
                        <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="menuEditorApplyImageUrl()">تطبيق الرابط</button>
                        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="menuEditorClearImageField()">🗑 إزالة الصورة من الصنف</button>
                    </div>
                    <label class="menu-editor-check"><input id="menuEditorVisible" type="checkbox" ${item.visible !== false ? 'checked' : ''}> مرئي في المنيو العام</label>
                    <div class="menu-editor-actions">
                        <button class="admin-btn admin-btn-primary" onclick="saveMenuEditorItem()">💾 حفظ</button>
                        ${_menuFormCtx?.mode === 'edit' && item.__isCustom ? '<button class="admin-btn admin-btn-danger" onclick="deleteMenuEditorItem()">حذف الصنف المضاف</button>' : ''}
                        ${_menuFormCtx?.mode === 'edit' && !item.__isCustom ? '<button class="admin-btn admin-btn-secondary" onclick="resetMenuEditorItem()">↺ استعادة الأصل</button>' : ''}
                    </div>
                </div>
            </div>
        </div>`;
}

function menuEditorChooseImage() { document.getElementById('menuEditorImageInput').click(); }

function menuEditorUploadImage(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            const MAX = 512;
            const sc = Math.min(1, MAX / Math.max(img.width, img.height));
            const w = Math.max(1, Math.round(img.width * sc));
            const h = Math.max(1, Math.round(img.height * sc));
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = c.toDataURL('image/jpeg', 0.82);
            document.getElementById('menuEditorImageUrl').value = '';
            document.getElementById('menuEditorNoImage').checked = false;
            document.getElementById('menuEditorPreview').innerHTML = `<img src="${dataUrl}" alt="معاينة" style="max-width:160px;max-height:120px;border-radius:10px;border:1px solid rgba(212,168,90,0.4);display:block;">`;
            document.getElementById('menuEditorImageUrl').dataset.pendingImage = dataUrl;
        };
        img.onerror = () => showMenuEditorMessage('تعذّر قراءة الصورة المختارة', true);
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
}

function menuEditorApplyImageUrl() {
    const url = document.getElementById('menuEditorImageUrl').value.trim();
    if (!url) return showMenuEditorMessage('أدخل رابط الصورة أولًا', true);
    document.getElementById('menuEditorNoImage').checked = false;
    delete document.getElementById('menuEditorImageUrl').dataset.pendingImage;
    document.getElementById('menuEditorPreview').innerHTML = `<img src="${url}" alt="معاينة" style="max-width:160px;max-height:120px;border-radius:10px;border:1px solid rgba(212,168,90,0.4);display:block;">`;
    showMenuEditorMessage('تم وضع الرابط — احفظ الصنف لتثبيته');
}

function menuEditorClearImageField() {
    if (!confirm('إزالة الصورة من هذا الصنف؟ سيُستخدم premium fallback وسيُحتفظ بالصنف نفسه.')) return;
    document.getElementById('menuEditorNoImage').checked = true;
    const urlEl = document.getElementById('menuEditorImageUrl');
    urlEl.value = '';
    delete urlEl.dataset.pendingImage;
    document.getElementById('menuEditorPreview').innerHTML = '<div class="menu-prod-thumb is-fallback img-fb" style="width:160px;height:120px;border-radius:10px;"><span>🍽️</span></div>';
}

function collectMenuEditorItem() {
    const nameEl = document.getElementById('menuEditorName');
    const enEl = document.getElementById('menuEditorEnName');
    const priceEl = document.getElementById('menuEditorPrice');
    const catEl = document.getElementById('menuEditorCategory');
    const orderEl = document.getElementById('menuEditorOrder');
    const calEl = document.getElementById('menuEditorCalories');
    const aliEl = document.getElementById('menuEditorAliases');
    const hasCMS = typeof cmsValidateField === 'function';
    let bad = false;
    const setErr = (el, e) => { if (hasCMS) { if (!cmsSetFieldError(el, e)) bad = true; } };
    const name = nameEl ? nameEl.value.trim() : '';
    const en = enEl ? enEl.value.trim() : '';
    if (!hasCMS && !name) { showMenuEditorMessage('اكتب اسم الصنف أولًا.', true); return null; }
    setErr(nameEl, hasCMS ? cmsValidateField('name', name, { en }) : '');
    const rawPrice = priceEl ? priceEl.value.trim() : '';
    let p = null;
    if (hasCMS) {
        const parts = rawPrice.split('/').map(v => v.trim()).filter(Boolean);
        const invalidPart = parts.find(pt => cmsValidateField('price', pt, {}) !== '');
        if (!parts.length) {
            setErr(priceEl, '');
            p = '0';
        } else if (invalidPart) {
            setErr(priceEl, 'سعر غير صحيح');
        } else {
            setErr(priceEl, '');
            p = parts.length > 1 ? parts : parts[0];
        }
    } else {
        p = parseMenuEditorPrice(rawPrice);
    }
    const wrap = document.getElementById('menuEditorOptionsWrap');
    const options = [];
    if (wrap) {
        wrap.querySelectorAll('.cms-opt-row').forEach(row => {
            const oarEl = row.querySelector('[data-op="ar"]');
            const oenEl = row.querySelector('[data-op="en"]');
            const opEl = row.querySelector('[data-op="p"]');
            const oar = oarEl ? oarEl.value.trim() : '';
            const oen = oenEl ? oenEl.value.trim() : '';
            const op = opEl ? opEl.value.trim() : '';
            if (!oar && !oen && !op) return;
            if (!hasCMS) { options.push({ ar: oar, en: oen, p: op || '0' }); return; }
            const labelErr = cmsValidateField('name', oar, { en: oen });
            const priceErr = cmsValidateField('price', op === '' ? '0' : op, {});
            if (labelErr || priceErr) {
                setErr(oarEl, labelErr); setErr(opEl, priceErr);
            } else {
                options.push({ ar: oar, en: oen, p: op === '' ? (Array.isArray(p) ? p[0] : p) || '0' : op });
            }
        });
    }
    const noImage = document.getElementById('menuEditorNoImage').checked;
    const pending = document.getElementById('menuEditorImageUrl')?.dataset?.pendingImage;
    const urlVal = document.getElementById('menuEditorImageUrl').value.trim();
    if (!noImage && urlVal && !pending && hasCMS) {
        setErr(document.getElementById('menuEditorImageUrl'), cmsValidateField('url', urlVal, {}));
    }
    if (hasCMS) {
        const catVal = (catEl && !catEl.disabled) ? catEl.value : (_menuFormCtx ? _menuFormCtx.cat : 'specialty');
        const catIds = (typeof getAccessibleCategories === 'function') ? getAccessibleCategories(true).map(c => c.id) : [];
        setErr(catEl, cmsValidateField('category', catVal, { catIds }));
    }
    if (bad) { showMenuEditorMessage('صحّح الحقول المميزة بالأحمر.', true); return null; }
    if (!p) return null;
    const image = noImage ? null : (pending || urlVal || null);
    const orderRaw = orderEl ? orderEl.value.trim() : '';
    const calRaw = calEl ? calEl.value.trim() : '';
    const aliRaw = aliEl ? aliEl.value.trim() : '';
    const aliases = aliRaw.split(',').map(a => a.trim()).filter(Boolean);
    return {
        n: name,
        en: en || undefined,
        p,
        d: document.getElementById('menuEditorDescription').value.trim() || undefined,
        de: document.getElementById('menuEditorEnDesc').value.trim() || undefined,
        origin: document.getElementById('menuEditorOrigin').value.trim() || undefined,
        variant: document.getElementById('menuEditorVariant').value.trim() || undefined,
        options: options.length ? options : undefined,
        order: orderRaw === '' ? undefined : Number(orderRaw),
        calories: calRaw || undefined,
        aliases: aliases.length ? aliases : undefined,
        image,
        visible: document.getElementById('menuEditorVisible').checked !== false
    };
}

function parseMenuEditorPrice(value) {
    const parts = String(value).split('/').map(v => v.trim()).filter(Boolean);
    return parts.length > 1 ? parts : (parts[0] || '0');
}

function saveMenuEditorItem() {
    const item = collectMenuEditorItem();
    if (!item) return;
    const ctx = _menuFormCtx;
    if (!ctx) return showMenuEditorMessage('لا يوجد صنف قيد التحرير.', true);
    const catInput = document.getElementById('menuEditorCategory');
    const cat = catInput.disabled ? ctx.cat : (catInput.value || ctx.cat);
    if (ctx.mode === 'new') {
        LocalMenuRepository.createProduct(item, cat).then(r => {
            showMenuEditorMessage(r.ok ? '✅ تمت إضافة الصنف (مسودة محلية).' : '❌ فشل الإضافة', !r.ok);
            renderMenuEditor(); refreshMenuStats();
        });
    } else {
        LocalMenuRepository.updateProduct(ctx.cat, ctx.index, item).then(r => {
            showMenuEditorMessage(r.ok ? '✅ تم حفظ التعديل. الآن الأصناف على هذا المتصفح فقط.' : '❌ فشل الحفظ', !r.ok);
            renderMenuEditor(); refreshMenuStats();
        });
    }
}

function resetMenuEditorItem() {
    if (!confirm('استعادة الصنف إلى بياناته الأصلية (حذف التعديل المحلي فقط)؟')) return;
    const ctx = _menuFormCtx;
    if (!ctx) return;
    LocalMenuRepository.resetOverride(ctx.cat, ctx.index).then(() => {
        showMenuEditorMessage('↺ تمت الاستعادة.'); renderMenuEditor(); refreshMenuStats();
    });
}

function deleteMenuEditorItem() {
    const ctx = _menuFormCtx;
    if (!ctx || ctx.mode !== 'edit') return;
    if (!confirm('حذف هذا الصنف المضاف محليًّا؟ (لن يُحذف من بيانات المنيو الأصلية)')) return;
    LocalMenuRepository.deleteCustomProduct(ctx.cat, ctx.index).then(r => {
        showMenuEditorMessage(r.ok ? '🗑️ تم حذف الصنف المضاف.' : 'هذا الصنف أساسي ولا يُحذف.', !r.ok);
        renderMenuEditor(); refreshMenuStats();
    });
}

function toggleMenuItemVisibility(cat, index) {
    const item = getPublishedItems(cat, { includeHidden: true })[index];
    if (!item) return;
    const hidden = item.visible === false;
    LocalMenuRepository.hideProduct(cat, index, !hidden).then(r => {
        if (r.ok) { showMenuEditorMessage(hidden ? '👁 أصبح ظاهرًا.' : '🙈 أصبح مخفيًّا عن المنيو العام.'); }
        renderMenuEditor(); refreshMenuStats();
    });
}

function removeMenuItemImage(cat, index) {
    const item = getPublishedItems(cat, { includeHidden: true })[index];
    if (!item) return;
    if (!confirm(`إزالة صورة "${item.n}"؟ سيُستخدم fallback والصنف نفسه باقٍ.`)) return;
    LocalMenuRepository.removeImage(cat, index).then(r => {
        showMenuEditorMessage(r.ok ? '🗑️ أُزيلت الصورة — fallback قيد الاستخدام.' : '❌ فشل الإزالة', !r.ok);
        renderMenuEditor(); refreshMenuStats();
    });
}

function resetMenuEditor() {
    if (!confirm('استعادة بيانات المنيو الأصلية وحذف كل التعديلات المحلية (الأسعار والأسماء والصور والإخفاء)؟')) return;
    localStorage.removeItem(MENU_EDITOR_STORAGE_KEY);
    renderMenuEditor(); refreshMenuStats();
    showMenuEditorMessage('↺ تمت الاستعادة إلى البيانات الأصلية.');
}

function showMenuEditorMessage(message, error = false) {
    const el = document.getElementById('menuEditorMessage');
    if (el) { el.textContent = message; el.style.color = error ? '#f08b78' : 'var(--gold)'; }
}
