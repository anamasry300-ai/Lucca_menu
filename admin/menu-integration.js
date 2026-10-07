/*
╔══════════════════════════════════════════════════════════════════╗
║              Lucca Café - Menu Integration Module                ║
║                         الإصدار 1.0                               ║
╚══════════════════════════════════════════════════════════════════╝
*/

// ==================== ربط المنيو بالبرنامج المحاسبي ====================

class MenuIntegration {
    constructor() {
        this.menuData = null;
    }

    // تحميل بيانات المنيو
    async loadMenuData() {
        try {
            // استيراد بيانات المنيو
            if (typeof menuData !== 'undefined') {
                this.menuData = menuData;
                return this.menuData;
            } else {
                // تحميل خارجي
                const response = await fetch('../menu/menu-data.js');
                const text = await response.text();
                // استخراج JSON من الملف
                const match = text.match(/const menuData = (\[[\s\S]*?\]);/);
                if (match) {
                    this.menuData = eval(match[1]);
                    return this.menuData;
                }
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات المنيو:', error);
            return null;
        }
    }

    // الحصول على سعر صنف معين
    getItemPrice(itemName) {
        if (!this.menuData) return null;
        
        for (const category of this.menuData) {
            const item = category.items.find(i => i.name === itemName);
            if (item) return item.price;
        }
        return null;
    }

    // الحصول على جميع الأصناف
    getAllItems() {
        if (!this.menuData) return [];
        
        const items = [];
        for (const category of this.menuData) {
            for (const item of category.items) {
                items.push({
                    ...item,
                    category: category.title,
                    categoryId: category.id
                });
            }
        }
        return items;
    }

    // البحث عن صنف
    searchItems(query) {
        if (!this.menuData) return [];
        
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for (const category of this.menuData) {
            for (const item of category.items) {
                if (item.name.toLowerCase().includes(lowerQuery) || 
                    (item.description && item.description.toLowerCase().includes(lowerQuery))) {
                    results.push({
                        ...item,
                        category: category.title,
                        categoryId: category.id
                    });
                }
            }
        }
        return results;
    }

    // الحصول على الأصناف حسب الفئة
    getItemsByCategory(categoryId) {
        if (!this.menuData) return [];
        
        const category = this.menuData.find(c => c.id === categoryId);
        return category ? category.items : [];
    }

    // تصدير قائمة الأسعار للبرنامج المحاسبي
    exportPriceList() {
        const priceList = {};
        
        for (const category of this.menuData || []) {
            for (const item of category.items) {
                priceList[item.name] = {
                    price: item.price,
                    category: category.title,
                    description: item.description
                };
            }
        }
        
        return priceList;
    }
}

// إنشاء نسخة عامة
const menuIntegration = new MenuIntegration();

// دالة مساعدة للوصول السريع
function getMenuPrice(itemName) {
    return menuIntegration.getItemPrice(itemName);
}

function getAllMenuItems() {
    return menuIntegration.getAllItems();
}

function searchMenuItems(query) {
    return menuIntegration.searchItems(query);
}

// تصدير للاستخدام الخارجي
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MenuIntegration, menuIntegration, getMenuPrice, getAllMenuItems, searchMenuItems };
}
