/**
 * searchHandlers.ts — Global full-text search across todos and categories.
 */
import { IpcMain } from 'electron';
import { queryAll } from '../db/database';
import { logger } from '../logger';

export interface SearchResult {
  type: 'todo' | 'category';
  id: number;
  title: string;
  subtitle: string;
  priority?: string;
  status?: string;
  color?: string;
}

export function registerSearchHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('search:global', (_e, userId: number, query: string) => {
    if (!query || query.trim().length < 2) return [];
    const q = `%${query.trim()}%`;
    logger.info('search:global', { userId, query });

    const todos = queryAll<{
      id: number; title: string; description: string | null;
      priority: string; status: string; deleted: number;
    }>(
      `SELECT id, title, description, priority, status, deleted
       FROM todos WHERE user_id = ? AND deleted = 0
       AND (title LIKE ? OR description LIKE ?)
       ORDER BY position LIMIT 20`,
      [userId, q, q]
    );

    const cats = queryAll<{ id: number; name: string; color: string }>(
      `SELECT id, name, color FROM categories WHERE user_id = ? AND name LIKE ? LIMIT 10`,
      [userId, q]
    );

    const results: SearchResult[] = [
      ...todos.map(t => ({
        type: 'todo' as const,
        id: t.id,
        title: t.title,
        subtitle: t.description?.slice(0, 80) ?? '',
        priority: t.priority,
        status: t.status,
      })),
      ...cats.map(c => ({
        type: 'category' as const,
        id: c.id,
        title: c.name,
        subtitle: 'Category',
        color: c.color,
      })),
    ];

    return results;
  });
}
