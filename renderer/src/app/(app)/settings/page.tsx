'use client';

/**
 * SettingsPage — User preferences, import/export, and backup controls.
 */
import { useRef, useState } from 'react';
import { Save, RotateCcw, Download, Upload, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useTodoStore } from '@/store/todoStore';
import type { AppSettings } from '@/types';

type Toast = { type: 'success' | 'error'; message: string };

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { user } = useAuth();
  const { loadAll, loadCategories, loadStats, loadTrash } = useTodoStore();
  const [toast, setToast] = useState<Toast | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const notify = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = async (partial: Partial<AppSettings>) => {
    await updateSettings(partial);
  };

  /* ── Export JSON ─────────────────────────────────────────────────────────── */
  const exportJSON = async () => {
    if (!user) return;
    const res = await window.electronAPI.data.exportJSON(user.id);
    if (!res.success || !res.data) return notify('error', res.error ?? 'Export failed');
    const saved = await window.electronAPI.data.saveFile(
      `todos-export-${new Date().toISOString().slice(0, 10)}.json`,
      res.data
    );
    if (saved.success) notify('success', 'Exported successfully');
  };

  /* ── Export CSV ──────────────────────────────────────────────────────────── */
  const exportCSV = async () => {
    if (!user) return;
    const res = await window.electronAPI.data.exportCSV(user.id);
    if (!res.success || !res.data) return notify('error', res.error ?? 'Export failed');
    const saved = await window.electronAPI.data.saveFile(
      `todos-export-${new Date().toISOString().slice(0, 10)}.csv`,
      res.data
    );
    if (saved.success) notify('success', 'CSV exported successfully');
  };

  /* ── Import JSON ─────────────────────────────────────────────────────────── */
  const importJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const text = await e.target.files[0].text();
    const res  = await window.electronAPI.data.importJSON(user.id, text);
    e.target.value = '';
    if (!res.success) return notify('error', res.error ?? 'Import failed');
    await Promise.all([loadAll(user.id), loadCategories(user.id), loadStats(user.id), loadTrash(user.id)]);
    notify('success', `Imported ${res.imported} todos`);
  };

  /* ── Backup / Restore DB ─────────────────────────────────────────────────── */
  const backupDB = async () => {
    const res = await window.electronAPI.data.backupDB();
    if (res.canceled) return;
    res.success ? notify('success', 'Backup saved') : notify('error', res.error ?? 'Backup failed');
  };

  const restoreDB = async () => {
    if (!confirm('Restoring will replace all current data. Continue?')) return;
    const res = await window.electronAPI.data.restoreDB();
    if (res.canceled) return;
    if (!res.success) return notify('error', res.error ?? 'Restore failed');
    if (user) await Promise.all([loadAll(user.id), loadCategories(user.id), loadStats(user.id), loadTrash(user.id)]);
    notify('success', 'Database restored');
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Appearance */}
      <Section title="Appearance">
        <Field label="Theme">
          <select
            value={settings.theme}
            onChange={e => handleChange({ theme: e.target.value as AppSettings['theme'] })}
            className={selectCls}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
        <Field label="Compact view">
          <Toggle
            checked={settings.compactView}
            onChange={v => handleChange({ compactView: v })}
          />
        </Field>
      </Section>

      {/* Behaviour */}
      <Section title="Behaviour">
        <Field label="Default priority">
          <select
            value={settings.defaultPriority}
            onChange={e => handleChange({ defaultPriority: e.target.value as AppSettings['defaultPriority'] })}
            className={selectCls}
          >
            {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </Field>
        <Field label="Auto-save interval">
          <select
            value={settings.autoSaveIntervalMs}
            onChange={e => handleChange({ autoSaveIntervalMs: Number(e.target.value) })}
            className={selectCls}
          >
            <option value={0}>Disabled</option>
            <option value={15_000}>15 seconds</option>
            <option value={30_000}>30 seconds</option>
            <option value={60_000}>1 minute</option>
            <option value={300_000}>5 minutes</option>
          </select>
        </Field>
        <Field label="Notifications">
          <Toggle
            checked={settings.notificationsEnabled}
            onChange={v => handleChange({ notificationsEnabled: v })}
          />
        </Field>
        <Field label="Start minimized">
          <Toggle
            checked={settings.startMinimized}
            onChange={v => handleChange({ startMinimized: v })}
          />
        </Field>
      </Section>

      {/* Import / Export */}
      <Section title="Import & Export">
        <div className="grid grid-cols-2 gap-3">
          <ActionButton icon={Download} label="Export JSON" onClick={exportJSON} />
          <ActionButton icon={Download} label="Export CSV"  onClick={exportCSV} />
          <ActionButton
            icon={Upload}
            label="Import JSON"
            onClick={() => importRef.current?.click()}
          />
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
        </div>
      </Section>

      {/* Database */}
      <Section title="Database">
        <div className="grid grid-cols-2 gap-3">
          <ActionButton icon={Database} label="Backup (.db)"  onClick={backupDB} />
          <ActionButton icon={Upload}   label="Restore Backup" onClick={restoreDB} variant="danger" />
        </div>
      </Section>

      {/* Reset */}
      <Section title="Reset">
        <button
          onClick={async () => { await resetSettings(); notify('success', 'Settings reset to defaults'); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <RotateCcw size={15} /> Reset to defaults
        </button>
      </Section>

      {/* Keyboard shortcuts reference */}
      <Section title="Keyboard Shortcuts">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ['Ctrl+N', 'New todo'],
            ['Ctrl+K', 'Global search'],
            ['Ctrl+,', 'Settings'],
            ['Ctrl+1', 'Dashboard'],
            ['Ctrl+2', 'Todos'],
            ['Ctrl+3', 'Calendar'],
            ['Ctrl+4', 'Trash'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-500 dark:text-gray-400">{desc}</span>
              <kbd className="font-mono text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded shadow-sm">{key}</kbd>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function ActionButton({
  icon: Icon, label, onClick, variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
        variant === 'danger'
          ? 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

const selectCls = 'text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500';
