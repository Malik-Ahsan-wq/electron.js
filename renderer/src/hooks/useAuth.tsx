'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { User } from '@/types';

const STORAGE_KEY = 'todoapp_user';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  const saveUser = (u: User | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await window.electronAPI.auth.login(email, password);
    if (res.success && res.user) saveUser(res.user);
    return { success: res.success, error: res.error };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await window.electronAPI.auth.register(name, email, password);
    return { success: res.success, error: res.error };
  }, []);

  const logout = useCallback(async () => {
    await window.electronAPI.auth.logout();
    saveUser(null);
  }, []);

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
