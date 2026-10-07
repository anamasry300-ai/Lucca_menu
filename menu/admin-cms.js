// ==================== Lucca Menu CMS ====================
// Enable: menu categories management, images inventory, location & contact,
// settings, preview, draft/review/publish pipeline and shared validation.
// Everything stays browser-local (localStorage) — never touches menu-data.js.

const CMS_LOCATION_KEY = 'lucca-menu-location-v1';
const CMS_CATEGORIES_KEY = 'lucca-menu-categories-v1';
const CMS_SETTINGS_KEY = 'lucca-menu-settings-v1';
const CMS_PUBLISH_KEY = 'lucca-menu-publish-v1';

// Register of the owner's 12 real photos (in OneDrive\Pictures). Listed for
// awareness only — NEVER auto-connect. Manual linking happens later if the owner asks.
const OWNER_PHOTO_UNVERIFIED = [
    'V60.png', 'لاتيه.png', 'اسبيريسو دابل.png', 'ايس دريب.png', 'قهوة اليوم.png', 'قهوة بندق.png',
    'قهوة تركي.png', 'قهوة فرنساوي.png', 'ميكاتو.png', 'نسكافيه.png', 'وايت موكا.png', 'هوت شوكليت.png'
];

function cmsJsonGet(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch (_) { return fallback; }
}
function cmsJsonSet(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* ignore */ } }
function escapeCms(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch])); }
function cmsToast(msg, err) { if (typeof showAdminToast === 'function') showAdminToast((err ? '❌ ' : '✅ ') + msg); }

// ==================== Validation (Phase 9) ====================
function cmsValidateField(field, value, ctx) {
    const v = (value === null || value === undefined) ? '' : String(value).trim();
    const c = ctx || {};
    switch (field) {
        case 'name':
            if (!v && !String(c.en || '').trim()) return 'الاسم مطلوب (عربي أو إنجليزي)';
            if (v.length > 80) return 'الاسم طويل جدًا (حد أقصى 80 حرفًا)';
            return '';
        case 'price':
            if (v === '') return 'السعر مطلوب';
            if (!Number.isFinite(Number(v))) return 'سعر غير صحيح';
            if (Number(v) < 0) return 'لا يمكن أن يكون السعر سالبًا';
            return '';
        case 'category': {
            const ids = (c.catIds || []).map(x => String(x));
            if (!ids.includes(String(value))) return 'فئة غير صحيحة';
            return '';
        }
        case 'url':
            if (!v) return '';
            if (!/^https?:\/\//i.test(v)) return 'اكتب الرابط كاملًا (https://...)';
            return '';
        case 'phone': {
            if (!v) return '';
            const digits = v.replace(/\D/g, '');
            if (digits.length < 7) return 'رقم قصير جدًا (غير إلزامي)';
            return '';
        }
        case 'lat':
            if (v === '') return '';
            if (!Number.isFinite(Number(v)) || Number(v) < -90 || Number(v) > 90) return 'خط العرض بين -90 و 90';
            return '';
        case 'lng':
            if (v === '') return '';
            if (!Number.isFinite(Number(v)) || Number(v) < -180 || Number(v) > 180) return 'خط الطول بين -180 و 180';
            return '';
        case 'time':
            if (v === '') return '';
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v) && v !== '24:00') return 'وقت غير صحيح (HH:MM)';
            return '';
        case 'categoryId':
            if (!v) return 'المعرّف (slug) مطلوب';
            if (!/^[a-z][a-z0-9-]*$/.test(v)) return 'حروف لاتينية صغيرة وأرقام وشرطة فقط';
            if ((c.existing || []).includes(v)) return 'هذا المعرّف مستخدم بالفعل';
            return '';
        case 'icon':
            if (v.length > 6) return 'أيقونة قصيرة (إيموجي) فقط';
            return '';
    }
    return '';
}

function cmsSetFieldError(input, err) {
    if (!input) return;
    input.classList.remove('valid');
    input.classList.toggle('invalid', !!err);
    let box = input.parentElement ? input.parentElement.querySelector('.field-error') : null;
    if (!box) {
        box = document.createElement('div');
        box.className = 'field-error';
        const after = input.nextElementSibling && input.nextElementSibling.classList && input.nextElementSibling.classList.contains('cms-hint') ? input.nextElementSibling : input;
        after.insertAdjacentElement('afterend', box);
    }
    box.textContent = err || '';
    return !err;
}

function cmsValidateInput(input, rule, ctx) {
    const err = cmsValidateField(rule, input ? input.value : '', ctx || {});
    return cmsSetFieldError(input, err);
}

// ==================== Categories (Phase 4) ====================
function readCategoryOverrides() {
    const list = cmsJsonGet(CMS_CATEGORIES_KEY, []);
    return Array.isArray(list) ? list : [];
}
function writeCategoryOverrides(list) { cmsJsonSet(CMS_CATEGORIES_KEY, list); }
function baseCategoryIndex(id) {
    const i = CATEGORIES.findIndex(c => c.id === id);
    return i >= 0 ? i : 1000;
}
function baseCategoryName(id) { return (_LANG.catNames.ar && _LANG.catNames.ar[id]) || id; }

function getAccessibleCategories(includeHidden) {
    const overrides = readCategoryOverrides();
    const byId = {};
    let i = 0;
    CATEGORIES.forEach(c => { byId[c.id] = { id: c.id, icon: c.icon, name: () => c.name(), ar: '', en: '', order: i++, hidden: false, custom: false }; });
    overrides.forEach(o => {
        const existing = byId[o.id];
        if (existing) {
            existing.hidden = !!o.hidden;
            if (o.order !== undefined) { existing.order = o.order; }
            if (o.icon) existing.icon = o.icon;
            if (o.ar || o.en) {
                const ar = o.ar || existing.name();
                const en = o.en || ar;
                existing.name = () => (lang === 'en' ? en : ar);
                existing.ar = ar; existing.en = en;
            }
        } else {
            byId[o.id] = {
                id: o.id, icon: o.icon || '🆕',
                name: () => (lang === 'en' ? (o.en || o.ar || o.id) : (o.ar || o.id)),
                ar: o.ar || '', en: o.en || '', order: (o.order !== undefined ? o.order : 1000),
                hidden: !!o.hidden, custom: true
            };
        }
    });
    let list = Object.values(byId);
    list.sort((a, b) => (a.order - b.order));
    if (!includeHidden) list = list.filter(c => !c.hidden);
    return list;
}

let _catWorking = null;
function categoryCmsRows() {
    if (!_catWorking) _catWorking = getAccessibleCategories(true).map(c => ({
        id: c.id, icon: c.icon, ar: c.ar || baseCategoryName(c.id), en: c.en || '', hidden: !!c.hidden, custom: !!c.custom, order: c.order
    }));
    return _catWorking;
}

function renderCategoryCms() {
    const root = document.getElementById('cms-categories-root');
    if (!root) return;
    const rows = categoryCmsRows();
    const customId = '_cat_new';
    const ic = (typeof cmsIconStr === 'function') ? cmsIconStr : () => '';
    const counts = {};
    getAccessibleCategories(true).forEach(c => {
        counts[c.id] = getPublishedItems(c.id, { includeHidden: true }).length;
    });
    root.innerHTML = `
        <div class="cms-sec-head">
            <div>
                <h3>${ic('folder', 'cms-ic-lg')} إدارة الفئات</h3>
                <p>إظهار، إخفاء، إعادة ترتيب، وتعديل الأسماء (عربي/إنجليزي). الفئات الأساسية تُختبأ ولا تُحذف؛ الفئات المضافة يمكن حذفها.</p>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="categoryCmsReset()">↺ استعادة الأصل</button>
                <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="categoryCmsSave()">${ic('save', 'cms-ic-sm')} حفظ الفئات</button>
            </div>
        </div>
        <div class="section-card">
            <h4>＋ إضافة فئة جديدة</h4>
            <div class="row" style="margin-bottom:0;">
                <input class="admin-input sm" id="${customId}_id" placeholder="id: snacks" oninput="cmsSetFieldError(this,'')">
                <input class="admin-input md" id="${customId}_ar" placeholder="الاسم بالعربية: سناكس">
                <input class="admin-input md" id="${customId}_en" placeholder="English: Snacks">
                <input class="admin-input sm" id="${customId}_icon" placeholder="🆕" style="width:70px;">
                <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="categoryCmsAdd()">＋ إضافة</button>
            </div>
            <div class="cms-hint">المعرّف: حروف إنجليزية صغيرة/أرقام/شرطة ولا يُكرَّر. الأصناف تُدار من تبويب «المنتجات».</div>
        </div>
        ${rows.map((r, idx) => `
        <div class="section-card" style="padding:10px 14px;${r.hidden ? 'opacity:.7;' : ''}">
            <div class="cat-row" style="margin:0;">
                ${r.custom
                    ? `<input class="admin-input sm" data-f="icon" data-i="${idx}" value="${escapeCms(r.icon)}" style="width:70px;" title="أيقونة (إيموجي)">`
                    : `<span class="cat-icon">${r.icon}</span>`}
                <input class="admin-input md" data-f="ar" data-i="${idx}" value="${escapeCms(r.ar)}" placeholder="العربية" style="flex:1;min-width:110px;">
                <input class="admin-input md" data-f="en" data-i="${idx}" value="${escapeCms(r.en)}" placeholder="English" style="flex:1;min-width:110px;" dir="ltr">
                <span class="cat-count-chip">${ic('cube')} ${counts[r.id] || 0} صنف</span>
                <label class="menu-editor-check" style="min-width:92px;"><input type="checkbox" data-f="hidden" data-i="${idx}" ${r.hidden ? 'checked' : ''}> مخفية</label>
                <div class="cat-actions">
                    <button class="admin-btn admin-btn-icon" title="تحريك لأعلى" onclick="categoryCmsMove(${idx}, -1)">▲</button>
                    <button class="admin-btn admin-btn-icon" title="تحريك لأسفل" onclick="categoryCmsMove(${idx}, 1)">▼</button>
                    ${r.custom ? `<button class="admin-btn admin-btn-icon" title="حذف الفئة" onclick="categoryCmsDelete('${r.id}')">🗑️</button>` : `<span class="cms-count-chip">أساسية</span>`}
                </div>
            </div>
        </div>`).join('') || '<div class="admin-empty">لا توجد فئات</div>'}`;
}

function categoryCmsAdd() {
    const id = document.getElementById('_cat_new_id').value.trim();
    const ar = document.getElementById('_cat_new_ar').value.trim();
    const en = document.getElementById('_cat_new_en').value.trim();
    const icon = document.getElementById('_cat_new_icon').value.trim();
    const existing = categoryCmsRows().map(r => r.id);
    const nameErr = cmsValidateField('categoryId', id, { existing });
    const arErr = cmsValidateField('name', ar, { en });
    const iconErr = cmsValidateField('icon', icon, {});
    if (nameErr || arErr || iconErr) {
        cmsSetFieldError(document.getElementById('_cat_new_id'), nameErr);
        cmsSetFieldError(document.getElementById('_cat_new_ar'), arErr);
        cmsSetFieldError(document.getElementById('_cat_new_icon'), iconErr);
        cmsToast(nameErr || arErr || iconErr, true);
        return;
    }
    const last = categoryCmsRows();
    const order = last.length ? Math.max(...last.map(r => r.order)) + 1 : 1000;
    _catWorking.push({ id, icon: icon || '🆕', ar, en, hidden: false, custom: true, order });
    renderCategoryCms();
    cmsToast('أُضيفت الفئة — احفظ الآن');
}

function categoryCmsSave() {
    const rows = categoryCmsRows();
    const out = [];
    let hasError = false;
    const prevOverrides = readCategoryOverrides();
    rows.forEach((r, idx) => {
        const newOrder = idx;
        const baseIdx = baseCategoryIndex(r.id);
        const baseAr = baseCategoryName(r.id);
        if (!r.custom) {
            const patch = {};
            const read = (f) => { const el = document.querySelector(`[data-f="${f}"][data-i="${idx}"]`); return el ? el.value : null; };
            const hid = document.querySelector(`[data-f="hidden"][data-i="${idx}"]`);
            const prevOv = prevOverrides.find(o => o.id === r.id);
            const ar = read('ar');
            const en = read('en');
            const hidden = !!(hid && hid.checked);
            if (newOrder !== baseIdx) patch.order = newOrder;
            if (hidden) patch.hidden = true;
            if (ar && ar !== baseAr) patch.ar = ar;
            if (en && en !== '') patch.en = en;
            if (prevOv && prevOv.icon) patch.icon = prevOv.icon;
            patch.id = r.id;
            if (Object.keys(patch).length > 1) out.push(patch);
        } else {
            const ic = document.querySelector(`[data-f="icon"][data-i="${idx}"]`);
            const ar = document.querySelector(`[data-f="ar"][data-i="${idx}"]`);
            const en = document.querySelector(`[data-f="en"][data-i="${idx}"]`);
            const hid = document.querySelector(`[data-f="hidden"][data-i="${idx}"]`);
            const eAr = cmsValidateField('name', ar ? ar.value : '', { en: en ? en.value : '' });
            if (eAr) { cmsSetFieldError(ar, eAr); hasError = true; return; }
            out.push({
                id: r.id,
                icon: (ic ? ic.value : '') || '🆕',
                ar: (ar ? ar.value : '').trim(),
                en: (en ? en.value : '').trim(),
                hidden: !!(hid && hid.checked),
                order: idx
            });
        }
    });
    if (hasError) { cmsToast('اسم الفئة مطلوب (عربي أو إنجليزي)', true); return; }
    writeCategoryOverrides(out.filter(o => o.id));
    _catWorking = null;
    renderCategoryCms();
    if (typeof refreshMenuStats === 'function') refreshMenuStats();
    if (typeof updateAdminStatus === 'function') updateAdminStatus();
    if (typeof renderInfoStrip === 'function') renderInfoStrip();
    cmsToast('تم حفظ الفئات');
}

function categoryCmsMove(idx, dir) {
    const rows = categoryCmsRows();
    const target = idx + dir;
    if (target < 0 || target >= rows.length) return;
    const a = rows[idx], b = rows[target];
    const tmp = a.order; a.order = b.order; b.order = tmp;
    _catWorking.sort((x, y) => x.order - y.order);
    renderCategoryCms();
}

function categoryCmsDelete(id) {
    if (!confirm(`حذف الفئة «${id}»؟ (تُحذف من القائمة، والأصناف المضافَة لها على هذا المتصفح أيضًا)`)) return;
    _catWorking = categoryCmsRows().filter(r => r.id !== id);
    const ov = readCategoryOverrides().filter(o => o.id !== id);
    writeCategoryOverrides(ov);
    renderCategoryCms();
    if (typeof refreshMenuStats === 'function') refreshMenuStats();
    cmsToast('حُذفت الفئة المضافة');
}

function categoryCmsReset() {
    if (!confirm('استعادة الفئات الأصلية (إخفاء، ترتيب، أسماء، فئات مضافة)؟ هذا لا يمس الأصناف.')) return;
    localStorage.removeItem(CMS_CATEGORIES_KEY);
    _catWorking = null;
    renderCategoryCms();
    if (typeof refreshMenuStats === 'function') refreshMenuStats();
    if (typeof updateAdminStatus === 'function') updateAdminStatus();
    cmsToast('استُعيدت الفئات الأصلية');
}

// ==================== Images (Phase 5) ====================
function computeImageInventory() {
    const strong = [], verified = [], link = [], fallback = [];
    getAccessibleCategories(true).forEach(c => {
        getPublishedItems(c.id, { includeHidden: true }).forEach(item => {
            const key = item.__sourceKey || menuItemKey(c.id, item.n);
            if (!item.image) { fallback.push({ item, category: c }); return; }
            if (CURATED_PRODUCT_IMAGES[key] === item.image) strong.push({ item, category: c });
            else if (typeof item.image === 'string' && item.image.startsWith('data:')) verified.push({ item, category: c });
            else link.push({ item, category: c });
        });
    });
    return { strong, verified, link, fallback, unverified: OWNER_PHOTO_UNVERIFIED, misleading: 0 };
}

function renderImagesCms() {
    const root = document.getElementById('cms-images-root');
    if (!root) return;
    const inv = computeImageInventory();
    const usedCount = inv.strong.length + inv.verified.length + inv.link.length;
    const ic = (typeof cmsIconStr === 'function') ? cmsIconStr : () => '';
    const usedItems = inv.strong.map(r => ['STRONG', 'img-strong', r])
        .concat(inv.verified.map(r => ['VERIFIED', 'img-verified', r]))
        .concat(inv.link.map(r => ['LINK', 'img-link', r]));
    const gridTiles = usedItems.map(([label, cls, r]) => `
        <div class="image-tile">
            <div class="tile-thumb"><img src="${escapeCms(r.item.image)}" alt="" loading="lazy"></div>
            <div class="tile-meta">
                <div class="tile-name">${escapeCms(r.item.n)}</div>
                <div class="tile-file">${escapeCms(r.category.id)}</div>
                <div class="tile-status"><span class="img-badge ${cls}">${label}</span></div>
            </div>
        </div>`).join('');
    const fbTiles = inv.fallback.slice(0, 8).map(r => `
        <div class="image-tile">
            <div class="tile-thumb tile-fb"><span>${r.category.icon || '☕'}</span></div>
            <div class="tile-meta">
                <div class="tile-name">${escapeCms(r.item.n)}</div>
                <div class="tile-file">—</div>
                <div class="tile-status"><span class="img-badge img-fb">FALLBACK</span></div>
            </div>
        </div>`).join('');
    const unvTiles = inv.unverified.map(f => `
        <div class="image-tile">
            <div class="tile-thumb tile-fb"><span>?</span></div>
            <div class="tile-meta">
                <div class="tile-name">غير موصولة</div>
                <div class="tile-file">${escapeCms(f)}</div>
                <div class="tile-status"><span class="img-badge img-unverified">UNVERIFIED</span></div>
            </div>
        </div>`).join('');
    root.innerHTML = `
        <div class="cms-sec-head">
            <div>
                <h3>${ic('image', 'cms-ic-lg')} جرد الصور</h3>
                <p>قائمة اشتقاقية لحالة صور الأصناف. لا يُربط أي شيء تلقائيًا — الصور الحقيقية غير المؤكدة تنتظر ربطًا يدويًّا لاحقًا.</p>
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card"><div class="val">${usedCount}</div><div class="lbl">مستخدمة</div></div>
            <div class="stat-card"><div class="val">${inv.strong.length}</div><div class="lbl"><span class="img-badge img-strong">STRONG</span></div></div>
            <div class="stat-card"><div class="val">${inv.verified.length}</div><div class="lbl"><span class="img-badge img-verified">VERIFIED</span></div></div>
            <div class="stat-card"><div class="val">${inv.link.length}</div><div class="lbl"><span class="img-badge img-link">LINK</span></div></div>
            <div class="stat-card"><div class="val">${inv.fallback.length}</div><div class="lbl"><span class="img-badge img-fb">FALLBACK</span></div></div>
            <div class="stat-card"><div class="val">${inv.unverified.length}</div><div class="lbl"><span class="img-badge img-unverified">UNVERIFIED</span></div></div>
            <div class="stat-card"><div class="val">${inv.misleading}</div><div class="lbl">مضللة</div></div>
        </div>
        <div class="cms-sec-head" style="margin-top:6px;"><div><h3 style="font-size:.95rem;">${ic('phone', 'cms-ic-sm')} معرض الصور</h3></div></div>
        <div class="images-grid">${gridTiles}${fbTiles}${unvTiles}</div>
        <div class="section-card">
            <h4>مستخدمة (${usedCount})</h4>
            <div class="admin-table-wrap"><table class="admin-table">
                <thead><tr><th>الصورة</th><th>الصنف</th><th>الفئة</th><th>الحالة</th></tr></thead>
                <tbody id="imagesUsedBody"></tbody>
            </table></div>
        </div>
        <div class="section-card">
            <h4>بدون صورة — Premium Fallback (${inv.fallback.length})</h4>
            <div class="cms-hint">تظهر هذه الأصناف بأيقونة + حرف أول؛ لا تخمين ولا صور مشتقة.</div>
        </div>
        <div class="section-card">
            <h4>الصور الحقيقية غير المؤكدة (${inv.unverified.length}) — غير موصولة</h4>
            <p style="color:var(--coffee-300);font-size:.85rem;margin:0 0 10px;">الصور موجودة لدى المالك في <code>OneDrive\\Pictures</code>؛ لا يمكن للنظام التأكد بصريًّا من مطابقتها، لذا تبقى معرّفة بلا ربط تلقائي.</p>
            <div class="admin-table-wrap"><table class="admin-table">
                <thead><tr><th>الملف</th><th>الحالة</th></tr></thead>
                <tbody>${inv.unverified.map(f => `<tr><td dir="ltr">${escapeCms(f)}</td><td><span class="img-badge img-unverified">UNVERIFIED · ربط يدوي لاحقًا</span></td></tr>`).join('')}</tbody>
            </table></div>
        </div>`;
    const usedBody = document.getElementById('imagesUsedBody');
    usedBody.innerHTML = usedItems.length ? usedItems.map(([label, cls, r]) => `
        <tr>
            <td><div class="menu-prod-thumb" style="width:44px;height:44px;"><img src="${escapeCms(r.item.image)}" alt="" loading="lazy"></div></td>
            <td>${escapeCms(r.item.n)}</td>
            <td style="font-size:.85rem;">${escapeCms(r.category.name())}</td>
            <td><span class="img-badge ${cls}">${label}</span></td>
        </tr>`).join('') : '<tr class="empty"><td colspan="4">لا توجد صور مستخدمة</td></tr>';
}

// ==================== Location & Contact (Phase 6) ====================
function readLocation() { return cmsJsonGet(CMS_LOCATION_KEY, {}); }
function writeLocation(loc) { cmsJsonSet(CMS_LOCATION_KEY, loc); }
const CMS_DAY_KEYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
const CMS_DAY_NAMES_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const CMS_DAY_NAMES_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function renderLocationCms() {
    const root = document.getElementById('cms-location-root');
    if (!root) return;
    const loc = readLocation();
    const ic = (typeof cmsIconStr === 'function') ? cmsIconStr : () => '';
    const hoursRows = CMS_DAY_KEYS.map((k, i) => {
        const h = (loc.hours || {})[k] || {};
        return `<div class="hours-row">
            <span class="day-label">${CMS_DAY_NAMES_AR[i]}</span>
            <label class="menu-editor-check" style="min-width:74px;"><input type="checkbox" data-day="${k}" ${h.open ? 'checked' : ''}> مفتوح</label>
            <input type="time" data-day="${k}" data-f="from" class="admin-input sm" value="${escapeCms(h.from || '')}">
            <span style="color:var(--coffee-300);">—</span>
            <input type="time" data-day="${k}" data-f="to" class="admin-input sm" value="${escapeCms(h.to || '')}">
        </div>`; }).join('');
    root.innerHTML = `
        <div class="cms-sec-head">
            <div>
                <h3>${ic('map', 'cms-ic-lg')} الموقع والتواصل</h3>
                <p>تُحفظ محليًّا وتُعرض للزوار إن وُجدت. بلا Google Maps API — نستعمل الرابط والإحداثيات فقط.</p>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="locationMapsTest()">🗺 افتح في Google Maps</button>
                <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="saveLocationCms()">${ic('save', 'cms-ic-sm')} حفظ</button>
            </div>
        </div>
        <div class="section-card" id="locPreviewCard" style="display:${Object.keys(loc).length ? 'block' : 'none'};"></div>
        <div class="loc-cards">
            <div class="section-card">
                <h4>${ic('file', 'cms-ic-sm')} بيانات الفرع</h4>
                <label>اسم الفرع</label>
                <input id="loc_branch" class="admin-input full" value="${escapeCms(loc.branch || '')}" placeholder="Lucca — Hub Cafe">
                <label>العنوان (عربي)</label>
                <input id="loc_addr_ar" class="admin-input full" value="${escapeCms(loc.addressAr || '')}" placeholder="شارع محمد علي - بورسعيد">
                <label>العنوان (إنجليزي)</label>
                <input id="loc_addr_en" class="admin-input full" dir="ltr" value="${escapeCms(loc.addressEn || '')}" placeholder="Mohamed Ali St, Port Said">
                <label>رابط Google Maps</label>
                <input id="loc_maps_url" class="admin-input full" dir="ltr" value="${escapeCms(loc.mapsUrl || '')}" placeholder="https://maps.app.goo.gl/...">
                <div class="cms-hint">اختياري؛ إن تُرك فارغًا نستعمل البحث عن العنوان.</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div><label>خط العرض</label>
                    <input id="loc_lat" class="admin-input full" dir="ltr" value="${escapeCms(loc.lat ?? '')}" placeholder="31.25"></div>
                    <div><label>خط الطول</label>
                    <input id="loc_lng" class="admin-input full" dir="ltr" value="${escapeCms(loc.lng ?? '')}" placeholder="32.28"></div>
                </div>
            </div>
            <div class="section-card">
                <h4>${ic('phone', 'cms-ic-sm')} التواصل</h4>
                <label>الهاتف (اختياري)</label>
                <input id="loc_phone" class="admin-input full" dir="ltr" value="${escapeCms(loc.phone || '')}" placeholder="+20 10 10058989">
                <label>واتساب (رقم دولي بدون +)</label>
                <input id="loc_wa" class="admin-input full" dir="ltr" value="${escapeCms(loc.whatsapp || '')}" placeholder="201010058989">
                <label>إنستجرام (اختياري)</label>
                <input id="loc_ig" class="admin-input full" dir="ltr" value="${escapeCms(loc.instagram || '')}" placeholder="@lucca.cafe أو https://...">
                <div class="cms-hint">تُعرض هذه البيانات للزوار في شريط التواصل أعلى المنيو.</div>
            </div>
            <div class="section-card" style="grid-column:1/-1;">
                <h4>${ic('clock', 'cms-ic-sm')} ساعات العمل (السبت → الجمعة)</h4>
                <div class="hours-wrap">${hoursRows}</div>
                <div class="cms-hint">اترك «مفتوح» غير مفعّل وأوقات فارغة للأيام المغلقة.</div>
            </div>
        </div>`;
    locationPreviewUpdate();
}

function locationPreviewUpdate() {
    const card = document.getElementById('locPreviewCard');
    if (!card) return;
    const loc = buildLocationFromForm();
    const hasData = !!(loc.addressAr || loc.addressEn || loc.branch || loc.phone || loc.whatsapp || loc.instagram || Object.keys(loc.hours || {}).length);
    card.style.display = hasData ? 'block' : 'none';
    if (!hasData) { card.innerHTML = ''; return; }
    const addr = loc.addressAr || loc.addressEn || '';
    const hoursLine = CMS_DAY_KEYS.filter(k => (loc.hours || {})[k] && (loc.hours)[k].open).slice(0, 3);
    const hoursText = hoursLine.length ? hoursLine.map(k => `${CMS_DAY_NAMES_AR[CMS_DAY_KEYS.indexOf(k)]} ${(loc.hours)[k].from}–${(loc.hours)[k].to}`).join(' · ') : '';
    card.innerHTML = `
        <h4>معاينة كتلة التواصل</h4>
        <div class="loc-preview">
            <div class="branch">${escapeCms(loc.branch || 'Lucca — Hub Cafe')}</div>
            ${addr ? `<div class="addr">📍 ${escapeCms(addr)}</div>` : ''}
            ${hoursText ? `<div class="addr" style="margin-top:6px;">🕐 ${escapeCms(hoursText)}</div>` : ''}
            <div class="meta">
                ${loc.phone ? `<span>📞 ${escapeCms(loc.phone)}</span>` : ''}
                ${loc.whatsapp ? `<span>💬 ${escapeCms(loc.whatsapp)}</span>` : ''}
                ${loc.instagram ? `<span>📷 ${escapeCms(loc.instagram)}</span>` : ''}
                ${loc.lat !== '' && loc.lng !== '' ? `<span>🧭 ${escapeCms(loc.lat)}, ${escapeCms(loc.lng)}</span>` : ''}
            </div>
        </div>`;
}

function buildLocationFromForm() {
    const g = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const hours = {};
    CMS_DAY_KEYS.forEach(k => {
        const openEl = document.querySelector(`[data-day="${k}"]`);
        const fromEl = document.querySelector(`[data-day="${k}"][data-f="from"]`);
        const toEl = document.querySelector(`[data-day="${k}"][data-f="to"]`);
        const open = !!(openEl && openEl.checked);
        if (open) hours[k] = { open: true, from: fromEl ? fromEl.value : '', to: toEl ? toEl.value : '' };
        else hours[k] = { open: false, from: '', to: '' };
    });
    return {
        branch: g('loc_branch'), addressAr: g('loc_addr_ar'), addressEn: g('loc_addr_en'),
        mapsUrl: g('loc_maps_url'), lat: g('loc_lat'), lng: g('loc_lng'),
        phone: g('loc_phone'), whatsapp: g('loc_wa'), instagram: g('loc_ig'), hours
    };
}

function saveLocationCms() {
    const loc = buildLocationFromForm();
    const checks = [
        ['url', 'loc_maps_url', 'url'],
        ['phone', 'loc_phone', 'phone'],
        ['lat', 'loc_lat', 'lat'],
        ['lng', 'loc_lng', 'lng']
    ];
    let bad = 0;
    checks.forEach(([, id, rule]) => {
        const el = document.getElementById(id);
        if (!cmsValidateInput(el, rule, {})) bad++;
    });
    let timeBad = 0;
    CMS_DAY_KEYS.forEach(k => {
        const h = loc.hours[k];
        if (!h.open) return;
        if (cmsValidateField('time', h.from, {}) || cmsValidateField('time', h.to, {})) timeBad++;
    });
    if (bad || timeBad) { cmsToast('صحّح الأخطاء أولًا', true); return; }
    writeLocation(loc);
    renderLocationCms();
    if (typeof renderInfoStrip === 'function') renderInfoStrip();
    if (typeof updateAdminStatus === 'function') updateAdminStatus();
    cmsToast('حُفظت بيانات الموقع والتواصل');
}

function locationMapsTest() {
    const loc = readLocation();
    const addr = loc.addressAr || loc.addressEn;
    let url = loc.mapsUrl;
    if (!url && addr) url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr);
    if (!url) { cmsToast('احفظ عنوانًا أو رابطًا أولًا', true); return; }
    window.open(url, '_blank');
}

// ==================== Public info-strip (Phase 7) ====================
function buildHoursMarkup(hours, en) {
    if (!hours) return '';
    const names = en ? CMS_DAY_NAMES_EN : CMS_DAY_NAMES_AR;
    const parts = [];
    CMS_DAY_KEYS.forEach((k, i) => {
        const h = hours[k];
        if (!h) return;
        const val = !h.open ? (en ? 'Closed' : 'مغلق')
            : (h.from || h.to) ? `${h.from || ''} – ${h.to || ''}`
            : (en ? 'Open' : 'مفتوح');
        parts.push(`<span><b>${names[i]}</b> ${val}</span>`);
    });
    return parts.join(' · ');
}

function getContactWhatsapp() {
    const loc = readLocation();
    if (loc.whatsapp) { const d = String(loc.whatsapp).replace(/\D/g, ''); if (d) return d; }
    const s = cmsJsonGet(CMS_SETTINGS_KEY, {});
    if (s.whatsapp) { const d = String(s.whatsapp).replace(/\D/g, ''); if (d) return d; }
    return '201010058989';
}

function renderInfoStrip() {
    const strip = document.getElementById('infoStrip');
    if (!strip) return;
    const loc = readLocation();
    const hasData = loc && (loc.branch || loc.addressAr || loc.addressEn || loc.mapsUrl || loc.phone || loc.whatsapp || loc.instagram || Object.keys(loc.hours || {}).length);
    if (!hasData) { strip.style.display = 'none'; strip.innerHTML = ''; return; }
    const en = lang === 'en';
    const branch = loc.branch || 'Lucca Café';
    const addr = en ? (loc.addressEn || loc.addressAr || '') : (loc.addressAr || loc.addressEn || '');
    const hoursMarkup = buildHoursMarkup((loc && loc.hours) || {}, en);
    let mapsUrl = loc.mapsUrl || '';
    if (!mapsUrl && addr) mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr);
    const phoneTel = loc.phone ? 'tel:' + String(loc.phone).replace(/[^+\d]/g, '') : '';
    const wa = getContactWhatsapp();
    const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(en ? 'Hello Lucca ☕' : 'مرحباً لوكا ☕')}` : '';
    const igRaw = loc.instagram || '';
    const igHref = igRaw ? (igRaw.startsWith('http') ? igRaw : 'https://instagram.com/' + igRaw.replace(/^@/, '')) : '';
    strip.innerHTML = `
        <div class="is-branch">${escapeCms(branch)}</div>
        ${addr ? `<div class="is-addr">📍 ${escapeCms(addr)}</div>` : ''}
        ${hoursMarkup ? `<div class="is-hours">🕐 ${hoursMarkup}</div>` : ''}
        <div class="is-actions">
            ${mapsUrl ? `<a class="is-btn is-gold" href="${escapeCms(mapsUrl)}" target="_blank" rel="noopener">📍 ${en ? 'Open in Maps' : 'فتح في الخرائط'}</a>` : ''}
            ${phoneTel ? `<a class="is-btn" href="${phoneTel}">📞 ${en ? 'Call' : 'اتصال'}</a>` : ''}
            ${waHref ? `<a class="is-btn" href="${waHref}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ''}
            ${igHref ? `<a class="is-btn" href="${igHref}" target="_blank" rel="noopener">📷 Instagram</a>` : ''}
        </div>`;
    strip.style.display = 'block';
    strip.classList.toggle('is-ltr', !!en && !!(addr || hoursMarkup));
}

function openPublicPreview() {
    const url = (window.location.href || '').split('?')[0];
    window.open(url, '_blank');
}

// ==================== Settings (Phase 6/2) ====================
function readSettings() { return cmsJsonGet(CMS_SETTINGS_KEY, {}); }
function writeSettings(s) { cmsJsonSet(CMS_SETTINGS_KEY, s); }

function renderSettingsCms() {
    const root = document.getElementById('cms-settings-root');
    if (!root) return;
    const s = readSettings();
    const ic = (typeof cmsIconStr === 'function') ? cmsIconStr : () => '';
    const inv = computeImageInventory();
    const usedCount = inv.strong.length + inv.verified.length + inv.link.length;
    root.innerHTML = `
        <div class="cms-sec-head">
            <div>
                <h3>${ic('sliders', 'cms-ic-lg')} الإعدادات</h3>
                <p>إعدادات المنيو المحلية (Draft) — جزء من بيانات النشر على هذا المتصفح.</p>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="cmsExportBackup()">📤 تصدير نسخة احتياطية</button>
                <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="document.getElementById('cms-import-file').click()">📥 استيراد</button>
                <input type="file" id="cms-import-file" style="display:none;" accept=".json" onchange="cmsImportBackup(this)">
                <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="cmsResetAll()">↺ مسح التعديلات المحلية</button>
                <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="saveSettingsCms()">${ic('save', 'cms-ic-sm')} حفظ</button>
            </div>
        </div>
        <div class="settings-cards">
            <div class="section-card">
                <h4>${ic('cube', 'cms-ic-sm')} عام</h4>
                <div class="row">
                    <label>رقم واتساب الافتراضي للطلبات</label>
                    <input id="set_wa" class="admin-input md" dir="ltr" value="${escapeCms(s.whatsapp || '')}" placeholder="201010058989">
                </div>
                <div class="row">
                    <label>فتح المنيو العام</label>
                    <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openPublicPreview()">👁 فتح في تبويب</button>
                </div>
                <div class="cms-hint">رقم واتساب الإعدادات يُستخدم كبديل إذا لم يُحدَّد رقم داخل «الموقع والتواصل».</div>
            </div>
            <div class="section-card">
                <h4>${ic('image', 'cms-ic-sm')} الصور</h4>
                <div class="app-meta">
                    <div class="app-meta-row">${ic('check')} ${usedCount} صورة مستخدمة</div>
                    <div class="app-meta-row">${ic('off')} ${inv.fallback.length} بدون صورة — fallback</div>
                    <div class="app-meta-row">${ic('clock')} ${inv.unverified.length} صورة حقيقية غير مؤكدة — بلا ربط تلقائي</div>
                </div>
                <div class="cms-hint">صُوِّرت الحالة من «جرد الصور»؛ لا يوجد ربط تلقائي للصور الحقيقية دون موافقتك.</div>
            </div>
            <div class="section-card">
                <h4>${ic('file', 'cms-ic-sm')} النشر</h4>
                <div class="row">
                    <span style="color:var(--coffee-300);font-size:.86rem;">كل التعديلات Draft محلية على هذا المتصفح وتُشارك مع الزوار فقط عبر النسخة النهائية من الجهاز المستضيف. انقر للعرض:</span>
                </div>
                <div class="row">
                    <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="cmsReviewOpen()">📋 مراجعة قبل النشر</button>
                    <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="cmsPublishLocal()">📤 «نشر» (اختبار محلي)</button>
                </div>
            </div>
        </div>`;
}

function saveSettingsCms() {
    const waEl = document.getElementById('set_wa');
    const waErr = cmsValidateField('phone', waEl ? waEl.value : '', {});
    if (!cmsSetFieldError(waEl, waErr)) { cmsToast('رقم واتساب غير صحيح', true); return; }
    const s = readSettings();
    s.whatsapp = waEl ? waEl.value.trim() : s.whatsapp;
    writeSettings(s);
    if (typeof updateAdminStatus === 'function') updateAdminStatus();
    cmsToast('حُفظت الإعدادات');
}

function cmsExportBackup() {
    const payload = {
        schema: 'lucca-cms-backup-v1',
        exportedAt: new Date().toISOString(),
        menu: (typeof readMenuEditorState === 'function') ? readMenuEditorState() : null,
        categories: readCategoryOverrides(),
        location: readLocation(),
        settings: readSettings()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lucca-menu-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    cmsToast('صُدّر الملف الاحتياطي');
}

function cmsImportBackup(fileInput) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    file.text().then(text => {
        const data = JSON.parse(text);
        if (data.schema !== 'lucca-cms-backup-v1') throw new Error('bad schema');
        if (data.menu && typeof writeMenuEditorState === 'function') writeMenuEditorState(data.menu);
        if (Array.isArray(data.categories)) writeCategoryOverrides(data.categories);
        if (data.location) writeLocation(data.location);
        if (data.settings) writeSettings(data.settings);
        _catWorking = null;
        if (typeof refreshMenuStats === 'function') refreshMenuStats();
        if (typeof renderInfoStrip === 'function') renderInfoStrip();
        if (typeof updateAdminStatus === 'function') updateAdminStatus();
        fileInput.value = '';
        cmsToast('استُوردت النسخة الاحتياطية');
    }).catch(() => { cmsToast('ملف غير صالح', true); fileInput.value = ''; });
}

function cmsResetAll() {
    if (!confirm('مسح كل التعديلات المحلية (الأصناف، الفئات، الموقع، الإعدادات) والعودة للبيانات الأصلية؟')) return;
    ['lucca-public-menu-overrides-v1', CMS_CATEGORIES_KEY, CMS_LOCATION_KEY, CMS_SETTINGS_KEY, CMS_PUBLISH_KEY].forEach(k => localStorage.removeItem(k));
    _catWorking = null;
    if (typeof refreshMenuStats === 'function') refreshMenuStats();
    if (typeof renderInfoStrip === 'function') renderInfoStrip();
    if (typeof updateAdminStatus === 'function') updateAdminStatus();
    cmsToast('استُعيدت البيانات الأصلية');
}

// ==================== Draft / Review / Publish (Phase 8) ====================
function readPublishMeta() { return cmsJsonGet(CMS_PUBLISH_KEY, {}); }
function writePublishMeta(pm) { cmsJsonSet(CMS_PUBLISH_KEY, pm); }

function cmsEditCount() {
    let n = 0;
    const state = (typeof readMenuEditorState === 'function') ? readMenuEditorState() : null;
    if (state) {
        n += Object.keys(state.overrides || {}).length;
        Object.values(state.custom || {}).forEach(a => { n += (a || []).length; });
    }
    n += readCategoryOverrides().length;
    const loc = readLocation();
    if (loc && Object.keys(loc).length) n++;
    const s = readSettings();
    if (s && Object.keys(s).length) n++;
    return n;
}

function updateAdminStatus() {
    const badge = document.getElementById('adminStatusBadge');
    if (!badge) return;
    const pm = readPublishMeta();
    const n = cmsEditCount();
    let txt, cls = '';
    if (pm.status === 'published' && pm.lastPublishedAt) {
        txt = `Published · محلي ${pm.lastPublishedAt}`; cls = 'cms-badge-published';
    } else if (n > 0) {
        txt = `Review · ${n} تعديل محلي`; cls = 'cms-badge-review';
    } else {
        txt = 'Draft / Local';
    }
    badge.textContent = txt;
    badge.className = 'admin-status-badge ' + cls;
}

function cmsReviewOpen() {
    const n = cmsEditCount();
    const state = (typeof readMenuEditorState === 'function') ? readMenuEditorState() : {};
    const menuEdits = Object.keys(state.overrides || {}).length + Object.values(state.custom || {}).flat().length;
    const body = document.createElement('div');
    body.id = 'cmsReviewModal';
    body.className = 'admin-modal';
    body.style.display = 'flex';
    body.innerHTML = `
        <div class="admin-overlay" style="display:block;" onclick="cmsReviewClose()"></div>
        <div class="admin-modal-inner" style="max-width:480px;" onclick="event.stopPropagation()">
            <button class="close-modal" onclick="cmsReviewClose()">✕</button>
            <h3>📋 مراجعة قبل النشر</h3>
            <p style="color:var(--coffee-300);font-size:.85rem;margin:0 0 12px;">هذه مسودة محلية على هذا المتصفح فقط. النشر الفعلي يتم من الجهاز المستضيف أو تطبيق التعديل النهائي على الملف.</p>
            <table class="admin-table" style="margin-bottom:12px;">
                <tbody>
                    <tr><td>الأصناف المعدَّلة / المضافة</td><td><b>${menuEdits}</b></td></tr>
                    <tr><td>تعديلات الفئات</td><td><b>${readCategoryOverrides().length}</b></td></tr>
                    <tr><td>الموقع والتواصل</td><td><b>${Object.keys(readLocation()).length ? 'محدد' : '—'}</b></td></tr>
                    <tr><td>الإعدادات</td><td><b>${Object.keys(readSettings()).length ? 'محددة' : '—'}</b></td></tr>
                    <tr><td>إجمالي التعديلات المحلية</td><td><b>${n}</b></td></tr>
                </tbody>
            </table>
            <div class="row" style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="cmsSetReview()">✍ حفظ كمراجعة</button>
                <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="cmsPublishLocal()">📤 «نشر» محلي</button>
            </div>
        </div>`;
    document.body.appendChild(body);
}

function cmsReviewClose() {
    const el = document.getElementById('cmsReviewModal');
    if (el) el.remove();
}

function cmsSetReview() {
    const pm = readPublishMeta();
    pm.status = 'review';
    if (!pm.lastPublishedAt) pm.lastPublishedAt = '';
    writePublishMeta(pm);
    cmsReviewClose();
    updateAdminStatus();
    cmsToast('حُفِظت كمراجعة (غير منشورة بعد)');
}

function cmsPublishLocal() {
    const run = (r) => {
        const pm = readPublishMeta();
        pm.status = 'published';
        pm.lastPublishedAt = new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
        writePublishMeta(pm);
        cmsReviewClose();
        updateAdminStatus();
        cmsToast(r ? 'نُشرت محليًّا على هذا المتصفح (Draft/Local)' : 'فشل النشر');
    };
    if (typeof LocalMenuRepository !== 'undefined' && LocalMenuRepository.publish) {
        LocalMenuRepository.publish().then(r => run(r && r.published === false ? true : !!r.ok)).catch(() => run(false));
    } else {
        run(true);
    }
}

// ==================== Preview (Phase 2/7) ====================
function renderPreviewCms() {
    const root = document.getElementById('cms-preview-root');
    if (!root) return;
    const ic = (typeof cmsIconStr === 'function') ? cmsIconStr : () => '';
    root.innerHTML = `
        <div class="cms-sec-head">
            <div>
                <h3>${ic('eye', 'cms-ic-lg')} المعاينة</h3>
                <p>معاينة تقريبية للمنيو العام بالبيانات الحية (عربي/إنجليزي حسب لغة المتصفح). المعاينة غير قابلة للنقر.</p>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openPublicPreview()">⬜ فتح المنيو العام في تبويب</button>
                <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="renderPreviewCms()">↻ تحديث</button>
            </div>
        </div>
        <div class="cms-preview-note">عرض تقريبي 📱 (412px)</div>
        <div class="cms-preview-frame" id="cmsPreviewFrame"></div>`;
    const frame = document.getElementById('cmsPreviewFrame');
    const cats = getAccessibleCategories();
    let html = '<div class="tabs" style="display:flex;gap:6px;overflow-x:auto;padding:10px 0;flex-wrap:nowrap;">' +
        cats.map(c => `<span style="white-space:nowrap;padding:6px 12px;border:1px solid rgba(212,168,90,.4);border-radius:999px;color:var(--gold);font-size:.76rem;">${c.icon} ${c.name()}</span>`).join('') + '</div>';
    html += cats.map(renderCategory).join('') + '<div style="height:14px;"></div>';
    frame.innerHTML = html;
    const guard = document.createElement('div');
    guard.className = 'cms-preview-guard';
    frame.appendChild(guard);
}

// ==================== Boot ====================
document.addEventListener('DOMContentLoaded', function () {
    if (typeof renderInfoStrip === 'function') renderInfoStrip();
    if (typeof updateAdminStatus === 'function') updateAdminStatus();
});