import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatSessionOut } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

function groupSessions(sessions: ChatSessionOut[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups: { label: string; items: ChatSessionOut[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const s of sessions) {
    const created = new Date(s.created_at);
    if (created >= startOfToday) groups[0].items.push(s);
    else if (created >= startOfYesterday) groups[1].items.push(s);
    else if (created >= startOfWeek) groups[2].items.push(s);
    else groups[3].items.push(s);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  sessions,
  activeSessionId,
  onNewChat,
  onOpenSession,
  onDeleteSession,
  onOpenDocuments,
  documentCount,
  onOpenAccount,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  sessions: ChatSessionOut[];
  activeSessionId: string;
  onNewChat: () => void;
  onOpenSession: (session: ChatSessionOut) => void;
  onDeleteSession: (session: ChatSessionOut) => void;
  onOpenDocuments: () => void;
  documentCount: number;
  onOpenAccount: () => void;
}) {
  const { user, signOut } = useAuth();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase())),
    [sessions, search]
  );
  const groups = useMemo(() => groupSessions(filtered), [filtered]);

  const initial = (user?.email || "?").charAt(0).toUpperCase();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 272 }}
      transition={{ type: "spring", stiffness: 280, damping: 32 }}
      className="glass relative z-20 flex h-screen flex-col shrink-0 overflow-hidden"
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(124,58,237,0.4)]">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-slate-800 whitespace-nowrap overflow-hidden"
              >
                DeepScope
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.svg
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </motion.svg>
        </button>
      </div>

      <div className="px-3 space-y-2">
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="w-full flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {!collapsed && <span>New chat</span>}
        </motion.button>

        <button
          onClick={onOpenDocuments}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors"
          title="Documents"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {!collapsed && (
            <span className="flex-1 text-left">
              Documents{documentCount > 0 && <span className="text-slate-400"> · {documentCount}</span>}
            </span>
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 mt-4">
          <div className="relative">
            <svg
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats"
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/70 border border-violet-100 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
        </div>
      )}

      {/* History */}
      <div className="flex-1 overflow-y-auto px-3 mt-3 space-y-4 pb-3">
        {!collapsed &&
          groups.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    className={`group/item relative flex items-center rounded-lg transition-colors ${
                      s.id === activeSessionId ? "bg-violet-100" : "hover:bg-violet-50"
                    }`}
                  >
                    <button
                      onClick={() => onOpenSession(s)}
                      className={`flex-1 min-w-0 text-left pl-2.5 pr-7 py-2 text-sm truncate ${
                        s.id === activeSessionId ? "text-violet-800 font-medium" : "text-slate-600"
                      }`}
                      title={s.title}
                    >
                      {s.title}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(s);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-slate-400 opacity-0 group-hover/item:opacity-100 hover:bg-violet-200 hover:text-red-500 transition-all"
                      title="Delete conversation"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        {!collapsed && sessions.length === 0 && (
          <p className="px-2 text-xs text-slate-400">No conversations yet</p>
        )}
      </div>

      {/* User footer */}
      <div className="border-t border-violet-100/70 px-3 py-3 flex items-center gap-1">
        <button
          onClick={onOpenAccount}
          className="flex-1 min-w-0 flex items-center gap-2.5 rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-violet-50 transition-colors"
          title="Account settings"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {initial}
          </div>
          {!collapsed && (
            <span className="flex-1 min-w-0 text-left text-xs text-slate-500 truncate" title={user?.email}>
              {user?.email}
            </span>
          )}
        </button>
        {!collapsed && (
          <button
            onClick={signOut}
            className="text-slate-400 hover:text-red-500 transition-colors shrink-0 p-1"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        )}
      </div>
    </motion.aside>
  );
}
