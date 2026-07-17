import { create } from 'zustand';
import type { Todo, Category, TodoFilters, TodoStats, TodoFormData, Priority, TodoStatus } from '@/types';
import { todoService, categoryService, notificationService } from '@/services/todoService';

interface TodoStore {
  todos: Todo[];
  trashedTodos: Todo[];
  categories: Category[];
  stats: TodoStats | null;
  filters: TodoFilters;
  selectedIds: Set<number>;
  isLoading: boolean;

  // Load
  loadAll: (userId: number) => Promise<void>;
  loadStats: (userId: number) => Promise<void>;
  loadTrash: (userId: number) => Promise<void>;

  // CRUD
  createTodo: (userId: number, data: TodoFormData) => Promise<void>;
  updateTodo: (id: number, data: Partial<TodoFormData>) => Promise<void>;
  toggleTodo: (id: number) => Promise<void>;
  deleteTodo: (id: number, userId: number) => Promise<void>;
  restoreTodo: (id: number, userId: number) => Promise<void>;
  hardDeleteTodo: (id: number, userId: number) => Promise<void>;
  emptyTrash: (userId: number) => Promise<void>;
  reorderTodos: (orderedIds: number[]) => Promise<void>;

  // Bulk
  bulkComplete: (userId: number) => Promise<void>;
  bulkDelete: (userId: number) => Promise<void>;
  bulkSetPriority: (priority: Priority, userId: number) => Promise<void>;

  // Categories
  loadCategories: (userId: number) => Promise<void>;
  createCategory: (userId: number, name: string, color: string) => Promise<void>;
  updateCategory: (id: number, name: string, color: string) => Promise<void>;
  deleteCategory: (id: number, userId: number) => Promise<void>;

  // Filters & selection
  setFilters: (f: Partial<TodoFilters>) => void;
  resetFilters: () => void;
  toggleSelect: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;
}

const DEFAULT_FILTERS: TodoFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  categoryId: 'all',
  sortField: 'position',
  sortDir: 'asc',
};

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  trashedTodos: [],
  categories: [],
  stats: null,
  filters: DEFAULT_FILTERS,
  selectedIds: new Set(),
  isLoading: false,

  loadAll: async (userId) => {
    set({ isLoading: true });
    const todos = await todoService.list(userId, false);
    set({ todos, isLoading: false });
  },

  loadStats: async (userId) => {
    const stats = await todoService.stats(userId);
    set({ stats });
  },

  loadTrash: async (userId) => {
    const trashedTodos = await todoService.list(userId, true);
    set({ trashedTodos });
  },

  createTodo: async (userId, data) => {
    const todo = await todoService.create(userId, data);
    set(s => ({ todos: [...s.todos, todo] }));
    if (data.due_date) {
      notificationService.send('Todo Created', `"${data.title}" added with due date ${data.due_date}`);
    }
    get().loadStats(userId);
  },

  updateTodo: async (id, data) => {
    await todoService.update(id, data);
    set(s => ({
      todos: s.todos.map(t => t.id === id ? { ...t, ...data } as Todo : t),
    }));
  },

  toggleTodo: async (id) => {
    const res = await todoService.toggle(id);
    set(s => ({
      todos: s.todos.map(t => t.id === id ? { ...t, status: res.status as TodoStatus } : t),
    }));
  },

  deleteTodo: async (id, userId) => {
    await todoService.softDelete(id);
    set(s => {
      const deleted = s.todos.find(t => t.id === id);
      return {
        todos: s.todos.filter(t => t.id !== id),
        trashedTodos: deleted ? [...s.trashedTodos, { ...deleted, deleted: 1 as const }] : s.trashedTodos,
      };
    });
    get().loadStats(userId);
  },

  restoreTodo: async (id, userId) => {
    await todoService.restore(id);
    set(s => ({ trashedTodos: s.trashedTodos.filter(t => t.id !== id) }));
    get().loadAll(userId);
  },

  hardDeleteTodo: async (id, userId) => {
    await todoService.hardDelete(id);
    set(s => ({ trashedTodos: s.trashedTodos.filter(t => t.id !== id) }));
    get().loadStats(userId);
  },

  emptyTrash: async (userId) => {
    await todoService.emptyTrash(userId);
    set({ trashedTodos: [] });
    get().loadStats(userId);
  },

  reorderTodos: async (orderedIds) => {
    await todoService.reorder(orderedIds);
    set(s => {
      const map = new Map(s.todos.map(t => [t.id, t]));
      return {
        todos: orderedIds
          .map((id, i) => {
            const todo = map.get(id);
            return todo ? { ...todo, position: i } : null;
          })
          .filter(Boolean) as Todo[],
      };
    });
  },

  bulkComplete: async (userId) => {
    const ids = [...get().selectedIds];
    await todoService.bulkComplete(ids);
    set(s => ({
      todos: s.todos.map(t => ids.includes(t.id) ? { ...t, status: 'completed' as TodoStatus } : t),
      selectedIds: new Set(),
    }));
    get().loadStats(userId);
  },

  bulkDelete: async (userId) => {
    const ids = [...get().selectedIds];
    await todoService.bulkDelete(ids);
    set(s => ({ todos: s.todos.filter(t => !ids.includes(t.id)), selectedIds: new Set() }));
    get().loadStats(userId);
  },

  bulkSetPriority: async (priority, userId) => {
    const ids = [...get().selectedIds];
    await todoService.bulkSetPriority(ids, priority);
    set(s => ({
      todos: s.todos.map(t => ids.includes(t.id) ? { ...t, priority } : t),
      selectedIds: new Set(),
    }));
    get().loadStats(userId);
  },

  loadCategories: async (userId) => {
    const categories = await categoryService.list(userId);
    set({ categories });
  },

  createCategory: async (userId, name, color) => {
    const cat = await categoryService.create(userId, name, color);
    set(s => ({ categories: [...s.categories, cat] }));
  },

  updateCategory: async (id, name, color) => {
    await categoryService.update(id, name, color);
    set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, name, color } : c) }));
  },

  deleteCategory: async (id, userId) => {
    await categoryService.delete(id);
    set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
    get().loadAll(userId);
  },

  setFilters: (f) => set(s => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  toggleSelect: (id) => set(s => {
    const next = new Set(s.selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    return { selectedIds: next };
  }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set() }),
}));

// Derived: filtered + sorted todos
export function useFilteredTodos() {
  const { todos, filters } = useTodoStore();
  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  return todos
    .filter(t => {
      if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(t.description ?? '').toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
      if (filters.categoryId !== 'all' && t.category_id !== filters.categoryId) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = filters.sortDir === 'asc' ? 1 : -1;
      switch (filters.sortField) {
        case 'priority': return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir;
        case 'due_date': return ((a.due_date ?? '9999') < (b.due_date ?? '9999') ? -1 : 1) * dir;
        case 'title': return a.title.localeCompare(b.title) * dir;
        case 'created_at': return (a.created_at < b.created_at ? -1 : 1) * dir;
        default: return (a.position - b.position) * dir;
      }
    });
}
