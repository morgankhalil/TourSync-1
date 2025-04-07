
import React, { ReactNode, useEffect } from 'react';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import { useSidebar } from '@/context/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 md:hidden"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      )}
      
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 md:z-auto h-full ${
          isSidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-200 ease-in-out w-[280px] max-w-[80vw] md:max-w-none bg-background`}
      >
        <Sidebar />
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto w-full pb-16 md:pb-0 pt-14 md:pt-0">
        {children}
      </main>

      {/* Mobile navigation */}
      {isMobile && <MobileNavigation />}
    </div>
  );
}
