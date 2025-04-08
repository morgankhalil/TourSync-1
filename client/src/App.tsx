import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from './contexts/AuthContext';
import { ActiveVenueProvider } from './hooks/useActiveVenue';
import { SidebarProvider } from '@/components/ui/sidebar';
import MainLayout from '@/components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import VenueDashboard from './pages/VenueDashboard';
import VenueSearch from './pages/VenueSearch';
import VenueView from './pages/VenueView';
import EnhancedArtistDiscovery from './pages/EnhancedArtistDiscovery';
import TourFinderPro from './pages/TourFinderPro';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" enableSystem>
        <AuthProvider>
          <ActiveVenueProvider>
            <SidebarProvider>
              <Switch>
                {/* Public Routes */}
                <Route path="/login" component={LoginPage} />
                <Route path="/register" component={RegisterPage} />

                {/* Protected Routes */}
                <Route path="/">
                  <ProtectedRoute>
                    <MainLayout>
                      <Switch>
                        <Route path="/" component={Dashboard} />
                        <Route path="/venues" component={VenueDashboard} />
                        <Route path="/venues/search" component={VenueSearch} />
                        <Route path="/venues/:id" component={VenueView} />
                        <Route path="/artist-discovery" component={EnhancedArtistDiscovery} />
                        <Route path="/tour-finder" component={TourFinderPro} />
                        <Route path="/profile" component={ProfilePage} />
                        <Route path="/settings" component={SettingsPage} />
                      </Switch>
                      <Toaster /> {/*Moved Toaster here*/}
                    </MainLayout>
                  </ProtectedRoute>
                </Route>
              </Switch>
            </SidebarProvider>
          </ActiveVenueProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}