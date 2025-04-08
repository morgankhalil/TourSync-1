
import React from "react";
import { Link, useLocation } from "wouter";
import { Building2, BarChart3, Network, Calendar, ExternalLink, Mail, Phone } from "lucide-react";
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function VenueSidebar() {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">BandConnect</h2>
        </div>
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="font-medium">{activeVenue?.name || 'Select Venue'}</span>
          <Button variant="ghost" size="icon" className="ml-auto">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/venue-manager" className={`flex items-center gap-2 ${location === '/venue-manager' ? 'text-primary' : ''}`}>
              <Building2 size={20} />
              Venue Manager
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/venue-analytics" className={`flex items-center gap-2 ${location === '/venue-analytics' ? 'text-primary' : ''}`}>
              <BarChart3 size={20} />
              Venue Analytics
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/venue-connections" className={`flex items-center gap-2 ${location === '/venue-connections' ? 'text-primary' : ''}`}>
              <Network size={20} />
              Venue Connections
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        {activeVenue && (
          <SidebarGroup>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium">{activeVenue.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {activeVenue.address}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Capacity {activeVenue.capacity}</Badge>
                <Badge variant="outline">Various</Badge>
              </div>
              <div className="space-y-2">
                <a href={`mailto:${activeVenue.email}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {activeVenue.email}
                </a>
                <a href={`tel:${activeVenue.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {activeVenue.phone}
                </a>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button variant="outline" className="flex-1">
                  <Network className="h-4 w-4 mr-2" />
                  Network
                </Button>
              </div>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
