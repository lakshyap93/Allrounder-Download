import type { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const LINKEDIN_HOSTS = new Set(['linkedin.com', 'www.linkedin.com']);
const LINKEDIN_VIDEO_PATHS = [
  /^\/posts\/[^/]+-\d+-[\w]{4}\/?$/i,
  /^\/feed\/update\/urn:li:activity:\d+\/?$/i,
];

function isLinkedInUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && LINKEDIN_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export const LinkedInAdapter: PlatformAdapter = {
  detect(url) {
    return isLinkedInUrl(url);
  },

  async validate(url) {
    if (!isLinkedInUrl(url)) {
      return { valid: false, reason: 'Please enter a linkedin.com URL.' };
    }

    const { pathname } = new URL(url);
    if (!LINKEDIN_VIDEO_PATHS.some((pattern) => pattern.test(pathname))) {
      return { valid: false, reason: 'Use a LinkedIn video post URL (/posts/… or /feed/update/urn:li:activity:…).' };
    }

    return { valid: true };
  },

  async analyze(url) { return baseAnalyze(url, 'linkedin', 'LinkedIn'); },
  async process(request) { return baseProcess(request); },
};
