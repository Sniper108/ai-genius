"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, X, Paperclip } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { AgentAvatar } from "./Avatar";

type Col = "todo" | "doing" | "done";
interface Attachment {
  name: string;
  url: string;
  type: string;
}
interface Card {
  id: string;
  title: string;
  agent?: string;
  col: Col;
  created: number;
  attachments?: Attachment[];
}

const COLS: { key: Col; label: string; accent: string }[] = [
  { key: "todo", label: "To Do", accent: "#64748b" },
  { key: "doing", label: "In Progress", accent: "#22d3ee" },
  { key: "done", label: "Done", accent: "#a3e635" },
];
const ORDER: Col[] = ["todo", "doing", "done"];
const KEY = "nexus.board";

let uid = 0;
const nextId = () => `b${Date.now()}_${uid++}`;

export function BoardView() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [agent, setAgent] = useState<string>("");
  const saveT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadForRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCards(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(cards));
      } catch {
        /* ignore */
      }
    }, 200);
  }, [cards, loaded]);

  const add = () => {
    if (!title.trim()) return;
    setCards((c) => [
      { id: nextId(), title: title.trim(), agent: agent || undefined, col: "todo", created: Date.now() },
      ...c,
    ]);
    setTitle("");
  };

  const move = (id: string, dir: -1 | 1) =>
    setCards((c) =>
      c.map((card) => {
        if (card.id !== id) return card;
        const i = Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(card.col) + dir));
        return { ...card, col: ORDER[i] };
      }),
    );

  const remove = (id: string) => setCards((c) => c.filter((x) => x.id !== id));

  // You pick the file each time — that file picker IS the permission gate;
  // nothing is read from your computer unless you choose it here.
  const pickFileFor = (id: string) => {
    uploadForRef.current = id;
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const id = uploadForRef.current;
    if (!file || !id) return;
    setUploading(id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setCards((c) =>
          c.map((card) =>
            card.id === id ? { ...card, attachments: [...(card.attachments || []), data] } : card,
          ),
        );
      }
    } catch {
      /* ignore */
    } finally {
      setUploading(null);
      uploadForRef.current = null;
    }
  };

  const removeAttachment = (cardId: string, url: string) =>
    setCards((c) =>
      c.map((card) =>
        card.id === cardId ? { ...card, attachments: (card.attachments || []).filter((a) => a.url !== url) } : card,
      ),
    );

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
      <input
        ref={fileRef}
        type="file"
        onChange={onFile}
        className="hidden"
        accept="image/*,.pdf,.txt,.md,.csv,.json,.doc,.docx,.xls,.xlsx"
      />
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations Board</h1>
          <p className="mt-1 text-sm text-white/45">Track tasks across your agent fleet. Saved locally.</p>
        </div>
        <span className="mono text-xs text-white/35">{cards.length} tasks</span>
      </motion.div>

      {/* Add row */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass mt-5 flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task…  (e.g. Research 5 trending fashion products)"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 focus:outline-none"
        >
          <option value="" className="bg-[#0d0d12] text-white">
            Unassigned
          </option>
          {AGENTS.map((a) => (
            <option key={a.id} value={a.id} className="bg-[#0d0d12] text-white">
              {a.name}
            </option>
          ))}
        </select>
        <button
          onClick={add}
          disabled={!title.trim()}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-electric to-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-glow shadow-electric/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-30"
        >
          <Plus size={16} /> Add
        </button>
      </motion.div>

      {/* Columns */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLS.map((col, ci) => {
          const items = cards.filter((c) => c.col === col.key);
          return (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + ci * 0.05 }}
              className="glass flex flex-col p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.accent }} />
                  {col.label}
                </span>
                <span className="mono text-xs text-white/35">{items.length}</span>
              </div>
              <div className="min-h-[8rem] space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((card) => {
                    const a = AGENTS.find((x) => x.id === card.agent);
                    return (
                      <motion.div
                        key={card.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-white/85">{card.title}</p>
                          <button
                            onClick={() => remove(card.id)}
                            className="shrink-0 text-white/20 opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {card.attachments && card.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {card.attachments.map((att) => (
                              <span key={att.url} className="group/att relative">
                                {att.type.startsWith("image/") ? (
                                  <a href={att.url} target="_blank" rel="noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      className="h-12 w-12 rounded-lg border border-white/10 object-cover"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="chip !max-w-[9rem] !text-[10px]"
                                  >
                                    <Paperclip size={10} />
                                    <span className="truncate">{att.name}</span>
                                  </a>
                                )}
                                <button
                                  onClick={() => removeAttachment(card.id, att.url)}
                                  className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-rose text-white group-hover/att:flex"
                                  title="Remove"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          {a ? (
                            <span className="flex items-center gap-1.5">
                              <AgentAvatar agent={a} size={18} />
                              <span className="text-[11px]" style={{ color: a.accent }}>
                                {a.name}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-white/30">Unassigned</span>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => pickFileFor(card.id)}
                              disabled={uploading === card.id}
                              className="rounded-md p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                              title="Attach a file for context (you pick it)"
                            >
                              <Paperclip size={14} />
                            </button>
                            {ORDER.indexOf(card.col) > 0 && (
                              <button
                                onClick={() => move(card.id, -1)}
                                className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"
                                title="Move left"
                              >
                                <ChevronLeft size={14} />
                              </button>
                            )}
                            {ORDER.indexOf(card.col) < ORDER.length - 1 && (
                              <button
                                onClick={() => move(card.id, 1)}
                                className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"
                                title="Move right"
                              >
                                <ChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-white/25">
                    {col.key === "todo" ? "Add a task above" : "Nothing here"}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
