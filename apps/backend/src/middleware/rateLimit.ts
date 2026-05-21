import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

// A small in-memory rate limiter: allows at most `max` requests per `windowMs`
// per client IP. Good enough for a single-instance deployment — a horizontally
// scaled backend would need a shared (e.g. Redis-backed) store instead.
// Set RATE_LIMIT_DISABLED=true to turn it off (useful for load testing).
export function rateLimit({ windowMs, max }: RateLimitOptions) {
  if (process.env.RATE_LIMIT_DISABLED === 'true') {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodically drop expired buckets so the map doesn't grow forever.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (now > entry.resetAt) hits.delete(ip);
    }
  }, windowMs);
  sweep.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      res.status(429).json({ success: false, message: 'Too many requests, please slow down.' });
      return;
    }

    entry.count++;
    next();
  };
}
