import type { AuthResponse, Todo, Category, TodoStats, TodoFormData, AppSettings, SearchResult } from '@/types';

declare global {
  interface Window {
    electronAPI: {
      auth: {
        login:    (email: string, password: string) => Promise<AuthResponse>;
        register: (name: string, email: string, password: string) => Promise<AuthResponse>;
        logout:   () => Promise<{ success: boolean }>;
      };
      categories: {
        list:   (userId: number) => Promise<Category[]>;
        create: (userId: number, name: string, color: string) => Promise<Category>;
        update: (id: number, name: string, color: string) => Promise<{ success: boolean }>;
        delete: (id: number) => Promise<{ success: boolean }>;
      };
      todos: {
        list:            (userId: number, includeDeleted?: boolean) => Promise<Todo[]>;
        create:          (userId: number, data: TodoFormData) => Promise<Todo>;
        update:          (id: number, data: Partial<TodoFormData>) => Promise<{ success: boolean }>;
        reorder:         (orderedIds: number[]) => Promise<{ success: boolean }>;
        toggle:          (id: number) => Promise<{ success: boolean; status: string }>;
        softDelete:      (id: number) => Promise<{ success: boolean }>;
        restore:         (id: number) => Promise<{ success: boolean }>;
        hardDelete:      (id: number) => Promise<{ success: boolean }>;
        emptyTrash:      (userId: number) => Promise<{ success: boolean }>;
        bulkComplete:    (ids: number[]) => Promise<{ success: boolean }>;
        bulkDelete:      (ids: number[]) => Promise<{ success: boolean }>;
        bulkSetPriority: (ids: number[], priority: string) => Promise<{ success: boolean }>;
        stats:           (userId: number) => Promise<TodoStats>;
      };
      notifications: {
        send: (title: string, body: string) => Promise<{ success: boolean }>;
      };
      settings: {
        get:   () => Promise<AppSettings>;
        set:   (partial: Partial<AppSettings>) => Promise<AppSettings>;
        reset: () => Promise<AppSettings>;
        notifyAutoSaveChanged: (intervalMs: number) => void;
      };
      data: {
        exportJSON: (userId: number) => Promise<{ success: boolean; data?: string; error?: string }>;
        exportCSV:  (userId: number) => Promise<{ success: boolean; data?: string; error?: string }>;
        importJSON: (userId: number, json: string) => Promise<{ success: boolean; imported?: number; error?: string }>;
        backupDB:   () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
        restoreDB:  () => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
        saveFile:   (filename: string, content: string) => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
      };
      search: {
        global: (userId: number, query: string) => Promise<SearchResult[]>;
      };
    };
  }
}

export {};
