import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
  sub?: string;
}

export default function StatsCard({ label, value, icon: Icon, color, bg, sub }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
