/**
 * SSRF Protection
 * Blocks requests to private/internal IP ranges, localhost, and cloud metadata endpoints.
 */

import { URL } from 'url';
import { isIP } from 'node:net';
import * as dns from 'dns/promises';

// Private IP ranges (CIDR notation represented as checks)
const PRIVATE_IP_PATTERNS = [
  /^0\./,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/, // Link-local / AWS metadata
  /^100\.(6[4-9]|[78]\d|9\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, // Shared address space
  /^192\.0\.0\./,
  /^192\.0\.2\./, // Documentation
  /^192\.88\.99\./,
  /^198\.(18|19)\./, // Benchmarking
  /^198\.51\.100\./, // Documentation
  /^203\.0\.113\./, // Documentation
  /^(22[4-9]|23\d|24\d|25[0-5])\./, // Multicast and reserved
  /^::1$/, // IPv6 loopback
  /^fc00:/i, // IPv6 unique local
  /^fd[0-9a-f]{2}:/i, // IPv6 unique local
  /^fe80:/i, // IPv6 link-local
  /^ff/i, // IPv6 multicast
  /^2001:db8:/i, // IPv6 documentation
];

// Cloud metadata endpoints
const BLOCKED_HOSTS = [
  '169.254.169.254', // AWS/GCP/Azure metadata
  'metadata.google.internal',
  'metadata.internal',
  'fd00:ec2::254',
];

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export interface SSRFCheckResult {
  safe: boolean;
  reason?: string;
}

function isPrivateIP(ip: string): boolean {
  const normalized = ip.toLowerCase();
  const mappedV4 = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (mappedV4) return isPrivateIP(mappedV4);
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isBlockedHost(host: string): boolean {
  return BLOCKED_HOSTS.some(
    (blocked) =>
      host === blocked ||
      host.endsWith(`.${blocked}`)
  );
}

export async function validateSSRF(urlString: string): Promise<SSRFCheckResult> {
  let parsed: URL;

  try {
    parsed = new URL(urlString);
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { safe: false, reason: `Protocol "${parsed.protocol}" is not allowed` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Supported media sources use DNS names. Reject all IP literals so encoded,
  // mapped, or reserved IP ranges cannot be used to reach internal services.
  if (isIP(hostname.replace(/^\[|\]$/g, ''))) {
    return { safe: false, reason: 'IP address URLs are not allowed' };
  }

  // Localhost checks
  if (
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    hostname === '[::]' ||
    hostname === '[::1]' ||
    hostname === '::1'
  ) {
    return { safe: false, reason: 'Localhost URLs are not allowed' };
  }

  // Blocked host check
  if (isBlockedHost(hostname)) {
    return { safe: false, reason: 'This host is not accessible' };
  }

  // Direct IP check
  if (isPrivateIP(hostname)) {
    return { safe: false, reason: 'Private IP addresses are not allowed' };
  }

  // Resolve both address families and reject the host if either answer is private.
  try {
    const answers = await Promise.allSettled([dns.resolve4(hostname), dns.resolve6(hostname)]);
    const addresses = answers.flatMap((answer) => answer.status === 'fulfilled' ? answer.value : []);
    if (addresses.length === 0) {
      return { safe: false, reason: 'Could not resolve the URL hostname' };
    }

    for (const address of addresses) {
      if (isPrivateIP(address)) {
        return {
          safe: false,
          reason: 'URL resolves to a private IP address',
        };
      }
      if (isBlockedHost(address)) {
        return { safe: false, reason: 'URL resolves to a blocked host' };
      }
    }
  } catch {
    // DNS resolution failed — treat as potentially unsafe
    return { safe: false, reason: 'Could not resolve the URL hostname' };
  }

  return { safe: true };
}
