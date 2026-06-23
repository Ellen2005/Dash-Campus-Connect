import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  draftMessage: z.string().min(1),
  context: z.string().optional(),
});

function mockAssist(draft: string) {
  const lower = draft.toLowerCase();
  const priority =
    lower.includes("emergency") || lower.includes("urgent") ? "Emergency"
    : lower.includes("deadline") || lower.includes("important") ? "Urgent"
    : "Normal";
  return {
    suggestedTitle: draft.split(".")[0].trim().slice(0, 60) || "Campus Announcement",
    revisedMessage: `Dear Students, ${draft.trim()} Please acknowledge receipt by logging into your Dash account. — University Administration`,
    suggestedPriority: priority as "Normal" | "Urgent" | "Emergency",
  };
}

export async function POST(request: NextRequest) {
  let draftMessage = "";
  let context: string | undefined;

  try {
    const body = await request.json();
    const parsed = Schema.parse(body);
    draftMessage = parsed.draftMessage;
    context = parsed.context;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_GENKIT_API_KEY;
  if (!apiKey) {
    return NextResponse.json(mockAssist(draftMessage));
  }

  try {
    const prompt = `You are helping create a campus announcement. Given this draft: "${draftMessage}"${context ? ` Context: "${context}"` : ""}.

Return a JSON object with exactly these fields:
- suggestedTitle: string (max 60 chars, concise title)
- revisedMessage: string (professional, clear version starting with "Dear Students,")
- suggestedPriority: "Normal" | "Urgent" | "Emergency"

Return only valid JSON, no markdown.`;

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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json({
      suggestedTitle: String(result.suggestedTitle ?? "").slice(0, 60),
      revisedMessage: String(result.revisedMessage ?? draftMessage),
      suggestedPriority: ["Normal", "Urgent", "Emergency"].includes(result.suggestedPriority)
        ? result.suggestedPriority
        : "Normal",
    });
  } catch {
    return NextResponse.json(mockAssist(draftMessage));
  }
}
