import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const PUBLIC_DIR = join(process.cwd(), "public", "uploads");

/**
 * Persist a generated image buffer under
 * `public/uploads/<storyId>/scene-<index>.<ext>` and return the public path
 * the browser can fetch.
 */
export async function saveImage(
  storyId: string,
  index: number,
  data: Buffer,
  mimeType: string,
): Promise<string> {
  const dir = join(PUBLIC_DIR, storyId);
  await mkdir(dir, { recursive: true });
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";
  const filename = `scene-${index}.${ext}`;
  const fullPath = join(dir, filename);
  await writeFile(fullPath, data);
  return `/uploads/${storyId}/${filename}`;
}
