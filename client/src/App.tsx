import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { ActiveVenueProvider } from './hooks/useActiveVenue';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

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
import VenueDashboard from './pages/VenueDashboard';
import TourRouteVisualization from './pages/TourRouteVisualization';
import VenueNetworkHub from './pages/VenueNetworkHub';
import NotFound from './pages/not-found';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    // Single QueryClientProvider at the root
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveVenueProvider>
          <SidebarProvider>
            <Switch>
              {/* Authentication Routes */}
              <Route path="/login" component={LoginPage} />
              <Route path="/register" component={RegisterPage} />

              {/* Protected Routes wrapped in MainLayout */}
              <Route>
                <ProtectedRoute>
                  <MainLayout>
                    <Switch>
                      {/* Use VenueDashboard as the main landing page */}
                      <Route path="/" component={VenueDashboard} />
                      {/* Venue-focused routes */}
                      <Route path="/venues/dashboard" component={VenueDashboard} />
                      <Route path="/venues/tour-finder" component={TourFinderPro} />
                      <Route path="/venues/search" component={VenueSearch} />
                      <Route path="/venues/list" component={VenueList} />
                      <Route path="/venues/:id" component={VenueDetail} />
                      <Route path="/venues" component={VenueSearch} />

                      {/* Venue Network Hub */}
                      <Route path="/venue-network" component={VenueNetworkHub} />

                      {/* Calendar */}
                      <Route path="/calendar" component={EventCalendar} />

                      {/* Tour routes */}
                      <Route path="/tours/route-visualization" component={TourRouteVisualization} />

                      {/* Artist-focused routes (kept for compatibility) */}
                      <Route path="/artists/dashboard" component={Dashboard} />
                      <Route path="/artists/discovery" component={ArtistDiscovery} />
                      <Route path="/artists/discovery/pro" component={TourFinderPro} />
                      <Route path="/artists/discovery/enhanced" component={EnhancedArtistDiscovery} />
                      <Route path="/artists/:id" component={ArtistProfile} />
                      <Route path="/collaboration-requests" component={CollaborationRequests} />

                      {/* User account routes */}
                      <Route path="/profile" component={ProfilePage} />
                      <Route path="/settings" component={SettingsPage} />

                      {/* 404 Not Found */}
                      <Route component={NotFound} />
                    </Switch>
                    <Toaster />
                  </MainLayout>
                </ProtectedRoute>
              </Route>
            </Switch>
          </SidebarProvider>
        </ActiveVenueProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}