import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SideNav } from '@/components/side-nav';
import { UpperNavItems, LowerNavItems } from '@/components/constants/side-nav';

import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/useSidebar';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { isOpen, toggle } = useSidebar();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const isBetweenMDAndLG = screenWidth >= 768 && screenWidth < 1024;
      if (isBetweenMDAndLG) {
        if (isOpen) {
          toggle();
        }
      } else {
        if (!isOpen) {
          toggle();
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, toggle]);
  
  return (
    <nav
      className={cn(
        `relative hidden h-screen pt-4 md:block bg-bgAuxiliary1 text-white w-16 lg:w-48 top-0 relative sticky`,
        className
      )}
    >
      <div className="flex flex-col h-full justify-between">
        <div className="flex flex-col justify-start">
          <button 
        onClick={() => navigate('/')}
        className="px-2 py-3 mb-4 flex items-center justify-center hover:text-gray-300 transition-colors cursor-pointer"
>
  <img 
    src="/logo.png" 
    alt="Chess4Nerds Logo" 
    className="w-6 h-8 lg:w-8 lg:h-12 block"
  />
    <span className="hidden lg:block text-lg font-bold leading-none">Chess4Nerds</span>
  <span className="lg:hidden text-base font-bold leading-none">C4N</span>
</button>



          <SideNav
            className="opacity-0 transition-all duration-300 group-hover:z-50  group-hover:rounded group-hover:bg-black p-1 group-hover:opacity-100"
            items={UpperNavItems}
          />
        </div>

        <div className="flex flex-col justify-end mb-2">
          <SideNav
            className="opacity-0 transition-all duration-300 group-hover:z-50  group-hover:rounded group-hover:bg-black p-1 group-hover:opacity-100"
            items={LowerNavItems}
          />
        </div>
      </div>
    </nav>
  );
}
