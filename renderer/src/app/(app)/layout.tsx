'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import GlobalSearch from '@/components/search/GlobalSearch';
import { useAuth } from '@/hooks/useAuth';
import { useTodoStore } from '@/store/todoStore';
import { SettingsProvider } from '@/hooks/useSettings';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router   = useRouter();
  const { loadAll, loadCategories, loadStats, loadTrash } = useTodoStore();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadAll(user.id);
    loadCategories(user.id);
    loadStats(user.id);
    loadTrash(user.id);
  }, [user]);

  const openSearch   = useCallback(() => setSearchOpen(true),  []);
  const openSettings = useCallback(() => router.push('/settings'), [router]);

  useKeyboardShortcuts({ onSearch: openSearch, onSettings: openSettings });

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onSearchOpen={openSearch} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AppShell>{children}</AppShell>
    </SettingsProvider>
  );
}
