
import React from 'react';
import { useLocation } from 'wouter';
import TopNav from './TopNav';
import ContextNav from './ContextNav';
import Sidebar from './Sidebar';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { useSidebar } from '@/context/SidebarContext';
import { Menu, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();
  const { isSidebarOpen, openSidebar } = useSidebar();
  
  // Determine if we show context nav based on route
  const showContextNav = location.startsWith('/venue/') || 
                        location.startsWith('/tour/') ||
                        location === '/discovery';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Mobile sidebar toggle and breadcrumb */}
          <div className="md:hidden flex items-center border-b p-2">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={openSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="text-sm font-medium">
              {activeVenue ? activeVenue.name : 'Venue Connect'}
            </div>
          </div>
          
          {/* Context Navigation (optional) */}
          {showContextNav && <ContextNav />}
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Quick Action Buttons */}
      {activeVenue && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-3">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-primary shadow-lg text-white font-bold"
            asChild
          >
            <Link href="/performances/add">
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-primary shadow-lg text-white font-bold"
            asChild
          >
            <Link href="/calendar/manage">
              <Calendar className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
