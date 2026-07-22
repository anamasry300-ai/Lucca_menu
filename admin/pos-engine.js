// ═══════════════════════════════════════════════════════════════════
//  Lucca POS Engine v2.0 — Auto-Save | Offline-First | Real-Time
// ═══════════════════════════════════════════════════════════════════

const POS = (function () {
  const DB_NAME = 'lucca_pos_v2';
  const DB_VERSION = 1;

  // ─── Table State Machine ──────────────────────────────────────
  const TABLE_STATUS = Object.freeze({
    FREE: 'FREE',
    OCCUPIED: 'OCCUPIED',
    WAITING_PAYMENT: 'WAITING_PAYMENT',
    PAID: 'PAID',
    CLOSED: 'CLOSED'
  });

  const ORDER_STATUS = Object.freeze({
    OPEN: 'OPEN',
    SENT_TO_KITCHEN: 'SENT_TO_KITCHEN',
    WAITING_PAYMENT: 'WAITING_PAYMENT',
    PAID: 'PAID',
    CLOSED: 'CLOSED'
  });

  // Valid transitions
  const TABLE_TRANSITIONS = {
    [TABLE_STATUS.FREE]: [TABLE_STATUS.OCCUPIED],
    [TABLE_STATUS.OCCUPIED]: [TABLE_STATUS.WAITING_PAYMENT, TABLE_STATUS.FREE],
    [TABLE_STATUS.WAITING_PAYMENT]: [TABLE_STATUS.PAID, TABLE_STATUS.OCCUPIED],
    [TABLE_STATUS.PAID]: [TABLE_STATUS.CLOSED, TABLE_STATUS.OCCUPIED],
    [TABLE_STATUS.CLOSED]: [TABLE_STATUS.FREE]
  };

  // ─── Utilities ───────────────────────────────────────────────
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function now() { return new Date().toISOString(); }

  // ─── IndexedDB ───────────────────────────────────────────────
  class Database {
    constructor() { this.db = null; }

    async init() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => { this.db = req.result; resolve(); };

        req.onupgradeneeded = (e) => {
          const db = e.target.result;

          // Tables
          if (!db.objectStoreNames.contains('tables')) {
            const s = db.createObjectStore('tables', { keyPath: 'id' });
            s.createIndex('status', 'status', { unique: false });
          }

          // Orders — active sessions keyed by tableId
          if (!db.objectStoreNames.contains('orders')) {
            const s = db.createObjectStore('orders', { keyPath: 'id' });
            s.createIndex('tableId', 'tableId', { unique: false });
            s.createIndex('status', 'status', { unique: false });
            s.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          // Sync queue for offline support
          if (!db.objectStoreNames.contains('sync_queue')) {
            const s = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
            s.createIndex('synced', 'synced', { unique: false });
          }

          // Archive — completed orders moved here
          if (!db.objectStoreNames.contains('archive')) {
            db.createObjectStore('archive', { keyPath: 'id' });
          }
        };
      });
    }

    _tx(store, mode = 'readonly') {
      if (!this.db) throw new Error('DB not initialized');
      return this.db.transaction(store, mode);
    }

    async getAll(store) {
      return new Promise((resolve, reject) => {
        const req = this._tx(store).objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async get(store, id) {
      return new Promise((resolve, reject) => {
        const req = this._tx(store).objectStore(store).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    }

    async getByIndex(store, indexName, value) {
      return new Promise((resolve, reject) => {
        const req = this._tx(store).objectStore(store).index(indexName).getAll(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async put(store, data) {
      return new Promise((resolve, reject) => {
        const req = this._tx(store, 'readwrite').objectStore(store).put(data);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async delete(store, id) {
      return new Promise((resolve, reject) => {
        const req = this._tx(store, 'readwrite').objectStore(store).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }

    async clear(store) {
      return new Promise((resolve, reject) => {
        const req = this._tx(store, 'readwrite').objectStore(store).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }

  // ─── POS Engine ──────────────────────────────────────────────
  class PosEngine {
    constructor() {
      this.db = new Database();
      this.initialized = false;
      this._saveIndicatorTimer = null;
      this._listeners = [];
    }

    async init() {
      await this.db.init();
      await this._seedTables();
      await this._processSyncQueue();
      this.initialized = true;
      return this;
    }

    // ── Table seeding ──────────────────────────────────────────
    async _seedTables() {
      const existing = await this.db.getAll('tables');
      if (existing.length === 0) {
        for (let i = 1; i <= 14; i++) {
          await this.db.put('tables', {
            id: i,
            number: i,
            name: `طاولة ${i}`,
            status: TABLE_STATUS.FREE,
            currentOrderId: null,
            updatedAt: now()
          });
        }
      }
    }

    // ── Event listeners ────────────────────────────────────────
    onChange(fn) { this._listeners.push(fn); }

    _emit(event, data) {
      for (const fn of this._listeners) {
        try { fn(event, data); } catch (e) { console.error('POS listener error', e); }
      }
    }

    // ── Save indicator ─────────────────────────────────────────
    _showSaveIndicator() {
      if (this._saveIndicatorTimer) clearTimeout(this._saveIndicatorTimer);
      const el = document.getElementById('posSaveIndicator');
      if (!el) return;
      el.textContent = '✓ تم الحفظ تلقائياً';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      this._saveIndicatorTimer = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
      }, 2000);
    }

    // ── Tables ─────────────────────────────────────────────────
    async getTables() {
      return this.db.getAll('tables');
    }

    async getTable(id) {
      return this.db.get('tables', id);
    }

    async _transitionTable(tableId, newStatus) {
      const table = await this.db.get('tables', tableId);
      if (!table) throw new Error(`Table ${tableId} not found`);
      const allowed = TABLE_TRANSITIONS[table.status];
      if (!allowed || !allowed.includes(newStatus)) {
        throw new Error(`Cannot transition table ${tableId} from ${table.status} to ${newStatus}`);
      }
      table.status = newStatus;
      table.updatedAt = now();
      await this.db.put('tables', table);
      this._emit('tableChange', table);
      return table;
    }

    // ── Orders ──────────────────────────────────────────────────
    async openTableSession(tableId) {
      const table = await this.db.get('tables', tableId);
      if (!table) throw new Error('Table not found');

      // Check for existing open order
      if (table.currentOrderId) {
        const existing = await this.db.get('orders', table.currentOrderId);
        if (existing && existing.status !== ORDER_STATUS.CLOSED) {
          return { order: existing, table, isNew: false };
        }
      }

      // Create new order
      const order = {
        id: uuid(),
        tableId: tableId,
        status: ORDER_STATUS.OPEN,
        items: [],
        subtotal: 0,
        discount: 0,
        discountType: 'percent',
        discountAmount: 0,
        tax: 0,
        taxRate: 14,
        total: 0,
        customerName: '',
        customerPhone: '',
        paymentMethod: null,
        notes: '',
        createdAt: now(),
        updatedAt: now(),
        createdBy: (POS.currentUser && POS.currentUser.name) || 'cashier',
        version: 1
      };

      await this.db.put('orders', order);
      table.status = TABLE_STATUS.OCCUPIED;
      table.currentOrderId = order.id;
      table.updatedAt = now();
      await this.db.put('tables', table);

      this._queueSync('CREATE', 'orders', order);
      this._emit('orderChange', order);
      this._emit('tableChange', table);

      return { order, table, isNew: true };
    }

    async getActiveOrder(tableId) {
      const orders = await this.db.getByIndex('orders', 'tableId', tableId);
      return orders.find(o => o.status !== ORDER_STATUS.CLOSED && o.status !== ORDER_STATUS.PAID) || null;
    }

    async getOrder(orderId) {
      return this.db.get('orders', orderId);
    }

    async getAllActiveOrders() {
      const all = await this.db.getAll('orders');
      return all.filter(o => o.status !== ORDER_STATUS.CLOSED && o.status !== ORDER_STATUS.PAID);
    }

    async getAllOrders() {
      return this.db.getAll('orders');
    }

    // ── Auto-Save: Items ───────────────────────────────────────
    async addItem(orderId, menuItem, quantity = 1) {
      const order = await this.db.get('orders', orderId);
      if (!order) throw new Error('Order not found');

      const existing = order.items.find(i => i.name === menuItem.name);
      if (existing) {
        existing.quantity += quantity;
      } else {
        order.items.push({
          id: uuid(),
          name: menuItem.name,
          price: typeof menuItem.price === 'number' ? menuItem.price : parseFloat(menuItem.price) || 0,
          quantity: quantity,
          notes: menuItem.description || ''
        });
      }

      this._recalcOrder(order);
      order.updatedAt = now();
      order.version++;
      await this.db.put('orders', order);
      this._queueSync('UPDATE', 'orders', order);
      this._emit('orderChange', order);
      this._showSaveIndicator();
      return order;
    }

    async updateItemQty(orderId, itemId, delta) {
      const order = await this.db.get('orders', orderId);
      if (!order) throw new Error('Order not found');

      const item = order.items.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      item.quantity += delta;
      if (item.quantity <= 0) {
        order.items = order.items.filter(i => i.id !== itemId);
      }

      this._recalcOrder(order);
      order.updatedAt = now();
      order.version++;
      await this.db.put('orders', order);
      this._queueSync('UPDATE', 'orders', order);
      this._emit('orderChange', order);
      this._showSaveIndicator();
      return order;
    }

    async removeItem(orderId, itemId) {
      const order = await this.db.get('orders', orderId);
      if (!order) throw new Error('Order not found');

      order.items = order.items.filter(i => i.id !== itemId);
      this._recalcOrder(order);
      order.updatedAt = now();
      order.version++;
      await this.db.put('orders', order);
      this._queueSync('UPDATE', 'orders', order);
      this._emit('orderChange', order);
      this._showSaveIndicator();
      return order;
    }

    async updateOrder(orderId, updates) {
      const order = await this.db.get('orders', orderId);
      if (!order) throw new Error('Order not found');

      Object.assign(order, updates, { updatedAt: now(), version: order.version + 1 });
      if (updates.items) this._recalcOrder(order);
      await this.db.put('orders', order);
      this._queueSync('UPDATE', 'orders', order);
      this._emit('orderChange', order);
      this._showSaveIndicator();
      return order;
    }

    // ── Workflow actions ────────────────────────────────────────
    async sendToKitchen(orderId) {
      const order = await this.db.get('orders', orderId);
      if (!order) throw new Error('Order not found');
      order.status = ORDER_STATUS.SENT_TO_KITCHEN;
      order.updatedAt = now();
      await this.db.put('orders', order);
      this._queueSync('UPDATE', 'orders', order);
      this._emit('orderChange', order);
      return order;
    }

    async requestPayment(orderId) {
      const order = await this.db.get('orders', orderId);
      if (!order) throw new Error('Order not found');
      order.status = ORDER_STATUS.WAITING_PAYMENT;
      order.updatedAt = now();
      await this.db.put('orders', order);

      // Update table status
      await this._transitionTable(order.tableId, TABLE_STATUS.WAITING_PAYMENT);

      this._queueSync('UPDATE', 'orders', order);
      this._emit('orderChange', order);
      return order;
    }

    async markPaid(orderId, paymentMethod, amountPaid = null) {
      const order = await this.db.get('orders', orderId);
      if (!order) throw new Error('Order not found');

      order.status = ORDER_STATUS.PAID;
      order.paymentMethod = paymentMethod;
      order.paidAt = now();
      order.amountPaid = amountPaid || order.total;
      order.updatedAt = now();
      await this.db.put('orders', order);

      await this._transitionTable(order.tableId, TABLE_STATUS.PAID);

      this._queueSync('UPDATE', 'orders', order);
      this._emit('orderChange', order);
      return order;
    }

    async closeTable(tableId) {
      const table = await this.db.get('tables', tableId);
      if (!table) throw new Error('Table not found');

      // Archive the order
      if (table.currentOrderId) {
        const order = await this.db.get('orders', table.currentOrderId);
        if (order) {
          order.status = ORDER_STATUS.CLOSED;
          order.updatedAt = now();
          // Move to archive
          await this.db.put('archive', order);
          await this.db.delete('orders', table.currentOrderId);
          this._queueSync('DELETE', 'orders', { id: table.currentOrderId });
        }
      }

      // Reset table
      table.status = TABLE_STATUS.CLOSED;
      // Then immediately to FREE
      await this.db.put('tables', table);
      await this._transitionTable(tableId, TABLE_STATUS.FREE);
      table.currentOrderId = null;
      table.updatedAt = now();
      await this.db.put('tables', table);

      this._emit('tableChange', table);
      return table;
    }

    // ── Recalculate order totals ────────────────────────────────
    _recalcOrder(order) {
      order.subtotal = order.items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

      if (order.discountType === 'percent') {
        order.discountAmount = order.subtotal * (order.discount || 0) / 100;
      } else {
        order.discountAmount = Math.min(order.discount || 0, order.subtotal);
      }

      const afterDiscount = order.subtotal - order.discountAmount;
      order.taxRate = order.taxRate || 14;
      order.tax = afterDiscount * (order.taxRate / 100);
      order.total = afterDiscount + order.tax;
    }

    // ── Sync Queue (Offline Support) ───────────────────────────
    async _queueSync(action, store, data) {
      try {
        await this.db.put('sync_queue', {
          action,
          store,
          data: JSON.parse(JSON.stringify(data)),
          timestamp: now(),
          synced: false,
          retries: 0
        });
      } catch (e) {
        console.warn('Queue save failed (non-fatal):', e);
        // If IndexedDB is full, save to localStorage fallback
        try {
          const fallback = JSON.parse(localStorage.getItem('lucca_sync_fallback') || '[]');
          fallback.push({ action, store, data, timestamp: now() });
          localStorage.setItem('lucca_sync_fallback', JSON.stringify(fallback.slice(-100)));
        } catch (e2) { /* give up */ }
      }
      this._attemptSync();
    }

    async _attemptSync() {
      if (!navigator.onLine) return;
      const items = await this.db.getByIndex('sync_queue', 'synced', false);
      for (const item of items) {
        try {
          const baseUrl = localStorage.getItem('luccaServerUrl') || 'http://localhost:3000';
          let res;
          if (item.action === 'CREATE') {
            res = await fetch(`${baseUrl}/api/pos/${item.store}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            });
          } else if (item.action === 'UPDATE') {
            res = await fetch(`${baseUrl}/api/pos/${item.store}/${item.data.id}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            });
          } else if (item.action === 'DELETE') {
            res = await fetch(`${baseUrl}/api/pos/${item.store}/${item.data.id}`, {
              method: 'DELETE'
            });
          }
          if (res && res.ok) {
            await this.db.delete('sync_queue', item.id);
          }
        } catch (e) {
          item.retries = (item.retries || 0) + 1;
          if (item.retries < 10) {
            item.synced = false;
            await this.db.put('sync_queue', item);
          } else {
            // Give up after 10 retries — mark as synced to prevent infinite loop
            await this.db.delete('sync_queue', item.id);
          }
        }
      }
    }

    async _processSyncQueue() {
      // Process any localStorage fallback items
      try {
        const fallback = JSON.parse(localStorage.getItem('lucca_sync_fallback') || '[]');
        if (fallback.length) {
          for (const item of fallback) {
            await this.db.put('sync_queue', { ...item, synced: false, retries: 0 });
          }
          localStorage.removeItem('lucca_sync_fallback');
        }
      } catch (e) { /* ignore */ }

      if (navigator.onLine) this._attemptSync();
    }

    // ── Order history ──────────────────────────────────────────
    async getArchivedOrders() {
      return this.db.getAll('archive');
    }

    async getDailySales() {
      const orders = await this.db.getAll('archive');
      const today = now().split('T')[0];
      return orders.filter(o => o.createdAt && o.createdAt.startsWith(today) && o.status === ORDER_STATUS.PAID);
    }

    async getDateRangeSales(from, to) {
      const orders = await this.db.getAll('archive');
      return orders.filter(o => {
        const d = (o.createdAt || '').split('T')[0];
        return d >= from && d <= to && o.status === ORDER_STATUS.PAID;
      });
    }
  }

  // ─── Menu Catalog Loader ─────────────────────────────────────
  function buildMenuCatalog() {
    if (typeof menuData !== 'undefined' && Array.isArray(menuData)) {
      return menuData;
    }
    if (typeof sharedMenuCatalog !== 'undefined' && Array.isArray(sharedMenuCatalog)) {
      return sharedMenuCatalog;
    }
    return [];
  }

  // ─── Instance ────────────────────────────────────────────────
  let instance = null;

  async function getInstance() {
    if (!instance) {
      instance = new PosEngine();
      await instance.init();
    }
    return instance;
  }

  return {
    getInstance,
    TABLE_STATUS,
    ORDER_STATUS,
    buildMenuCatalog,
    uuid,
    currentUser: null
  };
})();
