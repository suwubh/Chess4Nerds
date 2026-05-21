import { useThemeContext } from '@/hooks/useThemes';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/useSidebar';
import { buttonVariants } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/subnav-accordian';
import { useEffect, useState } from 'react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { type LucideIcon } from 'lucide-react';
import { useUser } from '@repo/store/src/hooks/useUser';

// Maps a nav item's colour key to a theme-aware Tailwind text colour.
export function getNavItemColorClass(theme: string, colorKey: string) {
  if (theme === 'pink') {
    if (colorKey === 'boardDark') return 'text-boardDarkpink';
  } else {
    if (colorKey === 'boardDark') return 'text-boardDark';
  }
  return '';
}

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
      {items.map((item) => {
        if (item.isChidren) {
          return (
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
                    <Link
                      key={child.title}
                      to={child.href}
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
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        }

        // External links (the backend /auth/logout URL) need a real <a>;
        // in-app routes use <Link> so navigation stays client-side.
        const isExternal = item.href.startsWith('http');
        const linkClassName = cn(
          buttonVariants({ variant: 'default' }),
          'group relative bg-transparent flex h-12 justify-start hover:bg-transparent]',
        );
        const handleClick = () => {
          if (setOpen) setOpen(false);
        };
        const linkChildren = (
          <>
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
          </>
        );

        return (
          <div
            key={item.title}
            hidden={
              (!!user && item.title === 'Login') ||
              (!user && item.title === 'Logout')
            }
          >
            {isExternal ? (
              <a href={item.href} onClick={handleClick} className={linkClassName}>
                {linkChildren}
              </a>
            ) : (
              <Link to={item.href} onClick={handleClick} className={linkClassName}>
                {linkChildren}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
