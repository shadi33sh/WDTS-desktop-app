import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Music, FileText, BookmarkPlus } from "lucide-react";

interface GreetingPageProps {
  onOpen: () => void;
  historyCount: number;
  onShowHistory: () => void;
}

export default function GreetingPage({ onOpen, historyCount, onShowHistory }: GreetingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-6">
      {/* Floating orbs */}
      <motion.div
        className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-foreground/[0.03] blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-25%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-foreground/[0.04] blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.1, 1], x: [0, -20, 0], y: [0, 15, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-[30%] right-[20%] w-[25vw] h-[25vw] rounded-full bg-foreground/[0.02] blur-2xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Floating sparkles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-foreground/10 pointer-events-none"
          style={{
            top: `${15 + i * 16}%`,
            left: `${10 + i * 18}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.05, 0.15, 0.05],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
        >
          <Sparkles size={12 + i * 4} />
        </motion.div>
      ))}

      <motion.div
        className="flex flex-col items-center gap-6 max-w-lg text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Logo with glow */}
        <motion.div className="relative">
          <motion.div
            className="absolute inset-0 blur-3xl bg-foreground/5 rounded-full scale-150"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.h1
            className="font-display font-extrabold tracking-[-0.04em] text-foreground leading-none relative"
            style={{ fontSize: "clamp(72px, 18vw, 120px)" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          >
            WDTS
          </motion.h1>
        </motion.div>

        <motion.p
          className="font-display text-xs tracking-[0.3em] uppercase text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          What Did They Say
        </motion.p>

        {/* Glass card with steps */}
        <motion.div
          className="flex flex-col gap-4 mt-4 bg-foreground/[0.03] backdrop-blur-xl border border-foreground/[0.08] rounded-2xl p-6 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { icon: Music, text: "Choose a song or podcast audio file" },
            { icon: FileText, text: "Load Arabic & English .srt subtitle files" },
            { icon: BookmarkPlus, text: "Click any word to save it to your list" },
          ].map((step, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 text-sm text-muted-foreground"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <span className="w-8 h-8 rounded-xl bg-foreground/[0.06] backdrop-blur-sm border border-foreground/[0.08] flex items-center justify-center flex-shrink-0">
                <step.icon size={14} className="text-foreground/60" />
              </span>
              <span className="font-body text-left">{step.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          className="mt-6 flex items-center gap-3 px-10 py-4 bg-foreground text-background font-display font-bold text-sm tracking-wide rounded-2xl hover:opacity-80 transition-opacity shadow-[0_0_40px_-10px] shadow-foreground/20"
          onClick={onOpen}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 30 }}
          whileHover={{ scale: 1.03, boxShadow: "0 0 60px -10px rgba(0,0,0,0.3)" }}
          whileTap={{ scale: 0.97 }}
        >
          <Sparkles size={16} />
          Open Audio
          <ArrowRight size={16} />
        </motion.button>

        {/* History link */}
        {historyCount > 0 && (
          <motion.button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono bg-foreground/[0.04] backdrop-blur-sm px-4 py-2 rounded-xl border border-foreground/[0.06]"
            onClick={onShowHistory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {historyCount} recent file{historyCount > 1 ? "s" : ""} →
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
