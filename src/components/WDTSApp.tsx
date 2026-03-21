import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Play, Pause, SkipBack, SkipForward, RotateCcw, FileAudio, FileText } from "lucide-react";
import GreetingPage from "@/components/GreetingPage";
import AppSidebar from "@/components/AppSidebar";
import WordConfirmPopover from "@/components/WordConfirmPopover";
import {
  type SubEntry, type HistoryEntry, type WordEntry, type SubtitlePair,
  FS_SUPPORTED, pickFileWithHandle, pickFileFallback,
  saveHandle, loadHandle, reopenHandle, deleteHandle,
  parseSRT, getHistory, upsertHistory, removeHistory,
  getWords, addWord, removeWord, fmt, fmtDate,
  srtHandleKey, reopenSrtHandle,
} from "@/lib/wdts";

export default function WDTSApp() {
  const [dark, setDark] = useState(false);

  // Apply dark class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  /* ── Audio state ── */
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  /* ── Subtitles ── */
  const [engSubs, setEngSubs] = useState<SubEntry[]>([]);
  const [arSubs, setArSubs] = useState<SubEntry[]>([]);
  const engRef = useRef<SubEntry[]>([]);
  const arRef = useRef<SubEntry[]>([]);
  const [sub, setSub] = useState<SubtitlePair>({ en: "", ar: "" });

  /* ── UI ── */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showHistInSidebar, setShowHistInSidebar] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  /* ── Word confirm ── */
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const [pendingWordPos, setPendingWordPos] = useState<{ x: number; y: number } | null>(null);

  /* ── Data ── */
  const [words, setWords] = useState<WordEntry[]>([]);
  const [history, setHist] = useState<HistoryEntry[]>([]);
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

  /* ── Refs ── */
  const rafRef = useRef<number | null>(null);
  const slotRef = useRef(-1);
  const entryRef = useRef<HistoryEntry | null>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => { engRef.current = engSubs; }, [engSubs]);
  useEffect(() => { arRef.current = arSubs; }, [arSubs]);

  useEffect(() => {
    const hist = getHistory();
    setWords(getWords());
    setHist(hist);
    if (FS_SUPPORTED) {
      (async () => {
        const ids = new Set<string>();
        await Promise.all(
          hist.map(async (h) => {
            const handle = await loadHandle(h.id).catch(() => null);
            if (handle) ids.add(h.id);
          })
        );
        setHandledIds(ids);
      })();
    }
  }, []);

  /* ── RAF ── */
  const startRAF = useCallback(() => {
    const tick = () => {
      const a = audioRef.current;
      if (!a) return;
      const pos = a.currentTime * 1000;
      setPosition(pos);
      const findSub = (subs: SubEntry[]) =>
        subs.find((s) => pos >= s.start && pos <= s.end)?.text ?? "";
      setSub({ en: findSub(engRef.current), ar: findSub(arRef.current) });
      const slot = Math.floor(pos / 30_000);
      if (slot !== slotRef.current && entryRef.current) {
        slotRef.current = slot;
        const updated: HistoryEntry = {
          ...entryRef.current,
          lastPosition: pos,
          duration: (a.duration || 0) * 1000,
        };
        entryRef.current = updated;
        upsertHistory(updated);
        setHist(getHistory());
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopRAF = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /* ── Load audio ── */
  const loadAudioFile = useCallback(
    async (file: File, resumePosition: number, existingEntry?: HistoryEntry) => {
      stopRAF();
      const a = audioRef.current;
      if (a) { a.pause(); a.src = ""; }
      if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }

      const url = URL.createObjectURL(file);
      blobRef.current = url;
      setAudioUrl(url);
      setAudioName(file.name);
      setIsPlaying(false);
      setIsEnded(false);
      setPosition(0);
      setDuration(0);
      setSub({ en: "", ar: "" });
      slotRef.current = -1;

      const entry: HistoryEntry = existingEntry
        ? { ...existingEntry, updatedAt: Date.now() }
        : { id: file.name, name: file.name, lastPosition: resumePosition, duration: 0, updatedAt: Date.now() };
      entryRef.current = entry;
      upsertHistory(entry);
      setHist(getHistory());

      await new Promise((r) => setTimeout(r, 50));
      const audio = audioRef.current;
      if (!audio) return;
      audio.src = url;
      audio.load();

      audio.onerror = () => {
        showToast("Failed to load audio — file may be corrupted or missing");
        URL.revokeObjectURL(url);
        blobRef.current = null;
        setAudioUrl(null);
        setAudioName(null);
        setIsPlaying(false);
        setLoading(null);
        entryRef.current = null;
      };

      audio.onloadedmetadata = async () => {
        const dur = (audio.duration || 0) * 1000;
        setDuration(dur);
        const updated: HistoryEntry = { ...entry, duration: dur };
        entryRef.current = updated;
        upsertHistory(updated);
        setHist(getHistory());
        if (resumePosition > 0) audio.currentTime = resumePosition / 1000;
        await audio.play().catch(() => {});
        setIsPlaying(true);
        startRAF();
      };
    },
    [startRAF, stopRAF]
  );

  /* ── Try to auto-load stored SRT handles for an entry ── */
  const tryLoadStoredSrts = useCallback(async (entryId: string) => {
    if (!FS_SUPPORTED) return;
    const [enResult, arResult] = await Promise.all([
      reopenSrtHandle(entryId, "en"),
      reopenSrtHandle(entryId, "ar"),
    ]);
    if (enResult) {
      setEngSubs(enResult.entries);
      engRef.current = enResult.entries;
    }
    if (arResult) {
      setArSubs(arResult.entries);
      arRef.current = arResult.entries;
    }
  }, []);

  /* ── Pick audio ── */
  const pickAudio = useCallback(async () => {
    setEngSubs([]); setArSubs([]);
    engRef.current = []; arRef.current = [];
    try {
      let file: File;
      let handle: FileSystemFileHandle | undefined;
      if (FS_SUPPORTED) {
        const res = await pickFileWithHandle({ types: [{ description: "Audio", accept: { "audio/*": [] } }], multiple: false });
        if (!res) return;
        file = res.file;
        handle = res.handle;
      } else {
        const f = await pickFileFallback("audio/*");
        if (!f) return;
        file = f;
      }
      const hist = getHistory();
      const existing = hist.find((h) => h.id === file.name);
      const resumeAt = existing?.lastPosition ?? 0;
      if (handle) {
        await saveHandle(file.name, handle);
        setHandledIds((prev) => new Set([...prev, file.name]));
      }
      if (resumeAt > 0) showToast(`Resuming at ${fmt(resumeAt)}`);
      await loadAudioFile(file, resumeAt, existing);
      if (existing) await tryLoadStoredSrts(file.name);
    } catch (err) {
      console.error(err);
    }
  }, [loadAudioFile, tryLoadStoredSrts]);

  /* ── Resume ── */
  const resumeEntry = useCallback(
    async (entry: HistoryEntry) => {
      setSidebarOpen(false);
      setEngSubs([]); setArSubs([]);
      engRef.current = []; arRef.current = [];
      setLoading(`Opening "${entry.name}"…`);
      try {
        const file = await reopenHandle(entry.id);
        if (file) {
          showToast(`Resuming at ${fmt(entry.lastPosition)}`);
          await loadAudioFile(file, entry.lastPosition, entry);
          await tryLoadStoredSrts(entry.id);
          setLoading(null);
          return;
        }
        setLoading(null);
        showToast("File not found — please re-select to resume");
        let newFile: File | null = null;
        let newHandle: FileSystemFileHandle | undefined;
        if (FS_SUPPORTED) {
          const res = await pickFileWithHandle({ types: [{ description: "Audio", accept: { "audio/*": [] } }], multiple: false });
          if (!res) return;
          if (res.file.name !== entry.name) {
            showToast("File name mismatch — starting fresh");
            await loadAudioFile(res.file, 0);
            return;
          }
          newFile = res.file;
          newHandle = res.handle;
        } else {
          newFile = await pickFileFallback("audio/*");
          if (!newFile) return;
          if (newFile.name !== entry.name) {
            showToast("File name mismatch — starting fresh");
            await loadAudioFile(newFile, 0);
            return;
          }
        }
        if (newHandle) {
          await saveHandle(entry.id, newHandle);
          setHandledIds((prev) => new Set([...prev, entry.id]));
        }
        showToast(`Resuming at ${fmt(entry.lastPosition)}`);
        await loadAudioFile(newFile!, entry.lastPosition, entry);
        await tryLoadStoredSrts(entry.id);
      } catch (err) {
        console.error(err);
        showToast("Failed to open file — it may have been moved or deleted");
        setLoading(null);
      }
    },
    [loadAudioFile, tryLoadStoredSrts]
  );

  /* ── Pick SRT ── */
  const pickSRT = useCallback(async (lang: "en" | "ar") => {
    try {
      let file: File | null = null;
      let handle: FileSystemFileHandle | undefined;
      if (FS_SUPPORTED) {
        const res = await pickFileWithHandle({
          types: [{ description: "SRT Subtitle", accept: { "text/plain": [".srt"], "application/x-subrip": [".srt"] } }],
          multiple: false,
        });
        file = res?.file ?? null;
        handle = res?.handle;
      } else {
        file = await pickFileFallback(".srt,application/x-subrip,text/plain");
      }
      if (!file) return;
      const raw = await file.text();
      const parsed = parseSRT(raw);

      // Save SRT handle to IndexedDB for auto-reload on resume
      if (handle && entryRef.current) {
        const key = srtHandleKey(entryRef.current.id, lang);
        await saveHandle(key, handle);
      }

      if (lang === "en") {
        setEngSubs(parsed); engRef.current = parsed;
        if (entryRef.current) {
          const upd = { ...entryRef.current, engSubName: file.name };
          entryRef.current = upd;
          upsertHistory(upd);
          setHist(getHistory());
        }
      } else {
        setArSubs(parsed); arRef.current = parsed;
        if (entryRef.current) {
          const upd = { ...entryRef.current, arSubName: file.name };
          entryRef.current = upd;
          upsertHistory(upd);
          setHist(getHistory());
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  /* ── Controls ── */
  const togglePlay = () => {
    const a = audioRef.current;
    if (!a || !audioUrl) return;
    if (isEnded) {
      a.currentTime = 0; a.play(); setIsPlaying(true); setIsEnded(false); startRAF();
    } else if (a.paused) {
      a.play(); setIsPlaying(true); startRAF();
    } else {
      a.pause(); setIsPlaying(false); stopRAF();
    }
  };

  const seek = (secs: number) => {
    const a = audioRef.current;
    if (!a) return;
    const newT = Math.max(0, Math.min(a.duration || 0, a.currentTime + secs));
    a.currentTime = newT;
    const pos = newT * 1000;
    setPosition(pos);
    setSub({
      en: engRef.current.find((s) => pos >= s.start && pos <= s.end)?.text ?? "",
      ar: arRef.current.find((s) => pos >= s.start && pos <= s.end)?.text ?? "",
    });
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * a.duration;
    setPosition(a.currentTime * 1000);
  };

  /* ── Toast ── */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  /* ── Word click with confirmation ── */
  const handleWordClick = (word: string, e: React.MouseEvent) => {
    const clean = word.replace(/[^a-zA-Z']/g, "");
    if (clean.length < 2) return;
    const savedSet = new Set(words.map((w) => w.word.toLowerCase()));
    if (savedSet.has(clean.toLowerCase())) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPendingWord(clean);
    setPendingWordPos({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const confirmWord = () => {
    if (pendingWord && addWord(pendingWord, sub.en)) {
      setWords(getWords());
      showToast(`"${pendingWord}" saved ✓`);
    }
    setPendingWord(null);
    setPendingWordPos(null);
  };

  const cancelWord = () => {
    setPendingWord(null);
    setPendingWordPos(null);
  };

  const handleRemoveWord = (word: string) => {
    removeWord(word);
    setWords(getWords());
  };

  const handleRemoveHistory = (id: string) => {
    removeHistory(id);
    setHist(getHistory());
    setHandledIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const savedWords = new Set(words.map((w) => w.word.toLowerCase()));
  const progress = duration > 0 ? position / duration : 0;
  const canFwd = duration > 0 && duration - position > 10_000;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <audio
        ref={audioRef}
        onEnded={() => { setIsPlaying(false); setIsEnded(true); stopRAF(); }}
        onLoadedMetadata={() => setDuration((audioRef.current?.duration ?? 0) * 1000)}
      />

      {/* Sidebar */}
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        words={words}
        history={history}
        dark={dark}
        onToggleTheme={() => setDark((d) => !d)}
        onRemoveWord={handleRemoveWord}
        onResumeEntry={resumeEntry}
        onRemoveHistory={handleRemoveHistory}
        handledIds={handledIds}
      />

      {/* Word confirm */}
      <WordConfirmPopover
        word={pendingWord}
        position={pendingWordPos}
        onConfirm={confirmWord}
        onCancel={cancelWord}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 bg-foreground/90 backdrop-blur-xl text-background px-5 py-2 rounded-2xl font-display text-xs font-bold shadow-2xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-2xl flex flex-col items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-body">{loading}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {!audioUrl ? (
          <motion.div
            key="greeting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GreetingPage
              onOpen={pickAudio}
              historyCount={history.length}
              onShowHistory={() => { setSidebarOpen(true); setShowHistInSidebar(true); }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="player"
            className="min-h-screen flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Topbar */}
            <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4 bg-background/60 backdrop-blur-2xl border-b border-foreground/[0.06]">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl hover:bg-foreground/[0.06] transition-colors text-foreground"
              >
                <Menu size={18} />
              </button>
              <span className="font-display font-extrabold text-sm tracking-[-0.04em] text-foreground">WDTS</span>
              <button
                onClick={pickAudio}
                className="p-2 rounded-xl hover:bg-foreground/[0.06] transition-colors text-foreground"
              >
                <FileAudio size={18} />
              </button>
            </header>

            {/* Stage */}
            <main className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-6 pt-20 pb-8">
              {/* EN Subtitles */}
              <div className="min-h-[96px] w-full flex flex-wrap gap-1.5 justify-center items-center py-4 mb-2">
                <AnimatePresence mode="wait">
                  {sub.en ? (
                    <motion.div
                      key={sub.en}
                      className="flex flex-wrap gap-1.5 justify-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      {sub.en.split(/\s+/).map((w, i) => {
                        const cleaned = w.replace(/[^a-zA-Z']/g, "").toLowerCase();
                        const isSaved = savedWords.has(cleaned);
                        return (
                          <motion.span
                            key={`${w}-${i}`}
                            className={`font-display font-semibold cursor-pointer px-2 py-1 rounded-xl transition-colors select-none ${
                              isSaved
                                ? "bg-foreground text-background"
                                : "text-foreground hover:bg-foreground/[0.06]"
                            }`}
                            style={{ fontSize: "clamp(18px, 4vw, 22px)" }}
                            onClick={(e) => handleWordClick(w, e)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {w}
                          </motion.span>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {engSubs.length > 0 ? "♪" : ""}
                    </span>
                  )}
                </AnimatePresence>
              </div>

              {/* AR Subtitles */}
              <div className="min-h-[40px] w-full text-center py-1 mb-6">
                <AnimatePresence mode="wait">
                  {sub.ar && (
                    <motion.p
                      key={sub.ar}
                      className="font-arabic text-sm text-muted-foreground leading-relaxed"
                      style={{ direction: "rtl" }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {sub.ar}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* SRT buttons */}
              <div className="flex gap-2 flex-wrap justify-center mb-8">
                {engSubs.length === 0 && (
                  <button
                    onClick={() => pickSRT("en")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] backdrop-blur-sm text-muted-foreground font-display text-xs hover:border-foreground/20 hover:text-foreground transition-colors"
                  >
                    <FileText size={12} />
                    English SRT
                  </button>
                )}
                {arSubs.length === 0 && (
                  <button
                    onClick={() => pickSRT("ar")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] backdrop-blur-sm text-muted-foreground font-display text-xs hover:border-foreground/20 hover:text-foreground transition-colors"
                  >
                    <FileText size={12} />
                    Arabic SRT
                  </button>
                )}
              </div>

              {/* Progress */}
              <div className="w-full mb-3">
                <div
                  className="w-full h-1 bg-foreground/[0.1] rounded-full cursor-pointer relative group"
                  onClick={seekTo}
                >
                  <div
                    className="h-full bg-foreground rounded-full relative transition-[width] duration-100 linear"
                    style={{ width: `${progress * 100}%` }}
                  >
                    <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{fmt(position)}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{fmt(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-12 mt-6">
                <button
                  onClick={() => seek(-10)}
                  className="flex flex-col items-center gap-1 text-foreground opacity-60 hover:opacity-100 transition-opacity"
                >
                  <SkipBack size={20} />
                  <span className="font-mono text-[10px]">10s</span>
                </button>

                <motion.button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center text-background shadow-[0_0_30px_-5px] shadow-foreground/20"
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isEnded ? (
                    <RotateCcw size={22} />
                  ) : isPlaying ? (
                    <Pause size={22} />
                  ) : (
                    <Play size={22} className="ml-1" />
                  )}
                </motion.button>

                <button
                  onClick={() => canFwd && seek(10)}
                  className={`flex flex-col items-center gap-1 transition-opacity ${canFwd ? "text-foreground opacity-60 hover:opacity-100" : "text-muted-foreground opacity-20 cursor-default"}`}
                >
                  <SkipForward size={20} />
                  <span className="font-mono text-[10px]">10s</span>
                </button>
              </div>

              {/* File chip */}
              <div className="mt-10 font-mono text-[11px] text-muted-foreground truncate max-w-[280px] text-center">
                {audioName}
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
