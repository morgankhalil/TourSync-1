import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-50 md:z-auto h-full ${
          isSidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-200 ease-in-out`}
      >
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}