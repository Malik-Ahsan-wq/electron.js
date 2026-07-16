/**
 * main.ts — Electron main process entry point.
 *
 * Responsibilities:
 *  - Create and manage the BrowserWindow
 *  - Initialise the SQLite database
 *  - Register all IPC handlers
 *  - Run periodic auto-save
 *  - Global error handling
 */
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import windowStateKeeper from 'electron-window-state';
import { initDb, persist } from './db/database';
import { registerAuthHandlers }         from './ipc/authHandlers';
import { registerTodoHandlers }         from './ipc/todoHandlers';
import { registerNotificationHandlers } from './ipc/notificationHandlers';
import { registerSettingsHandlers, readSettings } from './ipc/settingsHandlers';
import { registerDataHandlers }         from './ipc/dataHandlers';
import { registerSearchHandlers }       from './ipc/searchHandlers';
import { logger }                       from './logger';

const isDev = process.env.NODE_ENV === 'development';

/* ── Global error guards ──────────────────────────────────────────────────── */
process.on('uncaughtException',  (err) => logger.error('uncaughtException',  err));
process.on('unhandledRejection', (err) => logger.error('unhandledRejection', err));

/* ── Auto-save timer ─────────────────────────────────────────────────────── */
let autoSaveTimer: ReturnType<typeof setInterval> | null = null;

function startAutoSave(intervalMs: number): void {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  if (intervalMs <= 0) return;
  autoSaveTimer = setInterval(() => {
    try { persist(); logger.info('auto-save: persisted'); }
    catch (e) { logger.error('auto-save failed', e); }
  }, intervalMs);
}

/* ── Window factory ──────────────────────────────────────────────────────── */
function createWindow(): void {
  const state = windowStateKeeper({ defaultWidth: 1280, defaultHeight: 860 });

  const win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width:     state.width,
    height:    state.height,
    minWidth:  900,
    minHeight: 640,
    show: false, // show after ready-to-show to avoid flash
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
      // Prevent renderer from navigating to external URLs
      webSecurity: true,
    },
  });

  state.manage(win);

  // Prevent navigation to external URLs (security)
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev ? 'http://localhost:3000' : 'file://';
    if (!url.startsWith(allowed)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.once('ready-to-show', () => {
    const settings = readSettings();
    if (!settings.startMinimized) win.show();
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../renderer/out/index.html'));
  }

  logger.info('Window created');
}

/* ── App lifecycle ───────────────────────────────────────────────────────── */
app.whenReady().then(async () => {
  try {
    await initDb();
    logger.info('Database initialised');

    // Register all IPC handlers
    registerAuthHandlers(ipcMain);
    registerTodoHandlers(ipcMain);
    registerNotificationHandlers(ipcMain);
    registerSettingsHandlers(ipcMain);
    registerDataHandlers(ipcMain);
    registerSearchHandlers(ipcMain);

    // Start auto-save with configured interval
    const settings = readSettings();
    startAutoSave(settings.autoSaveIntervalMs);

    // Allow renderer to update auto-save interval dynamically
    ipcMain.on('settings:autoSaveChanged', (_e, intervalMs: number) => {
      startAutoSave(intervalMs);
    });

    createWindow();
  } catch (err) {
    logger.error('App startup failed', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  try { persist(); } catch { /* best-effort final save */ }
  if (process.platform !== 'darwin') app.quit();
});
