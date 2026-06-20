/*
╔══════════════════════════════════════════════════════════════════╗
║                    Lucca Caffè - نظام إدارة المقهى                  ║
║                         الإصدار 1.0                               ║
╚══════════════════════════════════════════════════════════════════╝
*/

// ==================== قاعدة البيانات المحلية ====================
const DB_NAME = 'lucca_caffe_db';
const DB_VERSION = 4;

class LuccaDatabase {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // جدول المستخدمين
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }
                
                // جدول الطابيزات
                if (!db.objectStoreNames.contains('tables')) {
                    db.createObjectStore('tables', { keyPath: 'id' });
                }
                
                // جدول الطلبات
                if (!db.objectStoreNames.contains('orders')) {
                    const orderStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
                    orderStore.createIndex('tableId', 'tableId', { unique: false });
                    orderStore.createIndex('date', 'date', { unique: false });
                    orderStore.createIndex('status', 'status', { unique: false });
                }
                
                // جدول العملاء
                if (!db.objectStoreNames.contains('customers')) {
                    const customerStore = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
                    customerStore.createIndex('phone', 'phone', { unique: true });
                }
                
                // جدول الإعدادات
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // جدول المخزون
                if (!db.objectStoreNames.contains('inventory')) {
                    const invStore = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
                    invStore.createIndex('name', 'name', { unique: false });
                }

                // جدول المشتريات
                if (!db.objectStoreNames.contains('purchases')) {
                    const purStore = db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
                    purStore.createIndex('date', 'date', { unique: false });
                }

                // جدول الموظفين
                if (!db.objectStoreNames.contains('employees')) {
                    db.createObjectStore('employees', { keyPath: 'id', autoIncrement: true });
                }

                // جدول الحضور والانصراف
                if (!db.objectStoreNames.contains('attendance')) {
                    const attStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
                    attStore.createIndex('employeeId', 'employeeId', { unique: false });
                    attStore.createIndex('date', 'date', { unique: false });
                }

                // جدول المصروفات
                if (!db.objectStoreNames.contains('expenses')) {
                    const expStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
                    expStore.createIndex('date', 'date', { unique: false });
                    expStore.createIndex('category', 'category', { unique: false });
                }

                // جدول ورديات الخزينة
                if (!db.objectStoreNames.contains('shifts')) {
                    db.createObjectStore('shifts', { keyPath: 'date' });
                }

                // جدول المرتجعات
                if (!db.objectStoreNames.contains('returns')) {
                    const retStore = db.createObjectStore('returns', { keyPath: 'id', autoIncrement: true });
                    retStore.createIndex('date', 'date', { unique: false });
                    retStore.createIndex('orderId', 'orderId', { unique: false });
                }
            };
        });
    }

    // عمليات عامة
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // جلب سجل واحد عن طريق Index (أسرع بكثير من getAll + filter)
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // جلب سجلات بنطاق تاريخ أو رقم (أسرع من filter)
    async getByIndexRange(storeName, indexName, lowerValue, upperValue) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const range = IDBKeyRange.bound(lowerValue, upperValue);
            const request = index.getAll(range);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// إنشاء مثيل واحد
const db = new LuccaDatabase();

// ==================== إدارة المستخدمين ====================
const Users = {
    async login(username, password) {
        const users = await db.getAll('users');
        const user = users.find(u => u.username === username);
        if (!user) throw new Error('اسم المستخدم أو كلمة المرور خطأ');

        let valid = false;
        // Support both hashed (pbkdf2:) and legacy plaintext passwords
        if (user.password && user.password.startsWith('pbkdf2:')) {
            // Hashed password from server - use Web Crypto API to verify
            try {
                const parts = user.password.split(':');
                const storedHash = parts[2];
                const computedHash = await this.pbkdf2Hash(password, parts[1]);
                valid = (computedHash === storedHash);
            } catch(e) {
                // Web Crypto not available, try server
                throw new Error('كلمة المرور مشفرة - استخدم تسجيل الدخول من الخادم');
            }
        } else {
            valid = (user.password === password);
        }

        if (valid) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        }
        throw new Error('اسم المستخدم أو كلمة المرور خطأ');
    },

    async pbkdf2Hash(password, salt) {
        if (!window.crypto?.subtle) return null;
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-512' }, keyMaterial, 512);
        return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async register(userData) {
        const users = await this.getAll();
        if (users.find(u => u.username === userData.username)) {
            throw new Error('اسم المستخدم موجود');
        }
        userData.createdAt = new Date().toISOString();
        userData.role = userData.role || 'cashier';
        const id = await db.add('users', userData);
        bgSync(() => quickServerPost('users', { ...userData, id }));
        return { ...userData, id };
    },

    async logout() {
        localStorage.removeItem('currentUser');
    },

    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    async getAll() {
        const local = await db.getAll('users');
        bgSync(async () => {
            const serverData = await quickServerFetch('users');
            if (Array.isArray(serverData)) {
                await db.clear('users');
                for (const item of serverData) await db.add('users', item);
            }
        });
        return local;
    },

    async createDefaultAdmin() {
        const users = await db.getAll('users');
        if (users.length === 0) {
            await db.add('users', {
                id: 1,
                username: 'admin',
                password: '123456',
                name: 'مدير النظام',
                role: 'admin',
                createdAt: new Date().toISOString()
            });
        }
    }
};

// ==================== إدارة الطابيزات ====================
const Tables = {
    async init() {
        const tables = await db.getAll('tables');
        if (tables.length === 0) {
            for (let i = 1; i <= 14; i++) {
                await db.add('tables', { id: i, number: i, status: 'available', capacity: 4, currentOrder: null });
            }
        }
    },

    async getAll() {
        const local = await db.getAll('tables');
        bgSync(async () => {
            const serverData = await quickServerFetch('tables');
            if (serverData && serverData.length) {
                await db.clear('tables');
                for (const item of serverData) await db.add('tables', item);
            }
        });
        return local;
    },

    async update(id, data) {
        const numId = parseInt(id);
        const table = await db.get('tables', isNaN(numId) ? id : numId);
        if (table) {
            Object.assign(table, data);
            await db.put('tables', table);
            bgSync(() => quickServerPut('tables', table.id, table));
        }
        return table;
    },

    async getById(id) {
        const numId = parseInt(id);
        return db.get('tables', isNaN(numId) ? id : numId);
    }
};

// ==================== إدارة الطلبات ====================
const Orders = {
    async createWithPayment(tableId, items, customerName, customerPhone, paymentMethod, options) {
        options = options || {};
        customerName = customerName || '';
        customerPhone = customerPhone || '';
        const subtotal = (items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
        const discount = parseFloat(options.discount) || 0;
        const discountPercent = options.discountType !== 'fixed';
        const discountAmount = discountPercent ? subtotal * (discount / 100) : discount;
        const afterDiscount = subtotal - discountAmount;
        const taxRate = parseFloat(await Settings.get('taxRate')) || 0;
        const tax = options.applyTax !== false ? afterDiscount * (taxRate / 100) : 0;
        const order = {
            tableId: tableId || null,
            items: items || [],
            customerName,
            customerPhone,
            paymentMethod: paymentMethod || 'cash',
            customerNotes: options.customerNotes || '',
            invoiceDelivery: options.invoiceDelivery || 'cashier',
            marketingOptIn: Boolean(options.marketingOptIn),
            wantsWhatsappInvoice: options.invoiceDelivery === 'whatsapp',
            status: 'completed',
            subtotal,
            discount: discountPercent ? discount : 0,
            discountAmount,
            discountType: options.discountType || 'percent',
            tax,
            total: afterDiscount + tax,
            paid: options.paid || afterDiscount + tax,
            change: (options.paid || afterDiscount + tax) - (afterDiscount + tax),
            date: new Date().toISOString(),
            createdBy: Users.getCurrentUser()?.name || 'menu'
        };

        const id = await db.add('orders', order);
        bgSync(() => quickServerPost('orders', order));

        // Paid order → free table
        if (tableId && !isNaN(tableId)) {
            await Tables.update(parseInt(tableId), { status: 'available', currentOrder: null });
        }

        if (customerPhone) {
            await Customers.add(customerPhone, customerName, {
                marketingOptIn: Boolean(options.marketingOptIn),
                preferredChannel: options.invoiceDelivery || 'cashier',
                lastOrderTotal: order.total
            });
        }

        this.backup();
        return { ...order, id };
    },

    async create(tableId, items, customerName = '', customerPhone = '', options = {}) {
        const subtotal = (items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
        const discount = parseFloat(options.discount) || 0;
        const discountType = options.discountType || 'percent';
        const discountAmount = discountType === 'percent' ? subtotal * (discount / 100) : discount;
        const afterDiscount = subtotal - discountAmount;
        const taxRate = parseFloat(await Settings.get('taxRate')) || 14;
        const tax = afterDiscount * (taxRate / 100);
        const order = {
            tableId,
            items,
            customerName: customerName || '',
            customerPhone: customerPhone || '',
            paymentMethod: options.paymentMethod || 'cash',
            customerNotes: options.customerNotes || '',
            invoiceDelivery: options.invoiceDelivery || 'cashier',
            marketingOptIn: Boolean(options.marketingOptIn),
            wantsWhatsappInvoice: options.invoiceDelivery === 'whatsapp',
            status: options.status || 'pending',
            subtotal,
            discount,
            discountAmount,
            discountType,
            tax,
            total: afterDiscount + tax,
            date: new Date().toISOString(),
            createdBy: Users.getCurrentUser()?.name || 'unknown'
        };

        const id = await db.add('orders', order);
        bgSync(() => quickServerPost('orders', order));
        
        if (tableId && !isNaN(tableId)) {
            await Tables.update(parseInt(tableId), { status: 'occupied', currentOrder: id });
        }

        if (customerPhone) {
            await Customers.add(customerPhone, customerName, {
                marketingOptIn: Boolean(options.marketingOptIn),
                preferredChannel: options.invoiceDelivery || 'cashier',
                lastOrderTotal: order.total
            });
        }

        this.backup();
        return { ...order, id };
    },

    async getAll() {
        const local = await db.getAll('orders');
        bgSync(async () => {
            const serverData = await quickServerFetch('orders');
            if (Array.isArray(serverData)) {
                await db.clear('orders');
                for (const item of serverData) await db.add('orders', item);
            }
        });
        return local;
    },

    async getByTable(tableId) {
        const orders = await db.getByIndex('orders', 'tableId', tableId);
        return (orders || []).filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    },

    async getById(orderId) {
        return db.get('orders', orderId);
    },

    async updateStatus(orderId, status) {
        const order = await db.get('orders', orderId);
        if (order) {
            order.status = status;
            await db.put('orders', order);
            if (status === 'completed' || status === 'cancelled') {
                await Tables.update(order.tableId, { status: 'available', currentOrder: null });
            }
            bgSync(() => quickServerPut('orders', orderId, order));
            this.backup();
        }
        return order;
    },

    async updateOrder(orderId, updates) {
        const item = await db.get('orders', orderId);
        if (!item) return null;
        Object.assign(item, updates);
        if (updates.items && !updates.subtotal) {
            item.subtotal = updates.items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
            const discount = item.discount || 0;
            const discountAmount = item.subtotal * (discount / 100);
            const afterDiscount = item.subtotal - discountAmount;
            const taxRate = parseFloat(await Settings.get('taxRate')) || 14;
            item.tax = afterDiscount * (taxRate / 100);
            item.total = afterDiscount + item.tax;
        }
        await db.put('orders', item);
        bgSync(() => quickServerPut('orders', orderId, item));
        this.backup();
        return item;
    },

    async delete(orderId) {
        const order = await db.get('orders', orderId);
        if (order) {
            await Tables.update(order.tableId, { status: 'available', currentOrder: null });
            await db.delete('orders', orderId);
            bgSync(() => quickServerDelete('orders', orderId));
        }
    },

    async getDailySales() {
        const today = new Date().toISOString().split('T')[0];
        const start = today + 'T00:00:00';
        const end = today + 'T23:59:59.999Z';
        const orders = await db.getByIndexRange('orders', 'date', start, end);
        return (orders || []).filter(o => o.status === 'completed' || o.status === 'pending');
    },

    async getByDateRange(startDate, endDate) {
        const start = startDate + 'T00:00:00';
        const end = endDate + 'T23:59:59.999Z';
        const orders = await db.getByIndexRange('orders', 'date', start, end);
        return orders || [];
    },

    async backup() {
        try {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            const start = d.toISOString().split('T')[0] + 'T00:00:00';
            const end = new Date().toISOString().split('T')[0] + 'T23:59:59.999Z';
            const orders = await db.getByIndexRange('orders', 'date', start, end);
            localStorage.setItem('lucca_orders_backup', JSON.stringify((orders || []).slice(-200)));
        } catch(e) {}
    }
};

// ==================== إدارة العملاء ====================
const Customers = {
    async add(phone, name = '', options = {}) {
        const customers = await this.getAll();
        const exists = customers.find(c => c.phone === phone);
        
        if (!exists) {
            const customer = {
                phone,
                name,
                visits: 1,
                lastVisit: new Date().toISOString(),
                totalSpent: options.lastOrderTotal || 0,
                marketingOptIn: Boolean(options.marketingOptIn),
                preferredChannel: options.preferredChannel || 'cashier',
                createdAt: new Date().toISOString()
            };
            const id = await db.add('customers', customer);
            bgSync(() => quickServerPost('customers', { ...customer, id }));
        } else {
            exists.name = name || exists.name;
            exists.visits++;
            exists.lastVisit = new Date().toISOString();
            exists.totalSpent = (exists.totalSpent || 0) + (options.lastOrderTotal || 0);
            exists.marketingOptIn = Boolean(options.marketingOptIn);
            exists.preferredChannel = options.preferredChannel || exists.preferredChannel || 'cashier';
            await db.put('customers', exists);
            bgSync(() => quickServerPut('customers', exists.id, exists));
        }
    },

    async getAll() {
        const local = await db.getAll('customers');
        bgSync(async () => {
            const serverData = await quickServerFetch('customers');
            if (Array.isArray(serverData)) {
                await db.clear('customers');
                for (const item of serverData) await db.add('customers', item);
            }
        });
        return local;
    },

    async search(phone) {
        const customers = await this.getAll();
        return customers.filter(c => c.phone.includes(phone));
    }
};

// ==================== إدارة الإعدادات ====================
const Settings = {
    async get(key) {
        const setting = await db.get('settings', key);
        return setting?.value;
    },

    async set(key, value) {
        await db.put('settings', { key, value });
        bgSync(() => quickServerPost('settings', { key, value }));
    },

    async getAll() {
        const settings = await db.getAll('settings');
        return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    }
};

// ==================== إدارة المخزون ====================
const Inventory = {
    async getAll() {
        const local = await db.getAll('inventory');
        bgSync(async () => {
            const serverData = await quickServerFetch('inventory');
            if (Array.isArray(serverData)) {
                await db.clear('inventory');
                for (const item of serverData) await db.add('inventory', item);
            }
        });
        return local;
    },

    async add(item) {
        item.createdAt = new Date().toISOString();
        const id = await db.add('inventory', item);
        bgSync(() => quickServerPost('inventory', { ...item, id }));
        return id;
    },

    async update(id, data) {
        const item = await db.get('inventory', id);
        if (item) {
            Object.assign(item, data);
            await db.put('inventory', item);
            bgSync(() => quickServerPut('inventory', id, item));
        }
        return item;
    },

    async delete(id) {
        await db.delete('inventory', id);
        bgSync(() => quickServerDelete('inventory', id));
    },

    async adjustStock(id, quantity) {
        const item = await db.get('inventory', id);
        if (item) {
            item.quantity = (item.quantity || 0) + quantity;
            item.lastUpdated = new Date().toISOString();
            await db.put('inventory', item);
            bgSync(() => quickServerPut('inventory', id, item));
        }
        return item;
    }
};

// ==================== إدارة المشتريات ====================
const Purchases = {
    async getAll() {
        const local = await db.getAll('purchases');
        bgSync(async () => {
            const serverData = await quickServerFetch('purchases');
            if (Array.isArray(serverData)) {
                await db.clear('purchases');
                for (const item of serverData) await db.add('purchases', item);
            }
        });
        return local;
    },

    async add(purchase) {
        purchase.date = purchase.date || new Date().toISOString();
        purchase.createdAt = new Date().toISOString();
        const id = await db.add('purchases', purchase);
        bgSync(() => quickServerPost('purchases', { ...purchase, id }));
        return id;
    },

    async delete(id) {
        await db.delete('purchases', id);
        bgSync(() => quickServerDelete('purchases', id));
    },

    async getTotalCost() {
        const purchases = await this.getAll();
        return purchases.reduce((sum, p) => sum + ((p.costPrice || p.price || 0) * (p.quantity || 1)), 0);
    }
};

// ==================== إدارة الموظفين ====================
const Employees = {
    async getAll() {
        const local = await db.getAll('employees');
        bgSync(async () => {
            const serverData = await quickServerFetch('employees');
            if (Array.isArray(serverData)) {
                await db.clear('employees');
                for (const item of serverData) await db.add('employees', item);
            }
        });
        return local;
    },

    async add(employee) {
        employee.createdAt = new Date().toISOString();
        employee.active = true;
        const id = await db.add('employees', employee);
        bgSync(() => quickServerPost('employees', { ...employee, id }));
        return id;
    },

    async update(id, data) {
        const emp = await db.get('employees', id);
        if (emp) {
            Object.assign(emp, data);
            await db.put('employees', emp);
            bgSync(() => quickServerPut('employees', id, emp));
        }
        return emp;
    },

    async delete(id) {
        await db.delete('employees', id);
        bgSync(() => quickServerDelete('employees', id));
    },

    async getActive() {
        const all = await this.getAll();
        return all.filter(e => e.active);
    }
};

// ==================== الحضور والانصراف ====================
const Attendance = {
    async getAll() {
        const local = await db.getAll('attendance');
        bgSync(async () => {
            const serverData = await quickServerFetch('attendance');
            if (Array.isArray(serverData)) {
                await db.clear('attendance');
                for (const item of serverData) await db.add('attendance', item);
            }
        });
        return local;
    },

    async checkIn(employeeId, notes) {
        const today = new Date().toISOString().split('T')[0];
        const existing = await this.getByEmployeeAndDate(employeeId, today);
        if (existing) {
            throw new Error('تم تسجيل الحضور مسبقاً اليوم');
        }
        const expectedStart = await Settings.get('workStartTime') || '09:00';
        const now = new Date();
        const expected = new Date();
        const parts = expectedStart.split(':');
        expected.setHours(parseInt(parts[0]), parseInt(parts[1]), 0);
        const lateMs = now - expected;
        const lateMinutes = lateMs > 0 ? Math.round(lateMs / 60000) : 0;

        const record = {
            employeeId,
            date: today,
            checkIn: new Date().toISOString(),
            checkOut: null,
            lateMinutes,
            bonus: 0,
            deduction: 0,
            notes: notes || ''
        };
        const id = await db.add('attendance', record);
        bgSync(() => quickServerPost('attendance', { ...record, id }));
        return id;
    },

    async checkOut(employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const existing = await this.getByEmployeeAndDate(employeeId, today);
        if (!existing) {
            throw new Error('لم يتم تسجيل الحضور اليوم');
        }
        if (existing.checkOut) {
            throw new Error('تم تسجيل الانصراف مسبقاً');
        }
        existing.checkOut = new Date().toISOString();
        const diff = new Date(existing.checkOut) - new Date(existing.checkIn);
        existing.hoursWorked = Math.round(diff / 3600000 * 10) / 10;
        await db.put('attendance', existing);
        bgSync(() => quickServerPut('attendance', existing.id, existing));
        return existing;
    },

    async updateRecord(id, data) {
        const item = await db.get('attendance', id);
        if (item) {
            Object.assign(item, data);
            await db.put('attendance', item);
            bgSync(() => quickServerPut('attendance', id, item));
        }
        return item;
    },

    async getByEmployeeAndDate(employeeId, date) {
        const records = await db.getByIndex('attendance', 'employeeId', employeeId);
        return (records || []).find(a => a.date === date) || null;
    },

    async getToday() {
        const today = new Date().toISOString().split('T')[0];
        const records = await db.getByIndex('attendance', 'date', today);
        return records || [];
    },

    async getByDateRange(startDate, endDate) {
        const records = await db.getByIndexRange('attendance', 'date', startDate, endDate);
        return records || [];
    },

    async getByEmployee(employeeId) {
        const records = await db.getByIndex('attendance', 'employeeId', employeeId);
        return records || [];
    }
};

// ==================== إدارة المصروفات ====================
const Expenses = {
    async getAll() {
        const local = await db.getAll('expenses');
        bgSync(async () => {
            const serverData = await quickServerFetch('expenses');
            if (Array.isArray(serverData)) {
                await db.clear('expenses');
                for (const item of serverData) await db.add('expenses', item);
            }
        });
        return local;
    },

    async add(expense) {
        expense.date = expense.date || new Date().toISOString().split('T')[0];
        expense.createdAt = new Date().toISOString();
        const id = await db.add('expenses', expense);
        bgSync(() => quickServerPost('expenses', { ...expense, id }));
        return id;
    },

    async update(id, data) {
        const item = await db.get('expenses', id);
        if (item) {
            Object.assign(item, data);
            await db.put('expenses', item);
            bgSync(() => quickServerPut('expenses', id, item));
        }
        return item;
    },

    async delete(id) {
        await db.delete('expenses', id);
        bgSync(() => quickServerDelete('expenses', id));
    },

    async getByDate(date) {
        const items = await db.getByIndex('expenses', 'date', date);
        return items || [];
    },

    async getByDateRange(startDate, endDate) {
        const items = await db.getByIndexRange('expenses', 'date', startDate, endDate);
        return items || [];
    },

    async getTotalByDate(date) {
        const items = await this.getByDate(date);
        return items.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    },

    async getTotalByDateRange(startDate, endDate) {
        const items = await this.getByDateRange(startDate, endDate);
        return items.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    },

    categories: ['إيجار', 'رواتب', 'مشتريات', 'صيانة', 'كهرباء', 'مياه', 'إنترنت', 'تسويق', 'نقل', 'أخرى']
};

// ==================== إدارة الخزينة والورديات ====================
const Shifts = {
    async get(date) {
        date = date || new Date().toISOString().split('T')[0];
        const shift = await db.get('shifts', date);
        return shift || null;
    },

    async open(date, openingBalance, notes) {
        date = date || new Date().toISOString().split('T')[0];
        const shift = {
            date,
            openingBalance: parseFloat(openingBalance) || 0,
            status: 'open',
            openedAt: new Date().toISOString(),
            closedAt: null,
            actualCash: null,
            expectedCash: null,
            difference: null,
            notes: notes || ''
        };
        await db.put('shifts', shift);
        bgSync(() => quickServerPost('shifts', shift));
        return shift;
    },

    async close(date, actualCash, notes) {
        date = date || new Date().toISOString().split('T')[0];
        const orders = await Orders.getByDateRange(date, date);
        const expenses = await Expenses.getByDate(date);
        const cashSales = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + (o.total || 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
        const existing = await this.get(date);
        const openingBalance = existing ? (parseFloat(existing.openingBalance) || 0) : 0;
        const expectedCash = openingBalance + cashSales - totalExpenses;
        const diff = parseFloat(actualCash || 0) - expectedCash;

        const shift = {
            date,
            openingBalance,
            status: 'closed',
            closedAt: new Date().toISOString(),
            actualCash: parseFloat(actualCash) || 0,
            expectedCash: Math.round(expectedCash * 100) / 100,
            difference: Math.round(diff * 100) / 100,
            cashSales: Math.round(cashSales * 100) / 100,
            cardSales: Math.round((orders.filter(o => o.paymentMethod === 'visa').reduce((s, o) => s + (o.total || 0), 0)) * 100) / 100,
            totalSales: Math.round(orders.reduce((s, o) => s + (o.total || 0), 0) * 100) / 100,
            totalExpenses: Math.round(totalExpenses * 100) / 100,
            orderCount: orders.length,
            notes: notes || existing?.notes || ''
        };
        if (existing) Object.assign(shift, { openedAt: existing.openedAt });
        await db.put('shifts', shift);
        bgSync(() => quickServerPost('shifts', shift));
        return shift;
    },

    async getAll() {
        const local = await db.getAll('shifts');
        bgSync(async () => {
            const serverData = await quickServerFetch('shifts');
            if (Array.isArray(serverData)) {
                await db.clear('shifts');
                for (const item of serverData) await db.add('shifts', item);
            }
        });
        return local;
    },

    async getByDateRange(startDate, endDate) {
        // Shifts use date as keyPath, so we need to iterate keys
        const all = await this.getAll();
        return (all || []).filter(s => s.date >= startDate && s.date <= endDate);
    }
};

// ==================== إدارة المرتجعات ====================
const Returns = {
    async getAll() {
        return db.getAll('returns');
    },

    async getById(id) {
        return db.get('returns', id);
    },

    async getByDate(date) {
        const items = await db.getByIndex('returns', 'date', date);
        return items || [];
    },

    async getByDateRange(startDate, endDate) {
        const items = await db.getByIndexRange('returns', 'date', startDate, endDate);
        return items || [];
    },

    async getByOrder(orderId) {
        const items = await db.getByIndex('returns', 'orderId', orderId);
        return items || [];
    },

    async add(returnData) {
        const record = {
            orderId: returnData.orderId || null,
            items: returnData.items || [],
            reason: returnData.reason || '',
            paymentMethod: returnData.paymentMethod || 'cash',
            refundAmount: parseFloat(returnData.refundAmount) || 0,
            date: returnData.date || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            createdBy: returnData.createdBy || Users.getCurrentUser()?.name || 'unknown'
        };
        const id = await db.add('returns', record);
        return { ...record, id };
    },

    async delete(id) {
        await db.delete('returns', id);
    },

    async getTotalByDate(date) {
        const items = await this.getByDate(date);
        return items.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
    },

    async getTotalByDateRange(startDate, endDate) {
        const items = await this.getByDateRange(startDate, endDate);
        return items.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
    }
};

const MenuSync = {
    settingsKey: 'sharedMenuCatalog',

    normalizeCategory(category, index) {
        return {
            id: category.id || `category-${index + 1}`,
            title: category.title || `Category ${index + 1}`,
            icon: category.icon || '•',
            items: (category.items || []).map(item => ({
                ...item,
                price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
                prices: Array.isArray(item.prices)
                    ? item.prices.map(value => (typeof value === 'string' ? parseFloat(value) : value))
                    : undefined
            }))
        };
    },

    normalizeCatalog(catalog = []) {
        return catalog.map((category, index) => this.normalizeCategory(category, index));
    },

    async saveCatalog(catalog = []) {
        const normalized = this.normalizeCatalog(catalog);
        await Settings.set(this.settingsKey, normalized);
        return normalized;
    },

    async getCatalog() {
        return (await Settings.get(this.settingsKey)) || [];
    },

    async syncFromMenuData(menuDataSource = []) {
        const existing = await this.getCatalog();
        if (!existing.length && menuDataSource.length) {
            return this.saveCatalog(menuDataSource);
        }
        return existing;
    }
};

// ==================== تصدير/استيراد البيانات ====================
const DataSync = {
    async exportAll() {
        const data = {
            users: await db.getAll('users'),
            tables: await db.getAll('tables'),
            orders: await db.getAll('orders'),
            customers: await db.getAll('customers'),
            settings: await db.getAll('settings'),
            inventory: await db.getAll('inventory'),
            purchases: await db.getAll('purchases'),
            employees: await db.getAll('employees'),
            attendance: await db.getAll('attendance'),
            expenses: await db.getAll('expenses'),
            shifts: await db.getAll('shifts'),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },

    async importAll(jsonString) {
        const data = JSON.parse(jsonString);
        const stores = ['users', 'tables', 'customers', 'orders', 'inventory', 'purchases', 'employees', 'attendance', 'expenses', 'shifts'];
        for (const store of stores) {
            if (data[store]) {
                await db.clear(store);
                for (const item of data[store]) {
                    await db.add(store, item);
                }
            }
        }
    },

    downloadBackup() {
        this.exportAll().then(json => {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lucca-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        });
    }
};

// ==================== المزامنة مع السيرفر ====================
let SERVER_URL = localStorage.getItem('luccaServerUrl') || 'http://localhost:3000';

// Quick sync — background, no blocking
async function quickServerFetch(storeName) {
    const url = SERVER_URL;
    const apiKey = localStorage.getItem('luccaApiKey') || 'lucca-secret-key';
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${url}/api/${storeName}`, {
            headers: { 'x-api-key': apiKey },
            signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) return await res.json();
    } catch(e) {}
    return null;
}

async function quickServerPost(storeName, data) {
    const url = SERVER_URL;
    const apiKey = localStorage.getItem('luccaApiKey') || 'lucca-secret-key';
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${url}/api/${storeName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) return await res.json();
    } catch(e) {}
    return null;
}

async function quickServerPut(storeName, id, data) {
    const url = SERVER_URL;
    const apiKey = localStorage.getItem('luccaApiKey') || 'lucca-secret-key';
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${url}/api/${storeName}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        clearTimeout(timer);
        return res.ok;
    } catch(e) { return false; }
}

async function quickServerDelete(storeName, id) {
    const url = SERVER_URL;
    const apiKey = localStorage.getItem('luccaApiKey') || 'lucca-secret-key';
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${url}/api/${storeName}/${id}`, {
            method: 'DELETE',
            headers: { 'x-api-key': apiKey },
            signal: controller.signal
        });
        clearTimeout(timer);
        return res.ok;
    } catch(e) { return false; }
}

// Try to sync a single item in background (fire & forget)
function bgSync(fn) { fn().catch(() => {}); }

const ServerSync = {
    setServerUrl(url) {
        localStorage.setItem('luccaServerUrl', url);
        SERVER_URL = url;
    },

    getServerUrl() {
        return localStorage.getItem('luccaServerUrl') || 'http://localhost:3000';
    },

    async pushAll() {
        const url = this.getServerUrl();
        const apiKey = localStorage.getItem('luccaApiKey') || 'lucca-secret-key';
        try {
            const data = {
                users: await db.getAll('users'),
                tables: await db.getAll('tables'),
                orders: await db.getAll('orders'),
                customers: await db.getAll('customers'),
                settings: await db.getAll('settings'),
                inventory: await db.getAll('inventory'),
                purchases: await db.getAll('purchases'),
                employees: await db.getAll('employees'),
                attendance: await db.getAll('attendance'),
                expenses: await db.getAll('expenses'),
                shifts: await db.getAll('shifts')
            };
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`${url}/api/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
                body: JSON.stringify(data),
                signal: controller.signal
            });
            clearTimeout(timer);
            if (!res.ok) throw new Error('فشل رفع البيانات');
            return { success: true, message: '✅ تم رفع البيانات للسيرفر' };
        } catch (e) {
            return { success: false, message: '❌ فشل الاتصال بالسيرفر: ' + e.message };
        }
    },

    async pullAll() {
        const url = this.getServerUrl();
        const apiKey = localStorage.getItem('luccaApiKey') || 'lucca-secret-key';
        try {
            const collections = ['users', 'tables', 'orders', 'customers', 'settings', 'inventory', 'purchases', 'employees', 'attendance', 'expenses', 'shifts'];
            for (const col of collections) {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 3000);
                const res = await fetch(`${url}/api/${col}`, {
                    headers: { 'x-api-key': apiKey },
                    signal: controller.signal
                });
                clearTimeout(timer);
                if (!res.ok) continue;
                const items = await res.json();
                await db.clear(col);
                for (const item of items) {
                    await db.add(col, item);
                }
            }
            return { success: true, message: '✅ تم تحميل البيانات من السيرفر' };
        } catch (e) {
            return { success: false, message: '❌ فشل الاتصال بالسيرفر: ' + e.message };
        }
    },

    async testConnection() {
        const url = this.getServerUrl();
        const apiKey = localStorage.getItem('luccaApiKey') || 'lucca-secret-key';
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${url}/api/tables`, { method: 'HEAD', cache: 'no-store', headers: { 'x-api-key': apiKey }, signal: controller.signal });
            clearTimeout(timer);
            return res.ok;
        } catch {
            return false;
        }
    }
};

// ==================== تهيئة النظام ====================
async function initSystem() {
    await db.init();

    // Auto-fetch API key from server (background, no blocking)
    bgSync(async () => {
        try {
            const baseUrl = ServerSync.getServerUrl();
            const resp = await fetch(`${baseUrl}/api/public-key`, { signal: AbortSignal.timeout(2000) });
            if (resp.ok) {
                const data = await resp.json();
                if (data.apiKey) localStorage.setItem('luccaApiKey', data.apiKey);
            }
        } catch(e) {}
    });

    await Tables.init();
    await Users.createDefaultAdmin();
    if (typeof menuData !== 'undefined' && Array.isArray(menuData) && menuData.length) {
        await MenuSync.syncFromMenuData(menuData);
    }

    // Auto-sync removed: pushAll + pullAll could wipe local data if server returns empty.
    // Use manual sync from Settings tab for safe data exchange between devices.

    // Recover orders from localStorage backup if IndexedDB is empty
    try {
        const orders = await db.getAll('orders');
        if (!orders.length) {
            const backup = localStorage.getItem('lucca_orders_backup');
            if (backup) {
                const parsed = JSON.parse(backup);
                if (Array.isArray(parsed) && parsed.length) {
                    for (const order of parsed) {
                        try { await db.add('orders', order); } catch(e) {}
                    }
                    console.log(`🔄 تم استعادة ${parsed.length} طلب من النسخ الاحتياطي`);
                }
            }
        }
    } catch(e) {}

    console.log('✅ تم تهيئة نظام Lucca Caffè');
}

// تصدير للاستخدام
window.LuccaDB = { db, Users, Tables, Orders, Customers, Settings, Inventory, Purchases, Employees, Attendance, Expenses, Shifts, Returns, MenuSync, DataSync, ServerSync, initSystem };
