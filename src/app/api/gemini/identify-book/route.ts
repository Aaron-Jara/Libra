import { NextResponse } from "next/server";

import { identifyBookFromImage } from "@/lib/gemini.server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing image file." },
        { status: 400 },
      );
    }

    if (!image.type?.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, error: "Unsupported file type. Please upload an image." },
        { status: 400 },
      );
    }

    // Lightweight base64 conversion for inline_data.
    const buffer = await image.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const result = await identifyBookFromImage({
      imageBase64: base64,
      mimeType: image.type || "image/jpeg",
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to identify book.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

