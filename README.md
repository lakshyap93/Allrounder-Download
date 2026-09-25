# Allrounder Download

> **Download. Convert. Done.**
>
> A free, open online media utility for retrieving publicly accessible media from supported platforms — no account, no payment, no DRM bypass.

---

## Features

- 🎯 **11 Supported Platforms** — YouTube, Instagram, Facebook, TikTok, X, Reddit, Pinterest, Vimeo, Dailymotion, Twitch, LinkedIn
- 🎬 **Multiple Formats** — Video in various qualities (360p to 1080p+) and audio extraction (MP3, M4A)
- ⚡ **Fast Analysis** — Instant metadata retrieval and format listing
- 🔒 **Secure** — SSRF protection, rate limiting, input validation, secure headers
- 🧹 **Privacy-Respecting** — No permanent storage; temporary files auto-deleted after 30 minutes
- 🎨 **Clean Light Theme** — Simple white pages with clear, readable layouts
- 📱 **Fully Responsive** — Works great on mobile, tablet, and desktop
- 🆓 **Free Forever** — No subscriptions, no accounts, no payment gateway

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Animations | CSS transitions |
| Media Processing | yt-dlp + FFmpeg |
| Job Queue | In-memory |
| Temp Storage | Local filesystem (S3-compatible for production) |
| Theme | Fixed light theme |

---

## Architecture

```
app/
├── page.tsx                    # Homepage (URL input + result flow)
├── about/page.tsx
├── supported-platforms/page.tsx
├── privacy/page.tsx
├── terms/page.tsx
├── robots.ts
├── sitemap.ts
└── api/
    ├── analyze/route.ts        # POST — URL validation + metadata retrieval
    ├── process/route.ts        # POST — Start download job
    ├── job/[id]/route.ts       # GET  — Poll job status
    ├── download/[id]/route.ts  # GET  — Stream file to user

lib/
├── platforms/
│   ├── types.ts                # Shared adapter interfaces
│   ├── registry.ts             # Platform adapter registry
│   ├── base-ytdlp.ts           # Base yt-dlp implementation
│   ├── youtube/
│   ├── instagram/
│   ├── facebook/
│   ├── tiktok/
│   ├── x/
│   ├── reddit/
│   ├── pinterest/
│   ├── vimeo/
│   ├── dailymotion/
│   ├── twitch/
│   └── linkedin/
├── security/ssrf.ts            # SSRF protection
├── validation/url.ts           # URL validation + normalization
├── rate-limit/index.ts         # IP-based rate limiting
├── queue/index.ts              # In-memory job manager
├── storage/temporary-media.ts  # Temporary media storage helpers
└── utils.ts                    # Utility functions

components/
├── layout/Header.tsx
├── layout/Footer.tsx
├── ui/Logo.tsx
├── ui/ErrorMessage.tsx
├── features/URLInput.tsx
├── features/PlatformCard.tsx
├── features/MediaPreview.tsx
├── features/FormatSelector.tsx
├── features/ProcessingStatus.tsx
```

## Quick Start

### Prerequisites

- Node.js 20+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed and available in PATH
- FFmpeg (install with `winget install yt-dlp.FFmpeg`; the app auto-detects the WinGet executable on Windows)

### Install yt-dlp

```bash
# Windows
winget install yt-dlp

# macOS
brew install yt-dlp

# Linux
pip install yt-dlp
```

### Install FFmpeg

```bash
# Windows
winget install Gyan.FFmpeg

# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```

### Setup

```bash
# Clone / open the project
cd "Allrounder Download"

# Install dependencies (Windows PowerShell)
npm.cmd install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your settings

# Start development server (Windows PowerShell)
npm.cmd run dev
```

On macOS or Linux, use `npm install` and `npm run dev`. Restart the development server after installing yt-dlp and FFmpeg. Python is not required when the standalone yt-dlp executable is installed.

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

See [`.env.example`](.env.example) for all variables. Key ones:

| Variable | Description | Required |
|---|---|---|
| `YTDLP_PATH` | Path to yt-dlp binary | Yes (or in PATH) |
| `FFMPEG_PATH` | Optional FFmpeg binary override; WinGet install is auto-detected on Windows | No |
| `TEMP_DIR` | Temp file directory | No (defaults to the operating system temp directory) |
| `REDIS_URL` | Redis URL for production queue | No (uses in-memory) |

---

## Production Deployment

### 1. Build

```bash
npm run build
npm start
```

### 2. Redis (for production job queue)

Install and run Redis:
```bash
# Docker
docker run -d -p 6379:6379 redis:alpine

# Set REDIS_URL=redis://localhost:6379 in .env.local
```

Then swap the in-memory queue in `lib/queue/index.ts` with the BullMQ implementation (commented reference in file).

### 3. Security Checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Ensure yt-dlp and FFmpeg are installed on the server
- [ ] Configure Redis for persistent job storage
- [ ] Set up TEMP_DIR on a fast, non-persistent disk partition
- [ ] Set up a cron/cleanup worker to purge old temp files
- [ ] Configure HTTPS (Nginx/Cloudflare)
- [ ] Review rate limit thresholds for your expected traffic

---

## Adding a New Platform

1. Create `lib/platforms/<platform>/index.ts`
2. Implement the `PlatformAdapter` interface (detect, validate, analyze, process)
3. Add `PlatformInfo` and import the adapter in `lib/platforms/registry.ts`
4. Add remote image patterns to `next.config.ts`

---

## Legal Notes

- This tool only processes publicly accessible content via technical means that are permitted.
- It does **not** bypass DRM, authentication, access controls, or anti-bot measures.
- Users are solely responsible for ensuring their downloads comply with applicable law and platform terms of service.
- See [Terms of Use](/terms) and [Privacy Policy](/privacy) for full details.

---

## License

MIT — see LICENSE for details.
