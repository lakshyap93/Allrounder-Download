/**
 * Platform Adapter Types
 * Shared interfaces for all platform adapters.
 */

export interface MediaFormat {
  formatId: string;
  container: string;     // e.g., 'mp4', 'webm', 'mp3'
  quality?: string;      // e.g., '1080p', '720p', 'best'
  resolution?: string;   // e.g., '1920x1080'
  fps?: number;
  filesize?: number;     // bytes
  bitrate?: number;      // kbps
  codec?: string;
  type: 'video' | 'audio';
  label: string;         // Display label e.g. "MP4 1080p"
}

export interface MediaMetadata {
  title: string;
  description?: string;
  duration?: number;     // seconds
  thumbnail?: string;   // URL
  uploader?: string;
  uploadDate?: string;
  viewCount?: number;
  platform: string;
  platformLabel: string;
  originalUrl: string;
}

export interface AnalysisResult {
  metadata: MediaMetadata;
  formats: MediaFormat[];
  formatsError?: string;
}

export interface ProcessProgress {
  percent: number;
  total?: string;
  speed?: string;
  eta?: string;
  statusText?: string;
}

export interface ProcessRequest {
  url: string;
  formatId: string;
  container?: string;    // e.g. 'mp4', 'm4a', 'mp3', 'opus'
  jobId: string;
  /** Keep the short-lived server scratch file so a route can stream it to the browser directly. */
  directDownload?: boolean;
  onProgress?: (progress: ProcessProgress) => void;
}

export interface ProcessResult {
  /** Supabase object path for queued downloads; for direct downloads this equals localPath. */
  filePath: string;
  /** Short-lived scratch file path, present only for direct browser downloads. */
  localPath?: string;
  filename: string;
  mimeType: string;
  filesize?: number;
}

export interface PlatformAdapter {
  /**
   * Returns true if this adapter handles the given URL.
   */
  detect(url: string): boolean;

  /**
   * Validates that the URL is well-formed for this platform.
   */
  validate(url: string): Promise<{ valid: boolean; reason?: string }>;

  /**
   * Retrieves permitted metadata and available formats.
   */
  analyze(url: string): Promise<AnalysisResult>;

  /**
   * Processes the media into the requested format.
   * Writes to filePath returned in ProcessResult.
   */
  process(request: ProcessRequest): Promise<ProcessResult>;
}

export interface PlatformInfo {
  id: string;
  name: string;
  label: string;
  domains: string[];
  icon: string;         // icon name from Lucide or custom SVG
  color: string;        // brand color hex
  description: string;
  features: string[];
  available: boolean;
}
