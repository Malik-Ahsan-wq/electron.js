/**
 * preload.ts — Secure contextBridge between renderer and main process.
 * Only whitelisted channels are exposed; no raw ipcRenderer access.
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {

  /* ── Auth ──────────────────────────────────────────────────────────────── */
  auth: {
    login:    (email: string, password: string) => ipcRenderer.invoke('auth:login', email, password),
    register: (name: string, email: string, password: string) => ipcRenderer.invoke('auth:register', name, email, password),
    logout:   () => ipcRenderer.invoke('auth:logout'),
  },

  /* ── Categories ────────────────────────────────────────────────────────── */
  categories: {
    list:   (userId: number) => ipcRenderer.invoke('categories:list', userId),
    create: (userId: number, name: string, color: string) => ipcRenderer.invoke('categories:create', userId, name, color),
    update: (id: number, name: string, color: string) => ipcRenderer.invoke('categories:update', id, name, color),
    delete: (id: number) => ipcRenderer.invoke('categories:delete', id),
  },

  /* ── Todos ─────────────────────────────────────────────────────────────── */
  todos: {
    list:            (userId: number, includeDeleted?: boolean) => ipcRenderer.invoke('todos:list', userId, includeDeleted),
    create:          (userId: number, data: unknown) => ipcRenderer.invoke('todos:create', userId, data),
    update:          (id: number, data: unknown) => ipcRenderer.invoke('todos:update', id, data),
    reorder:         (orderedIds: number[]) => ipcRenderer.invoke('todos:reorder', orderedIds),
    toggle:          (id: number) => ipcRenderer.invoke('todos:toggle', id),
    softDelete:      (id: number) => ipcRenderer.invoke('todos:softDelete', id),
    restore:         (id: number) => ipcRenderer.invoke('todos:restore', id),
    hardDelete:      (id: number) => ipcRenderer.invoke('todos:hardDelete', id),
    emptyTrash:      (userId: number) => ipcRenderer.invoke('todos:emptyTrash', userId),
    bulkComplete:    (ids: number[]) => ipcRenderer.invoke('todos:bulkComplete', ids),
    bulkDelete:      (ids: number[]) => ipcRenderer.invoke('todos:bulkDelete', ids),
    bulkSetPriority: (ids: number[], priority: string) => ipcRenderer.invoke('todos:bulkSetPriority', ids, priority),
    stats:           (userId: number) => ipcRenderer.invoke('todos:stats', userId),
  },

  /* ── Notifications ─────────────────────────────────────────────────────── */
  notifications: {
    send: (title: string, body: string) => ipcRenderer.invoke('notifications:send', title, body),
  },

  /* ── Settings ──────────────────────────────────────────────────────────── */
  settings: {
    get:   () => ipcRenderer.invoke('settings:get'),
    set:   (partial: Record<string, unknown>) => ipcRenderer.invoke('settings:set', partial),
    reset: () => ipcRenderer.invoke('settings:reset'),
    /** Notify main to restart auto-save timer without a round-trip invoke. */
    notifyAutoSaveChanged: (intervalMs: number) => ipcRenderer.send('settings:autoSaveChanged', intervalMs),
  },

  /* ── Data (import / export / backup) ──────────────────────────────────── */
  data: {
    exportJSON: (userId: number) => ipcRenderer.invoke('data:exportJSON', userId),
    exportCSV:  (userId: number) => ipcRenderer.invoke('data:exportCSV', userId),
    importJSON: (userId: number, json: string) => ipcRenderer.invoke('data:importJSON', userId, json),
    backupDB:   () => ipcRenderer.invoke('data:backupDB'),
    restoreDB:  () => ipcRenderer.invoke('data:restoreDB'),
    saveFile:   (filename: string, content: string) => ipcRenderer.invoke('data:saveFile', filename, content),
  },

  /* ── Search ────────────────────────────────────────────────────────────── */
  search: {
    global: (userId: number, query: string) => ipcRenderer.invoke('search:global', userId, query),
  },
});
