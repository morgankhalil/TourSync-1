import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ActiveVenueProvider } from './hooks/useActiveVenue';

import Dashboard from './pages/Dashboard';
import ArtistDiscovery from './pages/ArtistDiscovery';
import ArtistDiscoveryPro from './pages/ArtistDiscoveryPro';
import ArtistProfile from './pages/ArtistProfile';
import EventCalendar from './pages/EventCalendar';
import CollaborationRequests from './pages/CollaborationRequests';
import EnhancedArtistDiscovery from './pages/EnhancedArtistDiscovery';
import NotFound from './pages/not-found';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActiveVenueProvider>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/artists/discovery" component={ArtistDiscovery} />
          <Route path="/artists/discovery/pro" component={ArtistDiscoveryPro} />
          <Route path="/artists/discovery/enhanced" component={EnhancedArtistDiscovery} />
          <Route path="/artists/:id" component={ArtistProfile} />
          <Route path="/calendar" component={EventCalendar} />
          <Route path="/collaboration-requests" component={CollaborationRequests} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </ActiveVenueProvider>
    </QueryClientProvider>
  );
}