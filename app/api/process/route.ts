import { NextRequest, NextResponse } from "next/server";
import { validateURL } from "@/lib/validation/url";
import { detectPlatform } from "@/lib/platforms/registry";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createJob, countActiveJobsForIP, updateJob } from "@/lib/queue";

const MAX_CONCURRENT_JOBS_PER_IP = 3;

function getPublicProcessingError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/over Supabase Free|50 MB per-file limit/i.test(message)) {
    return "This file is over Supabase Free's 50 MB limit. Choose a lower resolution or an audio format.";
  }
  if (/Download stalled/i.test(message)) {
    return "The source stopped sending data for too long. Try again, or choose a lower resolution.";
  }
  if (/HTTP Error 403|403 Forbidden/i.test(message)) {
    return "The source refused this download (403). Try another public video or retry later.";
  }
  if (/Supabase media upload failed/i.test(message)) {
    return "Temporary storage could not accept this file. Please retry in a moment.";
  }
  if (/Supabase server configuration is missing|Could not save temporary download details/i.test(message)) {
    return "Temporary storage is not configured. Check the Supabase server keys and apply the storage migration.";
  }
  if (/yt-dlp is missing|media engine yt-dlp is missing/i.test(message)) {
    return "The server's media engine is unavailable. Restart the development server and try again.";
  }
  return "Media processing failed. Please try a lower resolution or retry the download.";
}

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
    const rateCheck = checkRateLimit(`process:${ip}`, RATE_LIMITS.process);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    // Concurrent job limit
    const activeJobs = countActiveJobsForIP(ip);
    if (activeJobs >= MAX_CONCURRENT_JOBS_PER_IP) {
      return NextResponse.json(
        { error: "You have too many active downloads. Please wait for them to complete." },
        { status: 429 }
      );
    }

    // Parse body
    let body: { url?: string; formatId?: string; platform?: string; container?: string; directDownload?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { url, formatId, container, directDownload } = body;

    if (!url || !formatId) {
      return NextResponse.json(
        { error: "URL and format are required." },
        { status: 400 }
      );
    }

    // Validate URL again server-side
    const validation = await validateURL(url as string);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const normalized = validation.normalized!;
    const platform = detectPlatform(normalized);
    if (!platform) {
      return NextResponse.json(
        { error: "Unsupported platform." },
        { status: 422 }
      );
    }

    const platformValidation = await platform.adapter.validate(normalized);
    if (!platformValidation.valid) {
      return NextResponse.json(
        { error: platformValidation.reason || "Invalid URL for this platform." },
        { status: 422 }
      );
    }

    // Create job
    const job = createJob({
      url: normalized,
      formatId: formatId as string,
      platform: platform.info.id,
      ipAddress: ip,
    });

    // Process asynchronously (in-process for now; replace with BullMQ worker for production)
    setImmediate(async () => {
      try {
        updateJob(job.id, { status: "processing", progress: 10 });

        const result = await platform.adapter.process({
          url: normalized,
          formatId: formatId as string,
          container: container as string | undefined,
          jobId: job.id,
          directDownload: directDownload === true,
          onProgress: (p) => {
            updateJob(job.id, {
              status: "processing",
              progress: Math.min(99, Math.max(5, Math.round(p.percent))),
              speed: p.speed,
              eta: p.eta,
              statusText: p.statusText || (p.speed ? `${p.percent.toFixed(0)}% of ${p.total || ''} • ${p.speed} • ETA ${p.eta}` : undefined),
            });
          },
        });

        updateJob(job.id, {
          status: "completed",
          progress: 100,
          result: {
            downloadId: job.id,
            filename: result.filename,
            mimeType: result.mimeType,
            filesize: result.filesize,
            localPath: result.localPath,
          },
        });
        if (result.localPath) {
          const { rm } = await import("node:fs/promises");
          const { dirname } = await import("node:path");
          const cleanupTimer = setTimeout(() => {
            void rm(dirname(result.localPath!), { recursive: true, force: true });
          }, 30 * 60 * 1000);
          cleanupTimer.unref?.();
        }
      } catch (err) {
        console.error(`[Job ${job.id}] Processing failed:`, err);
        updateJob(job.id, {
          status: "failed",
          error: getPublicProcessingError(err),
        });
      }
    });

    return NextResponse.json(
      { success: true, jobId: job.id },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (err) {
    console.error("[/api/process] Error:", err);
    return NextResponse.json(
      { error: "Failed to start processing. Please try again." },
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
