"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { logo: 44, text: "text-lg" },
  md: { logo: 40, text: "text-xl" },
  lg: { logo: 56, text: "text-2xl" },
};

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const s = sizes[size];
  return (
    <Link
      href="/"
      className={`flex items-center gap-3 group focus-visible:outline-none ${className}`}
      aria-label="Allrounder Download — Home"
    >
      <div
        className="relative flex-shrink-0 rounded-lg overflow-hidden"
        style={{ width: s.logo, height: s.logo }}
      >
        <Image
          src="/logo.png"
          alt="Allrounder Download Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span
          className={`font-bold tracking-tight leading-tight ${s.text} text-[var(--foreground)] group-hover:opacity-90 transition-opacity`}
        >
          <span className="text-[var(--foreground)]">Allrounder</span>{" "}
          <span className="text-[var(--primary)]">Download</span>
        </span>
      )}
    </Link>
  );
}
