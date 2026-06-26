import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  // Rate limit: 10 uploads per IP per minute
  const limiter = rateLimit(`upload:${ipFromRequest(req)}`, 10, 60_000);
  if (!limiter.allowed) return limiter.response;

  // Require auth
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
    }

    // TODO: Replace with Supabase Storage or S3-compatible storage.
    // Current base64 storage will bloat the database and break at scale.
    // For now, we convert to base64 data URL as fallback.
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error: any) {
    console.error("[upload] Error:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
