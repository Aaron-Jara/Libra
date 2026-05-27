"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Pause, Play, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { CritiqueReplyModal } from "@/components/overlays/critique-reply-modal";
import { Button } from "@/components/ui/button";
import { CRITIC_PROFILES } from "@/lib/critics";
import type { NarrationSpeed } from "@/lib/narration-speed";
import {
  pauseNarration,
  playNarration,
  resumeNarration,
  setNarrationPlaybackSpeed,
  stopNarration,
  type NarrationState,
} from "@/lib/narration";
import {
  NarrationSpeedButton,
  NarrationSpeedModal,
} from "@/components/overlays/narration-speed-modal";
import { cn } from "@/lib/utils";
import type { CriticType } from "@/lib/voices";
import { voiceMap } from "@/lib/voices";
import type { CritiqueChatMessage } from "@/types/critique-chat";

export type CinematicAiResultsOverlayProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  bookCoverUrl?: string | null;
  bookTitle?: string;
  bookAuthor?: string;
  criticType: CriticType;
  /** Shown as active personality badge; defaults from critic profile */
  personalityBadge?: string;
  /** Opening / full-voice transcript block */
  critiqueTranscript: string;
  whyMatchesYourTaste: string;
  potentialMismatch: string;
  comparedToFavoriteBook: string;
  finalRecommendationVerdict: string;
};

const defaultBook = {
  title: "The Seven Moons of Maali Almeida",
  author: "Shehan Karunatilaka",
  coverUrl: null as string | null,
};

function getCriticProfile(type: CriticType) {
  return CRITIC_PROFILES.find((c) => c.id === type) ?? CRITIC_PROFILES[0];
}

function buildFullCritiqueText(props: Pick<
  CinematicAiResultsOverlayProps,
  | "critiqueTranscript"
  | "whyMatchesYourTaste"
  | "potentialMismatch"
  | "comparedToFavoriteBook"
  | "finalRecommendationVerdict"
>): string {
  // Plain prose only — section headings live in the UI, not in TTS.
  return [
    props.critiqueTranscript,
    props.whyMatchesYourTaste,
    props.potentialMismatch,
    props.comparedToFavoriteBook,
    props.finalRecommendationVerdict,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
}

function AudioWaveform({ active }: { active: boolean }) {
  const pattern = useMemo(() => {
    const bars = 28;
    return Array.from({ length: bars }, (_, i) => {
      const phase = (i / bars) * Math.PI * 2;
      return { phase, base: 0.25 + (i % 5) * 0.06, bars };
    });
  }, []);

  return (
    <div
      className="flex h-10 w-full items-center justify-center gap-[3px] px-1"
      aria-hidden
    >
      {pattern.map(({ phase, base, bars }, i) => (
        <motion.span
          key={i}
          className={cn(
            "w-[3px] max-w-[3px] rounded-full bg-linear-to-t from-primary/20 to-primary/70",
            active ? "opacity-100" : "opacity-50",
          )}
          animate={{
            scaleY: active
              ? [0.35 + base, 1, 0.4 + base * 0.8, 0.9, 0.35 + base]
              : [0.35 + base * 0.6, 0.55 + base * 0.4, 0.35 + base * 0.6],
          }}
          transition={{
            duration: active ? 0.55 + (i % 4) * 0.04 : 1.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: active ? (i / bars) * 0.12 : phase * 0.08,
          }}
          style={{ height: 28, transformOrigin: "center bottom" }}
        />
      ))}
    </div>
  );
}

type CinematicAiResultsLayerProps = Omit<CinematicAiResultsOverlayProps, "open">;

function CinematicAiResultsLayer({
  onOpenChange,
  bookCoverUrl,
  bookTitle,
  bookAuthor,
  criticType,
  personalityBadge,
  critiqueTranscript,
  whyMatchesYourTaste,
  potentialMismatch,
  comparedToFavoriteBook,
  finalRecommendationVerdict,
}: CinematicAiResultsLayerProps) {
  const titleId = useId();
  const critic = getCriticProfile(criticType);
  const displayName = voiceMap[criticType].displayName;
  const badge =
    personalityBadge ??
    critic.description.slice(0, 48) +
      (critic.description.length > 48 ? "…" : "");

  const book = {
    title: bookTitle ?? defaultBook.title,
    author: bookAuthor ?? defaultBook.author,
  };

  void bookCoverUrl;

  const [narrationState, setNarrationState] = useState<NarrationState>("idle");
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [narrationSpeed, setNarrationSpeed] = useState<NarrationSpeed>(1);
  const [chatMessages, setChatMessages] = useState<CritiqueChatMessage[]>([]);
  const narrationPlaying = narrationState === "playing";
  const narrationPaused = narrationState === "paused";
  const narrationLoading = narrationState === "loading";
  const narrationActive = narrationPlaying || narrationPaused;

  const critiqueNarration = useMemo(
    () =>
      buildFullCritiqueText({
        critiqueTranscript,
        whyMatchesYourTaste,
        potentialMismatch,
        comparedToFavoriteBook,
        finalRecommendationVerdict,
      }),
    [
      critiqueTranscript,
      whyMatchesYourTaste,
      potentialMismatch,
      comparedToFavoriteBook,
      finalRecommendationVerdict,
    ],
  );

  useEffect(() => {
    return () => {
      stopNarration();
    };
  }, []);

  const handleSpeedChange = useCallback((next: NarrationSpeed) => {
    setNarrationSpeed(next);
    setNarrationPlaybackSpeed(next);
  }, []);

  const handlePlayToggle = useCallback(async () => {
    if (narrationLoading) return;

    if (narrationPlaying) {
      pauseNarration(setNarrationState);
      return;
    }

    if (narrationPaused) {
      setNarrationError(null);
      resumeNarration(setNarrationState, setNarrationError);
      return;
    }

    setNarrationError(null);
    await playNarration(critiqueNarration, criticType, {
      speed: narrationSpeed,
      onStateChange: setNarrationState,
      onError: setNarrationError,
    });
  }, [
    critiqueNarration,
    criticType,
    narrationSpeed,
    narrationPlaying,
    narrationPaused,
    narrationLoading,
  ]);

  const handleDismiss = useCallback(() => {
    stopNarration(setNarrationState);
    setNarrationError(null);
    onOpenChange?.(false);
  }, [onOpenChange]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-100%" }}
        transition={{
          type: "spring",
          damping: 32,
          stiffness: 320,
          mass: 0.85,
        }}
        className={cn(
          "pointer-events-auto absolute inset-x-0 top-0 z-1 mx-auto flex h-[96dvh] max-h-[900px] w-full max-w-lg flex-col overflow-hidden rounded-b-[1.75rem] border border-white/10 border-t-0 bg-background/80 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:max-w-xl",
        )}
      >
            <button
              type="button"
              aria-label="Close results"
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 z-10 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
            />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
            {/* Hero: critic + book */}
            <div className="border-b border-white/6 px-4 pb-4 pt-5 text-center sm:px-5 sm:pt-8">
              <div className="relative mx-auto size-28 overflow-hidden rounded-full border-[3px] border-white/15 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)] ring-4 ring-black/30 sm:size-32">
                <Image
                  src={critic.image}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 112px, 128px"
                  priority
                />
              </div>

              <h2
                id={titleId}
                className="mt-4 font-display text-xl leading-tight tracking-tight text-balance text-foreground sm:text-2xl"
              >
                {book.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                {book.author}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-tight",
                    critic.accent.border,
                    critic.accent.bg,
                    "text-foreground",
                  )}
                >
                  {displayName}
                </span>
                <span className="inline-flex max-w-[min(100%,280px)] rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] leading-tight text-primary/95">
                  {badge}
                </span>
              </div>

              <div className="mx-auto mt-4 max-w-md rounded-xl border border-white/6 bg-black/20 px-2 py-1">
                <AudioWaveform active={narrationActive} />
              </div>
            </div>

            {/* Critique */}
            <div className="px-4 py-4 sm:px-5">
              <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
                <p className="whitespace-pre-wrap text-foreground/90">
                  {critiqueTranscript}
                </p>

                <section className="space-y-2">
                  <h3 className="font-display text-base font-medium tracking-tight text-foreground">
                    Why This Matches Your Taste
                  </h3>
                  <p className="whitespace-pre-wrap">{whyMatchesYourTaste}</p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-display text-base font-medium tracking-tight text-foreground">
                    Potential Mismatch
                  </h3>
                  <p className="whitespace-pre-wrap">{potentialMismatch}</p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-display text-base font-medium tracking-tight text-foreground">
                    Compared To Your Favorite Book
                  </h3>
                  <p className="whitespace-pre-wrap">{comparedToFavoriteBook}</p>
                </section>
              </div>
            </div>

            {/* Bottom */}
            <div className="space-y-3 border-t border-white/6 bg-black/25 px-4 py-4 pb-8 backdrop-blur-xl sm:px-5">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="lg"
                  variant={
                    narrationActive || narrationLoading ? "secondary" : "default"
                  }
                  className="h-12 min-w-0 flex-1 rounded-xl gap-2"
                  onClick={handlePlayToggle}
                >
                  {narrationLoading ? (
                    <>
                      <Play className="size-4 fill-current animate-pulse" />
                      Preparing narration...
                    </>
                  ) : narrationPlaying ? (
                    <>
                      <Pause className="size-4" />
                      Pause narration
                    </>
                  ) : narrationPaused ? (
                    <>
                      <Play className="size-4 fill-current" />
                      Resume narration
                    </>
                  ) : (
                    <>
                      <Play className="size-4 fill-current" />
                      Play narration
                    </>
                  )}
                </Button>
                <NarrationSpeedButton
                  speed={narrationSpeed}
                  onClick={() => setSpeedOpen(true)}
                />
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-12 shrink-0 rounded-xl gap-2 px-4"
                  onClick={() => {
                    setNarrationError(null);
                    setReplyOpen(true);
                  }}
                >
                  <MessageCircle className="size-4" />
                  Reply
                </Button>
              </div>

              <NarrationSpeedModal
                open={speedOpen}
                onOpenChange={setSpeedOpen}
                speed={narrationSpeed}
                onSpeedChange={handleSpeedChange}
              />
              {narrationError ? (
                <p className="text-xs text-destructive/85">{narrationError}</p>
              ) : null}

              <CritiqueReplyModal
                open={replyOpen}
                onOpenChange={setReplyOpen}
                criticType={criticType}
                bookTitle={book.title}
                bookAuthor={book.author}
                critiqueNarration={critiqueNarration}
                messages={chatMessages}
                onMessagesChange={setChatMessages}
                narrationSpeed={narrationSpeed}
                onNarrationStateChange={setNarrationState}
                onNarrationError={setNarrationError}
              />

              <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
                <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Final Recommendation Verdict
                </p>
                <p className="mt-1.5 font-display text-lg leading-snug tracking-tight text-foreground">
                  {finalRecommendationVerdict}
                </p>
              </div>
            </div>
            </div>
          </motion.div>
    </motion.div>
  );
}

export function CinematicAiResultsOverlay({
  open,
  ...layerProps
}: CinematicAiResultsOverlayProps) {
  return (
    <AnimatePresence>
      {open ? (
        <CinematicAiResultsLayer key="libra-cinematic-results" {...layerProps} />
      ) : null}
    </AnimatePresence>
  );
}
