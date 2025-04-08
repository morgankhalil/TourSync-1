import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Search, Calendar, Settings, User, Menu } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

export default function MobileNavigation() {
  const [location] = useLocation();
  const { toggleSidebar, isSidebarOpen, closeSidebar } = useSidebar();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 flex justify-around items-center z-40 safe-area-bottom">
      <Link href="/dashboard" onClick={() => isSidebarOpen && closeSidebar()}>
        <a className={`flex flex-col items-center p-2 ${location === '/dashboard' ? 'text-primary' : 'text-gray-600'}`}>
          <Home size={24} />
          <span className="text-xs mt-1 mobile-nav-item">Dashboard</span>
        </a>
      </Link>

      <Link href="/artist-discovery" onClick={() => isSidebarOpen && closeSidebar()}>
        <a className={`flex flex-col items-center p-2 ${location === '/artist-discovery' ? 'text-primary' : 'text-gray-600'}`}>
          <Search size={24} />
          <span className="text-xs mt-1 mobile-nav-item">Discover</span>
        </a>
      </Link>

      <Link href="/tour-planning" onClick={() => isSidebarOpen && closeSidebar()}>
        <a className={`flex flex-col items-center p-2 ${location === '/tour-planning' ? 'text-primary' : 'text-gray-600'}`}>
          <Map size={24} />
          <span className="text-xs mt-1 mobile-nav-item">Tours</span>
        </a>
      </Link>

      <button 
        onClick={toggleSidebar}
        className={`flex flex-col items-center p-2 ${isSidebarOpen ? 'text-primary' : 'text-gray-600'}`}
        aria-label="Toggle menu"
      >
        <Menu size={24} />
        <span className="text-xs mt-1 mobile-nav-item">Menu</span>
      </button>

      <Link href="/venue-calendar" onClick={() => isSidebarOpen && closeSidebar()}>
        <a className={`flex flex-col items-center p-2 ${location === '/venue-calendar' ? 'text-primary' : 'text-gray-600'}`}>
          <Calendar size={24} />
          <span className="text-xs mt-1 mobile-nav-item">Calendar</span>
        </a>
      </Link>

      <Link href="/settings" onClick={() => isSidebarOpen && closeSidebar()}>
        <a className={`flex flex-col items-center p-2 ${location === '/settings' ? 'text-primary' : 'text-gray-600'}`}>
          <Settings size={24} />
          <span className="text-xs mt-1 mobile-nav-item">Settings</span>
        </a>
      </Link>
    </nav>
  );
}