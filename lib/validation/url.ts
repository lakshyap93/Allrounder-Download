/**
 * URL Validation and Normalization
 * Validates, normalizes, and extracts platform-relevant info from user-provided URLs.
 */

import { validateSSRF } from '@/lib/security/ssrf';
import { PLATFORM_INFO } from '@/lib/platforms/info';

export interface URLValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
  hostname?: string;
}

const MAX_URL_LENGTH = 2048;

/**
 * Sanitize and normalize a URL string.
 */
export function normalizeURL(raw: string): string {
  let url = raw.trim();
  // Add https:// if scheme is missing
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Full URL validation with SSRF protection.
 */
export async function validateURL(raw: string): Promise<URLValidationResult> {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, error: 'Please enter a URL.' };
  }

  if (raw.length > MAX_URL_LENGTH) {
    return { valid: false, error: 'URL is too long.' };
  }

  const normalized = normalizeURL(raw);

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { valid: false, error: 'Please enter a valid URL.' };
  }

  // Only allow http/https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are supported.' };
  }

  // Hostname must be present
  if (!parsed.hostname || parsed.hostname.length < 2) {
    return { valid: false, error: 'URL is missing a valid domain.' };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: 'URLs containing usernames or passwords are not supported.' };
  }

  const expectedPort = parsed.protocol === 'https:' ? '443' : '80';
  if (parsed.port && parsed.port !== expectedPort) {
    return { valid: false, error: 'Custom URL ports are not supported.' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const supportedHost = PLATFORM_INFO.some((platform) =>
    platform.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
  );
  if (!supportedHost) {
    return { valid: false, error: 'This platform is not currently supported.' };
  }

  // SSRF protection
  const ssrfCheck = await validateSSRF(normalized);
  if (!ssrfCheck.safe) {
    return { valid: false, error: 'This URL is not accessible.' };
  }

  return {
    valid: true,
    normalized,
    hostname: parsed.hostname,
  };
}
