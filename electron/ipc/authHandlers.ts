import { IpcMain } from 'electron';
import bcrypt from 'bcryptjs';
import { getDb, persist } from '../db/database';

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
}

function queryOne<T>(sql: string, params: (string | number)[]): T | undefined {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as T;
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

export function registerAuthHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('auth:register', async (_event, name: string, email: string, password: string) => {
    const existing = queryOne<UserRow>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return { success: false, error: 'Email already registered' };

    const hash = await bcrypt.hash(password, 10);
    getDb().run('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, hash]);
    persist();
    return { success: true };
  });

  ipcMain.handle('auth:login', async (_event, email: string, password: string) => {
    const user = queryOne<UserRow>('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return { success: false, error: 'Invalid credentials' };

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return { success: false, error: 'Invalid credentials' };

    return { success: true, user: { id: user.id, name: user.name, email: user.email } };
  });

  ipcMain.handle('auth:logout', async () => ({ success: true }));
}
