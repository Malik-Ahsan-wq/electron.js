"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_window_state_1 = __importDefault(require("electron-window-state"));
const database_1 = require("./db/database");
const authHandlers_1 = require("./ipc/authHandlers");
const todoHandlers_1 = require("./ipc/todoHandlers");
const notificationHandlers_1 = require("./ipc/notificationHandlers");
const settingsHandlers_1 = require("./ipc/settingsHandlers");
const dataHandlers_1 = require("./ipc/dataHandlers");
const searchHandlers_1 = require("./ipc/searchHandlers");
const logger_1 = require("./logger");
const isDev = !electron_1.app.isPackaged;
/* ── Global error guards ──────────────────────────────────────────────────── */
process.on('uncaughtException', (err) => logger_1.logger.error('uncaughtException', err));
process.on('unhandledRejection', (err) => logger_1.logger.error('unhandledRejection', err));
/* ── Auto-save timer ─────────────────────────────────────────────────────── */
let autoSaveTimer = null;
function startAutoSave(intervalMs) {
    if (autoSaveTimer)
        clearInterval(autoSaveTimer);
    if (intervalMs <= 0)
        return;
    autoSaveTimer = setInterval(() => {
        try {
            (0, database_1.persist)();
            logger_1.logger.info('auto-save: persisted');
        }
        catch (e) {
            logger_1.logger.error('auto-save failed', e);
        }
    }, intervalMs);
}
/* ── Window factory ──────────────────────────────────────────────────────── */
function createWindow() {
    const state = (0, electron_window_state_1.default)({ defaultWidth: 1280, defaultHeight: 860 });
    const win = new electron_1.BrowserWindow({
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
        minWidth: 900,
        minHeight: 640,
        show: false, // show after ready-to-show to avoid flash
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
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
            electron_1.shell.openExternal(url);
        }
    });
    win.once('ready-to-show', () => {
        const settings = (0, settingsHandlers_1.readSettings)();
        if (!settings.startMinimized)
            win.show();
    });
    if (isDev) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(path.join(__dirname, '../renderer/out/index.html'));
    }
    win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
        logger_1.logger.error(`Failed to load page: ${errorCode} ${errorDescription}`);
        if (!isDev)
            win.webContents.openDevTools();
    });
    win.webContents.on('did-finish-load', () => {
        logger_1.logger.info('Page loaded successfully');
    });
    win.webContents.on('console-message', (_e, level, message) => {
        logger_1.logger.info(`Renderer console [${level}]: ${message}`);
    });
    logger_1.logger.info('Window created');
}
/* ── App lifecycle ───────────────────────────────────────────────────────── */
electron_1.app.whenReady().then(async () => {
    try {
        await (0, database_1.initDb)();
        logger_1.logger.info('Database initialised');
        // Register all IPC handlers
        (0, authHandlers_1.registerAuthHandlers)(electron_1.ipcMain);
        (0, todoHandlers_1.registerTodoHandlers)(electron_1.ipcMain);
        (0, notificationHandlers_1.registerNotificationHandlers)(electron_1.ipcMain);
        (0, settingsHandlers_1.registerSettingsHandlers)(electron_1.ipcMain);
        (0, dataHandlers_1.registerDataHandlers)(electron_1.ipcMain);
        (0, searchHandlers_1.registerSearchHandlers)(electron_1.ipcMain);
        // Start auto-save with configured interval
        const settings = (0, settingsHandlers_1.readSettings)();
        startAutoSave(settings.autoSaveIntervalMs);
        // Allow renderer to update auto-save interval dynamically
        electron_1.ipcMain.on('settings:autoSaveChanged', (_e, intervalMs) => {
            startAutoSave(intervalMs);
        });
        createWindow();
    }
    catch (err) {
        logger_1.logger.error('App startup failed', err);
        electron_1.app.quit();
    }
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (autoSaveTimer)
        clearInterval(autoSaveTimer);
    try {
        (0, database_1.persist)();
    }
    catch { /* best-effort final save */ }
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
