import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";

/**
 * Persist a generated image. In production (Vercel) writes to Vercel Blob.
 * In local dev (no BLOB_READ_WRITE_TOKEN) writes to public/uploads/ so it
 * works without any cloud setup.
 */
export async function saveImage(
  storyId: string,
  index: number,
  data: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.includes("jpeg")
    ? "jpg"
    : mimeType.includes("webp")
      ? "webp"
      : "png";
  const filename = `scene-${index}.${ext}`;
  const key = `stories/${storyId}/${filename}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, data, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: true,
    });
    return blob.url;
  }

  // Local dev fallback
  const dir = join(process.cwd(), "public", "uploads", storyId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), data);
  return `/uploads/${storyId}/${filename}`;
}
