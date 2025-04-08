
import { Route, Switch } from 'wouter';
import { Toaster } from './components/ui/toaster';
import AppLayout from './components/layout/AppLayout';

// Core pages
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import NotFound from './pages/not-found';

// Venue pages
import VenueList from './pages/VenueList';
import VenueDashboard from './pages/VenueDashboard';
import VenueProfile from './pages/VenueProfile';
import VenueCalendar from './pages/VenueCalendar';
import VenueAvailability from './pages/VenueAvailability';
import EditVenue from './pages/EditVenue';
import VenueView from './pages/VenueView';

// Band pages
import BandsPage from './pages/BandsPage';
import BandDetailPage from './pages/BandDetailPage';
import ArtistDiscovery from './pages/ArtistDiscovery';
import EnhancedArtistDiscovery from './pages/EnhancedArtistDiscovery';
import BandsintownPage from './pages/BandsintownPage';
import BandsintownImport from './pages/BandsintownImport';

// Tour pages
import TourDashboard from './pages/TourDashboard';
import CreateTour from './pages/CreateTour';
import TourPlanningWizard from './pages/TourPlanningWizard';
import OpportunityDiscovery from './pages/OpportunityDiscovery';

// User pages
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export default function App() {
  return (
    <>
      <AppLayout>
        <Switch>
          {/* Core routes */}
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          
          {/* Venue routes */}
          <Route path="/venues" component={VenueList} />
          <Route path="/venue/:id" component={VenueView} />
          <Route path="/venue/:id/dashboard" component={VenueDashboard} />
          <Route path="/venue/:id/profile" component={VenueProfile} />
          <Route path="/venue/:id/calendar" component={VenueCalendar} />
          <Route path="/venue/:id/availability" component={VenueAvailability} />
          <Route path="/venue/:id/edit" component={EditVenue} />
          
          {/* Band routes */}
          <Route path="/bands" component={BandsPage} />
          <Route path="/band/:id" component={BandDetailPage} />
          <Route path="/discovery" component={ArtistDiscovery} />
          <Route path="/discovery/enhanced" component={EnhancedArtistDiscovery} />
          <Route path="/bandsintown" component={BandsintownPage} />
          <Route path="/bandsintown/import" component={BandsintownImport} />
          
          {/* Tour routes */}
          <Route path="/tours" component={TourDashboard} />
          <Route path="/tour/create" component={CreateTour} />
          <Route path="/tour/wizard" component={TourPlanningWizard} />
          <Route path="/opportunities" component={OpportunityDiscovery} />
          
          {/* User routes */}
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          
          {/* 404 route */}
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
      <Toaster />
    </>
  );
}
