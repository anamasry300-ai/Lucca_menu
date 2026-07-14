const express = require('express');
const multer = require('multer');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'menu', 'menu-data.json');
const IMAGES_DIR = path.join(__dirname, 'menu', 'images');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lucca2024';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'lucca-secret-2024', resave: false, saveUninitialized: true }));
app.use('/menu', express.static(path.join(__dirname, 'menu')));

// Serve main menu at root
app.get('/', (req, res) => res.redirect('/menu/'));

// ========== AUTH ==========
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  if (req.path.startsWith('/api/') && !req.path.startsWith('/api/login')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ========== API: Login ==========
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Wrong password' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// ========== API: Menu Data ==========
app.get('/api/menu', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/menu', requireAuth, (req, res) => {
  try {
    const data = req.body;
    // Validate
    if (!data.items || !data.categories || !data.calories) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== API: Image Upload ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const catId = req.params.catId;
    const dir = path.join(IMAGES_DIR, catId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, req.params.filename);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images'));
    cb(null, true);
  }
});

app.post('/api/upload/:catId/:filename', requireAuth, upload.single('image'), (req, res) => {
  res.json({ success: true, path: `menu/images/${req.params.catId}/${req.params.filename}` });
});

app.delete('/api/image/:catId/:filename', requireAuth, (req, res) => {
  const fp = path.join(IMAGES_DIR, req.params.catId, req.params.filename);
  try {
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== Admin Panel ==========
app.get('/admin', (req, res) => {
  if (!req.session.authenticated) {
    return res.sendFile(path.join(__dirname, 'admin', 'login.html'));
  }
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

app.get('/admin/*', (req, res) => {
  const fp = path.join(__dirname, 'admin', req.params[0]);
  if (fs.existsSync(fp)) return res.sendFile(fp);
  res.redirect('/admin');
});

// ========== Start ==========
app.listen(PORT, () => {
  console.log(`Lucca Menu Server running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}/admin`);
  console.log(`Default password: ${ADMIN_PASSWORD}`);
});
