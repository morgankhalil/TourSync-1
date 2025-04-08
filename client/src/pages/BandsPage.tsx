
import { useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { InteractiveMapView } from "@/components/maps/InteractiveMapView";
import Sidebar from "@/components/layout/Sidebar";

const BandsPage = () => {
  const { openSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!isMobile) {
      openSidebar();
    }
  }, [isMobile, openSidebar]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <InteractiveMapView locations={[]} showPaths={true} />
    </div>
  );
};

export default BandsPage;
