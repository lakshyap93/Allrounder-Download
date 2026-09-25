import { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const TWITCH_DOMAINS = ['twitch.tv', 'www.twitch.tv', 'clips.twitch.tv'];

export const TwitchAdapter: PlatformAdapter = {
  detect(url) {
    try {
      const { hostname } = new URL(url);
      return TWITCH_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    } catch { return false; }
  },

  async validate(url) {
    const pattern = /twitch\.tv\/(videos\/\d+|[\w]+\/clip\/[\w-]+)|clips\.twitch\.tv\/[\w-]+/;
    if (!pattern.test(url)) {
      return { valid: false, reason: 'Please enter a valid Twitch clip or VOD URL.' };
    }
    return { valid: true };
  },

  async analyze(url) { return baseAnalyze(url, 'twitch', 'Twitch'); },
  async process(request) { return baseProcess(request); },
};
