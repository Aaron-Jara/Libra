"use server";

import { fetchGeminiWithRetry } from "@/lib/gemini-fetch.server";
import { getCriticPersonalityLabel } from "@/lib/critic-personality";
import type { CriticType } from "@/lib/voices";

const MODEL_ID = "gemini-3.1-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

export type CritiqueChatTurn = {
  role: "user" | "critic";
  text: string;
};

export type GenerateCritiqueReplyResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function normalizeReplyJson(text: string): string | null {
  const stripped = stripCodeFences(text);

  const direct = safeJsonParse(stripped);
  if (typeof direct === "object" && direct !== null) {
    const reply = (direct as Record<string, unknown>).reply;
    if (typeof reply === "string" && reply.trim()) return reply.trim();
  }

  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const parsed = safeJsonParse(stripped.slice(firstBrace, lastBrace + 1));
  if (typeof parsed === "object" && parsed !== null) {
    const reply = (parsed as Record<string, unknown>).reply;
    if (typeof reply === "string" && reply.trim()) return reply.trim();
  }

  return null;
}

function formatChatHistory(history: CritiqueChatTurn[]) {
  if (!history.length) return "";
  return history
    .map((turn) =>
      turn.role === "user"
        ? `Reader: ${turn.text}`
        : `You (critic): ${turn.text}`,
    )
    .join("\n");
}

function buildReplyPrompt({
  criticType,
  bookTitle,
  bookAuthor,
  critiqueNarration,
  question,
  chatHistory,
}: {
  criticType: CriticType;
  bookTitle: string;
  bookAuthor: string;
  critiqueNarration: string;
  question: string;
  chatHistory: CritiqueChatTurn[];
}) {
  const priorChat = formatChatHistory(chatHistory);
  const conversationBlock = priorChat
    ? `Prior follow-up conversation (stay consistent; do not repeat yourself):\n---\n${priorChat}\n---\n\n`
    : "";

  return (
    `You are a literary critic continuing a conversation with a reader.\n` +
    `Personality: ${getCriticPersonalityLabel(criticType)}\n` +
    `Book: "${bookTitle}" by ${bookAuthor}\n\n` +
    `Below is the full spoken critique you already gave this reader (do not repeat it verbatim):\n` +
    `---\n${critiqueNarration}\n---\n\n` +
    conversationBlock +
    `The reader's new follow-up question:\n"${question}"\n\n` +
    `Answer in character. Stay spoiler-free.\n` +
    `LENGTH: Exactly 2 or 3 sentences total — never more.\n` +
    `- Sentence 1: A very direct answer to the question (yes/no/maybe or the clearest one-sentence takeaway).\n` +
    `- Sentences 2–3: Only 1–2 short sentences of explanation. No filler, no recap of the critique.\n` +
    `Write plain spoken prose only — no headings, labels, markdown, or bullet lists. ` +
    `Optimize for natural voice narration.\n\n` +
    `Return ONLY valid JSON:\n` +
    `{ "reply": "your spoken answer as a single string" }`
  );
}

export async function generateCritiqueReply({
  criticType,
  bookTitle,
  bookAuthor,
  critiqueNarration,
  question,
  chatHistory = [],
  apiKey = process.env.GEMINI_API_KEY,
}: {
  criticType: CriticType;
  bookTitle: string;
  bookAuthor: string;
  critiqueNarration: string;
  question: string;
  chatHistory?: CritiqueChatTurn[];
  apiKey?: string;
}): Promise<GenerateCritiqueReplyResult> {
  if (!apiKey) return { ok: false, error: "Missing GEMINI_API_KEY" };

  const trimmedQuestion = question.trim();
  const trimmedNarration = critiqueNarration.trim();

  if (!trimmedQuestion) {
    return { ok: false, error: "Question is required." };
  }
  if (!trimmedNarration) {
    return { ok: false, error: "Critique context is missing." };
  }

  const prompt = buildReplyPrompt({
    criticType,
    bookTitle: bookTitle.trim() || "Unknown title",
    bookAuthor: bookAuthor.trim() || "Unknown author",
    critiqueNarration: trimmedNarration,
    question: trimmedQuestion,
    chatHistory,
  });

  try {
    const fetched = await fetchGeminiWithRetry(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 180,
        },
      }),
    });

    if (!fetched.ok) {
      return { ok: false, error: fetched.error };
    }

    const res = fetched.response;

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Gemini request failed (${res.status}): ${bodyText || res.statusText}`,
      };
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { ok: false, error: "Gemini returned no text" };

    const reply = normalizeReplyJson(text);
    if (!reply) {
      return {
        ok: false,
        error: "Could not parse reply JSON (model returned invalid output).",
      };
    }

    return { ok: true, reply };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error calling Gemini";
    return { ok: false, error: message };
  }
}
