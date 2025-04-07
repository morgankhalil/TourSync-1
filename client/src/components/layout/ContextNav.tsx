
import React, { ReactElement } from 'react';
import { useLocation, Link } from 'wouter';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { TabsList, TabsTrigger, Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Home, Map, List, Star, Calendar, BarChart2, Settings, Users } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';

// Define types for our tab items
interface BreadcrumbItem {
  label: string;
  path: string;
  icon: ReactElement | null;
}

interface TabItem {
  value: string;
  label: string;
  href: string;
  icon?: ReactElement; // Make icon optional
}

interface SectionTabs {
  defaultValue: string;
  items: TabItem[];
}

export default function ContextNav() {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();

  // Get path segments for breadcrumbs
  const pathSegments = location.split('/').filter(Boolean);

  // Generate breadcrumb items dynamically
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    let path = '';

    // Always add home
    items.push({
      label: 'Home',
      path: '/',
      icon: <Home className="h-4 w-4" />
    });

    // Add each segment
    pathSegments.forEach((segment, index) => {
      path += `/${segment}`;
      
      // Format segment for display
      const formattedSegment = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      items.push({
        label: formattedSegment,
        path: path,
        icon: null
      });
    });

    return items;
  };

  // Define section tabs based on current route
  const getSectionTabs = (): SectionTabs | null => {
    // Venue Profile
    if (location.startsWith('/venue/')) {
      return {
        defaultValue: 'overview',
        items: [
          { value: 'overview', label: 'Overview', href: '/venue/' + pathSegments[1] },
          { value: 'calendar', label: 'Calendar', href: '/venue/' + pathSegments[1] + '/calendar' },
          { value: 'performances', label: 'Performances', href: '/venue/' + pathSegments[1] + '/performances' },
          { value: 'analytics', label: 'Analytics', href: '/venue/' + pathSegments[1] + '/analytics' }
        ]
      };
    }

    // Tour pages
    if (location.startsWith('/tour/')) {
      return {
        defaultValue: 'overview',
        items: [
          { value: 'overview', label: 'Overview', href: '/tour/' + pathSegments[1] },
          { value: 'dates', label: 'Tour Dates', href: '/tour/' + pathSegments[1] + '/dates' },
          { value: 'venues', label: 'Venues', href: '/tour/' + pathSegments[1] + '/venues' },
          { value: 'optimize', label: 'Optimize', href: '/tour/' + pathSegments[1] + '/optimize' }
        ]
      };
    }

    // Artist Discovery
    if (location === '/artist-discovery' || location === '/discovery') {
      return {
        defaultValue: 'map',
        items: [
          { value: 'map', label: 'Map View', href: '/artist-discovery?view=map', icon: <Map className="h-4 w-4 mr-1" /> },
          { value: 'list', label: 'List View', href: '/artist-discovery?view=list', icon: <List className="h-4 w-4 mr-1" /> },
          { value: 'matches', label: 'Best Matches', href: '/artist-discovery?view=matches', icon: <Star className="h-4 w-4 mr-1" /> }
        ]
      };
    }

    // Calendar
    if (location === '/calendar') {
      return {
        defaultValue: 'month',
        items: [
          { value: 'month', label: 'Month', href: '/calendar?view=month' },
          { value: 'week', label: 'Week', href: '/calendar?view=week' },
          { value: 'day', label: 'Day', href: '/calendar?view=day' },
          { value: 'list', label: 'List', href: '/calendar?view=list' }
        ]
      };
    }
    
    // Performances
    if (location === '/performances') {
      return {
        defaultValue: 'upcoming',
        items: [
          { value: 'upcoming', label: 'Upcoming', href: '/performances?filter=upcoming' },
          { value: 'past', label: 'Past', href: '/performances?filter=past' },
          { value: 'pending', label: 'Pending', href: '/performances?filter=pending' }
        ]
      };
    }

    // Default no tabs
    return null;
  };

  const breadcrumbItems = getBreadcrumbItems();
  const sectionTabs = getSectionTabs();
  
  return (
    <div className="border-b bg-card/10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumbs */}
        <Breadcrumb className="py-2 text-sm">
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="flex items-center">
                    <Link href={item.path}>
                      {item.icon && <span className="mr-1">{item.icon}</span>}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && (
                  <BreadcrumbSeparator />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Section Tabs */}
        {sectionTabs && (
          <div className="py-1 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-4 pb-2">
              {sectionTabs.items.map((tab) => (
                <Link key={tab.value} href={tab.href}>
                  <a className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md flex items-center whitespace-nowrap transition-colors",
                    location.includes(tab.href) ? 
                      "bg-primary/10 text-primary" : 
                      "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}>
                    {tab.icon && tab.icon}
                    {tab.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
