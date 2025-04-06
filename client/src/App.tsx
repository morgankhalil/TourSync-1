import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";
import CreateTour from "./pages/CreateTour";
import Profile from "./pages/Profile";
import BandsPage from "./pages/BandsPage";
import VenueView from "./pages/VenueView";
import VenueList from "./pages/VenueList";
import VenueDashboard from "./pages/VenueDashboard";
import TourPlanningWizard from "./pages/TourPlanningWizard";
import TourDashboard from "./pages/TourDashboard";
import { OpportunityDiscovery } from "./pages/OpportunityDiscovery";
import { BandsintownImport } from "./pages/BandsintownImport";
import Header from "./components/layout/Header";
import MobileNavigation from "./components/layout/MobileNavigation";
import { useMediaQuery } from "./hooks/use-mobile";
import { SidebarProvider } from "./context/SidebarContext";
import EditVenue from './pages/EditVenue';
import VenueAvailability from './pages/VenueAvailability';
import { BandsintownPage } from './pages/BandsintownPage';
import VenueProfile from './pages/VenueProfile';

function Router() {
  return (
    <Switch>
      {/* Venue-focused routes */}
      <Route path="/" component={VenueDashboard} />
      <Route path="/dashboard" component={VenueDashboard} />
      <Route path="/calendar" component={VenueAvailability} />
      <Route path="/calendar/manage" component={VenueAvailability} />
      
      {/* Artist/opportunity discovery */}
      <Route path="/opportunities" component={OpportunityDiscovery} />
      <Route path="/bands" component={BandsPage} />
      
      {/* Venue management */}
      <Route path="/venues" component={VenueList} />
      <Route path="/venues/:id" component={VenueProfile} />
      <Route path="/edit-venue" component={EditVenue} />
      
      {/* User profile */}
      <Route path="/profile" component={Profile} />
      
      {/* Performance management */}
      <Route path="/performances" component={VenueDashboard} />
      <Route path="/performances/add" component={VenueDashboard} />
      
      {/* Analytics */}
      <Route path="/analytics" component={VenueDashboard} />
      
      {/* Admin tools (import, setup, etc.) */}
      <Route path="/import" component={BandsintownPage} />
      <Route path="/import-bandsintown" component={BandsintownImport} />
      
      {/* Legacy routes (may not fit venue-centric model but keeping for now) */}
      <Route path="/tour-planning" component={TourPlanningWizard} />
      <Route path="/tour-planning/:tourId" component={TourPlanningWizard} />
      <Route path="/tour-dashboard" component={TourDashboard} />
      <Route path="/create-tour" component={CreateTour} />
      <Route path="/map" component={Home} />
      <Route path="/venue-view/:id" component={VenueView} />
      
      {/* 404 for anything else */}
      <Route component={NotFound} />
    </Switch>
  );
}

function MainContent() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col overflow-auto">
        <Router />
      </div>
      {isMobile && <MobileNavigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <MainContent />
        <Toaster />
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;