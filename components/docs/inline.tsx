import Link from "next/link";
import type { ReactNode } from "react";

const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

/** Renders the small inline syntax used in docs content: `code`, **bold**, *italic* and [label](href). */
export function Inline({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter(Boolean);
  return <>{parts.map((part, i) => render(part, i))}</>;
}

function render(part: string, key: number): ReactNode {
  if (part.startsWith("`") && part.endsWith("`")) {
    return <code key={key} className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.86em] text-ink">{part.slice(1, -1)}</code>;
  }
  if (part.startsWith("**") && part.endsWith("**")) return <strong key={key} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
  if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={key}>{part.slice(1, -1)}</em>;
  const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
  if (link) {
    const [, label, href] = link;
    const cls = "font-medium text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent";
    return href!.startsWith("http") ? (
      <a key={key} href={href} target="_blank" rel="noreferrer" className={cls}>{label}</a>
    ) : (
      <Link key={key} href={href!} className={cls}>{label}</Link>
    );
  }
  return part;
}
