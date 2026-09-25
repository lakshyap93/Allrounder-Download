import { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const DAILYMOTION_DOMAINS = ['dailymotion.com', 'www.dailymotion.com', 'dai.ly'];

export const DailymotionAdapter: PlatformAdapter = {
  detect(url) {
    try {
      const { hostname } = new URL(url);
      return DAILYMOTION_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    } catch { return false; }
  },

  async validate(url) {
    const pattern = /dailymotion\.com\/video\/[\w]+|dai\.ly\/[\w]+/;
    if (!pattern.test(url)) {
      return { valid: false, reason: 'Please enter a valid Dailymotion video URL.' };
    }
    return { valid: true };
  },

  async analyze(url) { return baseAnalyze(url, 'dailymotion', 'Dailymotion'); },
  async process(request) { return baseProcess(request); },
};
