import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PWARegistration } from "@/components/pwa/PWARegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Allrounder Download — Free Online Media Tools",
  description:
    "Download and convert public media from YouTube, Instagram, TikTok, Reddit and more. Free, fast, and no registration required.",
  keywords: [
    "video downloader",
    "youtube downloader",
    "free media tools",
    "download online video",
    "audio extractor",
    "allrounder download",
  ],
  authors: [{ name: "Allrounder Download" }],
  openGraph: {
    title: "Allrounder Download — Free Online Media Tools",
    description:
      "Simple online media tools for supported public content — fast, free, and easy to use.",
    url: "https://allrounderdownload.com",
    siteName: "Allrounder Download",
    images: [{ url: "/logo.png", width: 1080, height: 1080, alt: "Allrounder Download" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Allrounder Download — Free Online Media Tools",
    description: "Download. Convert. Done. Free online media tools.",
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
  metadataBase: new URL("https://allrounderdownload.com"),
  appleWebApp: {
    capable: true,
    title: "Allrounder",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        <PWARegistration />
        <Header />
        <main className="relative z-[1] flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
