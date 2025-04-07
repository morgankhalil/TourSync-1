import React from 'react';
import { Link, useLocation } from 'wouter';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { CalendarSearch, LayoutDashboard, Loader2, Map } from 'lucide-react';

const Navbar: React.FC = () => {
  const [location] = useLocation();
  const { venue, isLoading } = useActiveVenue();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5 mr-2" /> },
    { href: '/discovery', label: 'Artist Discovery', icon: <Map className="h-5 w-5 mr-2" /> },
    { href: '/calendar', label: 'Calendar', icon: <CalendarSearch className="h-5 w-5 mr-2" /> }
  ];

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex items-center font-bold text-xl">
                <span className="hidden md:inline">VenueBuddy</span>
                <span className="md:hidden">VB</span>
              </a>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center space-x-1 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading venue...</span>
            </div>
          ) : venue ? (
            <div className="hidden md:flex items-center px-3 py-1 rounded-full bg-primary-foreground/10 text-sm">
              <span className="font-medium mr-1">Active Venue:</span> {venue.name}
            </div>
          ) : null}

          <nav className="flex">
            <ul className="flex space-x-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        location === link.href
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground'
                      }`}
                    >
                      {link.icon}
                      <span className="hidden md:inline">{link.label}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;