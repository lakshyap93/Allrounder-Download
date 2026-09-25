import { PlatformAdapter } from '@/lib/platforms/types';
import { baseAnalyze, baseProcess } from '@/lib/platforms/base-ytdlp';

const YOUTUBE_DOMAINS = ['youtube.com', 'youtu.be', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/i;

function singleVideoUrl(rawUrl: string): string {
  const videoId = rawUrl.match(YOUTUBE_REGEX)?.[1];
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : rawUrl;
}

export const YouTubeAdapter: PlatformAdapter = {
  detect(url) {
    try {
      const { hostname } = new URL(url);
      return YOUTUBE_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    } catch { return false; }
  },

  async validate(url) {
    if (!YOUTUBE_REGEX.test(url)) {
      return { valid: false, reason: 'Please enter a valid YouTube video URL.' };
    }
    return { valid: true };
  },

  async analyze(url) {
    // Ignore playlist/mix parameters so yt-dlp extracts just the requested video.
    return baseAnalyze(singleVideoUrl(url), 'youtube', 'YouTube');
  },

  async process(request) {
    return baseProcess({ ...request, url: singleVideoUrl(request.url) });
  },
};
