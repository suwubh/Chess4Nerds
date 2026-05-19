import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GithubStrategy } from 'passport-github2';
import { db } from './db';

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: 'private' | 'public';
}

export function initPassport() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
  } = process.env;

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: '/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('Google account has no email'));
            }
            const user = await db.user.upsert({
              create: { email, name: profile.displayName, provider: 'GOOGLE' },
              update: { name: profile.displayName },
              where: { email },
            });
            done(null, user);
          } catch (err) {
            done(err as Error);
          }
        },
      ),
    );
  } else {
    console.warn('Google OAuth disabled: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set');
  }

  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
    passport.use(
      new GithubStrategy(
        {
          clientID: GITHUB_CLIENT_ID,
          clientSecret: GITHUB_CLIENT_SECRET,
          callbackURL: '/auth/github/callback',
        },
        async (accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const res = await fetch('https://api.github.com/user/emails', {
              headers: { Authorization: `token ${accessToken}` },
            });
            const emails = (await res.json()) as GithubEmail[];
            const primary = emails.find((e) => e.primary)?.email;
            if (!primary) {
              return done(new Error('GitHub account has no primary email'));
            }
            const user = await db.user.upsert({
              create: { email: primary, name: profile.displayName, provider: 'GITHUB' },
              update: { name: profile.displayName },
              where: { email: primary },
            });
            done(null, user);
          } catch (err) {
            done(err);
          }
        },
      ),
    );
  } else {
    console.warn('GitHub OAuth disabled: GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET not set');
  }

  passport.serializeUser((user: any, cb) => {
    process.nextTick(() => cb(null, { id: user.id, name: user.name }));
  });

  passport.deserializeUser((user: any, cb) => {
    process.nextTick(() => cb(null, user));
  });
}
