import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredTemporaryMedia } from "@/lib/storage/temporary-media";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const deleted = await cleanupExpiredTemporaryMedia();
    return NextResponse.json({ success: true, deleted });
  } catch {
    return NextResponse.json({ error: "Temporary media cleanup failed." }, { status: 500 });
  }
}
