import { Router, Request, Response } from 'express';
import { getDb, saveDb, queryAll, queryOne, insert, getLastInsertId } from '../db.js';

const router = Router();

const JSON_COLUMNS = new Set(['items']);

function parseRow(row: Record<string, unknown>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    if (JSON_COLUMNS.has(key) && typeof val === 'string') {
      try { obj[key] = JSON.parse(val as string); } catch { obj[key] = val; }
    } else {
      obj[key] = val;
    }
  }
  return obj;
}

function serializeRow(obj: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('_')) continue;
    if (JSON_COLUMNS.has(key) && Array.isArray(val)) {
      row[key] = JSON.stringify(val);
    } else {
      row[key] = val;
    }
  }
  return row;
}

const SAFE_TABLES = new Set([
  'users', 'tables', 'orders', 'customers',
  'inventory', 'purchases', 'employees', 'attendance', 'expenses'
]);

router.get('/:store', (req: Request, res: Response) => {
  const { store } = req.params;
  if (!SAFE_TABLES.has(store)) { res.status(400).json({ error: 'Invalid store' }); return; }
  try {
    const rows = queryAll(`SELECT * FROM \`${store}\` ORDER BY id`);
    res.json(rows.map(parseRow));
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/:store/:id', (req: Request, res: Response) => {
  const { store, id } = req.params;
  if (!SAFE_TABLES.has(store)) { res.status(400).json({ error: 'Invalid store' }); return; }
  try {
    const row = queryOne(`SELECT * FROM \`${store}\` WHERE id = ?`, [id]);
    if (!row) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(parseRow(row));
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/:store', (req: Request, res: Response) => {
  const { store } = req.params;
  if (!SAFE_TABLES.has(store)) { res.status(400).json({ error: 'Invalid store' }); return; }
  try {
    const data = serializeRow(req.body);
    const keys = Object.keys(data);
    if (keys.length === 0) { res.status(400).json({ error: 'No data' }); return; }
    const cols = keys.map(k => `\`${k}\``).join(', ');
    const vals = keys.map(() => '?').join(', ');
    const id = insert(`INSERT INTO \`${store}\` (${cols}) VALUES (${vals})`, keys.map(k => data[k]));
    const created = queryOne(`SELECT * FROM \`${store}\` WHERE id = ?`, [id || getLastInsertId()]);
    res.status(201).json(created ? parseRow(created) : { id });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.put('/:store/:id', (req: Request, res: Response) => {
  const { store, id } = req.params;
  if (!SAFE_TABLES.has(store)) { res.status(400).json({ error: 'Invalid store' }); return; }
  try {
    const data = serializeRow(req.body);
    const keys = Object.keys(data);
    if (keys.length === 0) { res.json({ success: true }); return; }
    const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
    const db = getDb();
    db.run(`UPDATE \`${store}\` SET ${sets} WHERE id = ?`, [...keys.map(k => data[k]), id]);
    saveDb();
    res.json({ success: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete('/:store/:id', (req: Request, res: Response) => {
  const { store, id } = req.params;
  if (!SAFE_TABLES.has(store)) { res.status(400).json({ error: 'Invalid store' }); return; }
  try {
    const db = getDb();
    db.run(`DELETE FROM \`${store}\` WHERE id = ?`, [id]);
    saveDb();
    res.json({ success: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
