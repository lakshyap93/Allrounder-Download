import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const TEMP_MEDIA_BUCKET = "allrounder-temp";
export const MAX_TEMP_MEDIA_BYTES = 50 * 1024 * 1024;

export interface TemporaryMedia {
  job_id: string;
  object_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  expires_at: string;
}

export class MediaStorageLimitError extends Error {
  constructor() {
    super("This file is over Supabase Free's 50 MB per-file limit. Choose a lower resolution or audio format.");
    this.name = "MediaStorageLimitError";
  }
}

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");
  return { url: url.replace(/\/$/, ""), key };
}

function encodedObjectPath(objectPath: string) {
  return objectPath.split("/").map(encodeURIComponent).join("/");
}

async function removeStorageObject(objectPath: string) {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/${TEMP_MEDIA_BUCKET}`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: [objectPath] }),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Supabase media cleanup failed (${response.status}).`);
  }
}

export async function saveTemporaryMedia(input: {
  jobId: string;
  localPath: string;
  filename: string;
  mimeType: string;
}) {
  // Expiry cleanup is best-effort here so stale records do not add a database
  // round-trip to every user's download. Production also runs the cron route.
  void cleanupExpiredTemporaryMedia().catch((error: unknown) => {
    console.error("Expired media cleanup failed:", error);
  });
  const fileStat = await stat(input.localPath);
  if (fileStat.size > MAX_TEMP_MEDIA_BYTES) throw new MediaStorageLimitError();

  const safeFilename = input.filename.replace(/[^\w.()+-]/g, "_").slice(0, 120);
  const objectPath = `${input.jobId}/${randomUUID()}-${safeFilename}`;
  const { url, key } = config();
  const fileBody = Readable.toWeb(createReadStream(input.localPath)) as ReadableStream<Uint8Array>;
  const upload = await fetch(`${url}/storage/v1/object/${TEMP_MEDIA_BUCKET}/${encodedObjectPath(objectPath)}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": input.mimeType,
      "Content-Length": String(fileStat.size),
    },
    body: fileBody,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  if (!upload.ok) {
    // Never return raw provider responses or credentials to the browser.
    throw new Error(`Supabase media upload failed (${upload.status}).`);
  }

  const { error } = await getSupabaseAdmin().from("temporary_media").insert({
    job_id: input.jobId,
    object_path: objectPath,
    filename: safeFilename,
    mime_type: input.mimeType,
    size_bytes: fileStat.size,
  });
  if (error) {
    await removeStorageObject(objectPath).catch(() => {});
    throw new Error("Could not save temporary download details. Apply the Supabase migration first.");
  }

  return { objectPath, size: fileStat.size, filename: safeFilename };
}

async function findMedia(query: { objectPath?: string; jobId?: string }): Promise<TemporaryMedia | null> {
  let request = getSupabaseAdmin()
    .from("temporary_media")
    .select("job_id,object_path,filename,mime_type,size_bytes,expires_at")
    .gt("expires_at", new Date().toISOString());
  request = query.objectPath
    ? request.eq("object_path", query.objectPath)
    : request.eq("job_id", query.jobId!);
  const { data, error } = await request.maybeSingle();
  if (error) throw new Error("Could not look up temporary media in Supabase.");
  return data as TemporaryMedia | null;
}

export async function streamTemporaryMedia(query: {
  objectPath?: string;
  jobId?: string;
  knownMedia?: Omit<TemporaryMedia, "expires_at">;
}) {
  const media = query.knownMedia ?? await findMedia(query);
  if (!media) return null;

  const { url, key } = config();
  const response = await fetch(
    `${url}/storage/v1/object/authenticated/${TEMP_MEDIA_BUCKET}/${encodedObjectPath(media.object_path)}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
  );
  if (!response.ok || !response.body) {
    throw new Error(`Supabase media download failed (${response.status}).`);
  }

  const reader = response.body.getReader();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          void deleteTemporaryMedia(media.object_path).catch((error: unknown) => {
            console.error("Temporary media cleanup failed:", error);
          });
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  return { media, body };
}

export async function deleteTemporaryMedia(objectPath: string) {
  await removeStorageObject(objectPath);
  const { error } = await getSupabaseAdmin()
    .from("temporary_media")
    .delete()
    .eq("object_path", objectPath);
  if (error) throw new Error("Could not remove expired temporary media metadata.");
}

export async function cleanupExpiredTemporaryMedia() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("temporary_media")
    .select("object_path")
    .lte("expires_at", new Date().toISOString())
    .limit(500);
  if (error) throw new Error("Could not list expired temporary media.");
  if (!data?.length) return 0;

  const paths = data.map((entry) => entry.object_path as string);
  const { error: storageError } = await supabase.storage.from(TEMP_MEDIA_BUCKET).remove(paths);
  if (storageError) throw new Error("Could not remove expired media from Supabase Storage.");
  const { error: rowError } = await supabase.from("temporary_media").delete().in("object_path", paths);
  if (rowError) throw new Error("Could not remove expired media records.");
  return paths.length;
}
