import type {
  CritiqueChatTurn,
  GenerateCritiqueReplyResult,
} from "@/lib/critique-reply";
import type { CriticType } from "@/lib/voices";

export async function fetchCritiqueReply({
  question,
  critiqueNarration,
  criticType,
  bookTitle,
  bookAuthor,
  chatHistory = [],
}: {
  question: string;
  critiqueNarration: string;
  criticType: CriticType;
  bookTitle: string;
  bookAuthor: string;
  chatHistory?: CritiqueChatTurn[];
}): Promise<GenerateCritiqueReplyResult> {
  const res = await fetch("/api/critique/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      critiqueNarration,
      criticType,
      bookTitle,
      bookAuthor,
      chatHistory,
    }),
  });

  const json = (await res.json().catch(() => null)) as GenerateCritiqueReplyResult | null;

  if (!json || typeof json !== "object" || !("ok" in json)) {
    return { ok: false, error: `Reply request failed (${res.status})` };
  }

  return json;
}
