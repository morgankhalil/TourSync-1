import React from 'react';
import { Header } from './Header';
import { SidebarLayout } from './SidebarLayout';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <SidebarLayout>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarLayout>
      </div>
    </div>
  );
}

export { MainLayout };