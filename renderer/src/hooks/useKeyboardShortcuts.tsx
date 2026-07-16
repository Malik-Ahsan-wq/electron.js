'use client';

/**
 * useKeyboardShortcuts — Registers global keyboard shortcuts.
 *
 * Shortcuts:
 *   Ctrl+N        → New todo
 *   Ctrl+K        → Open global search
 *   Ctrl+,        → Open settings
 *   Ctrl+1..4     → Navigate to Dashboard / Todos / Calendar / Trash
 *   Escape        → Close modals (handled by individual components)
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutHandlers {
  onNewTodo?:    () => void;
  onSearch?:     () => void;
  onSettings?:   () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}): void {
  const router = useRouter();

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
          router.push('/dashboard');
          break;
        case '2':
          e.preventDefault();
          router.push('/todos');
          break;
        case '3':
          e.preventDefault();
          router.push('/calendar');
          break;
        case '4':
          e.preventDefault();
          router.push('/trash');
          break;
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [handlers, router]);
}
