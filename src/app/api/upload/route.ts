import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const limiter = rateLimit(`upload:${ipFromRequest(req)}`, 10, 60_000);
  if (!limiter.allowed) return limiter.response;

  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
    }

    // Upload to Supabase Storage using service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const buffer = await file.arrayBuffer();
      const fileExt = file.name.split(".").pop() || "bin";
      const fileName = `${auth.userId}/${crypto.randomUUID()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!uploadError && data) {
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
        return NextResponse.json({
          url: urlData.publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
      }

      console.error("[upload] Supabase storage error:", uploadError);
    }

    // Fallback: base64 (only if Supabase Storage is unavailable)
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
