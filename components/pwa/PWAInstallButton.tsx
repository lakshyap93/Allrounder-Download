"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => {
      const standalone = displayMode.matches ||
        ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
      setInstalled(standalone);
      if (standalone) setPromptEvent(null);
    };

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    displayMode.addEventListener("change", updateInstalled);
    window.requestAnimationFrame(updateInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      displayMode.removeEventListener("change", updateInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (!promptEvent) {
      setHelpOpen((open) => !open);
      return;
    }
    setBusy(true);
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPromptEvent(null);
    } catch {
      setHelpOpen(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={install}
        disabled={busy}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-70 sm:h-10 sm:px-4"
        aria-expanded={helpOpen}
        aria-label="Install Allrounder Download"
      >
        <Download size={16} aria-hidden="true" />
        <span>Install app</span>
      </button>
      {helpOpen && (
        <div className="absolute right-0 top-full z-[60] mt-3 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-secondary)] shadow-xl" role="status">
          <div className="mb-2 flex items-center justify-between gap-3 font-semibold text-[var(--foreground)]">
            Install Allrounder Download
            <button type="button" onClick={() => setHelpOpen(false)} aria-label="Close install instructions" className="rounded p-1 hover:bg-[var(--surface-hover)]">
              <X size={16} />
            </button>
          </div>
          <p>Browser menu kholen aur “Install app” ya “Add to Home Screen” select karein. iPhone par Share button → “Add to Home Screen” tap karein.</p>
        </div>
      )}
    </div>
  );
}
