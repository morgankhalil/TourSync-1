
import React from 'react';
import { Header } from './Header';
import { SidebarLayout } from './SidebarLayout';

type MainLayoutProps = {
  children: React.ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <SidebarLayout>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarLayout>
      </div>
    </div>
  );
}
