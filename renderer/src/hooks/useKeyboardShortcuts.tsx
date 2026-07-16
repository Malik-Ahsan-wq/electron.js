'use client';

import { useEffect } from 'react';
import { navigate } from '@/lib/navigate';

interface ShortcutHandlers {
  onNewTodo?:    () => void;
  onSearch?:     () => void;
  onSettings?:   () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}): void {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      switch (e.key) {
        case 'n':
          e.preventDefault();
          handlers.onNewTodo?.();
          break;
        case 'k':
          e.preventDefault();
          handlers.onSearch?.();
          break;
        case ',':
          e.preventDefault();
          handlers.onSettings?.();
          break;
        case '1':
          e.preventDefault();
          navigate('/dashboard');
          break;
        case '2':
          e.preventDefault();
          navigate('/todos');
          break;
        case '3':
          e.preventDefault();
          navigate('/calendar');
          break;
        case '4':
          e.preventDefault();
          navigate('/trash');
          break;
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [handlers]);
}
