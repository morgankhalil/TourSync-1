
import React from "react";
import { Link, useLocation } from "wouter";
import { Menu, Calendar, Search, Network } from "lucide-react";
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

export default function VenueSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <h2 className="text-lg font-semibold">Venue Management</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className={`flex items-center gap-2 ${location === '/' ? 'text-primary' : ''}`}>
              <Menu size={20} />
              Dashboard
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/calendar" className={`flex items-center gap-2 ${location === '/calendar' ? 'text-primary' : ''}`}>
              <Calendar size={20} />
              Calendar
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/venues/search" className={`flex items-center gap-2 ${location === '/venues/search' ? 'text-primary' : ''}`}>
              <Search size={20} />
              Find Venues
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/venue-network" className={`flex items-center gap-2 ${location === '/venue-network' ? 'text-primary' : ''}`}>
              <Network size={20} />
              Venue Network
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
