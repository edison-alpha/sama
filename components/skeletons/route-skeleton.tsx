import { PageSkeleton } from "@/components/ui/states";
import { ActivitySkeleton } from "./activity-skeleton";
import { CirclesSkeleton } from "./circles-skeleton";
import { HomeSkeleton } from "./home-skeleton";
import { PortfolioSkeleton } from "./portfolio-skeleton";
import { SettingsSkeleton } from "./settings-skeleton";

/**
 * The skeleton for whichever page `pathname` is. The app shell shows it while it checks the session, so the first thing
 * on screen is already the shape of the page about to load, not a generic block that then changes into it.
 */
export function RouteSkeleton({ pathname }: { pathname: string }) {
  const is = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  if (is("/home")) return <HomeSkeleton />;
  if (is("/portfolio")) return <PortfolioSkeleton />;
  if (pathname === "/circles") return <CirclesSkeleton />;
  if (is("/activity")) return <ActivitySkeleton />;
  if (is("/settings")) return <SettingsSkeleton />;
  return <PageSkeleton />;
}
