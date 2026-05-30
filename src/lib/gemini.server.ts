"use server";

import { fetchGeminiWithRetry } from "@/lib/gemini-fetch.server";

export type GeminiBookIdentification = {
  title: string;
  author: string;
  description: string;
};

export type GeminiIdentifyBookResult =
  | { ok: true; data: GeminiBookIdentification }
  | { ok: false; error: string };

const MODEL_ID = "gemini-3.1-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

const IDENTIFY_BOOK_PROMPT =
  'Look at this book cover image. Extract the book title, author, and a short 2-3 sentence description of what the book is about. Return ONLY valid JSON in this format: { "title": "string", "author": "string", "description": "string" }';

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

function normalizeGeminiTextToJson(
  text: string,
): GeminiBookIdentification | null {
  const stripped = stripCodeFences(text);

  // Fast path: entire output is JSON
  const direct = safeJsonParse(stripped);
  const directObj = typeof direct === "object" && direct !== null ? direct : null;
  if (directObj) return coerceBookIdentification(directObj);

  // Fallback: find the first JSON object in the output
  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = stripped.slice(firstBrace, lastBrace + 1);
  const parsed = safeJsonParse(candidate);
  const parsedObj = typeof parsed === "object" && parsed !== null ? parsed : null;
  if (!parsedObj) return null;

  return coerceBookIdentification(parsedObj);
}

function coerceBookIdentification(value: object): GeminiBookIdentification | null {
  const v = value as Record<string, unknown>;
  const title = typeof v.title === "string" ? v.title.trim() : "";
  const author = typeof v.author === "string" ? v.author.trim() : "";
  const description =
    typeof v.description === "string" ? v.description.trim() : "";

  if (!title || !author || !description) return null;
  return { title, author, description };
}

/**
 * Lightweight Gemini 3.1 Flash-Lite call.
 *
 * Intended to run server-side (API key must remain private). Provide `imageBase64`
 * (no data URL prefix) and its `mimeType` (e.g. "image/jpeg").
 */
export async function identifyBookFromImage({
  imageBase64,
  mimeType,
  apiKey = process.env.GEMINI_API_KEY,
}: {
  imageBase64: string;
  mimeType: string;
  apiKey?: string;
}): Promise<GeminiIdentifyBookResult> {
  if (!apiKey) return { ok: false, error: "Missing GEMINI_API_KEY" };
  if (!imageBase64?.trim()) return { ok: false, error: "Missing image data" };
  if (!mimeType?.trim()) return { ok: false, error: "Missing image MIME type" };

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
            parts: [
              { text: IDENTIFY_BOOK_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
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
        error: "Could not extract book info (image unclear or invalid JSON).",
      };
    }

    return { ok: true, data: parsed };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error calling Gemini";
    return { ok: false, error: message };
  }
}

