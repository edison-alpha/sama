"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/modal";

/** The top layer escapes the sticky header's backdrop-filter and keeps focus inside the dialog. */
export function DocsDialog({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  return <Modal open={open} onClose={onClose} label={label} className="docs-theme docs-dialog">{children}</Modal>;
}
