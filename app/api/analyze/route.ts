import { NextRequest, NextResponse } from "next/server";
import { validateURL } from "@/lib/validation/url";
import { detectPlatform } from "@/lib/platforms/registry";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);

    // Rate limiting
    const rateCheck = checkRateLimit(`analyze:${ip}`, RATE_LIMITS.analyze);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a few minutes." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Parse body
    let body: { url?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Please provide a URL." }, { status: 400 });
    }

    // URL validation + SSRF protection
    const validation = await validateURL(url);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid URL." },
        { status: 422 }
      );
    }

    const normalized = validation.normalized!;

    // Platform detection
    const platform = detectPlatform(normalized);
    if (!platform) {
      return NextResponse.json(
        { error: "This platform is not currently supported. Please try a URL from a supported platform." },
        { status: 422 }
      );
    }

    // Platform-specific validation
    const platformValidation = await platform.adapter.validate(normalized);
    if (!platformValidation.valid) {
      return NextResponse.json(
        { error: platformValidation.reason || "Invalid URL for this platform." },
        { status: 422 }
      );
    }

    // Analyze
    const result = await platform.adapter.analyze(normalized);

    return NextResponse.json(
      {
        success: true,
        platform: platform.info.id,
        platformLabel: platform.info.label,
        metadata: result.metadata,
        formats: result.formats,
        formatsError: result.formatsError,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (err) {
    console.error("[/api/analyze] Error:", err);
    const message = err instanceof Error ? err.message : "";
    if (message.startsWith("The media engine yt-dlp is missing.")) {
      return NextResponse.json(
        { error: message },
        { status: 503, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
    // Do not expose internals
    return NextResponse.json(
      { error: "This media could not be analyzed. Please check the URL and try again." },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
