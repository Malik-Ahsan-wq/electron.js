export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: User;
}

export type Priority   = 'low' | 'medium' | 'high' | 'urgent';
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string;
}

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  priority: Priority;
  status: TodoStatus;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  due_date: string | null;
  due_time: string | null;
  position: number;
  deleted: number;
  created_at: string;
  updated_at: string;
}

export interface TodoFormData {
  title: string;
  description?: string;
  priority: Priority;
  status: TodoStatus;
  category_id?: number | null;
  due_date?: string;
  due_time?: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byPriority:  { priority: string; c: number }[];
  byCategory:  { category_name: string | null; color: string | null; c: number }[];
  /** Completion counts for the last 7 days (analytics) */
  last7Days?:  { date: string; completed: number; created: number }[];
}

export type SortField = 'created_at' | 'due_date' | 'priority' | 'title' | 'position';
export type SortDir   = 'asc' | 'desc';

export interface TodoFilters {
  search: string;
  status: TodoStatus | 'all';
  priority: Priority | 'all';
  categoryId: number | 'all';
  sortField: SortField;
  sortDir: SortDir;
}

/* ── Settings ──────────────────────────────────────────────────────────────── */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSaveIntervalMs: number;
  notificationsEnabled: boolean;
  defaultPriority: Priority;
  compactView: boolean;
  startMinimized: boolean;
}

/* ── Search ────────────────────────────────────────────────────────────────── */
export interface SearchResult {
  type: 'todo' | 'category';
  id: number;
  title: string;
  subtitle: string;
  priority?: string;
  status?: string;
  color?: string;
}
