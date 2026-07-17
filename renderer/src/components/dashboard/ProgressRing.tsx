interface Props { percent: number; size?: number; stroke?: number; color?: string; }

export default function ProgressRing({ percent, size = 80, stroke = 8, color = '#6366f1' }: Props) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="currentColor" strokeWidth={stroke}
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x="50%" y="50%"
        dominantBaseline="central" textAnchor="middle"
        className="fill-gray-700 dark:fill-gray-200 font-bold"
        style={{ fontSize: size * 0.18 }}
      >
        {percent}%
      </text>
    </svg>
  );
}
