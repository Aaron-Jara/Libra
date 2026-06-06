"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type ShimmerLineProps = {
  className?: string;
  delay?: number;
};

function ShimmerLine({ className, delay = 0 }: ShimmerLineProps) {
  return (
    <div
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full bg-white/6",
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="absolute inset-y-0 w-[45%] rounded-full bg-linear-to-r from-transparent via-primary/35 to-transparent blur-[0.5px]"
        initial={{ x: "-120%" }}
        animate={{ x: ["-120%", "280%"] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: [0.45, 0, 0.55, 1],
          delay,
        }}
      />
    </div>
  );
}

export type CinematicLoadingStateProps = {
  className?: string;
};

/**
 * Standalone cinematic loading UI — render when `isLoading` (or similar) is true.
 * Does not manage routing or data fetching.
 */
export function CinematicLoadingState({ className }: CinematicLoadingStateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const overlay = (
    <motion.div
      role="status"
      aria-live="polite"
      aria-busy="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className={cn(
        "fixed inset-0 z-90 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
        className="relative flex w-full max-w-sm flex-col items-center justify-center sm:max-w-md"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[72px] sm:size-80"
          animate={{
            opacity: [0.35, 0.55, 0.35],
            scale: [1, 1.06, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[42%] size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[48px]"
          animate={{
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
        />

        <div className="surface-glass relative w-full rounded-2xl border border-white/8 p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)] sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
        />

        <div className="mx-auto mb-8 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 sm:size-16">
          <motion.span
            className="font-display text-2xl text-primary sm:text-3xl"
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            L
          </motion.span>
        </div>

        <div className="space-y-3">
          <ShimmerLine className="h-3.5" delay={0} />
          <ShimmerLine className="w-[92%]" delay={0.15} />
          <ShimmerLine className="w-[78%]" delay={0.3} />
          <ShimmerLine className="w-[88%]" delay={0.45} />
        </div>

        <motion.p
          className="mt-8 text-center font-display text-base tracking-tight text-muted-foreground sm:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.span
            className="text-foreground/90"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Libra is reading
          </motion.span>
          <LoadingDots />
        </motion.p>
      </div>

        <span className="sr-only">Loading, Libra is reading</span>
      </motion.div>
    </motion.div>
  );

  if (!mounted) return null;

  return createPortal(overlay, document.body);
}

function LoadingDots() {
  return (
    <span className="inline" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-[0.35em] text-center text-primary/90"
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}
