import { PuzzleIcon, LogInIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
import { useThemeContext } from '@/hooks/useThemes';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/useSidebar';
import { buttonVariants } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/subnav-accordian';
import { useEffect, useState } from 'react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { type LucideIcon } from 'lucide-react';
import { useUser } from '@repo/store/useUser';

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL ?? 'http://localhost:3000';

// ----------------------
// Nav Items
// ----------------------
export const UpperNavItems = [
  {
    title: 'Play',
    icon: PuzzleIcon,
    href: '/game/random',
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

// ----------------------
// Color helper
// ----------------------
export function getNavItemColorClass(theme: string, colorKey: string) {
  if (theme === 'pink') {
    if (colorKey === 'boardDark') return 'text-boardDarkpink';
  } else {
    if (colorKey === 'boardDark') return 'text-boardDark';
  }
  return '';
}

// ----------------------
// Nav Item Component
// ----------------------
export function NavItem({ item }: { item: typeof UpperNavItems[0] }) {
  const { theme } = useThemeContext();
  const Icon = item.icon;
  const colorClass = getNavItemColorClass(theme, item.colorKey);

  return (
    <a href={item.href} className={`flex items-center gap-2`}>
      <Icon className={cn('h-5 w-5', colorClass)} />
      <span>{item.title}</span>
    </a>
  );
}

// ----------------------
// Side Nav Component
// ----------------------
export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  colorKey?: string;
  isChidren?: boolean;
  children?: NavItem[];
}

interface SideNavProps {
  items: NavItem[];
  setOpen?: (open: boolean) => void;
  className?: string;
}

export function SideNav({ items, setOpen, className }: SideNavProps) {
  const { theme } = useThemeContext();
  const user = useUser();
  const location = useLocation();
  const { isOpen } = useSidebar();
  const [openItem, setOpenItem] = useState('');
  const [lastOpenItem, setLastOpenItem] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOpenItem(lastOpenItem);
    } else {
      setLastOpenItem(openItem);
      setOpenItem('');
    }
  }, [isOpen]);

  return (
    <nav className="dark">
      {items.map((item) =>
        item.isChidren ? (
          <Accordion
            type="single"
            collapsible
            className="space-y-2"
            key={item.title}
            value={openItem}
            onValueChange={setOpenItem}
          >
            <AccordionItem value={item.title} className="border-none">
              <AccordionTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'group relative flex h-12 justify-between px-4 py-2 text-base duration-200 hover:bg-muted hover:no-underline',
                )}
              >
                <div>
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      getNavItemColorClass(theme, item.colorKey ?? 'boardDark'),
                    )}
                  />
                </div>
                <div
                  className={cn(
                    'absolute left-12 text-base duration-200 ',
                    !isOpen && className,
                  )}
                >
                  {item.title}
                </div>

                {isOpen && (
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                )}
              </AccordionTrigger>
              <AccordionContent className="mt-2 space-y-4 pb-1">
                {item.children?.map((child) => (
                  <a
                    key={child.title}
                    href={child.href}
                    onClick={() => {
                      if (setOpen) setOpen(false);
                    }}
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      'group relative flex h-12 justify-start gap-x-3',
                      location.pathname === child.href &&
                        'bg-muted font-bold hover:bg-muted',
                    )}
                  >
                    <child.icon
                      className={cn(
                        'h-5 w-5',
                        getNavItemColorClass(theme, child.colorKey ?? 'boardDark'),
                      )}
                    />
                    <div
                      className={cn(
                        'absolute left-12 text-base duration-200',
                        !isOpen && className,
                      )}
                    >
                      {child.title}
                    </div>
                  </a>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <div
            key={item.title}
            hidden={
              (user && item.title == 'Login') ||
              (!user && item.title == 'Logout')
                ? true
                : false
            }
          >
            <a
              href={item.href}
              onClick={() => {
                if (setOpen) setOpen(false);
              }}
              className={cn(
                buttonVariants({ variant: 'default' }),
                'group relative bg-transparent flex h-12 justify-start hover:bg-transparent]',
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5',
                  getNavItemColorClass(theme, item.colorKey ?? 'boardDark'),
                )}
              />
              <span
                className={cn(
                  'absolute left-12 text-white text-base duration-200',
                  !isOpen && className,
                )}
              >
                {item.title}
              </span>
            </a>
          </div>
        ),
      )}
    </nav>
  );
}
