import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useMediaQuery } from "@/hooks/use-mobile";
import VenueSidebar from "./VenueSidebar";

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { isOpen, toggle } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="flex min-h-screen bg-background">
      <VenueSidebar />
      <main className="flex-1 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}