import Link from "next/link";

/** Sama mark: the two coral pills from public/sama-logo.svg (white variant for dark imagery). */
export function Mark({ size = 28, white = false }: { size?: number; white?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={white ? "/sama-logo-white.svg" : "/sama-logo.svg"} width={Math.round((size * 198) / 216)} height={size} alt="" aria-hidden="true" />;
}

/**
 * Full brand lockup (coral mark + wordmark) from the official artwork, used in every header. The ORI file has white
 * text for dark backgrounds; the -light copy is the same artwork with dark text.
 */
export function BrandLogo({ href = "/", className = "h-10" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Sama">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sama-brand-logo-ORI-light.svg" alt="" aria-hidden="true" className={`brand-logo-light w-auto ${className}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sama-brand-logo-ORI.svg" alt="" aria-hidden="true" className={`brand-logo-dark w-auto ${className}`} />
    </Link>
  );
}
