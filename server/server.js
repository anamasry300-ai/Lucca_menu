const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'db.json');
const API_KEY_FILE = path.join(__dirname, '.api_key');
const SECRET_KEY = process.env.SECRET_KEY || (fs.existsSync(API_KEY_FILE) ? fs.readFileSync(API_KEY_FILE, 'utf8').trim() : crypto.randomBytes(32).toString('hex'));


if (!fs.existsSync(API_KEY_FILE)) {
    fs.writeFileSync(API_KEY_FILE, SECRET_KEY);
}

// ==================== In-memory Sessions ====================
const sessions = new Map();
const SESSION_COOKIE = 'lucca_session';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// ==================== Password Hashing ====================
const HASH_ITERATIONS = 100000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');
}

function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

// ==================== Security Middleware ====================

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://www.gstatic.com", "https:"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://api.qrserver.com", "https:"],
            connectSrc: ["'self'", "https:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: { error: 'كثرة الطلبات - حاول بعد دقيقة' },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'محاولات كثيرة - انتظر 15 دقيقة' }
});

const syncLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 30,
    message: { error: 'كثرة المزامنة - انتظر 5 دقائق' }
});

app.use('/api', apiLimiter);
app.post('/api/login', authLimiter);
app.post('/api/sync', syncLimiter);

app.use(express.json({ limit: '1mb' }));

app.set('trust proxy', 1);


// ==================== API Key Validation ====================
function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'مفتاح API مطلوب (x-api-key header)' });
    }
    if (apiKey !== SECRET_KEY) {
        return res.status(403).json({ error: 'مفتاح API غير صحيح' });
    }
    next();
}

// ==================== Session Auth ====================
function createSession(user) {
    const token = generateSessionToken();
    const session = { user, token, createdAt: Date.now() };
    sessions.set(token, session);
    return token;
}

function getSession(token) {
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() - session.createdAt > SESSION_MAX_AGE) {
        sessions.delete(token);
        return null;
    }
    return session;
}

function requireAuth(req, res, next) {
    const token = req.cookies?.[SESSION_COOKIE] || req.headers['authorization']?.replace('Bearer ', '');
    const session = getSession(token);
    if (!session) {
        if (req.headers.accept?.includes('text/html')) {
            return res.redirect('/login.html');
        }
        return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
    }
    req.user = session.user;
    next();
}

function requireRole(role) {
    return (req, res, next) => {
        if (req.user?.role !== role && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح بهذا الإجراء' });
        }
        next();
    };
}

// Cookie parser middleware (simple, no dependencies)
app.use((req, res, next) => {
    req.cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        cookieHeader.split(';').forEach(c => {
            const [key, ...val] = c.trim().split('=');
            req.cookies[key] = decodeURIComponent(val.join('='));
        });
    }
    next();
});

// ==================== Input Validation ====================
const VALID_COLLECTIONS = ['orders', 'tables', 'customers', 'users', 'inventory', 'purchases', 'employees', 'attendance', 'settings'];
const WRITABLE_COLLECTIONS = ['orders', 'tables', 'customers', 'inventory', 'purchases', 'employees', 'attendance', 'settings'];

function validateCollection(col) {
    return VALID_COLLECTIONS.includes(col);
}

function sanitizeString(val, maxLen = 500) {
    if (typeof val !== 'string') return '';
    return val.slice(0, maxLen);
}

// ==================== Serve Static Files ====================

// Login page - no auth
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'login.html'));
});

// Admin files require auth (except shared scripts)
const ADMIN_NO_AUTH = ['/login.html', '/', '/database.js', '/styles.css'];
app.use('/admin', (req, res, next) => {
    if (ADMIN_NO_AUTH.includes(req.path)) {
        return next();
    }
    const token = req.cookies?.[SESSION_COOKIE] || req.headers['authorization']?.replace('Bearer ', '');
    const session = getSession(token);
    if (!session) {
        return res.redirect('/login.html');
    }
    req.user = session.user;
    next();
});

app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Menu files - no auth required
app.use('/menu', express.static(path.join(__dirname, '..', 'menu')));

// ==================== Auth API ====================

// POST /api/login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    }

    const db = readDB();
    const users = db.users || [];
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور خطأ' });
    }

    // Support both hashed and legacy plaintext passwords
    let valid = false;
    if (user.password.startsWith('pbkdf2:')) {
        const parts = user.password.split(':');
        const salt = parts[1];
        const storedHash = parts[2];
        const computedHash = hashPassword(password, salt);
        valid = (computedHash === storedHash);
    } else {
        valid = (user.password === password);
        // Migrate to hashed password on successful login
        if (valid) {
            const salt = generateSalt();
            user.password = 'pbkdf2:' + salt + ':' + hashPassword(password, salt);
            const idx = db.users.findIndex(u => u.id === user.id);
            db.users[idx] = user;
            writeDB(db);
        }
    }

    if (!valid) {
        return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور خطأ' });
    }

    const token = createSession(user);
    const safeUser = { id: user.id, username: user.username, name: user.name, role: user.role };

    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
    res.json({
        user: safeUser,
        token,
        apiKey: SECRET_KEY
    });
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE] || req.headers['authorization']?.replace('Bearer ', '');
    if (token) sessions.delete(token);
    res.json({ success: true });
});

// GET /api/me
app.get('/api/me', (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE] || req.headers['authorization']?.replace('Bearer ', '');
    const session = getSession(token);
    if (!session) return res.status(401).json({ error: 'غير مصرح' });
    res.json({ user: session.user });
});

// POST /api/change-password
app.post('/api/change-password', (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE] || req.headers['authorization']?.replace('Bearer ', '');
    const session = getSession(token);
    if (!session) return res.status(401).json({ error: 'غير مصرح' });

    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'كلمة المرور القديمة والجديدة مطلوبتان' });
    }
    if (newPassword.length < 4) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل' });
    }

    const db = readDB();
    const user = db.users.find(u => u.id === session.user.id);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    let valid = false;
    if (user.password.startsWith('pbkdf2:')) {
        const parts = user.password.split(':');
        valid = (hashPassword(oldPassword, parts[1]) === parts[2]);
    } else {
        valid = (user.password === oldPassword);
    }

    if (!valid) return res.status(401).json({ error: 'كلمة المرور القديمة غير صحيحة' });

    const salt = generateSalt();
    user.password = 'pbkdf2:' + salt + ':' + hashPassword(newPassword, salt);
    const idx = db.users.findIndex(u => u.id === user.id);
    db.users[idx] = user;
    writeDB(db);

    res.json({ success: true, message: 'تم تغيير كلمة المرور' });
});

// ==================== PostgreSQL Support (Cloud Deployment) ====================
let pgPool = null;

async function initPostgres() {
    const { Pool } = require('pg');
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS store (
            collection TEXT NOT NULL,
            id INTEGER NOT NULL,
            data JSONB NOT NULL,
            PRIMARY KEY (collection, id)
        )
    `);
    console.log('✅ PostgreSQL connected');
    const result = await pgPool.query('SELECT collection, id, data FROM store ORDER BY collection, id');
    const db = { orders: [], tables: [], customers: [], users: [], inventory: [], purchases: [], employees: [], attendance: [], settings: [] };
    for (const row of result.rows) {
        if (!db[row.collection]) db[row.collection] = [];
        db[row.collection].push({ id: row.id, ...row.data });
    }
    writeDB(db);
    console.log('✅ Data imported from PostgreSQL');
}

async function pgWriteDB(data) {
    if (!pgPool) return;
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM store');
        for (const [collection, items] of Object.entries(data)) {
            if (!Array.isArray(items)) continue;
            for (const item of items) {
                const { id, ...rest } = item;
                await client.query(
                    'INSERT INTO store (collection, id, data) VALUES ($1, $2, $3) ON CONFLICT (collection, id) DO UPDATE SET data = $3',
                    [collection, id, JSON.stringify(rest)]
                );
            }
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

// ==================== Database ====================
function readDB() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const defaultDB = { orders: [], tables: [], customers: [], users: [], inventory: [], purchases: [], employees: [], attendance: [], settings: [] };
            fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
            return defaultDB;
        }
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('DB read error:', e.message);
        return { orders: [], tables: [], customers: [], users: [], inventory: [], purchases: [], employees: [], attendance: [], settings: [] };
    }
}

function writeDB(data) {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, DB_FILE);
    if (pgPool) {
        pgWriteDB(data).catch(e => console.error('PostgreSQL write error:', e.message));
    }
}

function getNextId(collection) {
    const db = readDB();
    const items = db[collection] || [];
    return items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
}

// ==================== Schema Validation ====================
const COLLECTION_SCHEMAS = {
    orders: { allowFields: ['id', 'tableId', 'items', 'customerName', 'customerPhone', 'paymentMethod', 'customerNotes', 'invoiceDelivery', 'marketingOptIn', 'wantsWhatsappInvoice', 'status', 'subtotal', 'tax', 'total', 'discount', 'discountAmount', 'discountType', 'date', 'createdBy'] },
    users: { allowFields: ['id', 'username', 'password', 'name', 'role', 'createdAt'] },
    customers: { allowFields: ['id', 'phone', 'name', 'visits', 'lastVisit', 'totalSpent', 'marketingOptIn', 'preferredChannel', 'createdAt'] },
    tables: { allowFields: ['id', 'number', 'status', 'capacity', 'currentOrder'] },
    settings: { allowFields: ['id', 'key', 'value'] },
    inventory: { allowFields: ['id', 'name', 'quantity', 'unit', 'price', 'createdAt', 'lastUpdated'] },
    purchases: { allowFields: ['id', 'item', 'quantity', 'costPrice', 'sellingPrice', 'supplier', 'date'] },
    employees: { allowFields: ['id', 'name', 'phone', 'role', 'salary', 'active', 'createdAt'] },
    attendance: { allowFields: ['id', 'employeeId', 'date', 'checkIn', 'checkOut', 'hoursWorked', 'notes'] }
};

function sanitizeItem(col, item) {
    const schema = COLLECTION_SCHEMAS[col];
    if (!schema) return item;
    const sanitized = {};
    for (const key of Object.keys(item)) {
        if (schema.allowFields.includes(key)) {
            sanitized[key] = item[key];
        }
    }
    return sanitized;
}

// ==================== REST API ====================

VALID_COLLECTIONS.forEach(col => {
    const isSensitive = (col === 'users');

    app.get(`/api/${col}`, (req, res) => {
        if (isSensitive) {
            const token = req.cookies?.[SESSION_COOKIE] || req.headers['authorization']?.replace('Bearer ', '');
            const session = getSession(token);
            if (!session) return res.status(401).json({ error: 'غير مصرح' });
        }
        const db = readDB();
        const data = db[col] || [];
        const { status, tableId, date, phone } = req.query;
        let filtered = [...data];
        if (status) filtered = filtered.filter(i => i.status === status);
        if (tableId) filtered = filtered.filter(i => i.tableId == tableId);
        if (date) filtered = filtered.filter(i => (i.date || '').startsWith(date));
        if (phone) filtered = filtered.filter(i => (i.customerPhone || '').includes(phone));
        res.json(filtered);
    });

    app.get(`/api/${col}/:id`, (req, res) => {
        if (isSensitive) {
            const token = req.cookies?.[SESSION_COOKIE] || req.headers['authorization']?.replace('Bearer ', '');
            const session = getSession(token);
            if (!session) return res.status(401).json({ error: 'غير مصرح' });
        }
        const db = readDB();
        const item = (db[col] || []).find(i => i.id == req.params.id);
        item ? res.json(item) : res.status(404).json({ error: 'غير موجود' });
    });

    app.post(`/api/${col}`, validateApiKey, (req, res) => {
        if (!WRITABLE_COLLECTIONS.includes(col)) {
            return res.status(403).json({ error: 'لا يمكن الكتابة على هذه المجموعة' });
        }
        const db = readDB();
        const item = { id: getNextId(col), ...sanitizeItem(col, req.body) };
        if (!db[col]) db[col] = [];
        db[col].push(item);
        writeDB(db);
        res.status(201).json(item);
    });

    app.put(`/api/${col}/:id`, validateApiKey, (req, res) => {
        if (!WRITABLE_COLLECTIONS.includes(col)) {
            return res.status(403).json({ error: 'لا يمكن الكتابة على هذه المجموعة' });
        }
        const db = readDB();
        const index = (db[col] || []).findIndex(i => i.id == req.params.id);
        if (index === -1) return res.status(404).json({ error: 'غير موجود' });
        const sanitized = sanitizeItem(col, { ...req.body, id: db[col][index].id });
        db[col][index] = { ...db[col][index], ...sanitized };
        writeDB(db);
        res.json(db[col][index]);
    });

    app.delete(`/api/${col}/:id`, validateApiKey, (req, res) => {
        if (!WRITABLE_COLLECTIONS.includes(col)) {
            return res.status(403).json({ error: 'لا يمكن الكتابة على هذه المجموعة' });
        }
        const db = readDB();
        const index = (db[col] || []).findIndex(i => i.id == req.params.id);
        if (index === -1) return res.status(404).json({ error: 'غير موجود' });
        db[col].splice(index, 1);
        writeDB(db);
        res.json({ success: true });
    });
});

// Sync endpoint - validate structure
app.post('/api/sync', validateApiKey, (req, res) => {
    const data = req.body;
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'بيانات غير صالحة' });

    const allowedCollections = ['orders', 'tables', 'customers', 'inventory', 'purchases', 'employees', 'attendance', 'settings'];
    const cleaned = {};
    for (const col of allowedCollections) {
        if (Array.isArray(data[col])) {
            cleaned[col] = data[col].map(item => sanitizeItem(col, item));
        }
    }
    // Preserve users from existing DB (don't overwrite with sync)
    const existing = readDB();
    cleaned.users = existing.users || [];

    // Preserve settings keys that shouldn't be overwritten
    const protectedSettings = ['sharedMenuCatalog'];
    const existingSettings = existing.settings || [];
    if (cleaned.settings) {
        cleaned.settings = cleaned.settings.filter(s => !protectedSettings.includes(s.key));
        const protectedOnes = existingSettings.filter(s => protectedSettings.includes(s.key));
        cleaned.settings = [...cleaned.settings, ...protectedOnes];
    }

    writeDB(cleaned);
    res.json({ success: true, message: 'تم حفظ البيانات بنجاح' });
});

// Public key endpoint - no auth required (for menu page / client-side use)
app.get('/api/public-key', (req, res) => {
    res.json({ apiKey: SECRET_KEY });
});

// GET /api/key - protected by session auth
app.get('/api/key', (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE] || req.headers['authorization']?.replace('Bearer ', '');
    const session = getSession(token);
    if (!session) return res.status(401).json({ error: 'غير مصرح' });
    res.json({ apiKey: SECRET_KEY });
});

// Reports
app.get('/api/reports/daily', (req, res) => {
    const db = readDB();
    const orders = db.orders || [];
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => (o.date || '').startsWith(today));
    const total = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
    res.json({ date: today, orders: todayOrders.length, total, ordersList: todayOrders });
});

app.get('/api/reports/monthly', (req, res) => {
    const db = readDB();
    const orders = db.orders || [];
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthOrders = orders.filter(o => (o.date || '').startsWith(monthKey));
    const total = monthOrders.reduce((s, o) => s + (o.total || 0), 0);
    const byPayment = {};
    monthOrders.forEach(o => { const p = o.paymentMethod || 'cash'; byPayment[p] = (byPayment[p] || 0) + (o.total || 0); });
    res.json({ month: monthKey, orders: monthOrders.length, total, byPayment, ordersList: monthOrders });
});

app.get('/api/reports/period', (req, res) => {
    const db = readDB();
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to required (YYYY-MM-DD)' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return res.status(400).json({ error: 'صيغة التاريخ غير صالحة (YYYY-MM-DD)' });
    }
    const orders = (db.orders || []).filter(o => {
        const d = (o.date || '').split('T')[0];
        return d >= from && d <= to;
    });
    const total = orders.reduce((s, o) => s + (o.total || 0), 0);
    const byPayment = {};
    orders.forEach(o => { const p = o.paymentMethod || 'cash'; byPayment[p] = (byPayment[p] || 0) + (o.total || 0); });
    res.json({ from, to, orders: orders.length, total, byPayment, ordersList: orders });
});

// ==================== Default Admin with Hashed Password ====================
function ensureDefaultAdmin() {
    const db = readDB();
    const users = db.users || [];
    if (users.length === 0) {
        const salt = generateSalt();
        db.users.push({
            id: 1,
            username: 'admin',
            password: 'pbkdf2:' + salt + ':' + hashPassword('123456', salt),
            name: 'مدير النظام',
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        writeDB(db);
        console.log('✅ تم إنشاء حساب admin افتراضي');
        console.log('   ⚠️  يرجى تغيير كلمة المرور من لوحة التحكم');
    } else {
        // Migrate legacy plaintext passwords
        let migrated = false;
        db.users.forEach(user => {
            if (user.password && !user.password.startsWith('pbkdf2:')) {
                const salt = generateSalt();
                user.password = 'pbkdf2:' + salt + ':' + hashPassword(user.password, salt);
                migrated = true;
            }
        });
        if (migrated) {
            writeDB(db);
            console.log('✅ تم ترحيل الباسوردات إلى التشفير');
        }
    }
}

// ==================== Start Server ====================
async function startServer() {
    if (process.env.DATABASE_URL) {
        try {
            await initPostgres();
        } catch (e) {
            console.error('PostgreSQL init error:', e.message);
        }
    }
    ensureDefaultAdmin();

// ==================== Root Page ====================
app.get('/', (req, res) => {
    const host = req.headers.host || 'localhost:3000';
    const menuUrl = `${req.protocol}://${host}/menu/index.html`;
    res.send(`
        <html dir="rtl"><head><meta charset="utf-8"><title>Lucca Caffè Server</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Segoe UI',sans-serif;background:#F5F1E8;text-align:center;padding:30px 20px;color:#3E2723;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;}
        h1{font-size:2.8rem;color:#C85A3E;margin-bottom:5px;letter-spacing:2px;}
        .sub{color:#697259;font-size:1.1rem;margin-bottom:30px;}
        .card{background:white;border-radius:16px;padding:25px;box-shadow:0 10px 40px rgba(0,0,0,0.1);max-width:400px;width:100%;margin:10px;}
        a{display:block;padding:14px;margin:10px 0;border-radius:10px;font-size:1.1rem;text-decoration:none;font-weight:600;transition:0.3s;}
        .menu-link{background:#C85A3E;color:white;}
        .menu-link:hover{background:#A74632;transform:translateY(-2px);}
        .admin-link{background:#3E2723;color:white;}
        .admin-link:hover{background:#5a3d35;transform:translateY(-2px);}
        .qr{background:#f9f6f0;padding:20px;border-radius:12px;margin:15px 0;}
        .qr img{width:150px;height:150px;border-radius:8px;}
        .footer{margin-top:30px;color:#999;font-size:0.85rem;}
        </style>
        </head><body>
        <h1>LUCCA</h1>
        <p class="sub">Caffè Italiano</p>
        <div class="card">
            <div class="qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(menuUrl)}" alt="QR"></div>
            <p style="margin-bottom:15px;color:#697259;">📱 امسح الكود أو افتح الرابط للطلب</p>
            <a class="menu-link" href="/menu/index.html">🍕 المنيو التفاعلي</a>
            <a class="admin-link" href="/login.html">🔐 تسجيل الدخول</a>
        </div>
        <div class="footer">${host} - Lucca Caffè System</div>
        </body></html>
    `);
});

const certDir = path.join(__dirname, 'certs');
const hasCerts = fs.existsSync(path.join(certDir, 'cert.pem')) && fs.existsSync(path.join(certDir, 'key.pem'));

const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`☕ Lucca Caffè Server running on:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    const os = require('os');
    const ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(ifname => {
        ifaces[ifname].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`   Network: http://${iface.address}:${PORT}`);
            }
        });
    });
    if (hasCerts) {
        console.log(`\n🔒 HTTPS Server:`);
        console.log(`   Local:   https://localhost:${HTTPS_PORT}`);
        Object.keys(ifaces).forEach(ifname => {
            ifaces[ifname].forEach(iface => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`   Network: https://${iface.address}:${HTTPS_PORT}`);
                }
            });
        });
    }
    console.log(`\n📋 Admin Panel: http://localhost:${PORT}/login.html`);
    console.log(`📋 Menu:        http://localhost:${PORT}/menu/index.html`);
    console.log(`\n🔒 Security:`);
    console.log(`   ✅ Helmet with CSP active`);
    console.log(`   ✅ Rate limiting active`);
    console.log(`   ✅ API Key for external writes`);
    console.log(`   ✅ Session-based admin auth`);
    console.log(`   ✅ PBKDF2 password hashing`);
    console.log(`   ⚠️  API key required for all writes`);

    if (process.argv.includes('--tunnel') || process.argv.includes('--public')) {
        try {
            const localtunnel = require('localtunnel');
            (async () => {
                const tunnel = await localtunnel({ port: PORT });
                const url = tunnel.url;
                console.log(`\n🌐 Public URL: ${url}`);
                fs.writeFileSync(path.join(__dirname, 'tunnel-url.txt'), url);
                tunnel.on('close', () => {
                    console.log('🔴 Tunnel closed');
                    try { fs.unlinkSync(path.join(__dirname, 'tunnel-url.txt')); } catch(e) {}
                });
            })();
        } catch (e) {
            console.log('⚠️  localtunnel not available, install with: npm install localtunnel');
        }
    }
});

// Create HTTPS server if certs available
if (hasCerts) {
    const httpsOptions = {
        cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
        key: fs.readFileSync(path.join(certDir, 'key.pem'))
    };
    https.createServer(httpsOptions, app).listen(HTTPS_PORT, '0.0.0.0', () => {
        console.log(`✅ HTTPS server started on port ${HTTPS_PORT}`);
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Server shutting down...');
    server.close(() => process.exit(0));
});

}

startServer();
