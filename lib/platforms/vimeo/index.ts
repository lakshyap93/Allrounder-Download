import { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const VIMEO_DOMAINS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];

export const VimeoAdapter: PlatformAdapter = {
  detect(url) {
    try {
      const { hostname } = new URL(url);
      return VIMEO_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    } catch { return false; }
  },

  async validate(url) {
    const pattern = /vimeo\.com\/(\d+|channels\/\w+\/\d+)/;
    if (!pattern.test(url)) {
      return { valid: false, reason: 'Please enter a valid Vimeo video URL.' };
    }
    return { valid: true };
  },

  async analyze(url) { return baseAnalyze(url, 'vimeo', 'Vimeo'); },
  async process(request) { return baseProcess(request); },
};
