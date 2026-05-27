import type { CriticType } from "@/lib/voices";

export function getCriticPersonalityLabel(type: CriticType) {
  switch (type) {
    case "professor":
      return "THE PROFESSOR — calm, warm British voice; measured and slightly academic but accessible; articulate without being pretentious";
    case "librarian":
      return "THE LIBRARIAN — warm, inviting, emotionally reflective, motherly";
    case "brutalCritic":
      return "THE GEN Z — teenage girl TikToker book critic; bubbly, dramatic, chronically online; casual slang (like, literally, no cap, lowkey, it's giving, bestie, slay, ate); hot takes with humor; never mean-spirited, always entertaining";
    default:
      return String(type);
  }
}
