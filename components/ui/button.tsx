import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { IconSpinner } from "@/components/icons";
import { cx } from "@/utils/cx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "glass";
type Size = "lg" | "md" | "sm";

/** Pill buttons, as in the landing design. */
/* leading-none: the brand font's default line-height is tall enough to read as off-center inside a pill; this
   keeps the label's cap-height centered top-to-bottom regardless of size. */
const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium leading-none transition-[background,opacity,box-shadow] disabled:cursor-not-allowed disabled:opacity-50";
const sizes: Record<Size, string> = { lg: "h-12 px-7 text-base", md: "h-11 px-5 text-[15px]", sm: "h-9 px-4 text-sm" };
const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_16px_-6px_var(--accent)] hover:bg-accent-strong",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
  /** Over imagery (hero, footer): clear liquid-glass pill (see .glass) with white text. */
  glass: "glass text-white hover:brightness-110",
};

export function buttonClass({ variant = "primary", size = "md", block = false }: { variant?: Variant; size?: Size; block?: boolean } = {}) {
  return cx(base, sizes[size], variants[variant], block && "w-full");
}

type Common = { variant?: Variant; size?: Size; block?: boolean; icon?: ReactNode; trailing?: ReactNode };

/** Touch targets are at least 44 px on md/lg (PRD §19.9). `busy` keeps the label so the button doesn't jump. */
export function Button({ variant, size, block, icon, trailing, busy, children, className, type = "button", ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button type={type} className={cx(buttonClass({ variant, size, block }), className)} disabled={busy || rest.disabled} aria-busy={busy || undefined} {...rest}>
      {busy ? <IconSpinner /> : icon}
      <span>{children}</span>
      {trailing}
    </button>
  );
}

export function ButtonLink({ variant, size, block, icon, trailing, children, className, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={cx(buttonClass({ variant, size, block }), className)} {...rest}>
      {icon}
      <span>{children}</span>
      {trailing}
    </Link>
  );
}
