'use client';

import { CheckCheck, Trash2, Flag, X } from 'lucide-react';
import { useTodoStore } from '@/store/todoStore';
import { useAuth } from '@/hooks/useAuth';
import type { Priority } from '@/types';

export default function BulkActions() {
  const { user } = useAuth();
  const { selectedIds, clearSelection, bulkComplete, bulkDelete, bulkSetPriority } = useTodoStore();
  const count = selectedIds.size;
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-xl shadow-lg">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="h-4 w-px bg-indigo-400" />

      <button onClick={() => bulkComplete(user!.id)} className="flex items-center gap-1.5 text-sm hover:text-indigo-200 transition-colors">
        <CheckCheck size={15} /> Complete
      </button>

      <div className="relative group">
        <button className="flex items-center gap-1.5 text-sm hover:text-indigo-200 transition-colors">
          <Flag size={15} /> Priority
        </button>
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 hidden group-hover:block z-10 min-w-28">
          {(['urgent', 'high', 'medium', 'low'] as Priority[]).map(p => (
            <button key={p} onClick={() => bulkSetPriority(p, user!.id)}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 capitalize">
              {p}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => bulkDelete(user!.id)} className="flex items-center gap-1.5 text-sm hover:text-red-300 transition-colors">
        <Trash2 size={15} /> Delete
      </button>

      <div className="ml-auto">
        <button onClick={clearSelection} className="p-1 hover:text-indigo-200 transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
