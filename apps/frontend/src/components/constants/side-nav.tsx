import { PuzzleIcon, LogInIcon, LogOutIcon, SettingsIcon, TrophyIcon, UserIcon } from 'lucide-react';

import { useThemeContext } from '@/hooks/useThemes'; // Import theme context

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL ?? 'http://localhost:3000';

export const UpperNavItems = [
  {
    title: 'Play',
    icon: PuzzleIcon,
    href: '/game/random',
    colorKey: 'boardDark',
  },
  {
    title: 'Leaderboard',
    icon: TrophyIcon,
    href: '/leaderboard',
    colorKey: 'boardDark',
  },
  {
    title: 'Profile', 
    icon: UserIcon,
    href: '/profile',
    colorKey: 'boardDark',
  },
];

export const LowerNavItems = [
  {
    title: 'Login',
    icon: LogInIcon,
    href: '/login',
    colorKey: 'boardDark',
  },
  {
    title: 'Logout',
    icon: LogOutIcon,
    href: `${BACKEND_URL}/auth/logout`,
    colorKey: 'boardDark',
  },
  {
    title: 'Settings',
    icon: SettingsIcon,
    href: '/settings',
    colorKey: 'boardDark',
  },
];

// Helper mapping function
export function getNavItemColorClass(theme: string, colorKey: string) {
  if (theme === 'pink') {
    if (colorKey === 'boardDark') return 'text-pink-400';
    // add more mappings if needed
  } else {
    if (colorKey === 'boardDark') return 'text-[#9A9484]';
  }
  return ''; // fallback
}

// Example usage inside a render function/component:
export function NavItem({ item }: { item: typeof UpperNavItems[0] }) {
  const { theme } = useThemeContext();
  const Icon = item.icon;
  const colorClass = getNavItemColorClass(theme, item.colorKey);

  return (
    <div className={colorClass}>
      <Icon />
      {item.title}
    </div>
  );
}
