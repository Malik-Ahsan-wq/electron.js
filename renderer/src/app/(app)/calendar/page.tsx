'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTodoStore } from '@/store/todoStore';
import PriorityBadge from '@/components/todos/PriorityBadge';
import type { Todo } from '@/types';

export default function CalendarPage() {
  const { todos } = useTodoStore();
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const startPad = startOfMonth(current).getDay();

  const todosForDay = (day: Date): Todo[] =>
    todos.filter(t => t.due_date && isSameDay(parseISO(t.due_date), day));

  const selectedTodos = selected ? todosForDay(selected) : [];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrent(subMonths(current, 1))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-base font-semibold text-gray-800 dark:text-gray-200 min-w-36 text-center">
            {format(current, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrent(addMonths(current, 1))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button onClick={() => setCurrent(new Date())} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Today
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="h-24 border-b border-r border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/20" />
          ))}
          {days.map(day => {
            const dayTodos = todosForDay(day);
            const isSelected = selected && isSameDay(day, selected);
            return (
              <div key={day.toISOString()} onClick={() => setSelected(isSameDay(day, selected ?? new Date(0)) ? null : day)}
                className={`h-24 border-b border-r border-gray-100 dark:border-gray-700/50 p-1.5 cursor-pointer transition-colors overflow-hidden
                  ${isSelected ? 'bg-indigo-50 dark:bg-indigo-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}
                  ${isToday(day) ? 'ring-2 ring-inset ring-indigo-400' : ''}`}>
                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {format(day, 'd')}
                </div>
                <div className="flex flex-col gap-0.5">
                  {dayTodos.slice(0, 2).map(t => (
                    <div key={t.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium
                      ${t.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 line-through' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'}`}>
                      {t.title}
                    </div>
                  ))}
                  {dayTodos.length > 2 && (
                    <div className="text-[10px] text-gray-400 px-1">+{dayTodos.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {format(selected, 'EEEE, MMMM d, yyyy')}
          </h2>
          {selectedTodos.length === 0 ? (
            <p className="text-sm text-gray-400">No todos due on this day.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedTodos.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'completed' ? 'bg-green-500' : 'bg-indigo-500'}`} />
                  <span className={`flex-1 text-sm ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{t.title}</span>
                  <PriorityBadge priority={t.priority} />
                  {t.due_time && <span className="text-xs text-gray-400">{t.due_time}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
