"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { CriticCard } from "@/components/onboarding/critic-card";
import { SelectableChip } from "@/components/onboarding/selectable-chip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CRITIC_PROFILES } from "@/lib/critics";
import {
  GENRE_OPTIONS,
  READING_STYLE_OPTIONS,
} from "@/lib/onboarding-options";
import { playCriticVoiceSample, stopNarration } from "@/lib/narration";
import { saveReaderProfile } from "@/lib/profile";
import type { CriticType } from "@/lib/voices";

type ReaderProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toggleSelection(value: string, current: string[]) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

export function ReaderProfileModal({
  open,
  onOpenChange,
}: ReaderProfileModalProps) {
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteBook, setFavoriteBook] = useState("");
  const [readingStyles, setReadingStyles] = useState<string[]>([]);
  const [selectedCritic, setSelectedCritic] = useState<CriticType | null>(
    null,
  );
  const [previewingCritic, setPreviewingCritic] = useState<CriticType | null>(
    null,
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      stopNarration();
      setPreviewingCritic(null);
    }
    onOpenChange(nextOpen);
  }

  function handleSelectCritic(criticId: CriticType) {
    setSelectedCritic(criticId);
    setPreviewingCritic(criticId);
    void playCriticVoiceSample(criticId).finally(() => {
      setPreviewingCritic((current) => (current === criticId ? null : current));
    });
  }

  function handleSave() {
    saveReaderProfile({
      favoriteGenres,
      favoriteBook,
      readingStylePreferences: readingStyles,
      criticType: selectedCritic ?? "professor",
    });
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,720px)] flex-col overflow-hidden sm:max-w-md">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 text-left">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            <span>Quick setup · 60 seconds</span>
          </div>
          <DialogTitle className="text-2xl">Build Your Reader Profile</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            Tell Libra what you love — we&apos;ll tailor every critique to your
            taste.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex-1 space-y-6 overflow-y-auto px-6 py-2"
        >
          <section className="space-y-3">
            <SectionLabel
              title="Favorite Genres"
              hint={`${favoriteGenres.length} selected`}
            />
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((genre) => (
                <SelectableChip
                  key={genre}
                  label={genre}
                  selected={favoriteGenres.includes(genre)}
                  onToggle={() =>
                    setFavoriteGenres((prev) => toggleSelection(genre, prev))
                  }
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionLabel title="Favorite Book" />
            <Input
              placeholder="e.g. Dune, The Midnight Library..."
              value={favoriteBook}
              onChange={(event) => setFavoriteBook(event.target.value)}
            />
          </section>

          <section className="space-y-3">
            <SectionLabel
              title="Reading Style Preferences"
              hint={`${readingStyles.length} selected`}
            />
            <div className="flex flex-wrap gap-2">
              {READING_STYLE_OPTIONS.map((style) => (
                <SelectableChip
                  key={style}
                  label={style}
                  selected={readingStyles.includes(style)}
                  onToggle={() =>
                    setReadingStyles((prev) => toggleSelection(style, prev))
                  }
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionLabel title="Choose Your Libra Critic" />
            <div className="space-y-2.5">
              {CRITIC_PROFILES.map((critic) => (
                <CriticCard
                  key={critic.id}
                  critic={critic}
                  selected={selectedCritic === critic.id}
                  isPreviewing={previewingCritic === critic.id}
                  onSelect={() => handleSelectCritic(critic.id)}
                />
              ))}
            </div>
          </section>
        </motion.div>

        <div className="shrink-0 border-t border-white/[0.06] px-6 py-4">
          <Button
            size="lg"
            className="h-12 w-full rounded-xl"
            onClick={handleSave}
          >
            Save Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h3 className="text-sm font-medium tracking-tight text-foreground">
        {title}
      </h3>
      {hint ? (
        <span className="text-[11px] text-muted-foreground/70">{hint}</span>
      ) : null}
    </div>
  );
}
