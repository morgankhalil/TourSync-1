
import { Route, Switch } from 'wouter';
import { Toaster } from './components/ui/toaster';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
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
      <Switch>
        <Route path="/" component={Home} />
        <Route>
          <AppLayout>
            <Switch>
              <Route path="/venue/:id/dashboard" component={VenueDashboard} />
              <Route path="/venue/:id/calendar" component={VenueCalendar} />
              <Route path="/venue/:id/profile" component={VenueProfile} />
              <Route path="/venue/:id/tours" component={TourDashboard} />
              <Route path="/venue/:id/tour/create" component={CreateTour} />
              <Route path="/venue/:id/discovery" component={ArtistDiscovery} />
              <Route path="/venue/:id/band/:bandId" component={BandDetailPage} />
            </Switch>
          </AppLayout>
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}
