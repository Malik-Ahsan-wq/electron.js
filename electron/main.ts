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
function registerAppProtocol(): void {
  const outDir = path.join(__dirname, '../renderer/out');

  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let filePath = decodeURIComponent(url.pathname);

    if (filePath === '' || filePath === '/') filePath = 'index.html';

    // Remove leading slash for path.join
    if (filePath.startsWith('/')) filePath = filePath.slice(1);

    let fullPath = path.join(outDir, filePath);

    if (!fs.existsSync(fullPath)) {
      // Try as flat .html file (e.g., /login → login.html)
      const flatPath = path.join(outDir, filePath + '.html');
      if (fs.existsSync(flatPath)) {
        return net.fetch('file://' + flatPath.replace(/\\/g, '/'));
      }
      // Try as directory index (e.g., /login/ → /login/index.html)
      const dirIndex = path.join(outDir, filePath, 'index.html');
      if (fs.existsSync(dirIndex)) {
        return net.fetch('file://' + dirIndex.replace(/\\/g, '/'));
      }
    }

    return net.fetch('file://' + fullPath.replace(/\\/g, '/'));
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
