import Link from "next/link";

/** Sama mark: the two coral pills from public/sama-logo.svg (white variant for dark imagery). */
export function Mark({ size = 28, white = false }: { size?: number; white?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={white ? "/sama-logo-white.svg" : "/sama-logo.svg"} width={Math.round((size * 198) / 216)} height={size} alt="" aria-hidden="true" />;
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 text-ink" aria-label="Sama">
      <Mark size={24} />
      <span className="text-xl font-semibold tracking-[-0.04em]">sama</span>
    </Link>
  );
}

/** Full brand lockup (icon + wordmark) from the official artwork, used in the sidebar. */
export function BrandLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Sama">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sama-brand-logo.svg" alt="" aria-hidden="true" className="brand-logo-light h-10 w-auto" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sama-brand-logo-ORI.svg" alt="" aria-hidden="true" className="brand-logo-dark h-10 w-auto" />
    </Link>
  );
}
