"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AssetIcon } from "@/components/asset-icon";
import { TokenCard } from "@/components/market/token-card";
import { IconArrowRight } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sama } from "@/lib/api";
import type { AssistantAction, ChatMessage, ChatSummary } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/utils/cx";
import { AiAvatar } from "./ai-avatar";
import { APPLY_TARGET_EVENT, PENDING_TARGET_KEY } from "./apply-target";

const HIDDEN_KEY = "sama:ai:hidden";
const CHAT_ID_KEY = "sama:ai:chat-id";

/** A chat turn as shown; `createdAt` is only there for turns that came from the server. */
type Entry = Omit<ChatMessage, "createdAt"> & { createdAt?: string };

/**
 * The AI assistant, on every screen of the app: a compact glass pill floating at the bottom that can be hidden down to
 * its avatar. A click opens the chat above it and blurs the page behind so it can be read. The model reads the user's
 * real data on the server and can only propose actions; each one shows as a button and nothing happens until it is
 * clicked. Portalled to <body> because pages animate with transforms, which would pin "fixed" to the page.
 */
export function AiAssistant() {
  const { d } = useI18n();
  const e = d.portfolio.editor;
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [chat, setChat] = useState<Entry[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [history, setHistory] = useState<ChatSummary[] | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      setHidden(window.localStorage.getItem(HIDDEN_KEY) === "1");
    } catch {}
    void sama.agentEnabled().then(setEnabled, () => setEnabled(false));
  }, []);

  // Conversations live on the server. The last one opened is remembered in this browser and restored when the panel
  // first opens, so a reload does not lose your place.
  const restored = useRef(false);
  useEffect(() => {
    if (!open || !enabled || restored.current) return;
    restored.current = true;
    let id: string | null = null;
    try { id = window.localStorage.getItem(CHAT_ID_KEY); } catch {}
    if (id) void openChat(id, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, enabled]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [chat, busy, open, view]);

  const remember = (id: string | null) => {
    setChatId(id);
    try { if (id) window.localStorage.setItem(CHAT_ID_KEY, id); else window.localStorage.removeItem(CHAT_ID_KEY); } catch {}
  };

  const openChat = async (id: string, quiet = false) => {
    try {
      const c = await sama.chat(id);
      setChat(c.messages);
      remember(c.id);
      setView("chat");
    } catch {
      if (quiet) remember(null);
      else setChat((x) => [...x, { role: "assistant", content: e.aiLoadFailed, error: true }]);
    }
  };

  const showHistory = async () => {
    setView("history");
    setConfirmAll(false);
    setHistory(null);
    try { setHistory(await sama.chats()); } catch { setHistory([]); }
  };

  const newChat = () => {
    setChat([]);
    setDone({});
    remember(null);
    setView("chat");
  };

  const removeChat = async (id: string) => {
    setHistory((h) => (h ? h.filter((c) => c.id !== id) : h));
    if (id === chatId) { newChat(); setView("history"); }
    try { await sama.deleteChat(id); } catch { void showHistory(); }
  };

  const removeAll = async () => {
    setHistory([]);
    setConfirmAll(false);
    newChat();
    setView("history");
    try { await sama.deleteAllChats(); } catch { void showHistory(); }
  };

  const setHide = (next: boolean) => {
    setHidden(next);
    setOpen(false);
    try { window.localStorage.setItem(HIDDEN_KEY, next ? "1" : "0"); } catch {}
  };

  const send = async (message: string) => {
    const content = message.trim();
    if (!content || busy) return;
    const next: Entry[] = [...chat, { role: "user", content }];
    setChat(next);
    setText("");
    setOpen(true);
    setBusy(true);
    try {
      const r = await sama.assist(chatId, content);
      remember(r.chatId);
      setChat([...next, { role: "assistant", content: r.reply.text, blocks: r.reply.blocks, actions: r.reply.actions }]);
    } catch (err) {
      setChat([...next, { role: "assistant", content: err instanceof Error ? err.message : String(err), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const run = async (key: string, action: AssistantAction) => {
    if (action.type === "apply_target") {
      try { window.sessionStorage.setItem(PENDING_TARGET_KEY, JSON.stringify(action.weights)); } catch {}
      if (pathname !== "/portfolio") router.push("/portfolio?tab=target");
      else window.dispatchEvent(new CustomEvent(APPLY_TARGET_EVENT, { detail: action.weights }));
      setOpen(false);
    } else if (action.type === "open") {
      router.push(action.path);
      setOpen(false);
    } else if (action.type === "join_circle") {
      if (action.needsInvite) { router.push(`/circles/${action.circleId}`); setOpen(false); return; }
      try {
        await sama.joinCircle(action.circleId);
        setDone((x) => ({ ...x, [key]: true }));
        router.push(`/circles/${action.circleId}`);
        setOpen(false);
      } catch (err) {
        setChat((c) => [...c, { role: "assistant", content: err instanceof Error ? err.message : String(err), error: true }]);
      }
    }
  };

  if (!mounted) return null;

  // Above the phone tab bar; on the Target page also above its pinned Save bar.
  const lift = pathname === "/portfolio" ? "bottom-[calc(max(12px,env(safe-area-inset-bottom))+148px)]" : "bottom-[calc(max(12px,env(safe-area-inset-bottom))+88px)]";

  if (hidden) {
    return createPortal(
      <button type="button" onClick={() => setHide(false)} aria-label={e.aiShow} title={e.aiShow} className={cx("glass-panel-strong fixed right-4 z-50 grid size-12 place-items-center rounded-full transition-[filter] hover:brightness-110 md:bottom-6", lift)}>
        <AiAvatar size={38} />
      </button>,
      document.body,
    );
  }

  return createPortal(
    <>
      {open && <div onClick={() => setOpen(false)} aria-hidden="true" className="fixed inset-0 z-40 bg-black/35 backdrop-blur-md" />}
      <div className={cx("fixed inset-x-4 z-50 mx-auto grid max-w-[480px] gap-2 md:bottom-6", lift)}>
        {open && (
          <div className="glass-panel-strong flex max-h-[min(70vh,560px)] flex-col overflow-hidden rounded-[24px]">
            <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-3.5">
              {view === "history" ? (
                <button type="button" onClick={() => setView("chat")} className="flex items-center gap-1.5 text-sm font-semibold text-ink"><span aria-hidden="true">‹</span>{e.aiHistory}</button>
              ) : (
                <p className="text-sm font-semibold text-ink">{e.aiTitle}</p>
              )}
              <div className="flex items-center gap-1">
                {view === "chat" && <button type="button" onClick={() => void showHistory()} className="rounded-full px-2.5 py-1 text-xs text-ink-3 hover:bg-surface-2 hover:text-ink">{e.aiHistory}</button>}
                {(view === "history" || chat.length > 0) && <button type="button" onClick={newChat} className="rounded-full px-2.5 py-1 text-xs text-ink-3 hover:bg-surface-2 hover:text-ink">{e.aiNew}</button>}
                <button type="button" onClick={() => setOpen(false)} aria-label={d.common.done} className="grid size-7 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink">×</button>
              </div>
            </div>
            <ScrollArea className="grid min-h-0 flex-1 content-start gap-3 px-4 pb-4 pt-2">
              {view === "history" ? (
                <HistoryList items={history} activeId={chatId} confirmAll={confirmAll} onOpen={(id) => void openChat(id)} onDelete={(id) => void removeChat(id)} onAskAll={() => setConfirmAll(true)} onDeleteAll={() => void removeAll()} />
              ) : (
              <>
              {chat.length === 0 && (
                <>
                  <p className="text-sm leading-relaxed text-ink-2">{e.aiIntro}</p>
                  <div className="flex flex-wrap gap-2">
                    {e.aiEx.map((ex: string) => (
                      <button key={ex} type="button" disabled={!enabled || busy} onClick={() => void send(ex)} className="rounded-full border border-line px-3.5 py-1.5 text-left text-xs text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50">{ex}</button>
                    ))}
                  </div>
                </>
              )}
              {chat.map((m, i) => (
                <Message key={i} entry={m} done={done} id={String(i)} onRun={(k, a) => void run(k, a)} onClose={() => setOpen(false)} />
              ))}
              {busy && (
                <div className="flex items-center gap-2.5" role="status">
                  <AiAvatar thinking size={28} />
                  <span className="text-sm text-ink-3">{e.aiBusy}<span className="ai-caret" aria-hidden="true" /></span>
                </div>
              )}
              <div ref={end} />
              </>
              )}
            </ScrollArea>
          </div>
        )}
        <form onSubmit={(ev) => { ev.preventDefault(); void send(text); }} className="glass-panel-strong flex items-center gap-2.5 rounded-full p-1.5 pr-2">
          <AiAvatar thinking={busy} size={36} />
          <input aria-label={e.aiLabel} value={text} onChange={(ev) => setText(ev.target.value)} onFocus={() => setOpen(true)} disabled={!enabled || busy} maxLength={500} placeholder={enabled ? e.aiPlaceholder : e.aiOff} autoComplete="off" className="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm font-medium text-ink outline-none placeholder:text-ink-3 disabled:opacity-70" />
          <button type="submit" disabled={!enabled || busy || !text.trim()} aria-label={e.aiButton} title={e.aiButton} className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-white transition-[filter,opacity] hover:brightness-110 disabled:opacity-35"><IconArrowRight size={18} /></button>
          <button type="button" onClick={() => setHide(true)} aria-label={e.aiHide} title={e.aiHide} className="grid size-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </form>
      </div>
    </>,
    document.body,
  );
}

/** One chat turn: the words, then any result cards, then the buttons for actions the user may confirm. */
function Message({ entry, id, done, onRun, onClose }: { entry: Entry; id: string; done: Record<string, boolean>; onRun: (key: string, a: AssistantAction) => void; onClose: () => void }) {
  const { d, fmt } = useI18n();
  const e = d.portfolio.editor;
  if (entry.role === "user") {
    return <p className="ml-10 w-fit max-w-full justify-self-end whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent-soft px-3.5 py-2 text-sm text-ink">{entry.content}</p>;
  }
  return (
    <div className="flex items-start gap-2.5">
      <AiAvatar size={28} className="mt-0.5" />
      <div className="grid min-w-0 flex-1 gap-2.5">
        <p className={cx("whitespace-pre-wrap break-words text-sm leading-relaxed", entry.error ? "text-danger" : "text-ink-2")}>{entry.content}</p>
        {entry.blocks?.map((b, i) =>
          b.type === "prices" ? (
            <div key={i} className="grid gap-2 rounded-2xl bg-surface-2/70 p-3">
              {b.items.length > 0 && <p className="text-xs text-ink-3">{e.aiPrices}</p>}
              <ul className="grid gap-2">
                {b.items.map((p) => (
                  <li key={p.symbol}>
                    <TokenCard symbol={p.symbol} name={p.name} priceUsd={p.priceUsd} onNavigate={onClose} />
                  </li>
                ))}
              </ul>
              {b.missing.length > 0 && <p className="text-xs text-ink-3">{fmt(e.aiMissing, { list: b.missing.join(", ") })}</p>}
            </div>
          ) : b.circles.length === 0 ? (
            <p key={i} className="text-xs text-ink-3">{e.aiNoCircles}</p>
          ) : (
            <ul key={i} className="grid gap-2">
              {b.circles.map((c) => (
                <li key={c.id}>
                  <Link href={`/circles/${c.id}`} onClick={onClose} className="flex items-center gap-3 rounded-2xl border border-line px-3.5 py-2.5 transition-colors hover:bg-surface-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{c.name}</span>
                      <span className="block truncate text-xs text-ink-3">{fmt(d.circles.members, { n: c.memberCount })} · {c.assetSymbols.slice(0, 4).join(", ")}</span>
                    </span>
                    <span className="text-xs font-semibold text-accent">{e.aiOpen}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ),
        )}
        {entry.actions?.map((a, i) => {
          const key = `${id}:${i}`;
          if (a.type === "apply_target") {
            return (
              <div key={key} className="grid gap-2 rounded-2xl border border-line p-3">
                <ul className="grid gap-1.5">
                  {Object.entries(a.weights).sort((x, y) => y[1] - x[1]).map(([sym, pct]) => (
                    <li key={sym} className="flex items-center gap-3 text-sm">
                      <AssetIcon symbol={sym} size={22} />
                      <span className="flex-1 font-medium text-ink">{sym}</span>
                      <span className="tabular-nums font-semibold text-ink">{pct}%</span>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => onRun(key, a)} className="h-10 rounded-full bg-accent text-sm font-semibold text-white transition-[filter] hover:brightness-110">{e.aiApply}</button>
              </div>
            );
          }
          const label = a.type === "open" ? a.label : done[key] ? e.aiJoined : a.needsInvite ? fmt(e.aiOpenToJoin, { name: a.name }) : fmt(e.aiJoin, { name: a.name });
          return <button key={key} type="button" disabled={Boolean(done[key])} onClick={() => onRun(key, a)} className="h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-60">{label}</button>;
        })}
      </div>
    </div>
  );
}

/** Saved conversations: open one, delete one, or clear them all (two taps). */
function HistoryList({ items, activeId, confirmAll, onOpen, onDelete, onAskAll, onDeleteAll }: { items: ChatSummary[] | null; activeId: string | null; confirmAll: boolean; onOpen: (id: string) => void; onDelete: (id: string) => void; onAskAll: () => void; onDeleteAll: () => void }) {
  const { d, locale } = useI18n();
  const e = d.portfolio.editor;
  const when = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  if (items === null) return <p className="text-sm text-ink-3">…</p>;
  if (items.length === 0) return <p className="text-sm text-ink-3">{e.aiHistoryEmpty}</p>;
  return (
    <>
      <ul className="grid gap-1.5">
        {items.map((c) => (
          <li key={c.id} className={cx("flex items-center gap-2 rounded-2xl border px-3.5 py-2.5", c.id === activeId ? "border-accent bg-accent-soft/40" : "border-line")}>
            <button type="button" onClick={() => onOpen(c.id)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium text-ink">{c.title}</span>
              <span className="block text-xs text-ink-3">{when.format(new Date(c.updatedAt))}</span>
            </button>
            <button type="button" onClick={() => onDelete(c.id)} aria-label={`${e.aiDelete}: ${c.title}`} title={e.aiDelete} className="grid size-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-danger">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={confirmAll ? onDeleteAll : onAskAll} className={cx("h-10 rounded-full border text-sm font-semibold transition-colors", confirmAll ? "border-danger bg-danger/10 text-danger" : "border-line text-ink-2 hover:bg-surface-2")}>{confirmAll ? e.aiDeleteAllConfirm : e.aiDeleteAll}</button>
    </>
  );
}
