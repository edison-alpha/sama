/** $44.0M, $3.3M, $13K: how market pages quote size. */
export function compactUsd(value: number | null, locale: "id" | "en"): string {
  if (value === null) return "—";
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value);
}
