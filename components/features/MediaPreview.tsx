import Image from "next/image";
import { Clock, Eye, User, ExternalLink } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { MediaMetadata } from "@/lib/platforms/types";

interface MediaPreviewProps {
  metadata: MediaMetadata;
}

function formatViewCount(count?: number): string {
  if (!count) return "";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toLocaleString();
}

const PLATFORM_BADGE_COLORS: Record<string, string> = {
  youtube: "bg-red-50 text-red-700 border-red-200",
  instagram: "bg-pink-50 text-pink-700 border-pink-200",
  facebook: "bg-blue-50 text-blue-800 border-blue-200",
  tiktok: "bg-zinc-100 text-zinc-800 border-zinc-200",
  x: "bg-zinc-100 text-zinc-800 border-zinc-200",
  reddit: "bg-orange-50 text-orange-800 border-orange-200",
  pinterest: "bg-red-50 text-red-700 border-red-200",
  vimeo: "bg-cyan-50 text-cyan-800 border-cyan-200",
  dailymotion: "bg-blue-50 text-blue-800 border-blue-200",
  twitch: "bg-purple-50 text-purple-800 border-purple-200",
};

export function MediaPreview({ metadata }: MediaPreviewProps) {
  const badgeColor =
    PLATFORM_BADGE_COLORS[metadata.platform] ??
    "bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/20";

  return (
    <div className="glass-card p-5 flex flex-col sm:flex-row gap-4 animate-fade-in">
      {/* Thumbnail */}
      {metadata.thumbnail && (
        <div className="flex-shrink-0 w-full sm:w-48 aspect-video relative rounded-lg overflow-hidden bg-[var(--surface-hover)]">
          <Image
            src={metadata.thumbnail}
            alt={metadata.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Platform badge */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {metadata.platformLabel}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)] leading-snug line-clamp-2">
          {metadata.title}
        </h2>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--foreground-muted)]">
          {metadata.duration != null && metadata.duration > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              {formatDuration(metadata.duration)}
            </span>
          )}
          {metadata.uploader && (
            <span className="flex items-center gap-1.5">
              <User size={12} />
              {metadata.uploader}
            </span>
          )}
          {metadata.viewCount != null && metadata.viewCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Eye size={12} />
              {formatViewCount(metadata.viewCount)} views
            </span>
          )}
        </div>

        {/* Original link */}
        <a
          href={metadata.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline"
        >
          View original
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}
