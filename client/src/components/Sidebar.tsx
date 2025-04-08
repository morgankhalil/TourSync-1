import React from 'react';
import { Link, useLocation } from 'wouter';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';
import { 
  LayoutDashboard, 
  Music, 
  Calendar, 
  Users, 
  Map, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Handshake,
  Search,
  MessageSquare,
  Building,
  Route
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { activeVenueId, venueData } = useActiveVenue();
  const { isOpen, toggle } = useSidebar();
  const isMobile = useMobile();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
    },
    {
      name: 'Artist Discovery',
      icon: Search,
      path: '/artists/discovery',
    },
    {
      name: 'Artist Discovery Pro',
      icon: Search,
      path: '/artists/discovery/pro',
    },
    {
      name: 'Artist Profile',
      icon: Music,
      path: '/artists/:id',
    },
    {
      name: 'Event Calendar',
      icon: Calendar,
      path: '/calendar',
    },
    {
      name: 'Tour Planning',
      icon: Route,
      path: '/create-tour',
    },
    {
      name: 'Venues',
      icon: Building,
      path: '/venues',
    },
    {
      name: 'Collaboration',
      icon: Handshake,
      path: '/collaboration-requests',
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
    },
  ];

  return (
    <div
      className={cn(
        'h-full bg-background border-r flex flex-col transition-all duration-300 overflow-hidden',
        isOpen ? 'w-64' : 'w-16',
        className
      )}
    >
      <div className="flex items-center justify-between p-4 h-16 border-b">
        <h1 
          className={cn(
            "font-bold transition-opacity duration-300", 
            isOpen ? "opacity-100" : "opacity-0 hidden"
          )}
        >
          BandConnect
        </h1>
        <button
          onClick={toggle}
          className="p-1 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {activeVenueId && venueData && (
        <div className={cn(
          "flex items-center p-4 border-b",
          !isOpen && "justify-center"
        )}>
          <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center text-primary font-semibold">
            {venueData.name.charAt(0)}
          </div>
          {isOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="font-medium truncate">{venueData.name}</p>
              <p className="text-xs text-muted-foreground truncate">{venueData.city}, {venueData.state}</p>
            </div>
          )}
        </div>
      )}
      
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                    !isOpen && "justify-center"
                  )}
                >
                  <item.icon size={18} />
                  {isOpen && <span>{item.name}</span>}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <div 
          className={cn(
            "flex items-center gap-3",
            !isOpen && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
            U
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">User Name</p>
              <p className="text-xs text-muted-foreground truncate">user@example.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}