import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — Allrounder Download",
  description: "Terms of Use for Allrounder Download — acceptable use, user responsibilities, and legal disclaimers.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-[var(--foreground)]">Terms of Use</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Last updated: September 2026</p>
      </div>

      <div className="space-y-8 text-[var(--foreground-secondary)] leading-relaxed">
        <Section title="1. Acceptance">
          By using Allrounder Download, you agree to these Terms of Use. If you do not agree,
          please do not use the service. We may update these terms; continued use constitutes
          acceptance of any changes.
        </Section>

        <Section title="2. Service Description">
          Allrounder Download provides online tools for retrieving publicly accessible media
          in various formats from supported platforms. The service is provided free of charge.
        </Section>

        <Section title="3. Acceptable Use">
          You may only use Allrounder Download to process:
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Content you own or have created.</li>
            <li>Content licensed under Creative Commons or other open licenses that permit downloading.</li>
            <li>Content for which you have explicit permission from the rights holder.</li>
            <li>Content that is in the public domain.</li>
          </ul>
        </Section>

        <Section title="4. Prohibited Activities">
          You must not use Allrounder Download to:
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Download or reproduce copyrighted content without authorization.</li>
            <li>Circumvent DRM, access controls, authentication, or paywalls.</li>
            <li>Access private, restricted, or subscriber-only content.</li>
            <li>Engage in bulk or automated downloading at scale.</li>
            <li>Use the service to harass, harm, or infringe on others&apos; rights.</li>
            <li>Violate the terms of service of any originating platform.</li>
            <li>Attempt to abuse, overload, or disrupt our infrastructure.</li>
          </ul>
        </Section>

        <Section title="5. Copyright & User Responsibility">
          You are solely responsible for ensuring your use complies with all applicable laws,
          including copyright law, and the terms of service of the platform from which media
          originates. Allrounder Download does not authorize infringement and is not liable for
          any unauthorized use by users.
        </Section>

        <Section title="6. Platform Terms">
          Many platforms (e.g., YouTube, Instagram, TikTok) have their own Terms of Service
          that restrict or prohibit downloading. It is your responsibility to review and comply
          with those terms. Allrounder Download only processes content that our technology is
          capable of accessing via public means, but this does not imply permission to download
          such content under those platform&apos;s terms.
        </Section>

        <Section title="7. No Warranty">
          The service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied.
          We do not guarantee uptime, availability of any specific format, or that any particular
          URL will be processable.
        </Section>

        <Section title="8. Limitation of Liability">
          To the maximum extent permitted by law, Allrounder Download and its operators shall not
          be liable for any direct, indirect, incidental, or consequential damages arising from
          your use of the service.
        </Section>

        <Section title="9. Service Availability">
          We may modify, suspend, or terminate the service at any time without notice. We are
          not obligated to maintain the service indefinitely.
        </Section>

        <Section title="10. Governing Law">
          These terms are governed by applicable law in the jurisdiction of the service operator.
          Any disputes shall be resolved through appropriate legal channels.
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
