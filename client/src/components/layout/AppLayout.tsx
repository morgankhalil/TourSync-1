
import React from 'react';
import { useLocation } from 'wouter';
import TopNav from './TopNav';
import ContextNav from './ContextNav';
import Sidebar from './Sidebar';
import { useActiveVenue } from '@/hooks/useActiveVenue';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();
  
  // Determine if we show context nav based on route
  const showContextNav = location.startsWith('/venue/') || 
                        location.startsWith('/tour/') ||
                        location === '/discovery';

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {showContextNav && <ContextNav />}
          
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Quick Actions Drawer - Fixed Position */}
      <div className="fixed bottom-4 right-4">
        {activeVenue && (
          <div className="flex gap-2">
            <button className="bg-primary text-white p-2 rounded-full shadow-lg">
              Quick Book
            </button>
            <button className="bg-primary text-white p-2 rounded-full shadow-lg">
              Add Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
