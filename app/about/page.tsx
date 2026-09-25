import type { Metadata } from "next";
import { CheckCircle2, Shield, Clock, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Allrounder Download",
  description:
    "Learn about Allrounder Download — a free, privacy-respecting online media tool for supported public content.",
};

const HOW_IT_WORKS = [
  { step: "1", title: "Paste a URL", description: "Enter any supported public media URL into the analyzer." },
  { step: "2", title: "Analyze", description: "We detect the platform and retrieve available formats." },
  { step: "3", title: "Choose a format", description: "Select the video quality or audio format you need." },
  { step: "4", title: "Download", description: "Your file is prepared and delivered directly to you." },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 space-y-20">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-[var(--foreground)]">
            About <span className="gradient-text">Allrounder Download</span>
          </h1>
          <p className="text-lg text-[var(--foreground-secondary)] max-w-2xl mx-auto leading-relaxed">
            Allrounder Download is a free online media utility that lets you retrieve publicly
            available media in various formats from supported platforms — no account required,
            no payment needed, ever.
          </p>
        </div>
      </section>

      {/* What it is */}
      <section className="glass-card p-8 space-y-4">
        <h2 className="text-xl font-bold text-[var(--foreground)]">What is Allrounder Download?</h2>
        <p className="text-[var(--foreground-secondary)] leading-relaxed">
          Allrounder Download is a lightweight web utility designed for one purpose: making it
          easy to access publicly available media in a format that works for you. Whether you need
          a video in a specific resolution or just the audio track, our tool handles the conversion
          and delivery in a secure, temporary pipeline.
        </p>
        <p className="text-[var(--foreground-secondary)] leading-relaxed">
          We do not store your media permanently, do not bypass any DRM or access controls, and
          do not process private or restricted content. We only work with content that is publicly
          accessible and that our tools are technically and legally permitted to process.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-[var(--foreground)]">How it Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="glass-card p-5 flex gap-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[var(--primary)]/12
                flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)] text-sm">{item.title}</p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-[var(--foreground)]">Our Principles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Download, title: "Free Forever", desc: "No subscriptions, no tiers, no premium plans. Free for everyone." },
            { icon: Shield, title: "Privacy-First", desc: "We don't store your URLs or media. Temporary files are auto-deleted." },
            { icon: Clock, title: "Temporary Processing", desc: "Files are deleted automatically after 30 minutes." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-5 space-y-3 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                <Icon size={18} className="text-[var(--primary)]" />
              </div>
              <p className="font-semibold text-[var(--foreground)] text-sm">{title}</p>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Legal note */}
      <section className="glass-card p-6 border-l-4 border-l-[var(--warning)] space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[var(--warning)]" />
          <h3 className="font-semibold text-[var(--foreground)] text-sm">Important</h3>
        </div>
        <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
          Only use Allrounder Download for media you have the right or permission to download.
          The user is solely responsible for ensuring their usage complies with applicable laws
          and the terms of service of the originating platform.
        </p>
      </section>
    </div>
  );
}
