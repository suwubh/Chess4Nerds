import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';

import authRoute from './router/auth';
import leaderboardRoutes from './router/leaderboard';
import gameHistoryRoutes from './router/gameHistory';
import { initPassport } from './passport';
import { COOKIE_MAX_AGE } from './consts';

const COOKIE_SECRET = process.env.COOKIE_SECRET;
if (!COOKIE_SECRET) {
  throw new Error('COOKIE_SECRET environment variable is required');
}

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: COOKIE_MAX_AGE },
  }),
);

initPassport();
app.use(passport.initialize());
app.use(passport.session());

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

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
