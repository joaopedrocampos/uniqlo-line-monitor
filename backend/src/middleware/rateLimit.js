// Simple IP-based rate limiter for reports
// Production: 1 report per IP per 15 minutes
// Development: 10 reports per IP per 1 minute (more lenient for testing)

const rateLimitStore = new Map();
const isDev = process.env.NODE_ENV !== 'production';

const RATE_LIMIT_WINDOW = isDev ? 1 * 60 * 1000 : 15 * 60 * 1000; // 1 min dev, 15 min prod
const MAX_REQUESTS = isDev ? 10 : 1;

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export const reportRateLimit = (req, res, next) => {
  // Get client IP address
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const now = Date.now();

  // Get or create rate limit data for this IP
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, {
      count: 1,
      firstRequest: now,
    });
    console.log(`Rate limit: New IP ${ip}, allowing request`);
    return next();
  }

  const data = rateLimitStore.get(ip);
  const timeSinceFirst = now - data.firstRequest;

  // If the time window has passed, reset the counter
  if (timeSinceFirst > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ip, {
      count: 1,
      firstRequest: now,
    });
    console.log(`Rate limit: Window expired for IP ${ip}, allowing request`);
    return next();
  }

  // If within the window and under the limit, allow
  if (data.count < MAX_REQUESTS) {
    data.count++;
    console.log(`Rate limit: IP ${ip} has ${data.count}/${MAX_REQUESTS} requests`);
    return next();
  }

  // Rate limit exceeded
  const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - timeSinceFirst) / 1000 / 60);
  console.log(`Rate limit: IP ${ip} exceeded limit, ${remainingTime} minutes remaining`);

  return res.status(429).json({
    error: 'Too many reports',
    message: `You can only submit one report every 15 minutes. Please try again in ${remainingTime} minute(s).`,
    retryAfter: remainingTime,
  });
};
