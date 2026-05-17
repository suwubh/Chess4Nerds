import { atom, selector } from 'recoil';

const BACKEND_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_APP_BACKEND_URL) ||
  'http://localhost:3000';

export interface User {
  id: string;
  name: string;
  token: string;
  isGuest?: boolean;
}

export const userAtom = atom<User | null>({
  key: 'user',
  default: selector<User | null>({
    key: 'user/default',
    get: async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (response.ok) {
          return (await response.json()) as User;
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      }
      return null;
    },
  }),
});
