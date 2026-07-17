'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Plus, Tag } from 'lucide-react';
import { useTodoStore, useFilteredTodos } from '@/store/todoStore';
import { useAuth } from '@/hooks/useAuth';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import TodoCard from '@/components/todos/TodoCard';
import TodoModal from '@/components/todos/TodoModal';
import TodoFilters from '@/components/todos/TodoFilters';
import BulkActions from '@/components/todos/BulkActions';
import CategoryManager from '@/components/todos/CategoryManager';
import type { Todo } from '@/types';

export default function TodosPage() {
  const { user } = useAuth();
  const { reorderTodos, selectAll, clearSelection, selectedIds } = useTodoStore();
  const filtered = useFilteredTodos();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTodo,  setEditTodo]  = useState<Todo | null>(null);
  const [catOpen,   setCatOpen]   = useState(false);

  const openNew = () => { setEditTodo(null); setModalOpen(true); };

  // Ctrl+N opens new todo modal
  useKeyboardShortcuts({ onNewTodo: openNew });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = [...filtered];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    reorderTodos(reordered.map(t => t.id));
  };

  const allSelected = filtered.length > 0 && filtered.every(t => selectedIds.has(t.id));

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Todos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCatOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Tag size={15} /> Categories
          </button>
          <button
            onClick={openNew}
            title="New Todo (Ctrl+N)"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> New Todo
          </button>
        </div>
      </div>

      <TodoFilters />
      <BulkActions />

      {filtered.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => allSelected ? clearSelection() : selectAll(filtered.map(t => t.id))}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">Select all ({filtered.length})</span>
        </div>
      )}

      {filtered.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="todos">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2">
                {filtered.map((todo, index) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    index={index}
                    onEdit={(t) => { setEditTodo(t); setModalOpen(true); }}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Plus size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No todos found</p>
          <button onClick={openNew} className="mt-2 text-indigo-600 text-sm hover:underline">
            Create your first todo
          </button>
        </div>
      )}

      {modalOpen && (
        <TodoModal todo={editTodo} onClose={() => { setModalOpen(false); setEditTodo(null); }} />
      )}
      {catOpen && <CategoryManager onClose={() => setCatOpen(false)} />}
    </div>
  );
}
