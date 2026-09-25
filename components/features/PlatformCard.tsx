import {
  Globe,
  Music2,
  Video,
  Play,
  Tv2,
  MessageSquare,
  Pin,
  Film,
  Gamepad2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { PlatformInfo } from "@/lib/platforms/types";

interface PlatformCardProps {
  platform: PlatformInfo;
}

// Map platform IDs to available Lucide icons
const ICON_MAP: Record<string, React.ElementType> = {
  youtube: Play,
  instagram: Film,
  facebook: Globe,
  tiktok: Music2,
  x: MessageSquare,
  reddit: MessageSquare,
  pinterest: Pin,
  vimeo: Video,
  dailymotion: Tv2,
  twitch: Gamepad2,
  linkedin: Globe,
};

export function PlatformCard({ platform }: PlatformCardProps) {
  const Icon = ICON_MAP[platform.id] || Globe;

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${platform.color}18` }}
          >
            <Icon size={20} style={{ color: platform.color }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {platform.label}
            </h3>
            <p className="text-xs text-[var(--foreground-muted)]">
              {platform.domains[0]}
            </p>
          </div>
        </div>

        {/* Availability badge */}
        {platform.available ? (
          <span className="flex items-center gap-1 text-[0.65rem] font-semibold px-2 py-0.5 rounded-full
            bg-[var(--success)]/12 text-[var(--success)] border border-[var(--success)]/20">
            <CheckCircle2 size={10} />
            Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[0.65rem] font-semibold px-2 py-0.5 rounded-full
            bg-[var(--warning)]/12 text-[var(--warning)] border border-[var(--warning)]/20">
            <Clock size={10} />
            Soon
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
        {platform.description}
      </p>

      {/* Features */}
      <div className="flex flex-wrap gap-1.5">
        {platform.features.map((f) => (
          <span
            key={f}
            className="text-[0.65rem] px-2 py-0.5 rounded-full bg-[var(--surface-hover)]
              text-[var(--foreground-secondary)] border border-[var(--border)]"
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
