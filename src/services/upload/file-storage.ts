import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  const ext = path.extname(originalName) || getExtFromMime(mimeType);
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_DIR, "files");
  await ensureDir(dir);
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/files/${filename}`;
}

export async function saveAudio(
  buffer: Buffer,
  filename?: string
): Promise<string> {
  const name = filename || `${randomUUID()}.mp3`;
  const dir = path.join(UPLOAD_DIR, "audio");
  await ensureDir(dir);
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/audio/${name}`;
}

export async function saveImage(
  buffer: Buffer,
  filename?: string
): Promise<string> {
  const name = filename || `${randomUUID()}.png`;
  const dir = path.join(UPLOAD_DIR, "images");
  await ensureDir(dir);
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/images/${name}`;
}

function getExtFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "text/plain": ".txt",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "image/png": ".png",
    "image/jpeg": ".jpg",
  };
  return map[mimeType] || ".bin";
}
