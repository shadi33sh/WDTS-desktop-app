import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Music, FileText, BookmarkPlus, Play } from "lucide-react";
import { useState, useEffect } from "react";

interface GreetingPageProps {
  onOpen: () => void;
  historyCount: number;
  onShowHistory: () => void;
  dark: boolean;
}

const QUOTES = [
  {
    text: "To have another language is to possess a second soul.",
    author: "Charlemagne",
  },
  {
    text: "Music gives wings to the mind and flight to the imagination.",
    author: "Plato",
  },
  {
    text: "Language is the road map of a culture.",
    author: "Rita Mae Brown",
  },
  {
    text: "One language opens a corridor. Two open every door.",
    author: "Frank Smith",
  },
  {
    text: "Music is the shorthand of emotion.",
    author: "Leo Tolstoy",
  },
];

const STEPS = [
  { icon: Music, label: "01", text: "Drop an audio file — song or podcast" },
  {
    icon: FileText,
    label: "02",
    text: "Load Arabic & English subtitle tracks",
  },
  { icon: BookmarkPlus, label: "03", text: "Tap any word to bank it forever" },
];

export default function GreetingPage({
  onOpen,
  historyCount,
  onShowHistory,
  dark,
}: GreetingPageProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % QUOTES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[quoteIndex];

  const gold = dark ? "rgba(111, 111, 111, 0.9)" : "rgba(115, 115, 115, 0.85)";
  const goldFaint = dark ? "rgba(180,140,80,0.15)" : "rgba(130,100,40,0.1)";
  const textStrong = dark ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.8)";
  const textMuted = dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const surface = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.035)";
  const surfaceBorder = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const bg = dark ? "#0c0c0e" : "#f4f1ec";

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: bg }}
    >
      {/* Grain texture */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1, opacity: dark ? 0.04 : 0.025 }}
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Ambient orbs */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 700,
          height: 700,
          top: "-25%",
          right: "-18%",
          background: `radial-gradient(circle, ${dark ? "rgba(212, 212, 212, 0.07)" : "rgba(101, 101, 101, 0.1)"} 0%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          bottom: "-15%",
          left: "-12%",
          background: `radial-gradient(circle, ${dark ? "rgba(70,110,170,0.07)" : "rgba(70,110,170,0.07)"} 0%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.5,
        }}
      />

      {/* Large decorative Arabic letter */}
      <motion.div
        className="absolute select-none pointer-events-none"
        style={{
          fontSize: "clamp(300px, 32vw, 520px)",
          lineHeight: 1,
          top: "50%",
          right: "-3%",
          transform: "translateY(-52%)",
          color: dark ? "rgba(255,255,255,0.022)" : "rgba(0,0,0,0.035)",
          zIndex: 0,
          userSelect: "none",
        }}
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        ع
      </motion.div>

      {/* Main grid layout */}
      <div
        className="relative z-10 w-full px-8 py-16"
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <motion.div
          className="flex flex-col gap-10"
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Eyebrow + Logo */}
          <div>
            <motion.p
              style={{
                fontSize: 9,
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: textMuted,
                marginBottom: 14,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              What Did They Say
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 260,
                damping: 28,
              }}
            >
              {dark ? (
                <img src="intro.png" className="w-40" alt="WDTS" />
              ) : (
                <img src="intro-light.png" className="w-40" alt="WDTS" />
              )}
            </motion.div>
          </div>

          {/* Quote block */}
          <div>
            {/* Section label */}
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: gold,
                marginBottom: 14,
                opacity: 0.8,
              }}
            >
              Words to learn by
            </p>

            <div
              style={{
                borderLeft: `2px solid ${gold}`,
                paddingLeft: 20,
                minHeight: 108,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                >
                  <p
                    style={{
                      fontSize: "clamp(14px, 1.4vw, 17px)",
                      lineHeight: 1.7,
                      fontStyle: "italic",
                      color: textStrong,
                      marginBottom: 12,
                    }}
                  >
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        color: gold,
                        textTransform: "uppercase",
                      }}
                    >
                      — {quote.author}
                    </span>
           
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div style={{ display: "flex", gap: 6, marginTop: 18 }}>
                {QUOTES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setQuoteIndex(i)}
                    style={{
                      height: 4,
                      width: i === quoteIndex ? 20 : 4,
                      borderRadius: 2,
                      background: i === quoteIndex ? gold : surfaceBorder,
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.35s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT COLUMN ── */}
        <motion.div
          className="flex flex-col gap-7"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        >
          {/* How it works */}
          <div>
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: gold,
                marginBottom: 14,
                opacity: 0.8,
              }}
            >
              How it works
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "13px 16px",
                    borderRadius: 13,
                    background: surface,
                    border: `1px solid ${surfaceBorder}`,
                    backdropFilter: "blur(12px)",
                    cursor: "default",
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.4 + i * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  whileHover={{
                    background: goldFaint,
                    borderColor: dark
                      ? "rgba(199, 199, 199, 0.18)"
                      : "rgba(103, 103, 103, 0.15)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      color: gold,
                      width: 18,
                      flexShrink: 0,
                      opacity: 0.75,
                    }}
                  >
                    {step.label}
                  </span>
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      background: surface,
                      border: `1px solid ${surfaceBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <step.icon
                      size={13}
                      style={{
                        color: dark
                          ? "rgba(255,255,255,0.42)"
                          : "rgba(0,0,0,0.42)",
                      }}
                    />
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: dark
                        ? "rgba(255,255,255,0.52)"
                        : "rgba(0,0,0,0.52)",
                      lineHeight: 1.4,
                    }}
                  >
                    {step.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA area */}
          <motion.div
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.75,
              type: "spring",
              stiffness: 280,
              damping: 26,
            }}
          >
            {/* Primary CTA */}
            <motion.button
              onClick={onOpen}
              style={{
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "17px 22px",
                borderRadius: 14,
                background: dark
                  ? "linear-gradient(135deg, #878787 0%, #c3d2cd 100%)"
                  : "linear-gradient(135deg, #636363 0%, #919191 100%)",
                color: dark ? "#0c0c0e" : "#f4f1ec",
                border: "none",
                cursor: "pointer",
                boxShadow: dark
                  ? "0 6px 36px rgba(162, 162, 162, 0.28), inset 0 1px 0 rgba(255,255,255,0.12)"
                  : "0 6px 36px rgba(50,34,16,0.22)",
              }}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
            >
              {/* Shimmer sweep */}
              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.11) 50%, transparent 65%)",
                  backgroundSize: "250% 100%",
                  pointerEvents: "none",
                }}
                animate={{ backgroundPosition: ["250% 0", "-250% 0"] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 2,
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "rgba(0,0,0,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Play size={13} fill="currentColor" />
                </span>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.22em",
                      opacity: 0.6,
                      textTransform: "uppercase",
                      marginBottom: 2,
                    }}
                  >
                    Get started
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Open Audio File
                  </div>
                </div>
              </div>

              <ArrowRight
                size={15}
                style={{
                  opacity: 0.65,
                  position: "relative",
                  zIndex: 1,
                  flexShrink: 0,
                }}
              />
            </motion.button>

            {/* History */}
            {historyCount > 0 && (
              <motion.button
                onClick={onShowHistory}
                style={{
                  width: "100%",
                  padding: "10px 18px",
                  borderRadius: 11,
                  background: surface,
                  border: `1px solid ${surfaceBorder}`,
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: textMuted,
                  cursor: "pointer",
                  transition: "color 0.2s ease",
                  textAlign: "center",
                }}
                whileHover={{ color: textStrong }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {historyCount} recent file{historyCount > 1 ? "s" : ""} in
                history →
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom vignette */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${bg} 0%, transparent 100%)`,
          zIndex: 2,
        }}
      />
    </div>
  );
}
