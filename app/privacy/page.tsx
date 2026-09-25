import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Allrounder Download",
  description: "How Allrounder Download handles your data and protects your privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-[var(--foreground)]">Privacy Policy</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Last updated: September 2026</p>
      </div>

      <div className="space-y-8 text-[var(--foreground-secondary)] leading-relaxed">
        <Section title="1. Overview">
          Allrounder Download is committed to protecting your privacy. This policy explains what
          information we collect, how we use it, and how we protect it. We collect the minimum
          data necessary to provide the service.
        </Section>

        <Section title="2. Information We Collect">
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong className="text-[var(--foreground)]">IP Address:</strong> Used solely for
              rate limiting and abuse prevention. Not stored permanently.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">URLs you submit:</strong> Used to
              process your request. Not stored after processing completes.
            </li>
          </ul>
        </Section>

        <Section title="3. Temporary File Processing">
          Media files processed by Allrounder Download are stored temporarily on our servers
          for up to 30 minutes to allow you to complete your download. Files are automatically
          deleted after this period. We do not retain downloaded media content.
        </Section>

        <Section title="4. Cookies & Local Storage">
          We do not save a color theme preference or use tracking cookies.
          We do not use tracking cookies or third-party advertising cookies.
        </Section>

        <Section title="5. Analytics">
          We may use privacy-respecting analytics (no personal identifiers, no cross-site
          tracking) to understand aggregate usage patterns and improve the service. If enabled,
          it will be disclosed here with the specific provider used.
        </Section>

        <Section title="6. Third-Party Services">
          We use yt-dlp and FFmpeg to process permitted public media. We do not share your
          submitted URLs with advertising networks or data brokers.
        </Section>

        <Section title="7. Data Retention">
          We do not maintain databases of user activity. Rate-limiting data (IP counters) is
          held in memory for 60 minutes and not persisted to disk.
        </Section>

        <Section title="8. Your Rights">
          You have the right to know what information we hold about you and to request its
          deletion. Since we do not store personal data beyond what is described above, there
          is typically nothing to delete.
        </Section>

        <Section title="9. Children's Privacy">
          Allrounder Download is not directed at children under 13. We do not knowingly collect
          personal information from children.
        </Section>

        <Section title="10. Changes">
          We may update this policy from time to time. Changes will be reflected on this page
          with an updated date.
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}
