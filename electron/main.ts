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
import { app, BrowserWindow, ipcMain, shell, protocol, net } from 'electron';
import * as fs from 'fs';
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

const isDev = !app.isPackaged;

/* ── Register app:// as a privileged scheme (must be before app.whenReady) ── */
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

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

/* ── Custom protocol for production static serving ────────────────────────── */
function toFileUrl(p: string): string {
  return 'file:///' + p.replace(/\\/g, '/');
}

function registerAppProtocol(): void {
  const outDir = path.join(__dirname, '../renderer/out');

  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    const relative = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';

    // 1. Exact file match
    const exact = path.join(outDir, relative);
    if (fs.existsSync(exact) && fs.statSync(exact).isFile()) {
      return net.fetch(toFileUrl(exact));
    }

    // 2. Directory index (trailingSlash routes: /login/ → /login/index.html)
    const dirIndex = path.join(outDir, relative, 'index.html');
    if (fs.existsSync(dirIndex)) {
      return net.fetch(toFileUrl(dirIndex));
    }

    // 3. Flat .html (e.g. /login → login.html)
    const flat = path.join(outDir, relative + '.html');
    if (fs.existsSync(flat)) {
      return net.fetch(toFileUrl(flat));
    }

    // 4. Fallback to root
    return net.fetch(toFileUrl(path.join(outDir, 'index.html')));
  });
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
    show: false,
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
      webSecurity: true,
    },
  });

  state.manage(win);

  win.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev ? 'http://localhost:3000' : 'app://';
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
    win.loadURL('app:///');
  }

  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    logger.error(`Failed to load page: ${errorCode} ${errorDescription}`);
    if (!isDev) win.webContents.openDevTools();
  });

  win.webContents.on('did-finish-load', () => {
    logger.info('Page loaded successfully');
  });

  win.webContents.on('console-message', (_e, level, message) => {
    logger.info(`Renderer console [${level}]: ${message}`);
  });

  logger.info('Window created');
}

/* ── App lifecycle ───────────────────────────────────────────────────────── */
app.whenReady().then(async () => {
  try {
    if (!isDev) registerAppProtocol();

    await initDb();
    logger.info('Database initialised');

    registerAuthHandlers(ipcMain);
    registerTodoHandlers(ipcMain);
    registerNotificationHandlers(ipcMain);
    registerSettingsHandlers(ipcMain);
    registerDataHandlers(ipcMain);
    registerSearchHandlers(ipcMain);

    const settings = readSettings();
    startAutoSave(settings.autoSaveIntervalMs);

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
