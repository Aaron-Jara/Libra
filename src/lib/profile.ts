"use client";

import { useEffect, useState } from "react";

import type { CriticType } from "@/lib/voices";

export type ReaderProfile = {
  favoriteGenres: string[];
  favoriteBook: string;
  readingStylePreferences: string[];
  criticType: CriticType;
};

const STORAGE_KEY = "libra.readerProfile.v1";

function isCriticType(value: unknown): value is CriticType {
  return value === "professor" || value === "librarian" || value === "brutalCritic";
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === "string").map((v) => v.trim()).filter(Boolean);
}

export function saveReaderProfile(profile: ReaderProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage failures
  }
}

export function loadReaderProfile(): ReaderProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const p = parsed as Record<string, unknown>;
    const criticType = p.criticType;

    if (!isCriticType(criticType)) return null;

    return {
      favoriteGenres: coerceStringArray(p.favoriteGenres),
      favoriteBook: typeof p.favoriteBook === "string" ? p.favoriteBook.trim() : "",
      readingStylePreferences: coerceStringArray(p.readingStylePreferences),
      criticType,
    };
  } catch {
    return null;
  }
}

export function clearReaderProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Reads localStorage after mount so SSR and the first client paint match. */
export function useHasReaderProfile() {
  const [hydrated, setHydrated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    setHasProfile(Boolean(loadReaderProfile()));
    setHydrated(true);
  }, []);

  const refresh = () => {
    setHasProfile(Boolean(loadReaderProfile()));
  };

  return { hydrated, hasProfile, refresh };
}

