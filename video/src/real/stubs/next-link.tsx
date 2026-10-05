import { forwardRef, type AnchorHTMLAttributes } from "react";

/** next/link for the video: a plain anchor (nothing navigates in a render). */
type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string | { pathname?: string | null }; prefetch?: boolean; replace?: boolean; scroll?: boolean; shallow?: boolean };

const Link = forwardRef<HTMLAnchorElement, Props>(({ href, prefetch: _p, replace: _r, scroll: _s, shallow: _sh, ...rest }, ref) => (
  <a ref={ref} href={typeof href === "string" ? href : (href.pathname ?? "#")} {...rest} />
));
Link.displayName = "Link";

export default Link;
