import { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const X_DOMAINS = ['twitter.com', 'x.com', 'www.twitter.com', 'www.x.com', 't.co'];

export const XAdapter: PlatformAdapter = {
  detect(url) {
    try {
      const { hostname } = new URL(url);
      return X_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    } catch { return false; }
  },

  async validate(url) {
    const pattern = /(twitter|x)\.com\/\w+\/status\/\d+/;
    if (!pattern.test(url)) {
      return { valid: false, reason: 'Please enter a valid X (Twitter) post URL.' };
    }
    return { valid: true };
  },

  async analyze(url) { return baseAnalyze(url, 'x', 'X (Twitter)'); },
  async process(request) { return baseProcess(request); },
};
