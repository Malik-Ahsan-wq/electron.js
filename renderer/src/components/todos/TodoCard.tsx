'use client';

import { Draggable } from '@hello-pangea/dnd';
import { format, isPast, parseISO } from 'date-fns';
import { Pencil, Trash2, GripVertical, Calendar } from 'lucide-react';
import type { Todo } from '@/types';
import PriorityBadge from './PriorityBadge';
import CategoryBadge from './CategoryBadge';
import { useTodoStore } from '@/store/todoStore';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  todo: Todo;
  index: number;
  onEdit: (todo: Todo) => void;
}

export default function TodoCard({ todo, index, onEdit }: Props) {
  const { user } = useAuth();
  const { toggleTodo, deleteTodo, toggleSelect, selectedIds } = useTodoStore();
  const isSelected = selectedIds.has(todo.id);
  const isOverdue = todo.due_date && todo.status !== 'completed' && isPast(parseISO(todo.due_date));

  return (
    <Draggable draggableId={String(todo.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group flex items-start gap-3 p-4 rounded-xl border transition-all
            ${snapshot.isDragging ? 'shadow-xl rotate-1 scale-[1.02]' : 'shadow-sm hover:shadow-md'}
            ${isSelected ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
            ${todo.status === 'completed' ? 'opacity-60' : ''}
          `}
        >
          {/* Drag handle */}
          <div {...provided.dragHandleProps} className="mt-0.5 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing">
            <GripVertical size={16} />
          </div>

          {/* Checkbox select */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(todo.id)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer shrink-0"
          />

          {/* Complete toggle */}
          <button
            onClick={() => toggleTodo(todo.id)}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 transition-colors
              ${todo.status === 'completed'
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 dark:border-gray-500 hover:border-green-400'}`}
          >
            {todo.status === 'completed' && (
              <svg viewBox="0 0 12 12" className="w-full h-full p-0.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 6l3 3 5-5" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {todo.title}
            </p>
            {todo.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{todo.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <PriorityBadge priority={todo.priority} />
              <CategoryBadge name={todo.category_name} color={todo.category_color} />
              {todo.due_date && (
                <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                  <Calendar size={11} />
                  {format(parseISO(todo.due_date), 'MMM d')}
                  {todo.due_time && ` ${todo.due_time}`}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(todo)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600 transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={() => deleteTodo(todo.id, user!.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
