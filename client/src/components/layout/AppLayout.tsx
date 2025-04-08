
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { 
  PlusCircle, 
  Calendar, 
  Music,
  Menu
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      <div className="flex flex-1 h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 border-r flex-shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <div className="md:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar onNavClick={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 items-end">
        <div className="flex gap-2">
          {activeVenue && (
            <>
              <Button size="sm" className="rounded-full shadow-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Schedule</span>
              </Button>

              <Button size="sm" className="rounded-full shadow-lg flex items-center gap-2">
                <Music className="h-4 w-4" />
                <span className="hidden sm:inline">Find Artists</span>
              </Button>

              <Button size="sm" variant="default" className="rounded-full shadow-lg flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">New Event</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
