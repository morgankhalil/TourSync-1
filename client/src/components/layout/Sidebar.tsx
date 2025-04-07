import { Plus, Edit, Calendar, Clock, Music, Users, MapPin, Star, Mail, Settings, BarChart3 } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format, isToday, isTomorrow, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Define the performance type
interface Performance {
  id: string;
  artistName: string;
  date: string | Date;
  status?: string;
  drawSize?: number;
  ticketPrice?: number;
}

const Sidebar = () => {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { activeVenue } = useActiveVenue();
  const [location] = useLocation();
  
  // Fetch upcoming performances for this venue
  const { data: performances = [], isLoading: isPerformancesLoading } = useQuery<Performance[]>({
    queryKey: ["/api/venues", activeVenue?.id, "performances"],
    enabled: !!activeVenue?.id,
  });
  
  // Get upcoming performances (just for display in sidebar)
  const upcomingPerformances = performances
    .filter((p) => new Date(p.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Determine the sidebar classes based on mobile and open state
  const sidebarClasses = isMobile
    ? `${isSidebarOpen ? "fixed top-0 left-0 bottom-0 z-50" : "hidden"} bg-sidebar-bg w-[85%] max-w-xs h-screen overflow-y-auto custom-scrollbar`
    : "hidden md:block bg-sidebar-bg w-full h-full border-r border-gray-200 flex-shrink-0 overflow-y-auto custom-scrollbar";

  // Helper to check if a navigation item is active
  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <aside className={`${sidebarClasses} ${isMobile ? 'fixed inset-y-0 left-0 w-[280px] bg-background shadow-lg' : ''}`}>
      {isMobile && isSidebarOpen && (
        <button 
          onClick={closeSidebar} 
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      )}

      <div className="p-4">
        {/* Venue Information */}
        <div className="mb-6">
          {activeVenue ? (
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <MapPin size={24} className="text-primary" />
              </div>
              <h2 className="font-inter font-semibold text-lg">{activeVenue.name}</h2>
              <p className="text-sm text-gray-500 text-center">
                {activeVenue.city}, {activeVenue.state}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-4">
              <Skeleton className="w-16 h-16 rounded-full mb-2" />
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          )}
          
          {/* Primary Navigation */}
          <nav className="space-y-1">
            <Link href="/dashboard">
              <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive("/dashboard") ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </span>
            </Link>
            
            <Link href="/artist-discovery">
              <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive("/artist-discovery") || isActive("/opportunities") || isActive("/bands") ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <Music className="mr-2 h-4 w-4" />
                <span>Artist Discovery</span>
              </span>
            </Link>
            
            <Link href="/calendar">
              <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive("/calendar") ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <Clock className="mr-2 h-4 w-4" />
                <span>Availability Calendar</span>
              </span>
            </Link>
            
            {activeVenue && (
              <Link href={`/venues/${activeVenue.id}`}>
                <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive(`/venues/${activeVenue.id}`) ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                  <Star className="mr-2 h-4 w-4" />
                  <span>Venue Profile</span>
                </span>
              </Link>
            )}
            
            <Link href="/analytics">
              <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive("/analytics") ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Performance Analytics</span>
              </span>
            </Link>
          </nav>
        </div>

        {/* Upcoming Shows */}
        <div className="mb-6">
          <h3 className="font-inter font-semibold text-sm text-gray-500 mb-3 uppercase tracking-wider">
            Upcoming Shows
          </h3>
          
          {isPerformancesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : upcomingPerformances.length > 0 ? (
            <div className="space-y-2 max-w-full">
              {upcomingPerformances.map((performance) => (
                <Card key={performance.id} className="p-2 text-sm">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{performance.artistName}</p>
                      <p className="text-xs text-gray-500">
                        {isToday(new Date(performance.date)) 
                          ? 'Today' 
                          : isTomorrow(new Date(performance.date))
                            ? 'Tomorrow'
                            : format(new Date(performance.date), "EEE, MMM d")}
                      </p>
                    </div>
                    {performance.status && (
                      <Badge variant={performance.status === 'confirmed' ? 'default' : 'outline'} className="text-xs ml-2 shrink-0">
                        {performance.status}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
              
              <Link href="/performances">
                <Button variant="ghost" size="sm" className="w-full text-xs text-primary">
                  View All Shows
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No upcoming shows</p>
          )}
        </div>
        
        {/* Quick Actions */}
        <div>
          <h3 className="font-inter font-semibold text-sm text-gray-500 mb-3 uppercase tracking-wider">
            Quick Actions
          </h3>
          
          <div className="space-y-2">
            <Link href="/performances/add">
              <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                <Plus size={14} className="mr-1" />
                Add Performance
              </Button>
            </Link>
            
            <Link href="/calendar/manage">
              <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                <Calendar size={14} className="mr-1" />
                Update Availability
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
