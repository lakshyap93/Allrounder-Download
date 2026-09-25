import type { PlatformInfo } from '@/lib/platforms/types';

/** Browser-safe platform catalog used by the UI. */
export const PLATFORM_INFO: PlatformInfo[] = [
  { id: 'youtube', name: 'YouTube', label: 'YouTube', domains: ['youtube.com', 'youtu.be'], icon: 'Youtube', color: '#FF0000', description: 'Download videos and audio from YouTube.', features: ['Video download', 'Audio extraction', 'Multiple qualities'], available: true },
  { id: 'instagram', name: 'Instagram', label: 'Instagram', domains: ['instagram.com'], icon: 'Instagram', color: '#E4405F', description: 'Download public reels, posts, and stories from Instagram.', features: ['Reels', 'Posts', 'Stories'], available: true },
  { id: 'facebook', name: 'Facebook', label: 'Facebook', domains: ['facebook.com', 'fb.watch'], icon: 'Facebook', color: '#1877F2', description: 'Download public videos from Facebook.', features: ['Public videos', 'Reels'], available: true },
  { id: 'tiktok', name: 'TikTok', label: 'TikTok', domains: ['tiktok.com', 'vm.tiktok.com'], icon: 'Music2', color: '#000000', description: 'Download public TikTok videos.', features: ['Video download', 'Audio extraction'], available: true },
  { id: 'x', name: 'X', label: 'X (Twitter)', domains: ['x.com', 'twitter.com'], icon: 'Twitter', color: '#000000', description: 'Download public videos from X (formerly Twitter).', features: ['Video download', 'GIF download'], available: true },
  { id: 'reddit', name: 'Reddit', label: 'Reddit', domains: ['reddit.com', 'v.redd.it'], icon: 'MessageCircle', color: '#FF4500', description: 'Download public videos from Reddit.', features: ['Video download', 'Audio extraction'], available: true },
  { id: 'pinterest', name: 'Pinterest', label: 'Pinterest', domains: ['pinterest.com', 'pin.it'], icon: 'Pin', color: '#E60023', description: 'Download public video pins from Pinterest.', features: ['Video pins'], available: true },
  { id: 'vimeo', name: 'Vimeo', label: 'Vimeo', domains: ['vimeo.com'], icon: 'Video', color: '#1AB7EA', description: 'Download public videos from Vimeo.', features: ['Video download', 'Multiple qualities'], available: true },
  { id: 'dailymotion', name: 'Dailymotion', label: 'Dailymotion', domains: ['dailymotion.com', 'dai.ly'], icon: 'Play', color: '#0066DC', description: 'Download public videos from Dailymotion.', features: ['Video download'], available: true },
  { id: 'twitch', name: 'Twitch', label: 'Twitch', domains: ['twitch.tv', 'clips.twitch.tv'], icon: 'Tv', color: '#9146FF', description: 'Download public Twitch clips and VODs.', features: ['Clips', 'VODs'], available: true },
  { id: 'linkedin', name: 'LinkedIn', label: 'LinkedIn', domains: ['linkedin.com'], icon: 'Linkedin', color: '#0A66C2', description: 'Download publicly accessible LinkedIn video posts.', features: ['Public video posts'], available: true },
];
