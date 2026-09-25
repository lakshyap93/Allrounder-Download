import { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const TIKTOK_DOMAINS = ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'm.tiktok.com'];

export const TikTokAdapter: PlatformAdapter = {
  detect(url) {
    try {
      const { hostname } = new URL(url);
      return TIKTOK_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    } catch { return false; }
  },

  async validate(url) {
    const pattern = /tiktok\.com\/@[\w.]+\/video\/\d+|vm\.tiktok\.com\/\w+/;
    if (!pattern.test(url)) {
      return { valid: false, reason: 'Please enter a valid TikTok video URL.' };
    }
    return { valid: true };
  },

  async analyze(url) { return baseAnalyze(url, 'tiktok', 'TikTok'); },
  async process(request) { return baseProcess(request); },
};
