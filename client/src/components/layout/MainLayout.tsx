import React, { ReactNode } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { Header } from './Header';
import { SidebarProvider } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar className="h-screen" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6 pb-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}