/**
 * logger.ts — Lightweight file + console logger for the main process.
 * Writes to <userData>/logs/app.log with daily rotation (keep last 7 files).
 */
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

type Level = 'info' | 'warn' | 'error';

let logDir: string;
let logFile: string;

function ensureLogDir(): void {
  if (logDir) return;
  logDir = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  logFile = path.join(logDir, `app-${new Date().toISOString().slice(0, 10)}.log`);
  rotateLogs();
}

/** Keep only the 7 most recent log files. */
function rotateLogs(): void {
  const files = fs.readdirSync(logDir)
    .filter(f => f.startsWith('app-') && f.endsWith('.log'))
    .sort();
  while (files.length > 7) {
    fs.unlinkSync(path.join(logDir, files.shift()!));
  }
}

function write(level: Level, message: string, meta?: unknown): void {
  ensureLogDir();
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  const line = `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  fs.appendFileSync(logFile, line);
  if (level === 'error') process.stderr.write(line);
  else process.stdout.write(line);
}

export const logger = {
  info:  (msg: string, meta?: unknown) => write('info',  msg, meta),
  warn:  (msg: string, meta?: unknown) => write('warn',  msg, meta),
  error: (msg: string, meta?: unknown) => write('error', msg, meta),
  getLogPath: () => { ensureLogDir(); return logFile; },
};
