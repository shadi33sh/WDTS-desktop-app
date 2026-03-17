import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

interface WordConfirmPopoverProps {
  word: string | null;
  position: { x: number; y: number } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function WordConfirmPopover({ word, position, onConfirm, onCancel }: WordConfirmPopoverProps) {
  return (
    <AnimatePresence>
      {word && position && (
        <motion.div
          className="fixed z-50 flex items-center gap-1.5 bg-foreground/90 backdrop-blur-xl text-background px-4 py-2 font-display text-xs font-bold shadow-2xl rounded-2xl border border-foreground/20"
          style={{
            left: position.x,
            top: position.y - 48,
            transform: "translateX(-50%)",
          }}
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <span className="mr-1">"{word}"</span>
          <button
            onClick={onConfirm}
            className="p-1 hover:bg-background/20 rounded-lg transition-colors"
          >
            <Check size={14} />
          </button>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-background/20 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
          {/* Arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-foreground/90 rotate-45 rounded-sm"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
