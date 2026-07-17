'use client';

import { Bell, Search, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTodoStore } from '@/store/todoStore';
import { navigate } from '@/lib/navigate';

interface Props {
  onSearchOpen: () => void;
}

export default function Header({ onSearchOpen }: Props) {
  const { user, logout } = useAuth();
  const { todos }        = useTodoStore();

  const overdueCount = todos.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < new Date(new Date().toDateString());
  }).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0">
      {/* User identity */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Search trigger */}
        <button
          onClick={onSearchOpen}
          title="Search (Ctrl+K)"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Search size={15} />
          <span className="hidden sm:inline text-xs">Search</span>
          <kbd className="hidden sm:inline text-[10px] font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Ctrl+K</kbd>
        </button>

        {/* Overdue bell */}
        <div className="relative group">
          <button
            title={`${overdueCount} overdue`}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <Bell size={17} />
          </button>
          {overdueCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {overdueCount > 9 ? '9+' : overdueCount}
            </span>
          )}
          {overdueCount > 0 && (
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 px-3 hidden group-hover:block whitespace-nowrap z-20">
              <p className="text-xs text-red-500 font-medium">{overdueCount} overdue todo{overdueCount !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          title="Settings (Ctrl+,)"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <Settings size={17} />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </header>
  );
}
