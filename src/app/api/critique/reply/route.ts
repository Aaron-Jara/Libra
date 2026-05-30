import { NextResponse } from "next/server";

import {
  generateCritiqueReply,
  type CritiqueChatTurn,
} from "@/lib/critique-reply";
import type { CriticType } from "@/lib/voices";

/** Hobby caps at 10s; Pro allows up to 60s. */
export const maxDuration = 60;

function normalizeChatHistory(value: unknown): CritiqueChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is CritiqueChatTurn =>
        typeof item === "object" &&
        item !== null &&
        (item as CritiqueChatTurn).role !== undefined &&
        ((item as CritiqueChatTurn).role === "user" ||
          (item as CritiqueChatTurn).role === "critic") &&
        typeof (item as CritiqueChatTurn).text === "string",
    )
    .map((item) => ({
      role: item.role,
      text: item.text.trim(),
    }))
    .filter((item) => item.text.length > 0);
}

function isCriticType(value: unknown): value is CriticType {
  return value === "professor" || value === "librarian" || value === "brutalCritic";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      question?: string;
      critiqueNarration?: string;
      criticType?: CriticType;
      bookTitle?: string;
      bookAuthor?: string;
      chatHistory?: unknown;
    };

    if (!isCriticType(body.criticType)) {
      return NextResponse.json(
        { ok: false, error: "Invalid critic type." },
        { status: 400 },
      );
    }

    const result = await generateCritiqueReply({
      criticType: body.criticType,
      question: body.question ?? "",
      critiqueNarration: body.critiqueNarration ?? "",
      bookTitle: body.bookTitle ?? "",
      bookAuthor: body.bookAuthor ?? "",
      chatHistory: normalizeChatHistory(body.chatHistory),
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate reply.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
