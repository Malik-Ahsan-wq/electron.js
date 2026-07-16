'use client';

/**
 * useSettings — Loads and persists AppSettings via IPC.
 * Also syncs the theme class on <html> when settings change.
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { AppSettings } from '@/types';

const DEFAULTS: AppSettings = {
  theme: 'system',
  autoSaveIntervalMs: 30_000,
  notificationsEnabled: true,
  defaultPriority: 'medium',
  compactView: false,
  startMinimized: false,
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyTheme(theme: AppSettings['theme']): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    window.electronAPI.settings.get().then((s) => {
      setSettings(s);
      applyTheme(s.theme);
    });
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const next = await window.electronAPI.settings.set(partial);
    setSettings(next);
    if (partial.theme) applyTheme(partial.theme);
    if ('autoSaveIntervalMs' in partial) {
      window.electronAPI.settings.notifyAutoSaveChanged(partial.autoSaveIntervalMs!);
    }
  }, []);

  const resetSettings = useCallback(async () => {
    const next = await window.electronAPI.settings.reset();
    setSettings(next);
    applyTheme(next.theme);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
