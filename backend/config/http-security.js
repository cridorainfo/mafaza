/**
 * Production HTTP hardening: CORS allowlist, Helmet, rate limits.
 * Keep logic configurable via env; no business rules here.
 */

const rateLimit = require('express-rate-limit');

function parseAllowedOrigins() {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      try {
        const u = new URL(entry);
        return `${u.protocol}//${u.host}`;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  if (fromEnv.length > 0) {
    return fromEnv;
  }
  const appUrl = process.env.APP_URL;
  if (!appUrl) return [];
  try {
    const u = new URL(appUrl);
    return [`${u.protocol}//${u.host}`];
  } catch {
    return [];
  }
}

function corsOptions() {
  const allowed = parseAllowedOrigins();
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (!isProduction) {
        return callback(null, true);
      }
      if (allowed.length === 0) {
        return callback(new Error('CORS: set APP_URL or CORS_ORIGINS in production'));
      }
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      console.error(
        '[mafaza-api] CORS rejected request. Origin:',
        origin,
        '| Allowed:',
        allowed.length ? allowed.join(', ') : '(none — set APP_URL or CORS_ORIGINS to your site URL, e.g. https://your-service.up.railway.app)'
      );
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
  };
}

function helmetOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const disableCsp = process.env.HELMET_CSP === 'false';

  if (!isProduction || disableCsp) {
    return {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    };
  }

  return {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'connect-src': ["'self'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  };
}

function apiLimiter() {
  return rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  });
}

function authLimiter() {
  return rateLimit({
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again later.' },
  });
}

function postOnly(middleware) {
  return (req, res, next) => {
    if (req.method !== 'POST') return next();
    return middleware(req, res, next);
  };
}

module.exports = {
  corsOptions,
  helmetOptions,
  apiLimiter,
  authLimiter,
  postOnly,
};
