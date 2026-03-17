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
          className="fixed z-50 flex items-center gap-1 bg-foreground text-background px-3 py-1.5 font-display text-xs font-bold shadow-lg"
          style={{
            left: position.x,
            top: position.y - 44,
            transform: "translateX(-50%)",
          }}
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <span className="mr-1">"{word}"</span>
          <button
            onClick={onConfirm}
            className="p-1 hover:bg-background/20 rounded-sm transition-colors"
          >
            <Check size={14} />
          </button>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-background/20 rounded-sm transition-colors"
          >
            <X size={14} />
          </button>
          {/* Arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-foreground rotate-45"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
