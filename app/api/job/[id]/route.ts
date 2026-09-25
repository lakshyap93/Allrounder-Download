import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/queue";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Job ID is required." }, { status: 400 });
  }

  const job = getJob(id);

  if (!job) {
    return NextResponse.json(
      { error: "Job not found or has expired." },
      { status: 404 }
    );
  }

  // Return safe job info (no internal file paths)
  return NextResponse.json(
    {
      id: job.id,
      status: job.status,
      progress: job.progress,
      speed: job.speed,
      eta: job.eta,
      statusText: job.statusText,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      expiresAt: job.expiresAt,
      error: job.status === "failed" ? (job.error ?? "Processing failed.") : undefined,
      result: job.result
        ? {
            downloadId: job.result.downloadId,
            filename: job.result.filename,
            mimeType: job.result.mimeType,
            filesize: job.result.filesize,
          }
        : undefined,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
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
