/** Fixed colour per asset so "now" and "target" donuts are directly comparable. */
const PALETTE = ["#e97863", "#0d2f6e", "#2563d9", "#f0b90b", "#23955a", "#8a8173", "#b14fc5", "#4a4b50"];

export function colorFor(symbol: string, order: string[]): string {
  const i = order.indexOf(symbol);
  return PALETTE[(i < 0 ? order.length : i) % PALETTE.length]!;
}

export function AllocationDonut({ weights, order, label, size = 132 }: { weights: Record<string, number>; order: string[]; label: string; size?: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const total = Object.values(weights).reduce((s, w) => s + w, 0) || 1;
  let offset = 0;
  const parts = order.filter((s) => (weights[s] ?? 0) > 0).map((s) => {
    const len = ((weights[s] ?? 0) / total) * c;
    const part = { s, len, offset };
    offset += len;
    return part;
  });
  return (
    <figure className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 132 132" role="img" aria-label={`${label}: ${parts.map((p) => `${p.s} ${Math.round(((weights[p.s] ?? 0) / total) * 100)}%`).join(", ")}`}>
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="18" />
        {parts.map((p) => (
          <circle key={p.s} cx="66" cy="66" r={r} fill="none" stroke={colorFor(p.s, order)} strokeWidth="18" strokeDasharray={`${Math.max(0, p.len - 1.5)} ${c}`} strokeDashoffset={-p.offset} transform="rotate(-90 66 66)" />
        ))}
      </svg>
      <figcaption className="text-xs font-medium text-ink-3">{label}</figcaption>
    </figure>
  );
}
