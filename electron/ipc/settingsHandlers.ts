/**
 * settingsHandlers.ts — IPC handlers for reading and writing app settings.
 * Settings are stored as JSON in <userData>/settings.json.
 */
import { IpcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSaveIntervalMs: number;   // 0 = disabled
  notificationsEnabled: boolean;
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
  compactView: boolean;
  startMinimized: boolean;
}

const DEFAULTS: AppSettings = {
  theme: 'system',
  autoSaveIntervalMs: 30_000,
  notificationsEnabled: true,
  defaultPriority: 'medium',
  compactView: false,
  startMinimized: false,
};

function settingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

export function readSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeSettings(s: AppSettings): void {
  fs.writeFileSync(settingsPath(), JSON.stringify(s, null, 2));
}

export function registerSettingsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('settings:get', () => {
    logger.info('settings:get');
    return readSettings();
  });

  ipcMain.handle('settings:set', (_e, partial: Partial<AppSettings>) => {
    const current = readSettings();
    const next = { ...current, ...partial };
    writeSettings(next);
    logger.info('settings:set', partial);
    return next;
  });

  ipcMain.handle('settings:reset', () => {
    writeSettings(DEFAULTS);
    logger.info('settings:reset');
    return DEFAULTS;
  });
}
