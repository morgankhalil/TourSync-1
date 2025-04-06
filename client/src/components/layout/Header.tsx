import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Menu, User, MapPin, Calendar, Music, Star, Compass, Mail, Settings, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useActiveVenue } from "@/hooks/useActiveVenue";

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { activeVenue } = useActiveVenue();
  const [location] = useLocation();

  // Check if a route is active
  const isActive = (path: string) => location === path;

  return (
    <header className="bg-primary text-white h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        {isMobile && (
          <button onClick={toggleSidebar} className="mr-4">
            <Menu size={24} />
          </button>
        )}
        <Link href="/dashboard">
          <h1 className="text-xl font-inter font-bold cursor-pointer">VenueBooker</h1>
        </Link>
        
        {/* Display active venue name prominently */}
        {activeVenue && (
          <div className="ml-4 px-3 py-1 bg-primary-foreground/20 rounded-full hidden md:flex items-center">
            <MapPin size={14} className="mr-1" />
            <span className="font-inter font-medium text-accent-foreground">
              {activeVenue.name}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center">
        <div className="hidden md:flex space-x-6 mr-4">
          {/* Venue Staff Navigation */}
          <Link href="/dashboard">
            <span className={`font-inter font-medium cursor-pointer hover:underline flex items-center ${isActive("/dashboard") ? "underline" : ""}`}>
              <Calendar size={16} className="mr-1" />
              Dashboard
            </span>
          </Link>
          
          <Link href="/opportunities">
            <span className={`font-inter font-medium cursor-pointer hover:underline flex items-center ${isActive("/opportunities") ? "underline" : ""}`}>
              <Compass size={16} className="mr-1" />
              Booking Opportunities
            </span>
          </Link>
          
          <Link href="/bands">
            <span className={`font-inter font-medium cursor-pointer hover:underline flex items-center ${isActive("/bands") ? "underline" : ""}`}>
              <Music size={16} className="mr-1" />
              Touring Artists
            </span>
          </Link>
          
          <Link href={activeVenue ? `/venues/${activeVenue.id}` : "/venues"}>
            <span className={`font-inter font-medium cursor-pointer hover:underline flex items-center ${isActive("/venues") || (activeVenue && isActive(`/venues/${activeVenue.id}`)) ? "underline" : ""}`}>
              <Star size={16} className="mr-1" />
              Venue Profile
            </span>
          </Link>
          
          <Link href="/calendar">
            <span className={`font-inter font-medium cursor-pointer hover:underline flex items-center ${isActive("/calendar") ? "underline" : ""}`}>
              <Clock size={16} className="mr-1" />
              Availability
            </span>
          </Link>
        </div>
        
        {/* User Profile */}
        <Link href="/profile">
          <button className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <User size={16} />
          </button>
        </Link>
      </div>
    </header>
  );
};

export default Header;