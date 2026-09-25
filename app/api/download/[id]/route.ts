import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/queue";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { streamTemporaryMedia } from "@/lib/storage/temporary-media";
import { createReadStream } from "node:fs";
import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import { Readable } from "node:stream";

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIP(req);

  // Rate limit downloads
  const rateCheck = checkRateLimit(`download:${ip}`, RATE_LIMITS.download);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  // Validate job
  const job = getJob(id);
  if (!job) {
    return NextResponse.json(
      { error: "Download not found or has expired." },
      { status: 404 }
    );
  }

  if (job.status !== "completed") {
    return NextResponse.json(
      { error: "Download is not ready yet." },
      { status: 202 }
    );
  }

  if (!job.result) {
    return NextResponse.json(
      { error: "Download result is unavailable." },
      { status: 404 }
    );
  }

  if (job.result.localPath) {
    const localPath = job.result.localPath;
    const source = createReadStream(localPath);
    const cleanup = () => {
      void rm(dirname(localPath), { recursive: true, force: true }).catch((error: unknown) => {
        console.error("Direct download scratch cleanup failed:", error);
      });
    };
    source.once("close", cleanup);
    source.once("error", cleanup);
    req.signal.addEventListener("abort", () => source.destroy(), { once: true });
    const rawFilename = job.result.filename || "media-download.mp4";
    const cleanFilename = rawFilename.replace(/[^\w\.\-\+]/g, "_");
    return new NextResponse(Readable.toWeb(source) as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": job.result.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(rawFilename)}`,
        ...(job.result.filesize !== undefined ? { "Content-Length": String(job.result.filesize) } : {}),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const download = await streamTemporaryMedia({ jobId: job.result.downloadId });
  if (!download) {
    return NextResponse.json(
      { error: "The download file has expired. Please process the media again." },
      { status: 410 }
    );
  }

  const rawFilename = job.result.filename || "media-download.mp4";
  const cleanFilename = rawFilename.replace(/[^\w\.\-\+]/g, "_");

  return new NextResponse(download.body, {
    headers: {
      "Content-Type": download.media.mime_type,
      "Content-Disposition": `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(rawFilename)}`,
      "Content-Length": String(download.media.size_bytes),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
