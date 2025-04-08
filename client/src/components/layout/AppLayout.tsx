import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Music, Users, Calendar, MessageSquare, Search, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
};

function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <Button 
        variant={isActive ? "secondary" : "ghost"} 
        className={cn(
          "w-full justify-start gap-2",
          isActive && "bg-primary/10 text-primary"
        )}
      >
        {icon}
        {children}
      </Button>
    </Link>
  );
}

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r bg-card p-4">
        <div className="mb-10">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-primary mb-1">
            <Music size={24} />
            <span>CollabConnect</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect. Collaborate. Create.
          </p>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem href="/" icon={<Home size={18} />} isActive={location === "/"}>
            Dashboard
          </NavItem>
          <NavItem 
            href="/artists/discovery" 
            icon={<Search size={18} />} 
            isActive={location === "/artists/discovery"}
          >
            Discover Artists
          </NavItem>
          <NavItem 
            href="/events" 
            icon={<Calendar size={18} />} 
            isActive={location === "/events"}
          >
            Event Calendar
          </NavItem>
          <NavItem 
            href="/collaborations" 
            icon={<MessageSquare size={18} />} 
            isActive={location === "/collaborations"}
          >
            Collaboration Requests
          </NavItem>
        </nav>
        
        <div className="mt-auto pt-4 border-t">
          <Link href="/profile">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Users size={18} />
              My Profile
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="flex md:hidden items-center justify-between w-full bg-card py-3 px-4 border-b fixed top-0 z-10">
        <h1 className="text-xl font-semibold flex items-center gap-2 text-primary">
          <Music size={20} />
          <span>CollabConnect</span>
        </h1>
        
        <Button variant="outline" size="sm">
          <Users size={16} />
        </Button>
      </div>
      
      {/* Mobile bottom nav */}
      <div className="flex md:hidden items-center justify-between w-full bg-card py-2 px-4 border-t fixed bottom-0 z-10">
        <Link href="/">
          <Button variant={location === "/" ? "secondary" : "ghost"} size="sm" className="flex flex-col items-center gap-1">
            <Home size={16} />
            <span className="text-xs">Home</span>
          </Button>
        </Link>
        
        <Link href="/artists/discovery">
          <Button variant={location === "/artists/discovery" ? "secondary" : "ghost"} size="sm" className="flex flex-col items-center gap-1">
            <Search size={16} />
            <span className="text-xs">Discover</span>
          </Button>
        </Link>
        
        <Link href="/events">
          <Button variant={location === "/events" ? "secondary" : "ghost"} size="sm" className="flex flex-col items-center gap-1">
            <Calendar size={16} />
            <span className="text-xs">Events</span>
          </Button>
        </Link>
        
        <Link href="/collaborations">
          <Button variant={location === "/collaborations" ? "secondary" : "ghost"} size="sm" className="flex flex-col items-center gap-1">
            <MessageSquare size={16} />
            <span className="text-xs">Requests</span>
          </Button>
        </Link>
      </div>
      
      {/* Main content */}
      <div className="flex-1 md:py-6 md:px-8 pt-16 pb-16 md:pt-0 md:pb-0">
        {children}
      </div>
    </div>
  );
}