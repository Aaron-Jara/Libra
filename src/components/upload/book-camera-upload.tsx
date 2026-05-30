"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, RefreshCcw, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { CinematicLoadingState } from "@/components/loading/cinematic-loading-state";
import { CinematicAiResultsOverlay } from "@/components/overlays/cinematic-ai-results-overlay";
import { Button } from "@/components/ui/button";
import { compressImageForUpload } from "@/lib/compress-image";
import { identifyBookWithGemini } from "@/lib/gemini";
import { LIBRA_NAVIGATE_HOME_EVENT } from "@/lib/navigate-home";
import { stopNarration } from "@/lib/narration";
import { loadReaderProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import type { CriticType } from "@/lib/voices";

type BookCameraUploadProps = {
  className?: string;
  /** Optional override; otherwise loaded from saved profile. */
  criticType?: CriticType;
};

export function BookCameraUpload({
  className,
  criticType,
}: BookCameraUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [identified, setIdentified] = useState<{
    title: string;
    author: string;
    description: string;
  } | null>(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const [critique, setCritique] = useState<{
    critique: string;
    tasteMatch: string;
    mismatch: string;
    comparisonToFavorite: string;
    verdict: string;
  } | null>(null);

  const overlayCopy = useMemo(() => {
    if (!identified || !critique) return null;
    return {
      critiqueTranscript: critique.critique,
      whyMatchesYourTaste: critique.tasteMatch,
      potentialMismatch: critique.mismatch,
      comparedToFavoriteBook: critique.comparisonToFavorite,
      verdict: critique.verdict,
    };
  }, [identified, critique]);

  const savedProfile = loadReaderProfile();
  const overlayCriticType: CriticType =
    criticType ?? savedProfile?.criticType ?? "professor";

  async function handleIdentify() {
    if (!file) return;
    const profile = loadReaderProfile();
    const resolvedCriticType: CriticType =
      criticType ?? profile?.criticType ?? "professor";

    if (!profile && !criticType) {
      setError("Build your Reader Profile first, then scan a cover.");
      return;
    }

    setLoading(true);
    setError(null);
    setIdentified(null);
    setCritique(null);
    setOverlayOpen(false);

    const imageForUpload = await compressImageForUpload(file);
    const result = await identifyBookWithGemini(imageForUpload);

    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }

    const critiqueRes = await fetch("/api/critique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: {
          favoriteGenres: profile?.favoriteGenres ?? [],
          favoriteBook: profile?.favoriteBook ?? "",
          readingStylePreferences: profile?.readingStylePreferences ?? [],
          criticType: resolvedCriticType,
        },
        book: result.data,
      }),
    });

    const critiqueJson = (await critiqueRes.json().catch(() => null)) as
      | { ok: true; data: NonNullable<typeof critique> }
      | { ok: false; error: string }
      | null;

    setLoading(false);

    if (!critiqueRes.ok || !critiqueJson || !("ok" in critiqueJson)) {
      setError("Could not generate critique. Please try again.");
      return;
    }

    if (!critiqueJson.ok) {
      setError(critiqueJson.error);
      return;
    }

    setIdentified(result.data);
    setCritique(critiqueJson.data);
    setOverlayOpen(true);
  }

  function reset() {
    setFile(null);
    setError(null);
    setIdentified(null);
    setCritique(null);
    setOverlayOpen(false);
    setLoading(false);
  }

  useEffect(() => {
    function handleNavigateHome() {
      stopNarration();
      reset();
    }

    window.addEventListener(LIBRA_NAVIGATE_HOME_EVENT, handleNavigateHome);
    return () => {
      window.removeEventListener(LIBRA_NAVIGATE_HOME_EVENT, handleNavigateHome);
    };
  }, []);

  return (
    <div className={cn("w-full", className)}>
      <div className="surface-glass relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-white/8 p-5 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)] sm:max-w-md sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg tracking-tight text-foreground">
              Scan a book cover
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Use your camera on mobile, or upload an image.
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Camera className="size-5" />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="sr-only">Upload book cover</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                setFile(next);
              }}
            />

            <motion.div
              whileTap={{ scale: 0.99 }}
              className="rounded-2xl border border-white/8 bg-white/3 p-3 transition-colors hover:bg-white/4"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-muted-foreground">
                  <Upload className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {file ? "Change image" : "Take a photo / choose file"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {file ? file.name : "Works best with the title + author visible"}
                  </p>
                </div>
              </div>
            </motion.div>
          </label>

          <AnimatePresence>
            {previewUrl ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="relative overflow-hidden rounded-2xl border border-white/8 bg-black/20"
              >
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src={previewUrl}
                    alt="Book cover preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 90vw, 400px"
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {error ? (
            <p className="text-sm text-destructive/85">{error}</p>
          ) : null}

          <div className="flex gap-2">
            <Button
              size="lg"
              className="h-12 flex-1 rounded-xl"
              disabled={!file || loading}
              onClick={handleIdentify}
            >
              {loading ? "Identifying..." : "Identify Book"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl px-4"
              onClick={reset}
              disabled={!file && !error && !identified}
            >
              <RefreshCcw className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <CinematicLoadingState />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {identified && overlayCopy ? (
        <CinematicAiResultsOverlay
          open={overlayOpen}
          onOpenChange={setOverlayOpen}
          bookCoverUrl={previewUrl}
          bookTitle={identified.title}
          bookAuthor={identified.author}
          criticType={overlayCriticType}
          personalityBadge="Personalized critique · Gemini"
          critiqueTranscript={overlayCopy.critiqueTranscript}
          whyMatchesYourTaste={overlayCopy.whyMatchesYourTaste}
          potentialMismatch={overlayCopy.potentialMismatch}
          comparedToFavoriteBook={overlayCopy.comparedToFavoriteBook}
          finalRecommendationVerdict={overlayCopy.verdict}
        />
      ) : null}
    </div>
  );
}

