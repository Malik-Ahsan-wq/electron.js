import { IpcMain } from 'electron';
import { getDb, persist, queryOne, queryAll } from '../db/database';

interface TodoRow {
  id: number; user_id: number; title: string; description: string | null;
  priority: string; status: string; category_id: number | null;
  due_date: string | null; due_time: string | null; position: number;
  deleted: number; created_at: string; updated_at: string;
}

interface CategoryRow { id: number; user_id: number; name: string; color: string; }

export function registerTodoHandlers(ipcMain: IpcMain): void {

  // ── Categories ──────────────────────────────────────────────────────────────
  ipcMain.handle('categories:list', (_e, userId: number) =>
    queryAll<CategoryRow>('SELECT * FROM categories WHERE user_id = ? ORDER BY name', [userId])
  );

  ipcMain.handle('categories:create', (_e, userId: number, name: string, color: string) => {
    getDb().run('INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)', [userId, name, color]);
    persist();
    return queryOne<CategoryRow>('SELECT * FROM categories WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  });

  ipcMain.handle('categories:update', (_e, id: number, name: string, color: string) => {
    getDb().run('UPDATE categories SET name = ?, color = ? WHERE id = ?', [name, color, id]);
    persist();
    return { success: true };
  });

  ipcMain.handle('categories:delete', (_e, id: number) => {
    getDb().run('DELETE FROM categories WHERE id = ?', [id]);
    persist();
    return { success: true };
  });

  // ── Todos ────────────────────────────────────────────────────────────────────
  ipcMain.handle('todos:list', (_e, userId: number, includeDeleted = false) =>
    queryAll<TodoRow>(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM todos t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.deleted = ?
       ORDER BY t.position ASC, t.created_at DESC`,
      [userId, includeDeleted ? 1 : 0]
    )
  );

  ipcMain.handle('todos:create', (_e, userId: number, data: Omit<TodoRow, 'id' | 'user_id' | 'deleted' | 'created_at' | 'updated_at'>) => {
    const maxPos = queryOne<{ pos: number }>('SELECT COALESCE(MAX(position),0) as pos FROM todos WHERE user_id = ?', [userId]);
    getDb().run(
      `INSERT INTO todos (user_id, title, description, priority, status, category_id, due_date, due_time, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.title, data.description ?? null, data.priority, data.status,
       data.category_id ?? null, data.due_date ?? null, data.due_time ?? null, (maxPos?.pos ?? 0) + 1]
    );
    persist();
    return queryOne<TodoRow>('SELECT * FROM todos WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  });

  ipcMain.handle('todos:update', (_e, id: number, data: Partial<TodoRow>) => {
    const fields = ['title', 'description', 'priority', 'status', 'category_id', 'due_date', 'due_time'] as const;
    const updates = fields.filter(f => f in data).map(f => `${f} = ?`).join(', ');
    const values = fields.filter(f => f in data).map(f => (data[f] ?? null) as string | number | null);
    if (!updates) return { success: false };
    getDb().run(`UPDATE todos SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
    persist();
    return { success: true };
  });

  ipcMain.handle('todos:reorder', (_e, orderedIds: number[]) => {
    const stmt = getDb().prepare('UPDATE todos SET position = ? WHERE id = ?');
    orderedIds.forEach((id, idx) => stmt.run([idx, id]));
    stmt.free();
    persist();
    return { success: true };
  });

  ipcMain.handle('todos:toggle', (_e, id: number) => {
    const todo = queryOne<TodoRow>('SELECT status FROM todos WHERE id = ?', [id]);
    if (!todo) return { success: false };
    const next = todo.status === 'completed' ? 'pending' : 'completed';
    getDb().run('UPDATE todos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [next, id]);
    persist();
    return { success: true, status: next };
  });

  ipcMain.handle('todos:softDelete', (_e, id: number) => {
    getDb().run('UPDATE todos SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    persist();
    return { success: true };
  });

  ipcMain.handle('todos:restore', (_e, id: number) => {
    getDb().run('UPDATE todos SET deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    persist();
    return { success: true };
  });

  ipcMain.handle('todos:hardDelete', (_e, id: number) => {
    getDb().run('DELETE FROM todos WHERE id = ?', [id]);
    persist();
    return { success: true };
  });

  ipcMain.handle('todos:emptyTrash', (_e, userId: number) => {
    getDb().run('DELETE FROM todos WHERE user_id = ? AND deleted = 1', [userId]);
    persist();
    return { success: true };
  });

  // ── Bulk ─────────────────────────────────────────────────────────────────────
  ipcMain.handle('todos:bulkComplete', (_e, ids: number[]) => {
    const stmt = getDb().prepare('UPDATE todos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    ids.forEach(id => stmt.run(['completed', id]));
    stmt.free();
    persist();
    return { success: true };
  });

  ipcMain.handle('todos:bulkDelete', (_e, ids: number[]) => {
    const stmt = getDb().prepare('UPDATE todos SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    ids.forEach(id => stmt.run([id]));
    stmt.free();
    persist();
    return { success: true };
  });

  ipcMain.handle('todos:bulkSetPriority', (_e, ids: number[], priority: string) => {
    const stmt = getDb().prepare('UPDATE todos SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    ids.forEach(id => stmt.run([priority, id]));
    stmt.free();
    persist();
    return { success: true };
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  ipcMain.handle('todos:stats', (_e, userId: number) => {
    const total     = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM todos WHERE user_id = ? AND deleted = 0', [userId]);
    const completed = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM todos WHERE user_id = ? AND deleted = 0 AND status = ?', [userId, 'completed']);
    const pending   = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM todos WHERE user_id = ? AND deleted = 0 AND status = ?', [userId, 'pending']);
    const overdue   = queryOne<{ c: number }>(
      `SELECT COUNT(*) as c FROM todos WHERE user_id = ? AND deleted = 0 AND status != 'completed'
       AND due_date IS NOT NULL AND due_date < date('now')`, [userId]
    );
    const byPriority = queryAll<{ priority: string; c: number }>(
      'SELECT priority, COUNT(*) as c FROM todos WHERE user_id = ? AND deleted = 0 GROUP BY priority', [userId]
    );
    const byCategory = queryAll<{ category_name: string | null; color: string | null; c: number }>(
      `SELECT c.name as category_name, c.color, COUNT(*) as c
       FROM todos t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.deleted = 0 GROUP BY t.category_id`, [userId]
    );
    // Last 7 days activity for analytics chart
    const last7Days = queryAll<{ date: string; completed: number; created: number }>(
      `SELECT
         date(d.day) as date,
         COUNT(CASE WHEN t.status = 'completed' AND date(t.updated_at) = date(d.day) THEN 1 END) as completed,
         COUNT(CASE WHEN date(t.created_at) = date(d.day) THEN 1 END) as created
       FROM (
         SELECT date('now', '-' || n || ' days') as day
         FROM (WITH RECURSIVE cnt(n) AS (SELECT 0 UNION ALL SELECT n+1 FROM cnt WHERE n < 6) SELECT n FROM cnt)
       ) d
       LEFT JOIN todos t ON t.user_id = ? AND t.deleted = 0
       GROUP BY d.day ORDER BY d.day ASC`,
      [userId]
    );
    return {
      total:     total?.c ?? 0,
      completed: completed?.c ?? 0,
      pending:   pending?.c ?? 0,
      overdue:   overdue?.c ?? 0,
      byPriority,
      byCategory,
      last7Days,
    };
  });
}
