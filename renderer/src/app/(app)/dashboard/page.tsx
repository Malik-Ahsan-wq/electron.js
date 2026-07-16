'use client';

import { useEffect } from 'react';
import { CheckSquare, Clock, AlertTriangle, ListTodo, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { useTodoStore } from '@/store/todoStore';
import { useAuth } from '@/hooks/useAuth';
import StatsCard from '@/components/dashboard/StatsCard';
import ProgressRing from '@/components/dashboard/ProgressRing';
import PriorityBadge from '@/components/todos/PriorityBadge';
import CategoryBadge from '@/components/todos/CategoryBadge';
import type { Priority } from '@/types';

export default function DashboardPage() {
  const { user }  = useAuth();
  const { stats, todos, loadStats } = useTodoStore();
  const router    = useRouter();

  useEffect(() => { if (user) loadStats(user.id); }, [user]);

  const completionPct = stats && stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100) : 0;
  const recent = todos.slice(0, 5);

  // 7-day chart max value for scaling bars
  const maxDay = Math.max(1, ...(stats?.last7Days?.map(d => Math.max(d.completed, d.created)) ?? [1]));

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={() => router.push('/todos')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> New Todo
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Todos"  value={stats?.total ?? 0}     icon={ListTodo}      color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/40" />
        <StatsCard label="Completed"    value={stats?.completed ?? 0} icon={CheckSquare}   color="text-green-600"  bg="bg-green-50 dark:bg-green-950/40" />
        <StatsCard label="Pending"      value={stats?.pending ?? 0}   icon={Clock}         color="text-yellow-600" bg="bg-yellow-50 dark:bg-yellow-950/40" />
        <StatsCard label="Overdue"      value={stats?.overdue ?? 0}   icon={AlertTriangle} color="text-red-600"    bg="bg-red-50 dark:bg-red-950/40"
          sub={stats?.overdue ? 'Needs attention' : 'All on track'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Completion ring */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 shadow-sm">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Completion Rate</p>
          <ProgressRing percent={completionPct} size={100} stroke={10} />
          <p className="text-xs text-gray-400">{stats?.completed ?? 0} of {stats?.total ?? 0} done</p>
        </div>

        {/* Priority breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">By Priority</p>
          <div className="flex flex-col gap-2">
            {(['urgent', 'high', 'medium', 'low'] as Priority[]).map(p => {
              const count = stats?.byPriority.find(x => x.priority === p)?.c ?? 0;
              const pct   = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={p} className="flex items-center gap-2">
                  <PriorityBadge priority={p} />
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">By Category</p>
          <div className="flex flex-col gap-2">
            {stats?.byCategory.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <CategoryBadge name={c.category_name ?? 'Uncategorized'} color={c.color ?? '#9ca3af'} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{c.c}</span>
              </div>
            ))}
            {!stats?.byCategory.length && (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* 7-day activity chart */}
      {stats?.last7Days && stats.last7Days.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">7-Day Activity</p>
          <div className="flex items-end gap-2 h-24">
            {stats.last7Days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5 h-16">
                  {/* Created bar */}
                  <div
                    className="flex-1 bg-indigo-200 dark:bg-indigo-900 rounded-t transition-all"
                    style={{ height: `${Math.round((d.created / maxDay) * 100)}%` }}
                    title={`Created: ${d.created}`}
                  />
                  {/* Completed bar */}
                  <div
                    className="flex-1 bg-green-400 dark:bg-green-600 rounded-t transition-all"
                    style={{ height: `${Math.round((d.completed / maxDay) * 100)}%` }}
                    title={`Completed: ${d.completed}`}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {format(parseISO(d.date), 'EEE')}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-200 dark:bg-indigo-900 inline-block" /> Created</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 dark:bg-green-600 inline-block" /> Completed</span>
          </div>
        </div>
      )}

      {/* Recent todos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Todos</p>
          <button onClick={() => router.push('/todos')} className="text-xs text-indigo-600 hover:underline">
            View all
          </button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recent.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-6 py-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'completed' ? 'bg-green-500' : 'bg-yellow-400'}`} />
              <span className={`flex-1 text-sm truncate ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {t.title}
              </span>
              <PriorityBadge priority={t.priority} />
              {t.due_date && (
                <span className="text-xs text-gray-400">{format(parseISO(t.due_date), 'MMM d')}</span>
              )}
            </div>
          ))}
          {recent.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-gray-400">
              No todos yet.{' '}
              <button onClick={() => router.push('/todos')} className="text-indigo-600 hover:underline">
                Create one
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
