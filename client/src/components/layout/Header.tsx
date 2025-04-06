import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Menu, User, MapPin, Calendar, Music, Route, Compass } from "lucide-react";
import { Link } from "wouter";
import { useActiveVenue } from "@/hooks/useActiveVenue";

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { activeVenue } = useActiveVenue();

  return (
    <header className="bg-primary text-white h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        {isMobile && (
          <button onClick={toggleSidebar} className="mr-4">
            <Menu size={24} />
          </button>
        )}
        <Link href="/">
          <h1 className="text-xl font-inter font-bold cursor-pointer">VenueBooker</h1>
        </Link>
      </div>
      <div className="flex items-center">
        <div className="hidden md:flex space-x-6 mr-4">
          <Link href="/">
            <span className="font-inter font-medium cursor-pointer hover:underline flex items-center">
              <Compass size={16} className="mr-1" />
              Opportunities
            </span>
          </Link>
          <Link href="/bands">
            <span className="font-inter font-medium cursor-pointer hover:underline flex items-center">
              <Music size={16} className="mr-1" />
              Touring Bands
            </span>
          </Link>
          <Link href="/venues">
            <span className="font-inter font-medium cursor-pointer hover:underline flex items-center">
              <MapPin size={16} className="mr-1" />
              All Venues
            </span>
          </Link>
          <Link href="/tour-dashboard">
            <span className="font-inter font-medium cursor-pointer hover:underline flex items-center">
              <Route size={16} className="mr-1" />
              Tour Dashboard
            </span>
          </Link>
          <Link href="/opportunities">
            <span className="font-inter font-medium cursor-pointer hover:underline flex items-center">
              <Compass size={16} className="mr-1" />
              Opportunities
            </span>
          </Link>
          {activeVenue && (
            <span className="font-inter font-medium text-accent-foreground">
              {activeVenue.name}
            </span>
          )}
        </div>
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
