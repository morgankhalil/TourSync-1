
import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { VenueSidebar } from "./VenueSidebar";

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { isSidebarOpen, closeSidebar, toggleSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [isMobile, closeSidebar]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 md:hidden bg-background"
        >
          <Menu size={24} />
        </Button>
      )}

      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div
        className={`
          ${isMobile ? 'fixed' : 'relative'} 
          left-0 top-0 bottom-0 
          ${isMobile ? 'z-50' : ''} 
          transform transition-transform duration-300 ease-in-out 
          w-[280px] bg-background
          ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        <VenueSidebar />
      </div>

      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
    </div>
  );
}
