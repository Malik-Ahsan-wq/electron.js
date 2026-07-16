'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useTodoStore } from '@/store/todoStore';
import type { SortField } from '@/types';

export default function TodoFilters() {
  const { filters, setFilters, resetFilters, categories } = useTodoStore();
  const hasActive = filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.categoryId !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={filters.search}
          onChange={e => setFilters({ search: e.target.value })}
          placeholder="Search todos..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Status */}
      <select value={filters.status} onChange={e => setFilters({ status: e.target.value as typeof filters.status })}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      {/* Priority */}
      <select value={filters.priority} onChange={e => setFilters({ priority: e.target.value as typeof filters.priority })}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="all">All Priority</option>
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Category */}
      <select value={filters.categoryId} onChange={e => setFilters({ categoryId: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="all">All Categories</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {/* Sort */}
      <div className="flex items-center gap-1">
        <SlidersHorizontal size={14} className="text-gray-400" />
        <select value={filters.sortField} onChange={e => setFilters({ sortField: e.target.value as SortField })}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="position">Manual</option>
          <option value="priority">Priority</option>
          <option value="due_date">Due Date</option>
          <option value="title">Title</option>
          <option value="created_at">Created</option>
        </select>
        <button onClick={() => setFilters({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })}
          className="px-2 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-indigo-600 transition-colors">
          {filters.sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Reset */}
      {hasActive && (
        <button onClick={resetFilters} className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
          <X size={14} /> Clear
        </button>
      )}
    </div>
  );
}
