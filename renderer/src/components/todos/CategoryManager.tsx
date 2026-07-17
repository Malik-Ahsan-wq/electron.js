'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { categorySchema, type CategorySchema } from '@/lib/validators';
import { useTodoStore } from '@/store/todoStore';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const PRESET_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6'];

interface Props { onClose: () => void; }

export default function CategoryManager({ onClose }: Props) {
  const { user } = useAuth();
  const { categories, createCategory, updateCategory, deleteCategory } = useTodoStore();
  const [editId, setEditId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CategorySchema>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', color: '#6366f1' },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: CategorySchema) => {
    if (editId) { await updateCategory(editId, data.name, data.color); setEditId(null); }
    else await createCategory(user!.id, data.name, data.color);
    reset({ name: '', color: '#6366f1' });
  };

  const startEdit = (id: number, name: string, color: string) => {
    setEditId(id); reset({ name, color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manage Categories</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={18} /></button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <Input label="Category Name" error={errors.name?.message} {...register('name')} placeholder="e.g. Work" />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setValue('color', c)}
                    className={`w-7 h-7 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }} />
                ))}
                <input
                  type="color"
                  value={selectedColor}
                  onChange={e => setValue('color', e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer border-0 p-0"
                />
              </div>
            </div>
            <Button type="submit" loading={isSubmitting} className="w-full">
              <Plus size={15} className="inline mr-1" />{editId ? 'Update' : 'Add Category'}
            </Button>
            {editId && <Button type="button" variant="secondary" onClick={() => { setEditId(null); reset({ name: '', color: '#6366f1' }); }}>Cancel Edit</Button>}
          </form>

          {/* List */}
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {categories.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{c.name}</span>
                <button onClick={() => startEdit(c.id, c.name, c.color)} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"><Pencil size={13} /></button>
                <button onClick={() => deleteCategory(c.id, user!.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No categories yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
