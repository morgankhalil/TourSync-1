import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ActiveVenueProvider } from './hooks/useActiveVenue';
import { MainLayout } from './components/layout/MainLayout';

import Dashboard from './pages/Dashboard';
import ArtistDiscovery from './pages/ArtistDiscovery';
import ArtistDiscoveryPro from './pages/ArtistDiscoveryPro';
import ArtistProfile from './pages/ArtistProfile';
import EventCalendar from './pages/EventCalendar';
import CollaborationRequests from './pages/CollaborationRequests';
import EnhancedArtistDiscovery from './pages/EnhancedArtistDiscovery';
import NotFound from './pages/not-found';

// Wrap a component with the MainLayout
const withMainLayout = (Component: React.ComponentType<any>) => (props: any) => (
  <MainLayout>
    <Component {...props} />
  </MainLayout>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActiveVenueProvider>
        <Switch>
          <Route path="/" component={withMainLayout(Dashboard)} />
          <Route path="/artists/discovery" component={withMainLayout(ArtistDiscovery)} />
          <Route path="/artists/discovery/pro" component={withMainLayout(ArtistDiscoveryPro)} />
          <Route path="/artists/discovery/enhanced" component={withMainLayout(EnhancedArtistDiscovery)} />
          <Route path="/artists/:id" component={withMainLayout(ArtistProfile)} />
          <Route path="/calendar" component={withMainLayout(EventCalendar)} />
          <Route path="/collaboration-requests" component={withMainLayout(CollaborationRequests)} />
          <Route component={withMainLayout(NotFound)} />
        </Switch>
        <Toaster />
      </ActiveVenueProvider>
    </QueryClientProvider>
  );
}