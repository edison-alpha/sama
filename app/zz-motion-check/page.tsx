"use client";

import { m } from "motion/react";
import HomePage from "../(app)/home/page";
import { page } from "@/components/motion";
import { Segmented } from "@/components/ui/segmented";
import { useState } from "react";

export default function MotionCheck() {
  const [v, setV] = useState<"a" | "b" | "c">("a");
  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <Segmented value={v} onChange={setV} label="t" options={[{ value: "a", label: "One" }, { value: "b", label: "Two" }, { value: "c", label: "Three" }]} />
      <m.div initial="hidden" animate="show" variants={page} className="mt-4"><HomePage /></m.div>
    </main>
  );
}
