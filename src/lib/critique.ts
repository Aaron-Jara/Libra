"use server";

import { fetchGeminiWithRetry } from "@/lib/gemini-fetch.server";
import { getCriticPersonalityLabel } from "@/lib/critic-personality";
import type { CriticType } from "@/lib/voices";

export type ReaderProfile = {
  favoriteGenres: string[];
  favoriteBook: string;
  readingStylePreferences: string[];
  criticType: CriticType;
};

export type IdentifiedBook = {
  title: string;
  author: string;
  description: string;
};

export type GeminiCritique = {
  critique: string;
  tasteMatch: string;
  mismatch: string;
  comparisonToFavorite: string;
  verdict: string;
};

export type GenerateCritiqueResult =
  | { ok: true; data: GeminiCritique }
  | { ok: false; error: string };

const MODEL_ID = "gemini-3.1-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

const SYSTEM_PROMPT_TEMPLATE =
  'You are a literary critic matching books to readers. You will receive:\n' +
  "- Reader's favorite genres: {genres}\n" +
  "- Reader's favorite book: {favoriteBook}\n" +
  "- Reader's reading style preferences: {preferences}\n" +
  "- Selected critic personality: {criticType}\n" +
  "- Book title: {title}\n" +
  "- Book author: {author}\n" +
  "- Book description: {description}\n\n" +
  "Generate a personalized, spoiler-free critique as JSON with these fields:\n" +
  "{\n" +
  '  "critique": "string (2-3 sentence spoiler-free take)",\n' +
  '  "tasteMatch": "string (why this matches their taste)",\n' +
  '  "mismatch": "string (potential mismatch or warning)",\n' +
  '  "comparisonToFavorite": "string (compare to their favorite book)",\n' +
  '  "verdict": "string (concise yes/no/maybe recommendation)"\n' +
  "}\n\n" +
  "Tone must match the critic personality exactly.\n" +
  "For The Professor: a measured, slightly academic British literary voice — thoughtful and articulate, with light literary vocabulary (e.g. themes, narrative, prose, character study) but still easy to follow. Avoid heavy jargon, thesis-speak, or words like 'salient', 'paradigm', or 'dialectic'. Sound like a well-read professor chatting with a student, not a conference paper.\n" +
  "For The Gen Z: sound like a teenage girl book-Tok creator — dramatic, funny, honest, chronically online. Use light Gen Z / TikTok slang (like, literally, no cap, lowkey, it's giving, bestie) but stay clear for voice narration. Hot takes, not cruelty.\n\n" +
  "Write each JSON field as plain spoken paragraphs only. Do NOT include section titles, headings, labels, or markdown in the text (those are shown separately in the UI and must not be read aloud).\n" +
  "Optimize for natural voice narration.\n" +
  "Return ONLY valid JSON.";

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

function coerceGeminiCritique(value: object): GeminiCritique | null {
  const v = value as Record<string, unknown>;
  const critique = typeof v.critique === "string" ? v.critique.trim() : "";
  const tasteMatch =
    typeof v.tasteMatch === "string" ? v.tasteMatch.trim() : "";
  const mismatch = typeof v.mismatch === "string" ? v.mismatch.trim() : "";
  const comparisonToFavorite =
    typeof v.comparisonToFavorite === "string"
      ? v.comparisonToFavorite.trim()
      : "";
  const verdict = typeof v.verdict === "string" ? v.verdict.trim() : "";

  if (
    !critique ||
    !tasteMatch ||
    !mismatch ||
    !comparisonToFavorite ||
    !verdict
  ) {
    return null;
  }

  return { critique, tasteMatch, mismatch, comparisonToFavorite, verdict };
}

function normalizeGeminiTextToJson(text: string): GeminiCritique | null {
  const stripped = stripCodeFences(text);

  const direct = safeJsonParse(stripped);
  const directObj = typeof direct === "object" && direct !== null ? direct : null;
  if (directObj) return coerceGeminiCritique(directObj);

  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = stripped.slice(firstBrace, lastBrace + 1);
  const parsed = safeJsonParse(candidate);
  const parsedObj = typeof parsed === "object" && parsed !== null ? parsed : null;
  if (!parsedObj) return null;

  return coerceGeminiCritique(parsedObj);
}

function formatSystemPrompt(profile: ReaderProfile, book: IdentifiedBook) {
  return SYSTEM_PROMPT_TEMPLATE.replace("{genres}", profile.favoriteGenres.join(", ") || "None")
    .replace("{favoriteBook}", profile.favoriteBook || "None")
    .replace("{preferences}", profile.readingStylePreferences.join(", ") || "None")
    .replace("{criticType}", getCriticPersonalityLabel(profile.criticType))
    .replace("{title}", book.title)
    .replace("{author}", book.author)
    .replace("{description}", book.description);
}

export async function generateCritique({
  profile,
  book,
  apiKey = process.env.GEMINI_API_KEY,
}: {
  profile: ReaderProfile;
  book: IdentifiedBook;
  apiKey?: string;
}): Promise<GenerateCritiqueResult> {
  if (!apiKey) return { ok: false, error: "Missing GEMINI_API_KEY" };

  if (!book.title?.trim() || !book.author?.trim() || !book.description?.trim()) {
    return { ok: false, error: "Missing book details (title/author/description)" };
  }

  const systemPrompt = formatSystemPrompt(profile, book);

  try {
    const fetched = await fetchGeminiWithRetry(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          // Slight creativity for demo polish; still constrained by strict JSON requirement.
          temperature: 0.6,
          maxOutputTokens: 520,
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

    const parsed = normalizeGeminiTextToJson(text);
    if (!parsed) {
      return {
        ok: false,
        error: "Could not parse critique JSON (model returned invalid output).",
      };
    }

    return { ok: true, data: parsed };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error calling Gemini";
    return { ok: false, error: message };
  }
}

