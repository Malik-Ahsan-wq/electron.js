'use client';

import { useEffect, useState } from 'react';
import { LayoutDashboard, CheckSquare, Calendar, Trash2, Settings } from 'lucide-react';
import { useTodoStore } from '@/store/todoStore';
import { navigate, getActiveRoute } from '@/lib/navigate';

const NAV = [
  { label: 'Dashboard', href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Todos',     href: '/todos',       icon: CheckSquare },
  { label: 'Calendar',  href: '/calendar',    icon: Calendar },
  { label: 'Trash',     href: '/trash',       icon: Trash2 },
  { label: 'Settings',  href: '/settings',    icon: Settings },
];

export default function Sidebar() {
  const [activeHref, setActiveHref] = useState('/');
  const { todos, trashedTodos } = useTodoStore();
  const pendingCount = todos.filter(t => t.status !== 'completed').length;
  const trashCount   = trashedTodos.length;

  useEffect(() => {
    setActiveHref(getActiveRoute());
  }, []);

  return (
    <aside className="w-60 h-full bg-gray-950 text-white flex flex-col py-6 px-3 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <CheckSquare size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">TodoApp</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = activeHref === href || activeHref.startsWith(href + '/');
          const badge  = label === 'Todos' ? pendingCount : label === 'Trash' ? trashCount : 0;
          return (
            <a
              key={href}
              href="#"
              onClick={(e) => { e.preventDefault(); navigate(href); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  active ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                  {badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
