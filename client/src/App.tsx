import { Route, Switch } from 'wouter';
import { Toaster } from './components/ui/toaster';
import AppLayout from './components/layout/AppLayout';
import VenueDashboard from './pages/VenueDashboard';
import VenueCalendar from './pages/VenueCalendar';
import VenueProfile from './pages/VenueProfile';
import TourDashboard from './pages/TourDashboard';
import CreateTour from './pages/CreateTour';
import ArtistDiscovery from './pages/ArtistDiscovery';
import BandDetailPage from './pages/BandDetailPage';

export default function App() {
  return (
    <>
      <AppLayout>
        <Switch>
          {/* Main dashboard - default route */}
          <Route path="/" component={VenueDashboard} />
          
          {/* Other standard routes */}
          <Route path="/calendar" component={VenueCalendar} />
          <Route path="/profile" component={VenueProfile} />
          <Route path="/tours" component={TourDashboard} />
          <Route path="/tour/create" component={CreateTour} />
          <Route path="/discovery" component={ArtistDiscovery} />
          <Route path="/band/:bandId" component={BandDetailPage} />
        </Switch>
      </AppLayout>
      <Toaster />
    </>
  );
}