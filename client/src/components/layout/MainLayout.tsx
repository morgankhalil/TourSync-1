
import React, { ReactNode } from 'react';
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar-fixed';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className={cn("flex-1 md:ml-[280px]")}>
          <Header />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
