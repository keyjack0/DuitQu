import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const RATE_LIMIT_MS = 3000;
const MAX_REQUEST_BYTES = 350_000;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 8000;
const MAX_TOTAL_MESSAGE_CHARS = 50_000;
const MAX_SYSTEM_PROMPT_CHARS = 30_000;
const rateLimit = new Map<string, number>();

interface AIRequestMessage {
  role: "user" | "assistant";
  content: string;
}

function invalidRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

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

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return invalidRequest("Ukuran permintaan terlalu besar");
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).length > MAX_REQUEST_BYTES) {
      return invalidRequest("Ukuran permintaan terlalu besar");
    }
    body = JSON.parse(rawBody);
  } catch {
    return invalidRequest("Format permintaan tidak valid");
  }

  if (!body || typeof body !== "object") return invalidRequest("Format permintaan tidak valid");
  const { messages, systemPrompt } = body as { messages?: unknown; systemPrompt?: unknown };
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return invalidRequest(`Jumlah pesan harus antara 1 dan ${MAX_MESSAGES}`);
  }
  if (typeof systemPrompt !== "string" || systemPrompt.length === 0 || systemPrompt.length > MAX_SYSTEM_PROMPT_CHARS) {
    return invalidRequest(`Instruksi sistem maksimal ${MAX_SYSTEM_PROMPT_CHARS} karakter`);
  }

  let totalMessageChars = 0;
  const validMessages: AIRequestMessage[] = [];
  for (const message of messages) {
    if (
      !message ||
      typeof message !== "object" ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.content !== "string" ||
      message.content.length === 0 ||
      message.content.length > MAX_MESSAGE_CHARS
    ) {
      return invalidRequest(`Setiap pesan harus valid dan maksimal ${MAX_MESSAGE_CHARS} karakter`);
    }
    totalMessageChars += message.content.length;
    if (totalMessageChars > MAX_TOTAL_MESSAGE_CHARS) {
      return invalidRequest(`Total isi pesan maksimal ${MAX_TOTAL_MESSAGE_CHARS} karakter`);
    }
    validMessages.push({ role: message.role, content: message.content });
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY tidak dikonfigurasi" },
      { status: 500 }
    );
  }

  const contents = validMessages.map((m) => ({
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
