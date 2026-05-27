"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type SelectableChipProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
};

export function SelectableChip({
  label,
  selected,
  onToggle,
}: SelectableChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 sm:text-[13px]",
        selected
          ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_16px_-4px_rgba(251,191,36,0.2)]"
          : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-foreground",
      )}
    >
      {label}
    </motion.button>
  );
}
