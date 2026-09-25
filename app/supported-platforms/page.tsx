import type { Metadata } from "next";
import { PlatformCard } from "@/components/features/PlatformCard";
import { PLATFORM_INFO } from "@/lib/platforms/info";

export const metadata: Metadata = {
  title: "Supported Platforms — Allrounder Download",
  description:
    "See all supported platforms on Allrounder Download — YouTube, Instagram, TikTok, Reddit, X, and more.",
};

const PLATFORMS = PLATFORM_INFO;

export default function SupportedPlatformsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-[var(--foreground)]">
          Supported <span className="gradient-text">Platforms</span>
        </h1>
        <p className="text-lg text-[var(--foreground-secondary)] max-w-2xl mx-auto leading-relaxed">
          Allrounder Download supports the following platforms. More will be added over time.
          Only publicly accessible content that the service is permitted to process will work.
        </p>
      </div>

      {/* Active platforms */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
          Active ({PLATFORMS.filter((p) => p.available).length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.filter((p) => p.available).map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>
      </section>

      {/* Coming soon */}
      {PLATFORMS.filter((p) => !p.available).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
            Coming Soon
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.filter((p) => !p.available).map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="glass-card p-6 text-center space-y-2">
        <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
          Platform support depends on public API availability and technical feasibility.
          We do not bypass access controls, authentication, or DRM. Only public, permitted
          content will be processed.
        </p>
      </div>
    </div>
  );
}
