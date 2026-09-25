import { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const INSTAGRAM_DOMAINS = ['instagram.com', 'www.instagram.com'];

export const InstagramAdapter: PlatformAdapter = {
  detect(url) {
    try {
      const { hostname } = new URL(url);
      return INSTAGRAM_DOMAINS.includes(hostname);
    } catch { return false; }
  },

  async validate(url) {
    const pattern = /instagram\.com\/(p|reel|tv|stories)\/[\w-]+/;
    if (!pattern.test(url)) {
      return { valid: false, reason: 'Please enter a valid Instagram post, reel, or story URL.' };
    }
    return { valid: true };
  },

  async analyze(url) { return baseAnalyze(url, 'instagram', 'Instagram'); },
  async process(request) { return baseProcess(request); },
};
