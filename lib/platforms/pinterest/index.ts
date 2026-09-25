import { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const PINTEREST_DOMAINS = ['pinterest.com', 'www.pinterest.com', 'pin.it'];

export const PinterestAdapter: PlatformAdapter = {
  detect(url) {
    try {
      const { hostname } = new URL(url);
      return PINTEREST_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    } catch { return false; }
  },

  async validate(url) {
    const pattern = /pinterest\.com\/pin\/\d+|pin\.it\/\w+/;
    if (!pattern.test(url)) {
      return { valid: false, reason: 'Please enter a valid Pinterest pin URL.' };
    }
    return { valid: true };
  },

  async analyze(url) { return baseAnalyze(url, 'pinterest', 'Pinterest'); },
  async process(request) { return baseProcess(request); },
};
