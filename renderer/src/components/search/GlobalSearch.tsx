'use client';

/**
 * GlobalSearch — Command-palette style search modal.
 * Triggered by Ctrl+K or the search button in the header.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, FileText, Tag, X } from 'lucide-react';
import { navigate } from '@/lib/navigate';
import { useAuth } from '@/hooks/useAuth';
import type { SearchResult } from '@/types';
import PriorityBadge from '@/components/todos/PriorityBadge';

interface Props {
  onClose: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function GlobalSearch({ onClose }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active,  setActive]  = useState(0);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 250);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    if (!user || debounced.length < 2) { setResults([]); return; }
    setLoading(true);
    window.electronAPI.search.global(user.id, debounced)
      .then(r => { setResults(r); setActive(0); })
      .finally(() => setLoading(false));
  }, [debounced, user]);

  const goToResult = useCallback((r: SearchResult) => {
    navigate('/todos');
    onClose();
  }, [onClose]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[active]) goToResult(results[active]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search todos, categories…"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((r, i) => (
              <li key={`${r.type}-${r.id}`}>
                <button
                  onClick={() => goToResult(r)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === active
                      ? 'bg-indigo-50 dark:bg-indigo-950/40'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {r.type === 'todo'
                    ? <FileText size={15} className="text-gray-400 shrink-0" />
                    : <Tag size={15} style={{ color: r.color ?? '#9ca3af' }} className="shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.title}</p>
                    {r.subtitle && (
                      <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>
                    )}
                  </div>
                  {r.priority && <PriorityBadge priority={r.priority as never} />}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <p className="px-4 py-6 text-sm text-center text-gray-400">No results for &quot;{query}&quot;</p>
        )}

        {/* Keyboard hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">↵</kbd> open</span>
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
