import crypto from 'crypto';

// Reporters are identified only by a keyed hash of their IP that rotates daily,
// so raw IPs are never stored or logged and hashes can't be linked across days.
// Without IP_HASH_SECRET a random per-process key is used (hashes reset on restart).
let fallbackSecret;

function getSecret() {
  if (process.env.IP_HASH_SECRET) {
    return process.env.IP_HASH_SECRET;
  }
  fallbackSecret ??= crypto.randomBytes(32).toString('hex');
  return fallbackSecret;
}

export function getClientIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
}

export function hashIp(ip, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return crypto.createHmac('sha256', getSecret()).update(`${day}:${ip}`).digest('hex');
}

export function getClientHash(req) {
  return hashIp(getClientIp(req));
}
