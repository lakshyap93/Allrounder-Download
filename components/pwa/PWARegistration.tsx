"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Next's dev server rewrites assets and injects the error overlay at runtime;
    // do not let the production offline cache interfere with localhost development.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => caches.keys())
        .then((keys) => Promise.all(
          keys.filter((key) => key.startsWith("allrounder-shell-")).map((key) => caches.delete(key))
        ))
        .catch((error: unknown) => console.warn("Could not clear the development service worker:", error));
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error: unknown) => console.error("Service worker registration failed:", error));
  }, []);

  return null;
}
