const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'lucca-secret-key';
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const stores = ['users', 'tables', 'orders', 'customers', 'settings', 'inventory', 'purchases', 'employees', 'attendance', 'menuItems'];

function loadStore(name) {
    const filePath = path.join(DATA_DIR, `${name}.json`);
    if (fs.existsSync(filePath)) {
        try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
        catch(e) { return []; }
    }
    if (name === 'tables') {
        const defaultTables = [];
        for (let i = 1; i <= 14; i++) {
            defaultTables.push({ id: i, number: i, status: 'available', capacity: 4, currentOrder: null });
        }
        saveStore(name, defaultTables);
        return defaultTables;
    }
    return [];
}

function saveStore(name, data) {
    fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}

function requireApiKey(req, res, next) {
    const key = req.headers['x-api-key'];
    if (key === API_KEY) return next();
    return res.status(401).json({ error: 'Unauthorized' });
}

app.get('/api/public-key', (req, res) => {
    res.json({ apiKey: API_KEY });
});

stores.forEach(store => {
    app.get(`/api/${store}`, (req, res) => {
        res.json(loadStore(store));
    });

    app.post(`/api/${store}`, requireApiKey, (req, res) => {
        const data = loadStore(store);
        const item = req.body;
        if (!item.id || data.find(i => i.id === item.id)) {
            item.id = data.length > 0 ? Math.max(...data.map(i => i.id || 0)) + 1 : 1;
        }
        data.push(item);
        saveStore(store, data);
        res.json(item);
    });

    app.get(`/api/${store}/:id`, (req, res) => {
        const data = loadStore(store);
        const item = data.find(i => i.id == req.params.id);
        if (item) return res.json(item);
        return res.status(404).json({ error: 'Not found' });
    });

    app.put(`/api/${store}/:id`, requireApiKey, (req, res) => {
        const data = loadStore(store);
        const idx = data.findIndex(i => i.id == req.params.id);
        if (idx >= 0) {
            data[idx] = { ...data[idx], ...req.body };
            data[idx].id = parseInt(data[idx].id) || data[idx].id;
            saveStore(store, data);
            return res.json(data[idx]);
        }
        return res.status(404).json({ error: 'Not found' });
    });

    app.delete(`/api/${store}/:id`, requireApiKey, (req, res) => {
        let data = loadStore(store);
        const idx = data.findIndex(i => i.id == req.params.id);
        if (idx >= 0) {
            data.splice(idx, 1);
            saveStore(store, data);
            return res.json({ success: true });
        }
        return res.status(404).json({ error: 'Not found' });
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (req, res) => {
    res.json({
        name: 'Lucca Caffè Server',
        version: '1.0.0',
        endpoints: {
            public_key: '/api/public-key',
            health: '/health',
            sync: '/api/sync',
            stores: '/api/{users,tables,orders,customers,settings,inventory,purchases,employees,attendance}'
        }
    });
});

app.head('/api/tables', requireApiKey, (req, res) => {
    res.status(200).end();
});

function mergeStore(name, incoming) {
    if (!Array.isArray(incoming) || incoming.length === 0) return;
    const existing = loadStore(name);
    const merged = [...existing];
    incoming.forEach(item => {
        if (item.id) {
            const idx = merged.findIndex(i => i.id === item.id);
            if (idx >= 0) merged[idx] = { ...merged[idx], ...item };
            else merged.push(item);
        } else {
            item.id = merged.length > 0 ? Math.max(...merged.map(i => i.id || 0)) + 1 : 1;
            merged.push(item);
        }
    });
    console.log(`mergeStore(${name}): ${existing.length} -> ${merged.length} items`);
    saveStore(name, merged);
}

app.post('/api/sync', requireApiKey, (req, res) => {
    const { users, tables, orders, customers, settings, inventory, purchases, employees, attendance, menuItems } = req.body;
    mergeStore('users', users);
    mergeStore('tables', tables);
    mergeStore('orders', orders);
    mergeStore('customers', customers);
    mergeStore('settings', settings);
    mergeStore('inventory', inventory);
    mergeStore('purchases', purchases);
    mergeStore('employees', employees);
    mergeStore('attendance', attendance);
    mergeStore('menuItems', menuItems);
    res.json({ success: true, message: 'تم المزامنة بنجاح' });
});

app.get('/api/sync', requireApiKey, (req, res) => {
    const result = {};
    stores.forEach(s => { result[s] = loadStore(s); });
    res.json(result);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`☕ Lucca Caffè Server running on port ${PORT}`);
    console.log(`🔗 http://localhost:${PORT}`);
});
