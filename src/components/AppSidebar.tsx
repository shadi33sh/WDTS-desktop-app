import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Clock, BookOpen, Trash2 } from "lucide-react";
import type { WordEntry, HistoryEntry } from "@/lib/wdts";
import { fmt, fmtDate } from "@/lib/wdts";

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  words: WordEntry[];
  history: HistoryEntry[];
  dark: boolean;
  onToggleTheme: () => void;
  onRemoveWord: (word: string) => void;
  onResumeEntry: (entry: HistoryEntry) => void;
  onRemoveHistory: (id: string) => void;
  handledIds: Set<string>;
}

type Tab = "words" | "history";

export default function AppSidebar({
  open,
  onClose,
  words,
  history,
  dark,
  onToggleTheme,
  onRemoveWord,
  onResumeEntry,
  onRemoveHistory,
  handledIds,
}: AppSidebarProps) {
  const [tab, setTab] = useState<Tab>("words");

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop - mobile only */}
          <motion.div
            className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-surface border-r border-border flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="font-display font-extrabold text-lg tracking-[-0.04em] text-foreground">WDTS</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-sm hover:bg-accent transition-colors text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: "words" as Tab, label: "Words", icon: BookOpen, count: words.length },
                { id: "history" as Tab, label: "History", icon: Clock, count: history.length },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-display font-semibold tracking-wide uppercase transition-colors relative ${
                    tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                  <span className="font-mono text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-sm">
                    {t.count}
                  </span>
                  {tab === t.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-px bg-foreground"
                      layoutId="sidebar-tab"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
              <AnimatePresence mode="wait">
                {tab === "words" && (
                  <motion.div
                    key="words"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {words.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-12 font-body leading-relaxed">
                        No words saved yet.<br />
                        Click any word in the subtitles.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {words.map((w) => (
                          <motion.div
                            key={w.word}
                            className="flex items-center justify-between p-3 rounded-sm border border-border hover:border-foreground/20 transition-colors group"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="min-w-0">
                              <p className="font-display font-bold text-sm text-foreground">{w.word}</p>
                              {w.context && (
                                <p className="font-body text-[11px] text-muted-foreground truncate mt-0.5">
                                  {w.context}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => onRemoveWord(w.word)}
                              className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {tab === "history" && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {history.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-12 font-body leading-relaxed">
                        No history yet.<br />
                        Pick a file to get started.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {history.map((item) => (
                          <motion.div
                            key={item.id}
                            className="p-3 rounded-sm cursor-pointer hover:bg-accent transition-colors group relative"
                            onClick={() => onResumeEntry(item)}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-display font-semibold text-xs text-foreground truncate flex-1">
                                {item.name}
                              </p>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
                                handledIds.has(item.id)
                                  ? "bg-accent text-foreground border border-border"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {handledIds.has(item.id) ? "auto" : "re-pick"}
                              </span>
                            </div>
                            <p className="font-mono text-[10px] text-muted-foreground mt-1">
                              {fmt(item.lastPosition)} / {fmt(item.duration)} · {fmtDate(item.updatedAt)}
                            </p>
                            {/* Progress bar */}
                            <div className="h-px bg-border mt-2 rounded-full">
                              <div
                                className="h-full bg-foreground rounded-full"
                                style={{ width: `${item.duration > 0 ? (item.lastPosition / item.duration) * 100 : 0}%` }}
                              />
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); onRemoveHistory(item.id); }}
                              className="absolute bottom-2 right-2 p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer - Theme toggle */}
            <div className="border-t border-border px-5 py-3">
              <button
                onClick={onToggleTheme}
                className="flex items-center gap-3 w-full py-2 px-3 rounded-sm text-sm font-body text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {dark ? <Sun size={14} /> : <Moon size={14} />}
                {dark ? "Light Mode" : "Dark Mode"}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
