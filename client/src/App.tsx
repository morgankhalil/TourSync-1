import { Route, Switch } from 'wouter';
import { Toaster } from './components/ui/toaster';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import VenueCalendar from './pages/VenueCalendar';
import VenueCalendarManage from './pages/VenueCalendarManage';
import VenueAvailability from './pages/VenueAvailability';
import VenueProfile from './pages/VenueProfile';
import TourDashboard from './pages/TourDashboard';
import CreateTour from './pages/CreateTour';
import ArtistDiscovery from './pages/ArtistDiscovery';
import BandDetailPage from './pages/BandDetailPage';
import { SidebarProvider } from './context/SidebarContext';
import { ActiveVenueProvider } from './hooks/useActiveVenue';

export default function App() {
  return (
    <>
      <ActiveVenueProvider>
        <SidebarProvider>
          <AppLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/calendar" component={VenueCalendar} />
              <Route path="/calendar/manage" component={VenueCalendarManage} />
              <Route path="/venue-availability" component={VenueAvailability} />
              <Route path="/venue/:id" component={VenueProfile} />
              <Route path="/tours" component={TourDashboard} />
              <Route path="/tour/create" component={CreateTour} />
              <Route path="/discovery" component={ArtistDiscovery} />
              <Route path="/artist-discovery" component={ArtistDiscovery} />
              <Route path="/band/:id" component={BandDetailPage} />
            </Switch>
          </AppLayout>
        </SidebarProvider>
      </ActiveVenueProvider>
      <Toaster />
    </>
  );
}