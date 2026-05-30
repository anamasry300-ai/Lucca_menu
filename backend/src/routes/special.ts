import { Router, Request, Response } from 'express';
import { getDb, saveDb, queryAll, queryOne } from '../db.js';

const router = Router();

// === SHIFTS ===

router.get('/shifts', (_req: Request, res: Response) => {
  try {
    const rows = queryAll('SELECT * FROM shifts ORDER BY date DESC');
    res.json(rows);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/shifts/:date', (req: Request, res: Response) => {
  try {
    const row = queryOne('SELECT * FROM shifts WHERE date = ?', [req.params.date]);
    if (!row) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(row);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/shifts', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.date) { res.status(400).json({ error: 'date is required' }); return; }
    const db = getDb();
    const stmt = db.prepare(`INSERT OR REPLACE INTO shifts
      (date, openingBalance, status, openedAt, closedAt, actualCash, expectedCash, difference, cashSales, cardSales, totalSales, totalExpenses, orderCount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.bind([
      data.date,
      data.openingBalance ?? 0,
      data.status ?? 'open',
      data.openedAt || null,
      data.closedAt || null,
      data.actualCash ?? null,
      data.expectedCash ?? null,
      data.difference ?? null,
      data.cashSales ?? null,
      data.cardSales ?? null,
      data.totalSales ?? null,
      data.totalExpenses ?? null,
      data.orderCount ?? 0,
      data.notes || ''
    ]);
    stmt.step();
    stmt.free();
    saveDb();
    const created = queryOne('SELECT * FROM shifts WHERE date = ?', [data.date]);
    res.status(201).json(created);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.put('/shifts/:date', (req: Request, res: Response) => {
  try {
    const data = req.body;
    const date = req.params.date;
    const existing = queryOne('SELECT * FROM shifts WHERE date = ?', [date]);
    if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
    const merged = { ...existing, ...data, date };
    const db = getDb();
    const stmt = db.prepare(`INSERT OR REPLACE INTO shifts
      (date, openingBalance, status, openedAt, closedAt, actualCash, expectedCash, difference, cashSales, cardSales, totalSales, totalExpenses, orderCount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.bind([
      merged.date,
      merged.openingBalance ?? 0,
      merged.status ?? 'open',
      merged.openedAt || null,
      merged.closedAt || null,
      merged.actualCash ?? null,
      merged.expectedCash ?? null,
      merged.difference ?? null,
      merged.cashSales ?? null,
      merged.cardSales ?? null,
      merged.totalSales ?? null,
      merged.totalExpenses ?? null,
      merged.orderCount ?? 0,
      merged.notes || ''
    ]);
    stmt.step();
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete('/shifts/:date', (req: Request, res: Response) => {
  try {
    const db = getDb();
    db.run('DELETE FROM shifts WHERE date = ?', [req.params.date]);
    saveDb();
    res.json({ success: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// === SETTINGS ===

router.get('/settings', (_req: Request, res: Response) => {
  try {
    const rows = queryAll('SELECT * FROM settings');
    res.json(rows);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/settings/:key', (req: Request, res: Response) => {
  try {
    const row = queryOne('SELECT * FROM settings WHERE key = ?', [req.params.key]);
    if (!row) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(row);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/settings', (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key) { res.status(400).json({ error: 'key is required' }); return; }
    const db = getDb();
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value ?? '']);
    saveDb();
    const created = queryOne('SELECT * FROM settings WHERE key = ?', [key]);
    res.status(201).json(created);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
