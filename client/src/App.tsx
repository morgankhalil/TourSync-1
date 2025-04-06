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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={VenueDashboard} />
      <Route path="/bands" component={BandsPage} />
      <Route path="/create-tour" component={CreateTour} />
      <Route path="/tour-planning" component={TourPlanningWizard} />
      <Route path="/tour-planning/:tourId" component={TourPlanningWizard} />
      <Route path="/tour-dashboard" component={TourDashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/venues" component={VenueList} />
      <Route path="/venues/:id" component={VenueView} />
      <Route path="/edit-venue" component={EditVenue} />
      <Route path="/venue-availability" component={VenueAvailability} />
      <Route path="/opportunities" component={OpportunityDiscovery} />
      <Route path="/opportunity-discovery" component={OpportunityDiscovery} />
      <Route path="/import" component={BandsintownPage} />
      <Route path="/import-bandsintown" component={BandsintownImport} />
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