import type { CriticType } from "@/lib/voices";

export type CriticProfile = {
  id: CriticType;
  title: string;
  name: string;
  description: string;
  image: string;
  accent: {
    border: string;
    bg: string;
    glow: string;
    ring: string;
  };
};

export const CRITIC_PROFILES: CriticProfile[] = [
  {
    id: "professor",
    title: "The Professor",
    name: "CRITIC 1 — THE PROFESSOR",
    description: "Calm, articulate, lightly academic — clear and accessible",
    image: "/images/critics/professor.jpg",
    accent: {
      border: "border-amber-400/25",
      bg: "bg-amber-400/[0.06]",
      glow: "shadow-[0_0_24px_-4px_rgba(251,191,36,0.15)]",
      ring: "ring-amber-400/40",
    },
  },
  {
    id: "librarian",
    title: "The Librarian",
    name: "CRITIC 2 — THE LIBRARIAN",
    description: "Warm, soft, comforting, emotionally reflective",
    image: "/images/critics/librarian.jpg",
    accent: {
      border: "border-rose-300/25",
      bg: "bg-rose-300/[0.06]",
      glow: "shadow-[0_0_24px_-4px_rgba(253,164,175,0.12)]",
      ring: "ring-rose-300/40",
    },
  },
  {
    id: "brutalCritic",
    title: "The Gen Z",
    name: "CRITIC 3 — THE GEN Z",
    description: "TikTok book girl energy — dramatic, honest, chronically online.",
    image: "/images/critics/brutal-critic.jpg",
    accent: {
      border: "border-red-400/30",
      bg: "bg-red-400/[0.06]",
      glow: "shadow-[0_0_24px_-4px_rgba(248,113,113,0.15)]",
      ring: "ring-red-400/45",
    },
  },
];
