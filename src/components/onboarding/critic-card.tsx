"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import type { CriticProfile } from "@/lib/critics";
import { cn } from "@/lib/utils";

type CriticCardProps = {
  critic: CriticProfile;
  selected: boolean;
  isPreviewing?: boolean;
  onSelect: () => void;
};

export function CriticCard({
  critic,
  selected,
  isPreviewing = false,
  onSelect,
}: CriticCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "surface-glass flex w-full items-start gap-3.5 rounded-2xl p-3.5 text-left transition-all duration-300 sm:gap-4 sm:p-4",
        critic.accent.border,
        critic.accent.bg,
        selected
          ? cn("ring-2", critic.accent.ring, critic.accent.glow)
          : "hover:border-white/[0.12]",
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-white/[0.08]">
        <Image
          src={critic.image}
          alt={critic.title}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground/80 uppercase">
          {critic.name}
        </p>
        <p className="mt-1 text-sm font-semibold tracking-tight text-foreground">
          {critic.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {critic.description}
        </p>
        {isPreviewing ? (
          <p className="mt-2 text-[10px] font-medium tracking-wide text-primary uppercase">
            Playing voice sample…
          </p>
        ) : null}
      </div>
    </motion.button>
  );
}
