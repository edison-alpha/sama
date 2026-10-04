import type { Locale } from "@/lib/i18n/dict";
import { usd } from "@/lib/format";

/** USD amount with the cents dimmed, as wallet apps show balances: "$1,375" bright, ".99" quiet. */
export function Money({ value, locale, className }: { value: number; locale: Locale; className?: string }) {
  const text = usd(value, locale);
  const sep = locale === "id" ? "," : ".";
  const i = text.lastIndexOf(sep);
  return (
    <span className={className}>
      {i < 0 ? text : <>{text.slice(0, i)}<span className="text-ink-3">{text.slice(i)}</span></>}
    </span>
  );
}
