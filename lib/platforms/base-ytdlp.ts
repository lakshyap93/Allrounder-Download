/**
 * Base YT-DLP Adapter
 * Common implementation using yt-dlp for metadata/format extraction.
 */

import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import fsSync from 'fs';
import {
  AnalysisResult,
  MediaFormat,
  MediaMetadata,
  ProcessRequest,
  ProcessResult,
} from '@/lib/platforms/types';
import { saveTemporaryMedia } from '@/lib/storage/temporary-media';

const execFileAsync = promisify(execFile);

// Use explicit WinGet locations when available so a dev server started before
// installation (or from an IDE with a stale PATH) can still find the tools.
function findWinGetExecutable(packagePrefix: string, executable: string): string | undefined {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return undefined;
  const packagesDir = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
  try {
    const packageDir = fsSync.readdirSync(packagesDir)
      .find((name) => name.startsWith(packagePrefix));
    if (!packageDir) return undefined;
    const root = path.join(packagesDir, packageDir);
    const stack = [root];
    while (stack.length) {
      const current = stack.pop()!;
      for (const entry of fsSync.readdirSync(current, { withFileTypes: true })) {
        const fullPath = path.join(current, entry.name);
        if (entry.isFile() && entry.name.toLowerCase() === executable.toLowerCase()) return fullPath;
        if (entry.isDirectory()) stack.push(fullPath);
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

const winGetLinks = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links')
  : '';
const YTDLP_PATH = process.env.YTDLP_PATH ||
  (winGetLinks && fsSync.existsSync(path.join(winGetLinks, 'yt-dlp.exe'))
    ? path.join(winGetLinks, 'yt-dlp.exe')
    : 'yt-dlp');
const FFMPEG_PATH = process.env.FFMPEG_PATH ||
  findWinGetExecutable('yt-dlp.FFmpeg_', 'ffmpeg.exe') || 'ffmpeg';
// Deno helps yt-dlp solve YouTube's JavaScript player challenges.
const DENO_LOCATION = process.env.DENO_PATH ||
  (winGetLinks && fsSync.existsSync(path.join(winGetLinks, 'deno.exe'))
    ? path.join(winGetLinks, 'deno.exe')
    : '');
// YouTube media requests can be denied over IPv6 on some networks. Enable IPv4
// by default, with an env override for IPv6-only deployment environments.
const YTDLP_FORCE_IPV4 = process.env.YTDLP_FORCE_IPV4 !== 'false';
const YTDLP_TIMEOUT_MS = 60_000; // metadata/extractor timeout
const YTDLP_DOWNLOAD_IDLE_TIMEOUT_MS = 10 * 60_000; // allow slow sources and long fragment retries
const YTDLP_INSTALL_HELP = 'The media engine yt-dlp is missing. Install it in PowerShell with `winget install yt-dlp`, then restart the development server.';
const TEMP_ROOT = process.env.TEMP_DIR || os.tmpdir();
const ANALYSIS_CACHE_TTL_MS = 60_000;
const ANALYSIS_CACHE_MAX_ENTRIES = 100;
const analysisCache = new Map<string, { result: AnalysisResult; expiresAt: number }>();

function isExecutableMissing(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT';
}

export interface YtDlpFormat {
  format_id: string;
  ext: string;
  resolution?: string;
  fps?: number;
  filesize?: number;
  tbr?: number;
  vcodec?: string;
  acodec?: string;
  height?: number;
  width?: number;
  format_note?: string;
  quality?: number;
}

export interface YtDlpInfo {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  upload_date?: string;
  view_count?: number;
  formats: YtDlpFormat[];
  url?: string;
}

function formatQualityLabel(fmt: YtDlpFormat): string {
  if (fmt.height) {
    return `${fmt.height}p`;
  }
  if (fmt.resolution && fmt.resolution !== 'audio only') {
    return fmt.resolution;
  }
  return fmt.format_note || 'Standard';
}

/** Returns true if this is an H.264 (AVC) stream — universally compatible. */
function isH264(vcodec?: string): boolean {
  return !!vcodec && (vcodec.startsWith('avc') || vcodec.startsWith('h264'));
}

/** Returns true if this is an AV1 stream — poor browser/device support. */
function isAV1(vcodec?: string): boolean {
  return !!vcodec && vcodec.startsWith('av01');
}

/**
 * Codec preference score: higher = preferred.
 * H.264 > VP9 > AV1 (AV1 is least compatible).
 */
function codecScore(vcodec?: string): number {
  if (isH264(vcodec)) return 3;
  if (vcodec?.startsWith('vp9') || vcodec?.startsWith('vp09')) return 2;
  if (isAV1(vcodec)) return 0;
  return 1;
}

function mapFormats(rawFormats: YtDlpFormat[]): MediaFormat[] {
  const formats: MediaFormat[] = [];

  // Video formats — only mp4/webm with real height, no audio-only streams
  const videoFormats = rawFormats
    .filter(
      (f) =>
        f.vcodec !== 'none' &&
        f.ext &&
        ['mp4', 'webm', 'mkv'].includes(f.ext) &&
        f.height &&
        f.height >= 144
    )
    // Sort: tallest first, then prefer H.264 > VP9 > AV1 at the same height
    .sort((a, b) => {
      const heightDiff = (b.height || 0) - (a.height || 0);
      if (heightDiff !== 0) return heightDiff;
      return codecScore(b.vcodec) - codecScore(a.vcodec);
    });

  // Deduplicate by height — first entry wins (H.264 preferred)
  const seenHeights = new Set<number>();
  for (const fmt of videoFormats) {
    if (fmt.height && !seenHeights.has(fmt.height)) {
      seenHeights.add(fmt.height);
      const quality = formatQualityLabel(fmt);
      // Use the resolution label as formatId so ytdlpDownload uses the
      // RESOLUTION_FORMAT_MAP which explicitly constrains codec to avc1.
      // This guarantees H.264 output regardless of what yt-dlp's "best" is.
      const formatIdToUse = `${fmt.height}p`;
      formats.push({
        formatId: formatIdToUse,
        container: 'mp4',
        quality,
        resolution: fmt.resolution,
        fps: fmt.fps,
        filesize: fmt.filesize,
        bitrate: fmt.tbr,
        codec: fmt.vcodec,
        type: 'video',
        label: `MP4 ${quality}`,
      });
    }
  }

  // Audio formats — best audio-only options
  const audioFormats = rawFormats
    .filter(
      (f) =>
        (f.vcodec === 'none' || !f.vcodec) &&
        f.acodec !== 'none' &&
        f.ext &&
        ['m4a', 'mp3', 'opus', 'webm'].includes(f.ext)
    )
    .sort((a, b) => (b.tbr || 0) - (a.tbr || 0));

  const seenAudioExts = new Set<string>();
  for (const fmt of audioFormats) {
    const ext = fmt.ext;
    if (!seenAudioExts.has(ext)) {
      seenAudioExts.add(ext);
      formats.push({
        formatId: fmt.format_id,
        container: ext,
        type: 'audio',
        bitrate: fmt.tbr,
        filesize: fmt.filesize,
        codec: fmt.acodec,
        label: `${ext.toUpperCase()} Audio`,
      });
    }
  }

  // Always offer MP3 if there's any audio
  if (audioFormats.length > 0 && !seenAudioExts.has('mp3')) {
    formats.push({
      formatId: 'bestaudio/mp3',
      container: 'mp3',
      type: 'audio',
      label: 'MP3 Audio',
    });
  }

  return formats;
}

/**
 * Run yt-dlp to get JSON metadata.
 */
export async function ytdlpGetInfo(url: string): Promise<YtDlpInfo> {
  const args = [
    '--dump-json',
    '--no-playlist',
    '--no-warnings',
    '--no-check-formats',
    '--socket-timeout', '30',
  ];

  if (YTDLP_FORCE_IPV4) args.push('--force-ipv4');

  if (DENO_LOCATION && (path.isAbsolute(DENO_LOCATION) ? fsSync.existsSync(DENO_LOCATION) : true)) {
    args.push('--js-runtimes', `deno:${DENO_LOCATION}`);
  }

  args.push(url);

  const { stdout } = await execFileAsync(YTDLP_PATH, args, {
    timeout: YTDLP_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024,
  });

  return JSON.parse(stdout) as YtDlpInfo;
}

/**
 * Download with yt-dlp to a temp file.
 */
// Map human-readable resolution labels → yt-dlp format selectors
// Explicitly prefer H.264 (avc1) codec for maximum compatibility.
// 3-tier fallback: avc1 H.264 → any mp4 → any format.
const RESOLUTION_FORMAT_MAP: Record<string, string> = {
  '2160p': 'bestvideo[height<=2160][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=2160]+bestaudio/best',
  '1440p': 'bestvideo[height<=1440][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1440]+bestaudio/best',
  '1080p': 'bestvideo[height<=1080][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best',
  '720p':  'bestvideo[height<=720][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best',
  '480p':  'bestvideo[height<=480][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best',
  '360p':  'bestvideo[height<=360][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=360]+bestaudio/best',
  'mp3':   'bestaudio',
  'mp3-320': 'bestaudio',
  'mp3-192': 'bestaudio',
  'm4a':   'bestaudio[ext=m4a]/bestaudio',
};

export function ytdlpDownload(
  url: string,
  formatId: string,
  outputPath: string,
  onProgress?: (progress: { percent: number; total?: string; speed?: string; eta?: string; statusText?: string }) => void,
  container?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const c = container?.toLowerCase();
    const isMP3 = c === 'mp3' || formatId === 'bestaudio/mp3' || formatId.startsWith('mp3');
    const isM4A = c === 'm4a' || formatId === 'm4a';
    const isOpus = c === 'opus' || c === 'webm';
    const isAudio = isMP3 || isM4A || isOpus;

    let formatSpec: string;
    if (isAudio && (formatId === 'bestaudio/mp3' || formatId.startsWith('mp3') || formatId === 'm4a')) {
      // Virtual/named audio format — use the resolution map
      formatSpec = RESOLUTION_FORMAT_MAP[formatId] ?? 'bestaudio';
    } else if (RESOLUTION_FORMAT_MAP[formatId]) {
      // Human-readable video label from fallback format list (e.g. '1080p', '720p')
      formatSpec = RESOLUTION_FORMAT_MAP[formatId];
    } else {
      // Real yt-dlp format ID from live analysis
      if (isAudio) {
        // Audio-only format: download as-is, no video merge needed
        formatSpec = formatId;
      } else {
        // Video format: merge with best available audio
        formatSpec = `${formatId}+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`;
      }
    }

    // Build args — ALL flags MUST come before the URL
    const args = [
      '--format', formatSpec,
      '--output', outputPath,
      '--no-playlist',
      '--no-warnings',
      '--socket-timeout', '45',
      '--retries', '5',
      '--fragment-retries', '5',
      '--extractor-retries', '3',
      '--concurrent-fragments', '16',
      '--buffer-size', '16M',
      '--newline',
      '--ffmpeg-location', FFMPEG_PATH,
    ];

    if (YTDLP_FORCE_IPV4) args.push('--force-ipv4');

    if (DENO_LOCATION && (path.isAbsolute(DENO_LOCATION) ? fsSync.existsSync(DENO_LOCATION) : true)) {
      args.push('--js-runtimes', `deno:${DENO_LOCATION}`);
    }

    // Post-processing flags (must come before the URL)
    if (isMP3) {
      // Extract and convert to MP3
      args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0');
    } else if (isOpus) {
      // Keep native Opus/WebM streams intact; transcoding adds latency and changes the advertised format.
    } else if (!isAudio) {
      // Video: merge streams into MP4 container
      args.push('--merge-output-format', 'mp4');
    }
    // For M4A: no extra post-processing needed, yt-dlp downloads m4a natively

    // URL is always the last argument
    args.push(url);

    const child = spawn(YTDLP_PATH, args);


    let stderrData = '';
    // yt-dlp can be quiet while the source retries a slow fragment. Its own
    // socket/retry limits handle transient network failures; allow those to finish.
    let inactivityTimer: NodeJS.Timeout;
    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.error('[yt-dlp] Download idle timeout. Last stderr:', stderrData.slice(-2000));
        child.kill('SIGTERM');
        reject(new Error('Download stalled: No progress received for 10 minutes.'));
      }, YTDLP_DOWNLOAD_IDLE_TIMEOUT_MS);
    };
    resetTimer();

    const processOutput = (chunk: Buffer) => {
      resetTimer();
      const text = chunk.toString('utf-8');
      const lines = text.split(/[\r\n]+/);
      for (const line of lines) {
        // Match standard yt-dlp progress: [download]  15.3% of 441.90MiB at 1.50MiB/s ETA 04:11
        const dlMatch = line.match(/\[download\]\s+([\d\.]+)%\s+of\s+~?([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/i);
        if (dlMatch) {
          const percent = parseFloat(dlMatch[1]);
          onProgress?.({
            percent,
            total: dlMatch[2],
            speed: dlMatch[3],
            eta: dlMatch[4],
          });
        } else if (line.includes('[Merger]') || line.includes('Merging formats')) {
          onProgress?.({
            percent: 96,
            statusText: 'Merging video & audio with FFmpeg…',
          });
        } else if (line.includes('[ExtractAudio]')) {
          onProgress?.({
            percent: 95,
            statusText: 'Extracting MP3 audio track…',
          });
        }
      }
    };

    child.stdout.on('data', processOutput);

    child.stderr.on('data', (chunk: Buffer) => {
      stderrData = `${stderrData}${chunk.toString('utf-8')}`.slice(-12_000);
      processOutput(chunk);
    });

    child.on('close', (code) => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderrData.slice(-300)}`));
      }
    });

    child.on('error', (err) => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      reject(err);
    });
  });
}

/**
 * Base analyze implementation using yt-dlp.
 */
export async function baseAnalyze(
  url: string,
  platformId: string,
  platformLabel: string
): Promise<AnalysisResult> {
  const cached = analysisCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  if (cached) analysisCache.delete(url);

  try {
    const info = await ytdlpGetInfo(url);

    const metadata: MediaMetadata = {
      title: info.title || 'Untitled',
      description: info.description?.slice(0, 500),
      duration: info.duration,
      thumbnail: info.thumbnail,
      uploader: info.uploader,
      uploadDate: info.upload_date,
      viewCount: info.view_count,
      platform: platformId,
      platformLabel,
      originalUrl: url,
    };

    const formats = mapFormats(info.formats || []);
    const result = { metadata, formats };
    if (analysisCache.size >= ANALYSIS_CACHE_MAX_ENTRIES) {
      const firstKey = analysisCache.keys().next().value;
      if (firstKey) analysisCache.delete(firstKey);
    }
    analysisCache.set(url, { result, expiresAt: Date.now() + ANALYSIS_CACHE_TTL_MS });
    return result;
  } catch (err) {
    if (isExecutableMissing(err)) {
      throw new Error(YTDLP_INSTALL_HELP);
    }
    console.warn(`[${platformLabel}] yt-dlp could not retrieve formats:`, err instanceof Error ? err.message : "Unknown extractor error");
    const extractorError = err instanceof Error ? err.message : "";
    const formatsError = /HTTP Error 429|Too Many Requests/i.test(extractorError)
      ? 'YouTube is temporarily rate-limiting requests from this network. Wait a while before retrying; repeated attempts can extend the block.'
      : /HTTP Error 403|403 Forbidden|PO Token|Proof of Origin/i.test(extractorError)
        ? 'YouTube refused the media request (403). This can require a current PO token or be caused by a network/IP restriction; the video metadata is available, but no downloadable formats were returned.'
        : /Sign in to confirm|LOGIN_REQUIRED|age-restricted/i.test(extractorError)
          ? 'YouTube requires sign-in or age verification for this video, so downloadable formats are unavailable.'
          : 'The source returned metadata, but its extractor could not retrieve any downloadable formats. Try again later or choose another public video.';
    // If yt-dlp binary is not found or fails, fallback to oEmbed and direct platform stream extraction
    let title = 'Public Online Media';
    let uploader = platformLabel;
    let thumbnail: string | undefined;

    // Check YouTube video ID
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      title = `YouTube Video (${ytMatch[1]})`;
    }

    try {
      const oEmbedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (oEmbedRes.ok) {
        const data = (await oEmbedRes.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
        if (data.title) title = data.title;
        if (data.author_name) uploader = data.author_name;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
      }
    } catch {
      // oEmbed timeout or failure, proceed with parsed metadata
    }

    return {
      metadata: {
        title,
        uploader,
        thumbnail,
        platform: platformId,
        platformLabel,
        originalUrl: url,
      },
      // Never advertise guessed formats: the chosen quality must actually exist on the source.
      formats: [],
      formatsError,
    };
  }
}

/**
 * Base process implementation using yt-dlp.
 */
export async function baseProcess(
  request: ProcessRequest
): Promise<ProcessResult> {
  // Determine audio type from container (passed from client) or formatId
  const container = request.container?.toLowerCase();
  const isM4A = container === 'm4a' || request.formatId === 'm4a';
  const isMP3 = container === 'mp3' || request.formatId === 'bestaudio/mp3' || request.formatId.startsWith('mp3');
  const isOpus = container === 'opus' || container === 'webm';
  // Any audio-only container: m4a, mp3, opus, webm (audio-only)
  const isAudioOnly = isM4A || isMP3 || isOpus;

  const ext = isAudioOnly ? (isM4A ? 'm4a' : isOpus ? 'webm' : 'mp3') : 'mp4';
  const mimeType = isAudioOnly
    ? (isM4A ? 'audio/mp4' : isOpus ? 'audio/webm' : 'audio/mpeg')
    : 'video/mp4';

  const workDir = await fs.mkdtemp(path.join(TEMP_ROOT, 'allrounder-media-'));
  const outputPath = path.join(/* turbopackIgnore: true */ workDir, `${request.jobId}.${ext}`);
  let keepScratchForResponse = false;
  try {
    await ytdlpDownload(request.url, request.formatId, outputPath, request.onProgress, request.container);

    // Merging can change the final extension; select the completed file, never a .part file.
    let finalPath = outputPath;
    try {
      await fs.access(finalPath);
    } catch {
      const entries = await fs.readdir(workDir).catch(() => [] as string[]);
      const match = entries.find((name) => name.startsWith(`${request.jobId}.`) && !name.endsWith('.part'));
      if (match) finalPath = path.join(workDir, match);
    }

    const safeFormat = request.formatId.replace(/[^\w.-]/g, '-').slice(0, 32);
    // Give every job a unique browser filename so downloading the same format
    // twice never overwrites an earlier file in the Downloads folder.
    const jobSuffix = request.jobId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    const filename = `allrounder-${safeFormat}-${jobSuffix}.${ext}`;
    if (request.directDownload) {
      const fileStat = await fs.stat(/* turbopackIgnore: true */ finalPath);
      keepScratchForResponse = true;
      return {
        filePath: finalPath,
        localPath: finalPath,
        filename,
        mimeType,
        filesize: fileStat.size,
      };
    }

    const stored = await saveTemporaryMedia({
      jobId: request.jobId,
      localPath: finalPath,
      filename,
      mimeType,
    });

    return {
      filePath: stored.objectPath,
      filename: stored.filename,
      mimeType,
      filesize: stored.size,
    };
  } finally {
    // yt-dlp and FFmpeg need scratch space while processing; remove it immediately afterwards.
    if (!keepScratchForResponse) {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
