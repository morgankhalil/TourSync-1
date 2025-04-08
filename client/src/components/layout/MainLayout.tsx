
import { ReactNode } from "react";
import { SidebarProvider } from "@/context/SidebarContext";
import VenueSidebar from "./VenueSidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <VenueSidebar />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
