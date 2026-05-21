import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';

import authRoute from './router/auth';
import leaderboardRoutes from './router/leaderboard';
import gameHistoryRoutes from './router/gameHistory';
import { initPassport } from './passport';
import { COOKIE_MAX_AGE } from './consts';

// Safety net: log stray errors instead of letting one bad request crash the server.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const COOKIE_SECRET = process.env.COOKIE_SECRET;
if (!COOKIE_SECRET) {
  throw new Error('COOKIE_SECRET environment variable is required');
}

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

const isProd = process.env.NODE_ENV === 'production';

// OAuth (and the server-side sessions it needs) is only enabled when provider
// credentials are present. Guest login is stateless — it uses a JWT cookie.
const oauthEnabled =
  (!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET) ||
  (!!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET);

const app = express();

if (isProd) {
  // Render terminates TLS at its proxy; trust it so Secure cookies work.
  app.set('trust proxy', 1);
}

app.use(helmet());
// Cap request bodies — every endpoint only ever receives small JSON payloads.
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

initPassport();

// Sessions exist purely to carry the user through the OAuth handshake, so they
// are only mounted when OAuth is configured. With OAuth off there is no session
// store at all — nothing to leak, nothing to scale.
if (oauthEnabled) {
  app.use(
    session({
      secret: COOKIE_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: COOKIE_MAX_AGE,
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
} else {
  app.use(passport.initialize());
  console.log('OAuth not configured — running with guest auth only (no sessions).');
}

app.use(
  cors({
    origin: allowedOrigins,
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  }),
);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/games', gameHistoryRoutes);
app.use('/auth', authRoute);

// Centralised error handler so a thrown error returns JSON instead of crashing.
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('Unhandled route error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  },
);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
