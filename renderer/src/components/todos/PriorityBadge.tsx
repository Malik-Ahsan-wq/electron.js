import type { Priority } from '@/types';

const styles: Record<Priority, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
};

const dots: Record<Priority, string> = {
  urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500',
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[priority]}`} />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
