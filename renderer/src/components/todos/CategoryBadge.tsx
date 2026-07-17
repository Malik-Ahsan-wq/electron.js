interface Props { name: string | null | undefined; color: string | null | undefined; }

export default function CategoryBadge({ name, color }: Props) {
  if (!name) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color || '#6366f1' }}
    >
      {name}
    </span>
  );
}
