import Link from "next/link";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { href: "/", label: "Home" },
      { href: "/supported-platforms", label: "Supported Platforms" },
      { href: "/about", label: "About" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer relative z-[1] border-t">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand */}
          <div className="space-y-3">
            <span className="text-sm font-semibold text-[var(--foreground)]">Allrounder Download</span>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed max-w-xs">
              Free online media tools for supported public content. Fast, simple, and no
              registration required.
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Only process content you have the right to use.
            </p>
          </div>

          {/* Links */}
          {FOOTER_LINKS.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)]
                        transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-5 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--foreground-muted)]">
            © {new Date().getFullYear()} Allrounder Download. All rights reserved.
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            Designed &amp; Developed by{" "}
            <a
              href="https://github.com/lakshyap93"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--foreground-secondary)] underline underline-offset-4 decoration-[var(--border-hover)] hover:text-[var(--primary)] transition-colors"
            >
              Lakshya Purohit
            </a>
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            Free to use · No registration · No payments
          </p>
        </div>
      </div>
    </footer>
  );
}
