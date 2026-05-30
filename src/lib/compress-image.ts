const DEFAULT_MAX_EDGE = 1280;
const DEFAULT_JPEG_QUALITY = 0.82;
/** Skip re-encoding when already small JPEG. */
const SKIP_IF_UNDER_BYTES = 400_000;

/**
 * Resize and compress a cover photo before upload (keeps Gemini + Vercel fast).
 */
export async function compressImageForUpload(
  file: File,
  {
    maxEdge = DEFAULT_MAX_EDGE,
    quality = DEFAULT_JPEG_QUALITY,
  }: { maxEdge?: number; quality?: number } = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const longest = Math.max(width, height);
    const scale = Math.min(1, maxEdge / longest);

    if (
      scale >= 1 &&
      file.size <= SKIP_IF_UNDER_BYTES &&
      file.type === "image/jpeg"
    ) {
      return file;
    }

    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "cover";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
