import type { TodoFormData } from '@/types';

export const todoService = {
  list: (userId: number, includeDeleted = false) =>
    window.electronAPI.todos.list(userId, includeDeleted),
  create: (userId: number, data: TodoFormData) =>
    window.electronAPI.todos.create(userId, data),
  update: (id: number, data: Partial<TodoFormData>) =>
    window.electronAPI.todos.update(id, data),
  reorder: (orderedIds: number[]) =>
    window.electronAPI.todos.reorder(orderedIds),
  toggle: (id: number) =>
    window.electronAPI.todos.toggle(id),
  softDelete: (id: number) =>
    window.electronAPI.todos.softDelete(id),
  restore: (id: number) =>
    window.electronAPI.todos.restore(id),
  hardDelete: (id: number) =>
    window.electronAPI.todos.hardDelete(id),
  emptyTrash: (userId: number) =>
    window.electronAPI.todos.emptyTrash(userId),
  bulkComplete: (ids: number[]) =>
    window.electronAPI.todos.bulkComplete(ids),
  bulkDelete: (ids: number[]) =>
    window.electronAPI.todos.bulkDelete(ids),
  bulkSetPriority: (ids: number[], priority: string) =>
    window.electronAPI.todos.bulkSetPriority(ids, priority),
  stats: (userId: number) =>
    window.electronAPI.todos.stats(userId),
};

export const categoryService = {
  list: (userId: number) => window.electronAPI.categories.list(userId),
  create: (userId: number, name: string, color: string) =>
    window.electronAPI.categories.create(userId, name, color),
  update: (id: number, name: string, color: string) =>
    window.electronAPI.categories.update(id, name, color),
  delete: (id: number) => window.electronAPI.categories.delete(id),
};

export const notificationService = {
  send: (title: string, body: string) =>
    window.electronAPI.notifications.send(title, body),
};
