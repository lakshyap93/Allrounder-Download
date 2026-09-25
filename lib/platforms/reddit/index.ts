import { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const REDDIT_DOMAINS = ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'v.redd.it'];

export const RedditAdapter: PlatformAdapter = {
  detect(url) {
    try {
      const { hostname } = new URL(url);
      return REDDIT_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    } catch { return false; }
  },

  async validate(url) {
    const pattern = /reddit\.com\/r\/\w+\/comments\/|v\.redd\.it\//;
    if (!pattern.test(url)) {
      return { valid: false, reason: 'Please enter a valid Reddit post URL.' };
    }
    return { valid: true };
  },

  async analyze(url) { return baseAnalyze(url, 'reddit', 'Reddit'); },
  async process(request) { return baseProcess(request); },
};
