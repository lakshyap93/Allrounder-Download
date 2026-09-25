"use client";

import { Download, Music, Video } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import type { MediaFormat } from "@/lib/platforms/types";

interface FormatSelectorProps {
  formats: MediaFormat[];
  formatsError?: string;
  onSelectFormat: (format: MediaFormat) => void;
  selectedFormatId?: string;
  isBusy?: boolean;
  rightsConfirmed: boolean;
}

export function FormatSelector({
  formats,
  formatsError,
  onSelectFormat,
  selectedFormatId,
  isBusy = false,
  rightsConfirmed,
}: FormatSelectorProps) {
  const videoFormats = formats.filter((f) => f.type === "video");
  const audioFormats = formats.filter((f) => f.type === "audio");

  const renderFormatRow = (format: MediaFormat) => {
    const isSelected = format.formatId === selectedFormatId;
    return (
      <div
        key={format.formatId}
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-150
          ${isSelected
            ? "border-[var(--primary)] bg-[var(--primary)]/8"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
          }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold
            ${format.type === "video"
              ? "bg-[var(--primary)]/12 text-[var(--primary)]"
              : "bg-[var(--primary)]/10 text-[var(--primary)]"
            }`}
          >
            {format.container.toUpperCase().slice(0, 4)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {format.label}
            </p>
            <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-2 mt-0.5">
              {format.quality && <span>{format.quality}</span>}
              {format.fps && <span>{format.fps}fps</span>}
              {format.bitrate && <span>{Math.round(format.bitrate)}kbps</span>}
              {format.filesize && <span>{formatFileSize(format.filesize)}</span>}
            </p>
          </div>
        </div>

        <button
          id={`download-${format.formatId}`}
          onClick={() => onSelectFormat(format)}
          disabled={isBusy || !rightsConfirmed}
          aria-label={`Download ${format.label}`}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
            transition-all duration-200 focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed
            disabled:opacity-50
            bg-[#24134f] text-white border border-[#24134f] shadow-[0_2px_8px_rgb(36_19_79_/_24%)] hover:bg-[#160d35] hover:border-[#160d35]`}
        >
          <Download size={14} />
          {isBusy && isSelected ? "Preparing…" : "Download"}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <p className="-mb-2 text-xs text-[var(--foreground-muted)]">
        Downloads go straight to your browser. Larger or higher-quality videos can still take longer to process.
      </p>
      {videoFormats.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider mb-3">
            <Video size={14} />
            Video
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{videoFormats.map(renderFormatRow)}</div>
        </section>
      )}

      {audioFormats.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider mb-3">
            <Music size={14} />
            Audio
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{audioFormats.map(renderFormatRow)}</div>
        </section>
      )}

      {formats.length === 0 && (
        <p className="text-center text-sm text-[var(--foreground-muted)] py-6" role="status">
          {formatsError || 'No downloadable formats were returned for this media.'}
        </p>
      )}
    </div>
  );
}
