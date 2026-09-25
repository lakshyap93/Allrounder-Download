"use client";

import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { JobStatus } from "@/lib/queue";

interface ProcessingStatusProps {
  status: JobStatus;
  progress?: number;
  error?: string;
}

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; description: string; color: string }
> = {
  queued: {
    label: "Queued",
    description: "Your request is in the queue…",
    color: "text-[var(--foreground-muted)]",
  },
  analyzing: {
    label: "Analyzing",
    description: "Analyzing media metadata…",
    color: "text-[var(--primary)]",
  },
  processing: {
    label: "Processing",
    description: "Preparing your download…",
    color: "text-[var(--primary)]",
  },
  completed: {
    label: "Ready",
    description: "Your download is ready!",
    color: "text-[var(--success)]",
  },
  failed: {
    label: "Failed",
    description: "Something went wrong.",
    color: "text-[var(--destructive)]",
  },
  expired: {
    label: "Expired",
    description: "This download has expired. Please try again.",
    color: "text-[var(--foreground-muted)]",
  },
};

export function ProcessingStatus({ status, progress = 0, error }: ProcessingStatusProps) {
  const config = STATUS_CONFIG[status];
  const isActive = status === "queued" || status === "analyzing" || status === "processing";
  const isSuccess = status === "completed";
  const isError = status === "failed" || status === "expired";

  return (
    <div className="glass-card p-6 text-center space-y-4 animate-fade-in">
      {/* Icon */}
      <div className="flex justify-center">
        {isActive && (
          <div className="relative">
            <Loader2
              size={40}
              className="animate-spin text-[var(--primary)]"
            />
          </div>
        )}
        {isSuccess && (
          <CheckCircle2 size={40} className="text-[var(--success)]" />
        )}
        {isError && <XCircle size={40} className="text-[var(--destructive)]" />}
      </div>

      {/* Label */}
      <div className="space-y-1">
        <p className={`text-base font-semibold ${config.color}`}>{config.label}</p>
        <p className="text-sm text-[var(--foreground-muted)]">
          {error && isError ? error : config.description}
        </p>
      </div>

      {/* Progress bar */}
      {isActive && (
        <div className="relative h-1.5 bg-[var(--border)] rounded-full overflow-hidden max-w-xs mx-auto">
          {progress > 0 ? (
            <div
              className="absolute inset-y-0 left-0 bg-[var(--primary)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          ) : (
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: "40%",
                background: `linear-gradient(90deg, transparent, var(--primary), transparent)`,
                animation: "shimmer 1.5s ease-in-out infinite",
                backgroundSize: "200% 100%",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
