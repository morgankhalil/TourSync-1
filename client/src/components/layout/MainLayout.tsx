
import React, { ReactNode } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { Header } from './Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          {/* Sidebar content */}
        </Sidebar>
        <main className="flex-1">
          <Header />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
