import { Composition, Folder } from "remotion";
import "./fonts";
import "./real/setup";
import { SamaPromo } from "./SamaPromo";
import { DEMO_SECONDS, SamaDemo } from "./demo/SamaDemo";
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
import { PLAYBACK_RATE, PROMO_SECONDS, SCENE_SECONDS as S } from "./timeline";

/** 60 fps everywhere; lengths come from timeline.ts. */
const FPS = 60;
const len = (seconds: number) => Math.round(seconds * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="SamaDemo" component={SamaDemo} durationInFrames={len(DEMO_SECONDS)} fps={FPS} width={1920} height={1080} />
      <Composition id="SamaPromo" component={SamaPromo} durationInFrames={len(PROMO_SECONDS / PLAYBACK_RATE)} fps={60.85} width={1920} height={1080} />
      <Folder name="Scenes">
        <Composition id="Intro" component={Intro} durationInFrames={len(S.intro)} fps={FPS} width={1920} height={1080} />
        <Composition id="Problem" component={Problem} durationInFrames={len(S.problem)} fps={FPS} width={1920} height={1080} />
        <Composition id="Hook" component={Hook} durationInFrames={len(S.hook)} fps={FPS} width={1920} height={1080} />
        <Composition id="AppHome" component={AppHome} durationInFrames={len(S.home)} fps={FPS} width={1920} height={1080} />
        <Composition id="AppPortfolio" component={AppPortfolio} durationInFrames={len(S.target)} fps={FPS} width={1920} height={1080} />
        <Composition id="AppCircle" component={AppCircle} durationInFrames={len(S.circle)} fps={FPS} width={1920} height={1080} />
        <Composition id="AppRoundMatching" component={AppRoundMatching} durationInFrames={len(S.roundMatching)} fps={FPS} width={1920} height={1080} />
        <Composition id="Matching" component={Matching} durationInFrames={len(S.solver)} fps={FPS} width={1920} height={1080} />
        <Composition id="AppRoundDone" component={AppRoundDone} durationInFrames={len(S.roundDone)} fps={FPS} width={1920} height={1080} />
        <Composition id="Stats" component={Stats} durationInFrames={len(S.stats)} fps={FPS} width={1920} height={1080} />
        <Composition id="Outro" component={Outro} durationInFrames={len(S.outro)} fps={FPS} width={1920} height={1080} />
      </Folder>
    </>
  );
};
