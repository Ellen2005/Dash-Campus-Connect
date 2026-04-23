import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server auth is not configured. Missing Supabase environment variables." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }

  const { userId } = parsed.data;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

