import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Music, 
  Calendar, 
  Search, 
  MapPin, 
  Users, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type SidebarContextType = {
  collapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Setup listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <SidebarContext.Provider value={{ 
      collapsed, 
      toggleSidebar, 
      mobileOpen, 
      setMobileOpen 
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const { collapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar();
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when navigating
  useEffect(() => {
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [location, isMobile, mobileOpen, setMobileOpen]);

  const navigationItems = [
    { href: '/', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/artists/discovery', label: 'Artist Discovery', icon: <Music className="h-5 w-5" /> },
    { href: '/calendar', label: 'Event Calendar', icon: <Calendar className="h-5 w-5" /> },
    { href: '/venues', label: 'Venue Search', icon: <Search className="h-5 w-5" /> },
    { href: '/venue-network', label: 'Venue Network', icon: <Users className="h-5 w-5" /> },
    { href: '/tours/route-visualization', label: 'Tour Routes', icon: <MapPin className="h-5 w-5" /> },
  ];

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile Trigger */}
        <div className="fixed top-4 left-4 z-40">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={() => setMobileOpen(false)}
            />
            
            {/* Sidebar */}
            <div className="relative flex w-[280px] max-w-[80%] flex-col overflow-y-auto bg-background p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">TourConnect</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <nav className="flex flex-col gap-2">
                {navigationItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a 
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        location === item.href 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <div 
      className={cn(
        "hidden md:flex flex-col border-r bg-background h-screen z-30 fixed",
        collapsed ? "w-[70px]" : "w-[280px]"
      )}
    >
      <div className="flex h-14 items-center px-4 border-b">
        {!collapsed && <h2 className="text-lg font-bold">TourConnect</h2>}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className={collapsed ? "mx-auto" : "ml-auto"}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <nav className="flex-1 overflow-auto p-3">
        <div className="flex flex-col gap-1">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a 
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location === item.href 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted",
                  collapsed && "justify-center"
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </a>
            </Link>
          ))}
        </div>
      </nav>
      
      {children}
    </div>
  );
}