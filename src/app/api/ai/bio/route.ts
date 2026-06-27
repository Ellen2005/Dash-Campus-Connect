import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";

const Schema = z.object({
  academicField: z.string().min(1),
  interests: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const { academicField, interests } = Schema.parse(body);

    const apiKey = process.env.GOOGLE_GENKIT_API_KEY;
    if (!apiKey) {
      const fallback = `${academicField} student passionate about ${interests.split(",")[0].trim()}. Building the future one line of code at a time.`;
      return NextResponse.json({ bio: fallback });
    }

    const prompt = `Create a creative and engaging student bio (max 150 characters) for someone studying ${academicField} with interests in: ${interests}. Make it fun, professional, and highlight their personality. Return only the bio text, nothing else.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!res.ok) throw new Error("Gemini API error");

    const data = await res.json();
    const bio = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      `${academicField} student passionate about ${interests.split(",")[0].trim()}.`;

    return NextResponse.json({ bio: bio.slice(0, 160) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }
}
