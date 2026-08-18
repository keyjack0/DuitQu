import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const RATE_LIMIT_MS = 3000;
const rateLimit = new Map<string, number>();

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const last = rateLimit.get(user.id) ?? 0;
  if (Date.now() - last < RATE_LIMIT_MS) {
    return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });
  }
  rateLimit.set(user.id, Date.now());
  if (rateLimit.size > 1000) {
    for (const [key, at] of rateLimit) {
      if (Date.now() - at > RATE_LIMIT_MS * 20) rateLimit.delete(key);
    }
  }

  const { messages, systemPrompt } = await request.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY tidak dikonfigurasi" },
      { status: 500 }
    );
  }

  const contents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Gagal memanggil Gemini API" },
        { status: response.status }
      );
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Gagal terhubung ke Gemini API" },
      { status: 500 }
    );
  }
}