"use client";

import {
  snapNarrationSpeed,
  type NarrationSpeed,
} from "@/lib/narration-speed";
import type { CriticType } from "@/lib/voices";
import { voiceMap } from "@/lib/voices";
import { CRITIC_VOICE_SAMPLES } from "@/lib/voice-samples";

export type NarrationState = "idle" | "loading" | "playing" | "paused" | "error";

type PlayNarrationOptions = {
  onStateChange?: (state: NarrationState) => void;
  onError?: (message: string) => void;
  speed?: number;
};

type PlaybackSession = {
  text: string;
  criticType: CriticType;
  /** User-selected speed (0.8–1.2). */
  speed: NarrationSpeed;
  /** Speed baked into the current ElevenLabs audio blob. */
  generatedAtSpeed: NarrationSpeed;
  savedTime: number;
};

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let playbackSession: PlaybackSession | null = null;
/** Bumped on stop; in-flight playNarration ignores stale generations. */
let playbackGeneration = 0;

function sessionMatches(text: string, criticType: CriticType): boolean {
  return (
    playbackSession !== null &&
    playbackSession.text === text &&
    playbackSession.criticType === criticType
  );
}

function applyPlaybackRate(audio: HTMLAudioElement, session: PlaybackSession) {
  audio.playbackRate = session.speed / session.generatedAtSpeed;
}

function detachAudioHandlers(audio: HTMLAudioElement) {
  audio.onended = null;
  audio.onerror = null;
  audio.onplay = null;
  audio.ontimeupdate = null;
}

function cleanupAudio() {
  if (activeAudio) {
    const audio = activeAudio;
    activeAudio = null;
    detachAudioHandlers(audio);
    audio.pause();
  }

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }

  playbackSession = null;
}

export function stopNarration(onStateChange?: (state: NarrationState) => void) {
  playbackGeneration += 1;
  cleanupAudio();
  onStateChange?.("idle");
}

/** Updates speed without restarting; keeps current playback position. */
export function setNarrationPlaybackSpeed(speed: number) {
  const snapped = snapNarrationSpeed(speed);
  if (!playbackSession) return;
  playbackSession.speed = snapped;
  if (activeAudio) {
    applyPlaybackRate(activeAudio, playbackSession);
  }
}

export function pauseNarration(onStateChange?: (state: NarrationState) => void) {
  if (!activeAudio || !playbackSession) return;

  playbackSession.savedTime = activeAudio.currentTime;
  activeAudio.pause();
  onStateChange?.("paused");
}

export function resumeNarration(
  onStateChange?: (state: NarrationState) => void,
  onError?: (message: string) => void,
): void {
  if (!activeAudio || !playbackSession) {
    onStateChange?.("idle");
    return;
  }

  const audio = activeAudio;
  const generation = playbackGeneration;

  applyPlaybackRate(audio, playbackSession);
  audio.currentTime = playbackSession.savedTime;

  audio
    .play()
    .then(() => {
      if (generation !== playbackGeneration) return;
      onStateChange?.("playing");
    })
    .catch(() => {
      if (generation !== playbackGeneration) return;
      cleanupAudio();
      onStateChange?.("error");
      onError?.("Audio playback failed.");
    });
}

export async function playNarration(
  text: string,
  criticType: CriticType,
  options: PlayNarrationOptions = {},
): Promise<void> {
  const { onStateChange, onError, speed: speedInput } = options;
  const trimmed = text.trim();
  const speed = snapNarrationSpeed(speedInput ?? 1);

  if (!trimmed) {
    const message = "Narration text is empty.";
    onStateChange?.("error");
    onError?.(message);
    return;
  }

  if (sessionMatches(trimmed, criticType) && activeAudio && playbackSession) {
    playbackSession.speed = speed;
    applyPlaybackRate(activeAudio, playbackSession);

    if (!activeAudio.ended) {
      resumeNarration(onStateChange, onError);
      return;
    }
    playbackSession.savedTime = 0;
  }

  if (playbackSession && !sessionMatches(trimmed, criticType)) {
    playbackGeneration += 1;
    cleanupAudio();
  }

  const generation = ++playbackGeneration;
  onStateChange?.("loading");

  try {
    const voiceId = voiceMap[criticType].id;

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: trimmed, voiceId, speed }),
    });

    if (generation !== playbackGeneration) return;

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(body || `TTS request failed (${response.status})`);
    }

    const blob = await response.blob();
    if (!blob.size) {
      throw new Error("TTS returned empty audio.");
    }

    if (generation !== playbackGeneration) return;

    if (activeObjectUrl) {
      URL.revokeObjectURL(activeObjectUrl);
    }

    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    audio.preload = "auto";

    if (activeAudio) {
      detachAudioHandlers(activeAudio);
      activeAudio.pause();
    }

    activeAudio = audio;
    activeObjectUrl = objectUrl;
    playbackSession = {
      text: trimmed,
      criticType,
      speed,
      generatedAtSpeed: speed,
      savedTime: 0,
    };

    applyPlaybackRate(audio, playbackSession);

    audio.onplay = () => {
      if (generation !== playbackGeneration) return;
      onStateChange?.("playing");
    };

    audio.ontimeupdate = () => {
      if (generation !== playbackGeneration || !playbackSession) return;
      playbackSession.savedTime = audio.currentTime;
    };

    audio.onended = () => {
      if (generation !== playbackGeneration) return;
      cleanupAudio();
      onStateChange?.("idle");
    };

    audio.onerror = () => {
      if (generation !== playbackGeneration) return;
      cleanupAudio();
      onStateChange?.("error");
      onError?.("Audio playback failed.");
    };

    audio.currentTime = playbackSession.savedTime;
    await audio.play();
  } catch (error) {
    if (generation !== playbackGeneration) return;
    cleanupAudio();
    const message =
      error instanceof Error ? error.message : "Narration failed.";
    onStateChange?.("error");
    onError?.(message);
  }
}

/** Short ElevenLabs preview when picking a critic in onboarding. */
export function playCriticVoiceSample(
  criticType: CriticType,
  speed = 1,
): Promise<void> {
  return playNarration(CRITIC_VOICE_SAMPLES[criticType], criticType, { speed });
}
