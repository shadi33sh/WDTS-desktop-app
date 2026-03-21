import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";

interface WordInfoModalProps {
  word: string | null;
  onClose: () => void;
}

interface WordSense {
  definition: string;
  examples?: string[];
  translations?: { word: string; language?: { name: string; code: string } }[];
}

interface WordEntryData {
  partOfSpeech: string;
  forms?: { word: string; tags?: string[] }[];
  senses?: WordSense[];
  synonyms?: string[];
}

interface WordData {
  word: string;
  entries: WordEntryData[];
}

export default function WordInfoModal({ word, onClose }: WordInfoModalProps) {
  const [data, setData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!word) { setData(null); setError(null); return; }

    let cancelled = false;
    const fetchWord = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch(
          `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}?translations=true`
        );
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Could not load word data. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchWord();
    return () => { cancelled = true; };
  }, [word]);

  return (
    <AnimatePresence>
      {word && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-foreground/10 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[71] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="pointer-events-auto w-full max-w-md max-h-[80vh] bg-surface/90 backdrop-blur-2xl border border-foreground/[0.08] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/[0.08]">
                <h2 className="font-display font-extrabold text-2xl text-foreground tracking-[-0.04em]">
                  {word}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-foreground/[0.06] transition-colors text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 size={28} className="animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground font-body">Loading…</p>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <AlertCircle size={32} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground font-body text-center">{error}</p>
                  </div>
                )}

                {data && (
                  <div className="flex flex-col gap-4">
                    {data.entries && data.entries.length > 0 ? (
                      data.entries.map((entry, i) => (
                        <div key={i} className="flex flex-col gap-3">
                          {/* Part of speech */}
                          <span className="inline-block self-start px-3 py-1 rounded-xl bg-foreground text-background text-[11px] font-display font-bold uppercase tracking-wider">
                            {entry.partOfSpeech}
                          </span>

                          {/* Forms */}
                          {entry.forms && entry.forms.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {entry.forms.map((f, idx) => (
                                <span key={idx} className="text-xs font-mono px-2 py-0.5 rounded-lg bg-foreground/[0.04] text-foreground/70">
                                  {f.word}
                                  {f.tags?.length ? (
                                    <span className="text-muted-foreground ml-1">({f.tags.join(", ")})</span>
                                  ) : null}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Senses */}
                          {entry.senses?.map((sense, k) => (
                            <div
                              key={k}
                              className="pl-3 border-l-2 border-foreground/20 flex flex-col gap-2"
                            >
                              <p className="text-sm font-body text-foreground leading-relaxed">
                                {sense.definition}
                              </p>

                              {sense.examples?.map((ex, l) => (
                                <p
                                  key={l}
                                  className="text-xs font-body italic text-muted-foreground bg-foreground/[0.03] px-3 py-2 rounded-xl"
                                >
                                  "{ex}"
                                </p>
                              ))}

                              {sense.translations?.map((tr, n) =>
                                tr.language?.code === "ar" ? (
                                  <p
                                    key={n}
                                    className="text-sm font-body text-foreground/80 bg-foreground/[0.04] px-3 py-2 rounded-xl border border-foreground/[0.06]"
                                    dir="rtl"
                                  >
                                    {tr.word}{" "}
                                    <span className="text-muted-foreground text-xs">
                                      ({tr.language?.name})
                                    </span>
                                  </p>
                                ) : null
                              )}
                            </div>
                          ))}

                          {/* Synonyms */}
                          {entry.synonyms && entry.synonyms.length > 0 && (
                            <div className="flex flex-col gap-2 mt-1">
                              <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
                                Synonyms
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {entry.synonyms.map((syn, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs font-body px-2.5 py-1 rounded-xl bg-foreground/[0.05] text-foreground/80 border border-foreground/[0.06]"
                                  >
                                    {syn}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {i < data.entries.length - 1 && (
                            <div className="h-px bg-foreground/[0.06] my-1" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <AlertCircle size={32} className="text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-body">No data available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
