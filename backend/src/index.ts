import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb, getDb, saveDb, closeDb } from './db.js';
import crudRoutes from './routes/crud.js';
import specialRoutes from './routes/special.js';

const PORT = parseInt(process.env.PORT || '3000');
const API_KEY = process.env.API_KEY || 'lucca-secret-key';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function apiKeyCheck(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.headers['x-api-key'] as string | undefined;
  if (key && key === API_KEY) return next();
  if (req.method === 'GET') return next();
  const token = req.headers['authorization']?.replace('Bearer ', '') || '';
  if (token === API_KEY) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

app.use('/api', apiKeyCheck);

app.get('/api/public-key', (_req, res) => {
  res.json({ apiKey: API_KEY });
});

app.use('/api', specialRoutes);
app.use('/api', crudRoutes);

// Sync: POST /api/sync
app.post('/api/sync', (req, res) => {
  try {
    const db = getDb();
    const data = req.body;
    const stores = ['users', 'tables', 'orders', 'customers', 'settings', 'inventory', 'purchases', 'employees', 'attendance', 'expenses', 'shifts'];
    for (const store of stores) {
      if (!Array.isArray(data[store])) continue;
      db.run(`DELETE FROM \`${store}\``);
      for (const item of data[store]) {
        const keys = Object.keys(item);
        const cols = keys.map(k => `\`${k}\``).join(', ');
        const vals = keys.map(() => '?').join(', ');
        try {
          db.run(`INSERT INTO \`${store}\` (${cols}) VALUES (${vals})`, keys.map(k => item[k]));
        } catch { /* skip conflicts */ }
      }
    }
    saveDb();
    res.json({ success: true, message: '✅ تم استيراد البيانات' });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Lucca Backend running on http://localhost:${PORT}`);
  });
});

process.on('SIGINT', () => { closeDb(); process.exit(0); });
process.on('SIGTERM', () => { closeDb(); process.exit(0); });
