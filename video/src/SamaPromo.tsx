import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Easing, useVideoConfig } from "remotion";
import { AppCircle } from "./scenes/AppCircle";
import { AppHome } from "./scenes/AppHome";
import { AppPortfolio } from "./scenes/AppPortfolio";
import { AppRoundDone, AppRoundMatching } from "./scenes/AppRound";
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Matching } from "./scenes/Matching";
import { Outro } from "./scenes/Outro";
import { Problem } from "./scenes/Problem";
import { Stats } from "./scenes/Stats";
import { CROSSFADE_SECONDS, PLAYBACK_RATE, SCENE_SECONDS as S } from "./timeline";

/**
 * The Sama promo at any frame rate (Root renders 60 fps). Scene lengths live in timeline.ts; the total length is their
 * sum minus the crossfades (PROMO_SECONDS). The App* scenes are the real app screens (components/…) on demo data.
 */
export const SamaPromo = () => {
  const { fps } = useVideoConfig();
  const t = linearTiming({ durationInFrames: Math.round(CROSSFADE_SECONDS * fps), easing: Easing.bezier(0.65, 0, 0.35, 1) });

  return (
    <TransitionSeries playbackRate={PLAYBACK_RATE}>
      <TransitionSeries.Sequence name="Intro" durationInFrames={Math.round(S.intro * fps)} premountFor={fps}>
        <Intro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Problem" durationInFrames={Math.round(S.problem * fps)} premountFor={fps}>
        <Problem />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Hook" durationInFrames={Math.round(S.hook * fps)} premountFor={fps}>
        <Hook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Home" durationInFrames={Math.round(S.home * fps)} premountFor={fps}>
        <AppHome />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Target" durationInFrames={Math.round(S.target * fps)} premountFor={fps}>
        <AppPortfolio />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Circle" durationInFrames={Math.round(S.circle * fps)} premountFor={fps}>
        <AppCircle />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Round matching" durationInFrames={Math.round(S.roundMatching * fps)} premountFor={fps}>
        <AppRoundMatching />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Solver ring" durationInFrames={Math.round(S.solver * fps)} premountFor={fps}>
        <Matching />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Round done" durationInFrames={Math.round(S.roundDone * fps)} premountFor={fps}>
        <AppRoundDone />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Stats" durationInFrames={Math.round(S.stats * fps)} premountFor={fps}>
        <Stats />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Outro" durationInFrames={Math.round(S.outro * fps)} premountFor={fps}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
