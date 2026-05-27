export type GeminiBookIdentification = {
  title: string;
  author: string;
  description: string;
};

export type GeminiIdentifyBookResult =
  | { ok: true; data: GeminiBookIdentification }
  | { ok: false; error: string };

type IdentifyBookApiResponse =
  | GeminiIdentifyBookResult
  | { error?: string }
  | null;

/**
 * Client-friendly helper used by the mobile upload UI:
 * sends the image file to our API route, which calls Gemini server-side.
 */
export async function identifyBookWithGemini(
  imageFile: File,
): Promise<GeminiIdentifyBookResult> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const res = await fetch("/api/gemini/identify-book", {
    method: "POST",
    body: formData,
  });

  const json = (await res.json().catch(() => null)) as IdentifyBookApiResponse;

  if (!res.ok) {
    const message =
      json && typeof json === "object" && "error" in json && typeof json.error === "string"
        ? json.error
        : `Identify book failed (${res.status})`;
    return { ok: false, error: message };
  }

  if (!json || typeof json !== "object") {
    return { ok: false, error: "Invalid response from identify-book API." };
  }

  // If the route returns our union, forward as-is.
  if ("ok" in json && typeof json.ok === "boolean") {
    return json;
  }

  return { ok: false, error: "Invalid response shape from identify-book API." };
}

