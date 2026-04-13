import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

const BUCKET = "storynest-uploads";

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  const ext = getExtFromMime(mimeType) || originalName.split(".").pop() || "bin";
  const filename = `files/${randomUUID()}.${ext}`;
  return uploadToSupabase(buffer, filename, mimeType);
}

export async function saveAudio(
  buffer: Buffer,
  filename?: string
): Promise<string> {
  const name = `audio/${filename || `${randomUUID()}.mp3`}`;
  return uploadToSupabase(buffer, name, "audio/mpeg");
}

export async function saveImage(
  buffer: Buffer,
  filename?: string
): Promise<string> {
  const name = `images/${filename || `${randomUUID()}.png`}`;
  return uploadToSupabase(buffer, name, "image/png");
}

async function uploadToSupabase(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const supabase = getSupabase();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

function getExtFromMime(mimeType: string): string | null {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "text/plain": "txt",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "image/png": "png",
    "image/jpeg": "jpg",
  };
  return map[mimeType] || null;
}
