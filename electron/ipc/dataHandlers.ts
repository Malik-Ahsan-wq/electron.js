/**
 * dataHandlers.ts — Import / Export / Backup IPC handlers.
 *
 * Channels:
 *   data:exportJSON   → returns serialised JSON string of all user data
 *   data:exportCSV    → returns CSV string of todos
 *   data:importJSON   → accepts JSON string, merges data, returns { success }
 *   data:backupDB     → copies raw .db file to user-chosen path via dialog
 *   data:restoreDB    → replaces DB from a backup file via dialog
 */
import { IpcMain, app, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { getDb, persist, initDb } from '../db/database';
import { queryAll } from '../db/database';
import { logger } from '../logger';

interface TodoRow {
  id: number; user_id: number; title: string; description: string | null;
  priority: string; status: string; category_id: number | null;
  due_date: string | null; due_time: string | null; position: number;
  deleted: number; created_at: string; updated_at: string;
}
interface CategoryRow { id: number; user_id: number; name: string; color: string; }

/** Escape a CSV cell value. */
function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s;
}

export function registerDataHandlers(ipcMain: IpcMain): void {

  /* ── Export JSON ─────────────────────────────────────────────────────────── */
  ipcMain.handle('data:exportJSON', (_e, userId: number) => {
    try {
      const todos      = queryAll<TodoRow>('SELECT * FROM todos WHERE user_id = ?', [userId]);
      const categories = queryAll<CategoryRow>('SELECT * FROM categories WHERE user_id = ?', [userId]);
      const payload    = JSON.stringify({ todos, categories, exportedAt: new Date().toISOString() }, null, 2);
      logger.info('data:exportJSON', { userId, count: todos.length });
      return { success: true, data: payload };
    } catch (err) {
      logger.error('data:exportJSON failed', err);
      return { success: false, error: String(err) };
    }
  });

  /* ── Export CSV ──────────────────────────────────────────────────────────── */
  ipcMain.handle('data:exportCSV', (_e, userId: number) => {
    try {
      const todos = queryAll<TodoRow>(
        `SELECT t.*, c.name as category_name FROM todos t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = ? AND t.deleted = 0 ORDER BY t.position`,
        [userId]
      );
      const headers = ['id','title','description','priority','status','category_name','due_date','due_time','created_at'];
      const rows    = todos.map(t =>
        headers.map(h => csvCell((t as unknown as Record<string, unknown>)[h])).join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      logger.info('data:exportCSV', { userId, rows: todos.length });
      return { success: true, data: csv };
    } catch (err) {
      logger.error('data:exportCSV failed', err);
      return { success: false, error: String(err) };
    }
  });

  /* ── Import JSON ─────────────────────────────────────────────────────────── */
  ipcMain.handle('data:importJSON', (_e, userId: number, jsonStr: string) => {
    try {
      const payload = JSON.parse(jsonStr) as { todos: TodoRow[]; categories: CategoryRow[] };
      const db = getDb();

      // Import categories first (preserve mapping)
      const catIdMap = new Map<number, number>();
      for (const c of (payload.categories ?? [])) {
        const existing = db.prepare('SELECT id FROM categories WHERE user_id = ? AND name = ?');
        existing.bind([userId, c.name]);
        if (existing.step()) {
          catIdMap.set(c.id, (existing.getAsObject() as { id: number }).id);
          existing.free();
        } else {
          existing.free();
          db.run('INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)', [userId, c.name, c.color]);
          const newCat = db.prepare('SELECT id FROM categories WHERE user_id = ? ORDER BY id DESC LIMIT 1');
          newCat.bind([userId]);
          newCat.step();
          const newId = (newCat.getAsObject() as { id: number }).id;
          newCat.free();
          catIdMap.set(c.id, newId);
        }
      }

      // Import todos (skip duplicates by title + created_at)
      let imported = 0;
      for (const t of (payload.todos ?? [])) {
        const dup = db.prepare('SELECT id FROM todos WHERE user_id = ? AND title = ? AND created_at = ?');
        dup.bind([userId, t.title, t.created_at]);
        const isDup = dup.step();
        dup.free();
        if (isDup) continue;

        const newCatId = t.category_id != null ? (catIdMap.get(t.category_id) ?? null) : null;
        db.run(
          `INSERT INTO todos (user_id, title, description, priority, status, category_id, due_date, due_time, position, deleted, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, t.title, t.description ?? null, t.priority, t.status, newCatId,
           t.due_date ?? null, t.due_time ?? null, t.position, t.deleted ?? 0, t.created_at, t.updated_at]
        );
        imported++;
      }

      persist();
      logger.info('data:importJSON', { userId, imported });
      return { success: true, imported };
    } catch (err) {
      logger.error('data:importJSON failed', err);
      return { success: false, error: String(err) };
    }
  });

  /* ── Backup DB (save dialog) ─────────────────────────────────────────────── */
  ipcMain.handle('data:backupDB', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(win!, {
      title: 'Save Database Backup',
      defaultPath: `todo-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });
    if (result.canceled || !result.filePath) return { success: false, canceled: true };
    try {
      const data = getDb().export();
      fs.writeFileSync(result.filePath, Buffer.from(data));
      logger.info('data:backupDB', { path: result.filePath });
      return { success: true, path: result.filePath };
    } catch (err) {
      logger.error('data:backupDB failed', err);
      return { success: false, error: String(err) };
    }
  });

  /* ── Restore DB (open dialog) ────────────────────────────────────────────── */
  ipcMain.handle('data:restoreDB', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, {
      title: 'Restore Database Backup',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) return { success: false, canceled: true };
    try {
      const dbPath = path.join(app.getPath('userData'), 'app.db');
      fs.copyFileSync(result.filePaths[0], dbPath);
      await initDb(); // reload DB into memory
      logger.info('data:restoreDB', { from: result.filePaths[0] });
      return { success: true };
    } catch (err) {
      logger.error('data:restoreDB failed', err);
      return { success: false, error: String(err) };
    }
  });

  /* ── Save file dialog helper (used by renderer for JSON/CSV) ─────────────── */
  ipcMain.handle('data:saveFile', async (_e, filename: string, content: string) => {
    const win = BrowserWindow.getFocusedWindow();
    const ext  = filename.split('.').pop() ?? 'txt';
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: filename,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    });
    if (result.canceled || !result.filePath) return { success: false, canceled: true };
    try {
      fs.writeFileSync(result.filePath, content, 'utf-8');
      return { success: true, path: result.filePath };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}
