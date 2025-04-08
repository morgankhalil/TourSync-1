import React from 'react';
import { Link } from 'wouter';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { 
  Calendar, 
  Search, 
  Map, 
  Settings,
  Bell
} from 'lucide-react';

export default function TopNav() {
  const { activeVenue } = useActiveVenue();

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-full mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <a className="font-bold text-xl">TourSync</a>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard">
              <a className="text-sm font-medium">Dashboard</a>
            </Link>
            <Link href="/calendar">
              <a className="text-sm font-medium">Calendar</a>
            </Link>
            <Link href="/discovery">
              <a className="text-sm font-medium">Discovery</a>
            </Link>
            <Link href="/tours">
              <a className="text-sm font-medium">Tours</a>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-accent rounded-full">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-full">
            <Bell className="h-5 w-5" />
          </button>

          {activeVenue && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
              <span className="text-sm font-medium">{activeVenue.name}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}