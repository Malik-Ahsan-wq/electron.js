'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { todoSchema, type TodoSchema } from '@/lib/validators';
import type { Todo } from '@/types';
import { useTodoStore } from '@/store/todoStore';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Props {
  todo?: Todo | null;
  onClose: () => void;
}

export default function TodoModal({ todo, onClose }: Props) {
  const { user } = useAuth();
  const { createTodo, updateTodo, categories } = useTodoStore();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TodoSchema>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: '', description: '', priority: 'medium', status: 'pending',
      category_id: null, due_date: '', due_time: '',
    },
  });

  useEffect(() => {
    if (todo) {
      reset({
        title: todo.title,
        description: todo.description ?? '',
        priority: todo.priority,
        status: todo.status,
        category_id: todo.category_id,
        due_date: todo.due_date ?? '',
        due_time: todo.due_time ?? '',
      });
    }
  }, [todo, reset]);

  const onSubmit = async (data: TodoSchema) => {
    const payload = { ...data, category_id: data.category_id ?? null, due_date: data.due_date || undefined, due_time: data.due_time || undefined };
    if (todo) await updateTodo(todo.id, payload);
    else await createTodo(user!.id, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {todo ? 'Edit Todo' : 'New Todo'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
          <Input label="Title" error={errors.title?.message} {...register('title')} placeholder="What needs to be done?" />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Add details..."
              className="px-3 py-2 rounded-md border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <select {...register('priority')} className="px-3 py-2 rounded-md border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select {...register('status')} className="px-3 py-2 rounded-md border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select {...register('category_id', { setValueAs: v => v === '' ? null : Number(v) })} className="px-3 py-2 rounded-md border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" type="date" error={errors.due_date?.message} {...register('due_date')} />
            <Input label="Due Time" type="time" error={errors.due_time?.message} {...register('due_time')} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{todo ? 'Save Changes' : 'Create Todo'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
