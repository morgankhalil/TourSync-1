import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { Dashboard } from '@/pages/Dashboard';
import { VenueDashboard } from "./pages/VenueDashboard";
import { VenueSearch } from "./pages/VenueSearch";
import { TourFinderPro } from "@/pages/TourFinderPro";
import { EnhancedArtistDiscovery } from "@/pages/EnhancedArtistDiscovery";
import { BandsintownPage } from "./pages/BandsintownPage";
import TestPage from './pages/TestPage';
import { SupabaseExample } from './pages/SupabaseExample';
import { SupabaseLogin } from './pages/SupabaseLogin';
import { SupabaseRealtime } from './pages/SupabaseRealtime';
import { AuthProvider } from "./contexts/SupabaseAuthContext";
import { ActiveVenueProvider } from "./hooks/useActiveVenue";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import { Toaster } from "./components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { VenueView } from './pages/VenueView';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" enableSystem={false}>
          <ActiveVenueProvider>
            <div className="min-h-screen">
              <Toaster />
              <SidebarProvider>
                <MainLayout>
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/login" component={LoginPage} />
                    <Route path="/register" component={RegisterPage} />
                    <Route path="/venue-dashboard" component={VenueDashboard} />
                    <Route path="/venue-search" component={VenueSearch} />
                    <Route path="/tour-finder-pro" component={TourFinderPro} />
                    <Route path="/artist-discovery" component={EnhancedArtistDiscovery} />
                    <Route path="/bandsintown" component={BandsintownPage} />
                    <Route path="/test" component={TestPage} />
                    <Route path="/supabase" component={SupabaseExample} />
                    <Route path="/supabase-login" component={SupabaseLogin} />
                    <Route path="/supabase-realtime" component={SupabaseRealtime} />
                    <Route path="/profile" component={ProfilePage} />
                    <Route path="/settings" component={SettingsPage} />
                    <Route path="/venue/:id" component={VenueView} />
                  </Switch>
                </MainLayout>
              </SidebarProvider>
            </div>
          </ActiveVenueProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
