import { Request, Response, Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { COOKIE_MAX_AGE } from '../consts';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

const CLIENT_URL = process.env.AUTH_REDIRECT_URL ?? 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (JWT_SECRET === 'your_jwt_secret') {
  console.warn('⚠️  JWT_SECRET is set to the example placeholder — use a strong, unique value.');
}

const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  maxAge: COOKIE_MAX_AGE,
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
};

// At most 20 guest accounts per minute per IP. Set RATE_LIMIT_DISABLED=true
// when running load tests that mint many tokens up front.
const guestLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

interface UserJwtClaims {
  userId: string;
  name: string;
  isGuest?: boolean;
}

interface UserDetails {
  id: string;
  token?: string;
  name: string;
  isGuest?: boolean;
}

router.post('/guest', guestLimiter, async (req: Request, res: Response) => {
  try {
    const guestUUID = `guest-${uuidv4()}`;
    const requestedName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

    const user = await db.user.create({
      data: {
        username: guestUUID,
        email: `${guestUUID}@chess4nerds.local`,
        name: requestedName || guestUUID,
        provider: 'GUEST',
      },
    });

    const token = jwt.sign(
      { userId: user.id, name: user.name, isGuest: true },
      JWT_SECRET!,
    );

    res.cookie('guest', token, cookieOptions);
    res.json({
      id: user.id,
      name: user.name!,
      token,
      isGuest: true,
    } satisfies UserDetails);
  } catch (err) {
    console.error('Guest login failed:', err);
    res.status(500).json({ success: false, message: 'Failed to create guest account' });
  }
});

router.get('/refresh', async (req: Request, res: Response) => {
  try {
    if (req.user) {
      const user = req.user as UserDetails;
      const userDb = await db.user.findFirst({ where: { id: user.id } });
      const token = jwt.sign({ userId: user.id, name: userDb?.name }, JWT_SECRET!);
      res.json({ token, id: user.id, name: userDb?.name });
      return;
    }

    if (req.cookies?.guest) {
      try {
        const decoded = jwt.verify(req.cookies.guest, JWT_SECRET!) as unknown as UserJwtClaims;
        const token = jwt.sign(
          { userId: decoded.userId, name: decoded.name, isGuest: true },
          JWT_SECRET!,
        );
        res.cookie('guest', token, cookieOptions);
        res.json({
          id: decoded.userId,
          name: decoded.name,
          token,
          isGuest: true,
        } satisfies UserDetails);
        return;
      } catch {
        res.clearCookie('guest');
      }
    }

    res.status(401).json({ success: false, message: 'Unauthorized' });
  } catch (err) {
    console.error('Refresh failed:', err);
    res.status(500).json({ success: false, message: 'Failed to refresh session' });
  }
});

router.get('/login/failed', (_req, res) => {
  res.status(401).json({ success: false, message: 'failure' });
});

router.get('/logout', (req: Request, res: Response) => {
  res.clearCookie('guest');
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      res.status(500).json({ error: 'Failed to log out' });
      return;
    }
    res.clearCookie('jwt');
    res.redirect(CLIENT_URL);
  });
});

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: CLIENT_URL,
    failureRedirect: '/login/failed',
  }),
);

router.get(
  '/github',
  passport.authenticate('github', { scope: ['read:user', 'user:email'] }),
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    successRedirect: CLIENT_URL,
    failureRedirect: '/login/failed',
  }),
);

export default router;
