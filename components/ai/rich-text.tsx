"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "@tiptap/markdown";
import { cx } from "@/utils/cx";

/**
 * Renders the assistant's reply as Markdown through a read-only Tiptap editor: paragraphs, headings, lists, tables,
 * quotes, code, bold/italic/strike/links. Models sometimes leave a marker unclosed, so a lone `**` or `__` is dropped
 * before parsing instead of showing up raw. Styles live in `.ai-md` (globals.css); tables and code scroll inside
 * themselves so the chat panel never grows sideways.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const content = tidy(text);
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: true, autolink: true, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } } }), TableKit.configure({ table: { resizable: false, renderWrapper: true } }), Markdown],
    content,
    contentType: "markdown",
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.commands.setContent(content, { contentType: "markdown", emitUpdate: false });
  }, [editor, content]);

  return <EditorContent editor={editor} className={cx("ai-md min-w-0 text-sm leading-relaxed", className)} />;
}

/** Normalises what models send: Windows line endings, non-breaking spaces, and an odd (unclosed) `**`/`__` per line. */
function tidy(src: string): string {
  let inFence = false;
  return src
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return line; }
      if (inFence) return line;
      for (const mark of ["**", "__"]) {
        const plain = line.replace(/`[^`]*`/g, "");
        if (plain.split(mark).length % 2 === 0) {
          const at = line.lastIndexOf(mark);
          line = line.slice(0, at) + line.slice(at + mark.length);
        }
      }
      return line;
    })
    .join("\n");
}
