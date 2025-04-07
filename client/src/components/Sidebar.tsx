import React from 'react';
import { Link, useLocation } from 'wouter';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { getLocationLabel } from '@/lib/utils';
import { 
  Home, 
  CalendarDays, 
  Compass, 
  Users, 
  Settings, 
  ChevronRight 
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const venue = useActiveVenue();
  const activeVenue = venue.activeVenue;
  const [location] = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-5 h-5 mr-3" /> },
    { name: 'Artist Discovery', path: '/discovery', icon: <Compass className="w-5 h-5 mr-3" /> },
    { name: 'Enhanced Discovery', path: '/discovery-v2', icon: <Compass className="w-5 h-5 mr-3 text-purple-600" /> },
    { name: 'Calendar', path: '/calendar', icon: <CalendarDays className="w-5 h-5 mr-3" /> },
    { name: 'Bands', path: '/bands', icon: <Users className="w-5 h-5 mr-3" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="min-h-screen w-64 bg-gray-50 border-r flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">VenueBuddy</h1>
        {activeVenue && (
          <div className="mt-2">
            <p className="font-medium text-sm">{activeVenue.name}</p>
            <p className="text-xs text-muted-foreground">
              {getLocationLabel(activeVenue.city, activeVenue.state)}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== '/' && location.startsWith(item.path));

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm group hover:bg-gray-100 ${
                    isActive 
                      ? 'bg-gray-100 text-primary font-medium' 
                      : 'text-gray-700'
                  }`}
                >
                  {item.icon}
                  {item.name}
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${
                    isActive ? 'text-primary' : 'opacity-0 group-hover:opacity-100'
                  }`} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            VB
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Venue Staff</p>
            <p className="text-xs text-muted-foreground">staff@venue.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;