import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Menu, User } from "lucide-react";
import { Link } from "wouter";

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <header className="bg-primary text-white h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        {isMobile && (
          <button onClick={toggleSidebar} className="mr-4">
            <Menu size={24} />
          </button>
        )}
        <Link href="/">
          <h1 className="text-xl font-inter font-bold cursor-pointer">TourConnect</h1>
        </Link>
      </div>
      <div className="flex items-center">
        <div className="hidden md:flex space-x-4 mr-4">
          <Link href="/venue">
            <span className="font-inter font-medium cursor-pointer hover:underline">Venue View</span>
          </Link>
          <span className="font-inter font-medium">The Sonic Waves</span>
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
