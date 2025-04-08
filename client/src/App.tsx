
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from '@/pages/Dashboard';
import VenueDashboard from "./pages/VenueDashboard";
import VenueSearch from "./pages/VenueSearch";
import TourFinderPro from "@/pages/TourFinderPro";
import EnhancedArtistDiscovery from "@/pages/EnhancedArtistDiscovery";
import BandsintownPage from "./pages/BandsintownPage";
import { AuthProvider } from "./contexts/AuthContext";
import { ActiveVenueProvider } from "./hooks/useActiveVenue";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import { Toaster } from "./components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import VenueView from './pages/VenueView';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" enableSystem>
          <ActiveVenueProvider>
            <div className="min-h-screen">
              <Toaster />
              <Switch>
                <Route path="/login" component={LoginPage} />
                <Route path="/register" component={RegisterPage} />
                <Route path="/">
                  <ProtectedRoute>
                    <MainLayout>
                      <Switch>
                        <Route path="/" component={Dashboard} />
                        <Route path="/venues" component={VenueDashboard} />
                        <Route path="/venues/search" component={VenueSearch} />
                        <Route path="/venues/:id" component={VenueView} />
                        <Route path="/tours/finder" component={TourFinderPro} />
                        <Route path="/artists/discovery" component={EnhancedArtistDiscovery} />
                        <Route path="/bandsintown" component={BandsintownPage} />
                        <Route path="/profile" component={ProfilePage} />
                        <Route path="/settings" component={SettingsPage} />
                      </Switch>
                    </MainLayout>
                  </ProtectedRoute>
                </Route>
              </Switch>
            </div>
          </ActiveVenueProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
