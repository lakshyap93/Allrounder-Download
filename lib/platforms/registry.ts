/** Server-side registry maps platform metadata to its download adapter. */
import type { PlatformAdapter, PlatformInfo } from '@/lib/platforms/types';
import { PLATFORM_INFO } from '@/lib/platforms/info';
import { YouTubeAdapter } from '@/lib/platforms/youtube';
import { InstagramAdapter } from '@/lib/platforms/instagram';
import { FacebookAdapter } from '@/lib/platforms/facebook';
import { TikTokAdapter } from '@/lib/platforms/tiktok';
import { XAdapter } from '@/lib/platforms/x';
import { RedditAdapter } from '@/lib/platforms/reddit';
import { PinterestAdapter } from '@/lib/platforms/pinterest';
import { VimeoAdapter } from '@/lib/platforms/vimeo';
import { DailymotionAdapter } from '@/lib/platforms/dailymotion';
import { TwitchAdapter } from '@/lib/platforms/twitch';
import { LinkedInAdapter } from '@/lib/platforms/linkedin';

interface RegisteredPlatform {
  info: PlatformInfo;
  adapter: PlatformAdapter;
}

const ADAPTERS: Record<string, PlatformAdapter> = {
  youtube: YouTubeAdapter,
  instagram: InstagramAdapter,
  facebook: FacebookAdapter,
  tiktok: TikTokAdapter,
  x: XAdapter,
  reddit: RedditAdapter,
  pinterest: PinterestAdapter,
  vimeo: VimeoAdapter,
  dailymotion: DailymotionAdapter,
  twitch: TwitchAdapter,
  linkedin: LinkedInAdapter,
};

const PLATFORMS: RegisteredPlatform[] = PLATFORM_INFO.map((info) => ({
  info,
  adapter: ADAPTERS[info.id],
}));

export function detectPlatform(url: string): RegisteredPlatform | null {
  for (const platform of PLATFORMS) {
    if (platform.adapter.detect(url)) return platform;
  }
  return null;
}

export function getAllPlatforms(): PlatformInfo[] {
  return PLATFORM_INFO;
}

export function getPlatformById(id: string): RegisteredPlatform | null {
  return PLATFORMS.find((platform) => platform.info.id === id) || null;
}
