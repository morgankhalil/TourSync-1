import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ActiveVenueProvider } from './hooks/useActiveVenue';
import { MainLayout } from './components/layout/MainLayout';

import Dashboard from './pages/Dashboard';
import ArtistDiscovery from './pages/ArtistDiscovery';
import TourFinderPro from './pages/TourFinderPro';
import ArtistProfile from './pages/ArtistProfile';
import EventCalendar from './pages/EventCalendar';
import CollaborationRequests from './pages/CollaborationRequests';
import EnhancedArtistDiscovery from './pages/EnhancedArtistDiscovery';
import VenueSearch from './pages/VenueSearch';
import VenueList from './pages/VenueList';
import VenueDetail from './pages/VenueDetail';
import TourRouteVisualization from './pages/TourRouteVisualization';
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
        <MainLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/artists/discovery" component={ArtistDiscovery} />
            {/* Updated route name to better reflect venue-centric tour finder */}
            <Route path="/venues/tour-finder" component={TourFinderPro} />
            {/* Keep the old route for backward compatibility */}
            <Route path="/artists/discovery/pro" component={TourFinderPro} />
            <Route path="/artists/discovery/enhanced" component={EnhancedArtistDiscovery} />
            <Route path="/artists/:id" component={ArtistProfile} />
            <Route path="/calendar" component={EventCalendar} />
            <Route path="/collaboration-requests" component={CollaborationRequests} />
            <Route path="/venues/:id" component={VenueDetail} />
            <Route path="/venues" component={VenueSearch} />
            <Route path="/tours/route-visualization" component={TourRouteVisualization} />
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
        <Toaster />
      </ActiveVenueProvider>
    </QueryClientProvider>
  );
}