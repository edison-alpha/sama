import HomePage from "@/app/(app)/home/page";
import { AppScene } from "../app/shell";

/** Step 1: the real Home screen. Camera: whole window → value and chart → next-step card. */
export const AppHome = () => (
  <AppScene
    n="01"
    label="Home"
    title="Know exactly where you stand."
    path="/home"
    cams={[
      { f: 60, x: 1130, y: 640, z: 1 },
      { f: 150, x: 1000, y: 580, z: 1.15 },
      { f: 245, x: 870, y: 540, z: 1.38 },
      { f: 350, x: 1130, y: 1000, z: 1.48 },
    ]}
  >
    <HomePage />
  </AppScene>
);
