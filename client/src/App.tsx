import { Route, Switch } from 'wouter';
import { Toaster } from './components/ui/toaster';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import VenueDashboard from './pages/VenueDashboard';
import VenueCalendar from './pages/VenueCalendar';
import VenueProfile from './pages/VenueProfile';
import VenueView from './pages/VenueView';
import TourDashboard from './pages/TourDashboard';
import CreateTour from './pages/CreateTour';
import ArtistDiscovery from './pages/ArtistDiscovery';
import BandDetailPage from './pages/BandDetailPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route>
          <AppLayout>
            <Switch>
              {/* Venue-specific dashboard routes */}
              <Route path="/venue/:id/dashboard" component={VenueDashboard} />
              <Route path="/venue/:id" component={VenueView} />
              
              {/* Generic dashboard (redirects to venue dashboard when venue is selected) */}
              <Route path="/dashboard" component={Dashboard} />
              
              {/* Other standard routes */}
              <Route path="/calendar" component={VenueCalendar} />
              <Route path="/profile" component={VenueProfile} />
              <Route path="/tours" component={TourDashboard} />
              <Route path="/tour/create" component={CreateTour} />
              <Route path="/discovery" component={ArtistDiscovery} />
              <Route path="/band/:bandId" component={BandDetailPage} />
            </Switch>
          </AppLayout>
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}