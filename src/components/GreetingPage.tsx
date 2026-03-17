import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface GreetingPageProps {
  onOpen: () => void;
  historyCount: number;
  onShowHistory: () => void;
}

export default function GreetingPage({ onOpen, historyCount, onShowHistory }: GreetingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-6">
      <motion.div
        className="flex flex-col items-center gap-6 max-w-lg text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Logo */}
        <motion.h1
          className="font-display font-extrabold tracking-[-0.04em] text-foreground leading-none"
          style={{ fontSize: "clamp(72px, 18vw, 120px)" }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          WDTS
        </motion.h1>

        <motion.p
          className="font-display text-xs tracking-[0.3em] uppercase text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          What Did They Say
        </motion.p>

        {/* Steps */}
        <motion.div
          className="flex flex-col gap-3 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[
            "Choose a song or podcast audio file",
            "Load Arabic & English .srt subtitle files",
            "Click any word to save it to your list",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full border border-border flex items-center justify-center text-[10px] font-mono text-foreground flex-shrink-0">
                {i + 1}
              </span>
              <span className="font-body">{step}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          className="mt-8 flex items-center gap-3 px-10 py-4 bg-foreground text-background font-display font-bold text-sm tracking-wide rounded-none hover:opacity-80 transition-opacity"
          onClick={onOpen}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 30 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Open Audio
          <ArrowRight size={16} />
        </motion.button>

        {/* History link */}
        {historyCount > 0 && (
          <motion.button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
            onClick={onShowHistory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {historyCount} recent file{historyCount > 1 ? "s" : ""} →
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
