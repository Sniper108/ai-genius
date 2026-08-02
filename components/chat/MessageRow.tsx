"use client";

import { motion } from "framer-motion";
import type { AgentDef } from "@/lib/types";
import { AgentAvatar, UserAvatar } from "@/components/Avatar";

/**
 * One row in a chat: assistant messages sit on the left with the agent avatar;
 * user messages sit on the right with the user avatar. Bubble content is passed
 * as children so each chat can render whatever it needs inside.
 */
export function MessageRow({
  role,
  agent,
  children,
  meta,
  error,
}: {
  role: "user" | "assistant";
  agent: AgentDef;
  children: React.ReactNode;
  meta?: React.ReactNode;
  error?: boolean;
}) {
  const isUser = role === "user";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`mb-5 flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className="mt-0.5 shrink-0">
        {isUser ? <UserAvatar size={32} /> : <AgentAvatar agent={agent} size={32} />}
      </div>

      <div className={`flex min-w-0 max-w-[82%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className="mb-1 px-1 text-[11px] font-medium text-white/40">
          {isUser ? "You" : agent.name}
        </div>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-white/[0.08] text-white/90"
              : "rounded-tl-sm border border-white/[0.06] bg-white/[0.03] text-white/85"
          } ${error ? "!border-rose/40 !bg-rose/5" : ""}`}
        >
          {children}
        </div>
        {meta && <div className="mt-1.5 px-1 text-[10px] text-white/35">{meta}</div>}
      </div>
    </motion.div>
  );
}

export function TypingDots({ color = "#ffffff" }: { color?: string }) {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}
