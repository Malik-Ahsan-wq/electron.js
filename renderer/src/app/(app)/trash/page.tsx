'use client';

import { Trash2, RotateCcw, X } from 'lucide-react';
import { useTodoStore } from '@/store/todoStore';
import { useAuth } from '@/hooks/useAuth';
import PriorityBadge from '@/components/todos/PriorityBadge';
import CategoryBadge from '@/components/todos/CategoryBadge';
import Button from '@/components/ui/Button';
import { format, parseISO } from 'date-fns';

export default function TrashPage() {
  const { user } = useAuth();
  const { trashedTodos, restoreTodo, hardDeleteTodo, emptyTrash } = useTodoStore();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trash</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{trashedTodos.length} deleted item{trashedTodos.length !== 1 ? 's' : ''}</p>
        </div>
        {trashedTodos.length > 0 && (
          <Button variant="danger" onClick={() => emptyTrash(user!.id)} className="flex items-center gap-2">
            <Trash2 size={15} /> Empty Trash
          </Button>
        )}
      </div>

      {trashedTodos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Trash2 size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Trash is empty</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {trashedTodos.map(todo => (
            <div key={todo.id} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm opacity-75">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-through truncate">{todo.title}</p>
                {todo.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{todo.description}</p>}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <PriorityBadge priority={todo.priority} />
                  <CategoryBadge name={todo.category_name} color={todo.category_color} />
                  {todo.due_date && (
                    <span className="text-xs text-gray-400">{format(parseISO(todo.due_date), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => restoreTodo(todo.id, user!.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
                  <RotateCcw size={13} /> Restore
                </button>
                <button onClick={() => hardDeleteTodo(todo.id, user!.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <X size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
