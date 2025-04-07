import React, { ReactNode, useEffect } from 'react';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import { useSidebar } from '@/context/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { isSidebarOpen, closeSidebar, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  // Close sidebar when switching to mobile view
  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [isMobile, closeSidebar]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 md:hidden bg-background"
        >
          <Menu size={24} />
        </Button>
      )}

      {/* Sidebar with mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile ? 'fixed' : 'relative'} 
          left-0 top-0 bottom-0 
          ${isMobile ? 'z-50' : ''} 
          transform transition-transform duration-300 ease-in-out 
          w-[280px] bg-background
          ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>

      {/* Mobile navigation */}
      {isMobile && <MobileNavigation />}
    </div>
  );
}