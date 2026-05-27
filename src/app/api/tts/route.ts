import { NextResponse } from "next/server";

import { snapNarrationSpeed } from "@/lib/narration-speed";

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ELEVENLABS_API_KEY" },
      { status: 500 },
    );
  }

  try {
    const body = (await req.json()) as {
      text?: string;
      voiceId?: string;
      speed?: number;
    };
    const text = body.text?.trim();
    const voiceId = body.voiceId?.trim();
    const speed = snapNarrationSpeed(
      typeof body.speed === "number" ? body.speed : 1,
    );

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: "Both text and voiceId are required." },
        { status: 400 },
      );
    }

    const ttsResponse = await fetch(
      `${ELEVENLABS_TTS_URL}/${voiceId}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true,
            speed,
          },
        }),
      },
    );

    if (!ttsResponse.ok) {
      const details = await ttsResponse.text().catch(() => "");
      return NextResponse.json(
        { error: `ElevenLabs TTS failed: ${details || ttsResponse.status}` },
        { status: 502 },
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "TTS request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

