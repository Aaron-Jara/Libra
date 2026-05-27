import { NextResponse } from "next/server";

import { generateCritique } from "@/lib/critique";
import type { ReaderProfile, IdentifiedBook } from "@/lib/critique";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      profile?: ReaderProfile;
      book?: IdentifiedBook;
    };

    if (!body.profile || !body.book) {
      return NextResponse.json(
        { ok: false, error: "Missing profile or book." },
        { status: 400 },
      );
    }

    const result = await generateCritique({ profile: body.profile, book: body.book });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate critique.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

