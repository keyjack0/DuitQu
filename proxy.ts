import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Cache verifikasi token di level modul agar navigasi/prefetch berulang
// tidak memicu network call ke Supabase Auth setiap saat.
const VERIFICATION_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

type CachedVerification = { userId: string | null; at: number };
const verificationCache = new Map<string, CachedVerification>();

function hasAuthCookies(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
}

function buildCacheKey(request: NextRequest): string {
  return request.cookies
    .getAll()
    .filter((c) => c.name.startsWith("sb-"))
    .map((c) => `${c.name}=${c.value}`)
    .join("|");
}

function pruneCache() {
  const cutoff = Date.now() - VERIFICATION_TTL_MS;
  for (const [key, entry] of verificationCache) {
    if (entry.at < cutoff) verificationCache.delete(key);
  }
}

async function verifyUser(supabase: ReturnType<typeof createServerClient>, cacheKey: string) {
  const cached = verificationCache.get(cacheKey);
  if (cached && Date.now() - cached.at < VERIFICATION_TTL_MS) {
    return cached.userId;
  }

  let userId: string | null = null;
  try {
    // Verifikasi JWT lokal via JWKS — tanpa round-trip ke server Auth
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) {
      userId = data.claims.sub as string;
    }
  } catch {
    userId = null;
  }

  if (!userId) {
    // Fallback: proyek dengan legacy symmetric secret tidak bisa diverifikasi lokal
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }
  }

  if (verificationCache.size >= CACHE_MAX_ENTRIES) pruneCache();
  verificationCache.set(cacheKey, { userId, at: Date.now() });
  return userId;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPath = pathname === "/login" || pathname === "/register";

  // Fast path tanpa network call untuk request tanpa cookie sesi
  if (!hasAuthCookies(request)) {
    if (isAuthPath) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const userId = await verifyUser(supabase, buildCacheKey(request));

  if (!userId && !isAuthPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (userId && isAuthPath) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)",
  ],
};
