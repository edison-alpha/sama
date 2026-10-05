import { m } from "motion/react";
import { interpolate } from "remotion";
import { rise, Stagger } from "@/components/motion";
import { TargetEditor } from "@/components/portfolio/target-editor";
import { WalletHeader } from "@/components/portfolio/wallet-header";
import { sama } from "@/lib/api";
import { useApi } from "@/lib/api/use-api";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";
import { press, ramp, useT } from "../anim";
import { ComponentScene } from "../app/shell";
import { Cursor } from "../ui";
import { EASE_IN_OUT } from "../theme";

/**
 * app/(app)/portfolio/page.tsx with its Target tab open. The page picks that tab from ?tab=target on mount, which a
 * render can't set, so this repeats its markup around the same components.
 */
const PortfolioTargetPage = () => {
  const { d } = useI18n();
  const { data } = useApi(() => Promise.all([sama.portfolio(), sama.assets()]), []);
  if (!data) return null;
  const [{ portfolio, target }, assets] = data;
  return (
    <Stagger>
      <WalletHeader />
      <m.nav variants={rise} className="mb-8 flex gap-6 border-b border-line">
        {(["tokens", "target"] as const).map((k) => (
          <span key={k} className={cx("relative pb-3 text-lg font-medium", k === "target" ? "text-ink" : "text-ink-3")}>
            {d.portfolio.tabs[k]}
            {k === "target" && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ink" />}
          </span>
        ))}
      </m.nav>
      <m.section variants={rise}>
        <TargetEditor assets={assets} portfolio={portfolio} target={target} />
      </m.section>
    </Stagger>
  );
};

/** "Save target" in the Summary panel, in app CSS pixels (measured in Studio). */
const SAVE: [number, number] = [1286, 430];
const CLICK = 196;

const SaveCursor = () => {
  const f = useT();
  const opts = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT } as const;
  return (
    <Cursor
      x={interpolate(f, [130, CLICK - 2], [1400, SAVE[0]], opts)}
      y={interpolate(f, [130, CLICK - 2], [470, SAVE[1]], opts)}
      pressed={press(f, CLICK)}
      opacity={ramp(f, 126, 138)}
    />
  );
};

/** Step 2: the real target editor and its summary, cut out of the Portfolio page. */
export const AppPortfolio = () => (
  <ComponentScene
    n="02"
    label="Set your target"
    title="Pick where you want to be."
    path="/portfolio"
    page={<PortfolioTargetPage />}
    shots={[
      { rect: [352, 241, 732, 493], pad: 24, x: 710, y: 545, delay: 40 },
      { rect: [1116, 241, 340, 234], bare: true, radius: 24, x: 1497, y: 345, delay: 56, tilt: -4, overlay: <SaveCursor /> },
    ]}
  />
);
