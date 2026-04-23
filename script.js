const menuContent = document.getElementById('menuContent');
const searchInput = document.getElementById('searchInput');
const toggleAllBtn = document.getElementById('toggleAllBtn');
let allExpanded = false;

function renderMenu() {
    menuContent.innerHTML = '';

    menuData.forEach((category, index) => {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'category';
        categoryEl.innerHTML = `
            <div class="category-header">
                <h2><span class="category-icon">${category.icon}</span> ${category.title}</h2>
                <span class="toggle-icon">▼</span>
            </div>
            <div class="category-items"></div>
        `;

        const header = categoryEl.querySelector('.category-header');
        const itemsContainer = categoryEl.querySelector('.category-items');

        header.addEventListener('click', () => {
            categoryEl.classList.toggle('expanded');
        });

        category.items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'menu-item';

            const leftEl = document.createElement('div');
            const nameEl = document.createElement('div');
            nameEl.className = 'item-name';
            nameEl.textContent = item.name;
            leftEl.appendChild(nameEl);

            if (item.description) {
                const descEl = document.createElement('div');
                descEl.className = 'item-description';
                descEl.textContent = item.description;
                leftEl.appendChild(descEl);
            }

            if (item.origins) {
                const originEl = document.createElement('div');
                originEl.className = 'origin-selection';
                originEl.innerHTML = `
                    <div class="label">اختر المحصول:</div>
                    <div class="origin-options"></div>
                `;
                const optionsEl = originEl.querySelector('.origin-options');
                item.origins.forEach(origin => {
                    const tag = document.createElement('span');
                    tag.className = 'origin-tag';
                    tag.textContent = origin;
                    optionsEl.appendChild(tag);
                });
                leftEl.appendChild(originEl);
            }

            const rightEl = document.createElement('div');
            if (item.prices && item.prices.length > 1) {
                const priceGroup = document.createElement('div');
                priceGroup.className = 'dual-price';
                item.prices.forEach(priceValue => {
                    const priceEl = document.createElement('div');
                    priceEl.className = 'item-price';
                    priceEl.innerHTML = `${priceValue} <span class="price-unit">${item.unit}</span>`;
                    priceGroup.appendChild(priceEl);
                });
                rightEl.appendChild(priceGroup);
            } else {
                const priceEl = document.createElement('div');
                priceEl.className = 'item-price';
                priceEl.innerHTML = `${item.price || item.prices?.[0] || ''} <span class="price-unit">${item.unit || ''}</span>`;
                rightEl.appendChild(priceEl);
            }

            itemEl.appendChild(leftEl);
            itemEl.appendChild(rightEl);
            itemsContainer.appendChild(itemEl);
        });

        menuContent.appendChild(categoryEl);
        if (index === 0) {
            categoryEl.classList.add('expanded');
        }
    });
}

function toggleAll() {
    allExpanded = !allExpanded;
    document.querySelectorAll('.category').forEach(category => {
        category.classList.toggle('expanded', allExpanded);
    });
}

function applySearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const categories = document.querySelectorAll('.category');

    categories.forEach(category => {
        let hasVisible = false;
        const items = category.querySelectorAll('.menu-item');

        items.forEach(item => {
            const name = item.querySelector('.item-name').textContent.toLowerCase();
            const descEl = item.querySelector('.item-description');
            const desc = descEl ? descEl.textContent.toLowerCase() : '';
            const visible = name.includes(searchTerm) || desc.includes(searchTerm);
            item.style.display = visible ? 'flex' : 'none';
            if (visible) {
                hasVisible = true;
            }
        });

        category.style.display = hasVisible || searchTerm === '' ? 'block' : 'none';
        category.classList.toggle('expanded', hasVisible && searchTerm !== '');
    });
}

function generateQrCode() {
    const qrcodeContainer = document.getElementById('qrcode');
    qrcodeContainer.innerHTML = '';
    new QRCode(qrcodeContainer, {
        text: window.location.href,
        width: 200,
        height: 200,
        colorDark: '#3E2723',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

searchInput.addEventListener('input', applySearch);
toggleAllBtn.addEventListener('click', toggleAll);

document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    generateQrCode();
});
