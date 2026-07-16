'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const res = await window.electronAPI.auth.login(email, password);
    if (res.success && res.user) setUser(res.user);
    return { success: res.success, error: res.error };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await window.electronAPI.auth.register(name, email, password);
    return { success: res.success, error: res.error };
  }, []);

  const logout = useCallback(async () => {
    await window.electronAPI.auth.logout();
    setUser(null);
  }, []);

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
