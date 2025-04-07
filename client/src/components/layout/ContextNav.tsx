
import React from 'react';
import { useLocation } from 'wouter';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { TabsList, TabsTrigger } from '../ui/tabs';

export default function ContextNav() {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();

  // Render different navigation items based on current route
  const renderNavItems = () => {
    if (location.startsWith('/venue/')) {
      return (
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="performances">Performances</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      );
    }

    if (location.startsWith('/tour/')) {
      return (
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dates">Tour Dates</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
        </TabsList>
      );
    }

    if (location === '/discovery') {
      return (
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="matches">Best Matches</TabsTrigger>
        </TabsList>
      );
    }

    return null;
  };

  return (
    <div className="border-b bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="py-4">
          {renderNavItems()}
        </div>
      </div>
    </div>
  );
}
