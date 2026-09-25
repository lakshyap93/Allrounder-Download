import { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const FB_DOMAINS = ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch', 'fb.com'];

export const FacebookAdapter: PlatformAdapter = {
  detect(url) {
    try {
      const { hostname } = new URL(url);
      return FB_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    } catch { return false; }
  },

  async validate(url) {
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
      return { valid: false, reason: 'Please enter a valid Facebook video URL.' };
    }
    return { valid: true };
  },

  async analyze(url) { return baseAnalyze(url, 'facebook', 'Facebook'); },
  async process(request) { return baseProcess(request); },
};
