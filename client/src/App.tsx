import { Route, Switch } from 'wouter';
import { Toaster } from './components/ui/toaster';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
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
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/calendar" component={VenueCalendar} />
          <Route path="/venue/:id" component={VenueProfile} />
          <Route path="/tours" component={TourDashboard} />
          <Route path="/tour/create" component={CreateTour} />
          <Route path="/discovery" component={ArtistDiscovery} />
          <Route path="/band/:id" component={BandDetailPage} />
        </Switch>
      </AppLayout>
      <Toaster />
    </>
  );
}