import { supabase } from "@/lib/auth-context";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm"];

export type UploadBucket = "posts" | "avatars" | "covers" | "stories" | "events" | "marketplace";

export interface UploadResult {
  url: string | null;
  error: string | null;
}

function validateFile(file: File): string | null {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);
  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);

  if (!isImage && !isVideo && !isDocument && !isAudio) {
    return `File type not allowed. Use: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_AUDIO_TYPES].join(", ")}`;
  }
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return `Image too large. Maximum size is 5MB.`;
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return `Video too large. Maximum size is 50MB.`;
  }
  if (isDocument && file.size > MAX_DOCUMENT_SIZE) {
    return `Document too large. Maximum size is 20MB.`;
  }
  if (isAudio && file.size > MAX_AUDIO_SIZE) {
    return `Audio too large. Maximum size is 25MB.`;
  }
  return null;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
}

export async function uploadFile(
  file: File,
  bucket: UploadBucket,
  userId: string
): Promise<UploadResult> {
  const validationError = validateFile(file);
  if (validationError) return { url: null, error: validationError };

  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = sanitizeFileName(`${userId}_${Date.now()}.${ext}`);
  const path = `${userId}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function deleteFile(bucket: UploadBucket, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}
