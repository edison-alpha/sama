"use client";

import { useServerInsertedHTML } from "next/navigation";
import { BOOT_SCRIPT } from "./boot-scripts";

/** Injects the pre-paint bootstrap into the server HTML without rendering a script during client hydration. */
export function BootScript() {
  useServerInsertedHTML(() => (
    <script id="sama-boot" dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
  ));

  return null;
}
