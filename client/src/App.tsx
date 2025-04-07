import { Route, Switch } from 'wouter';
import Dashboard from './pages/Dashboard';
import ArtistDiscovery from './pages/ArtistDiscovery';
import VenueCalendar from './pages/VenueCalendar';
import BandDetailPage from './pages/BandDetailPage';
import { Toaster } from './components/ui/toaster';
import { ActiveVenueProvider } from './hooks/useActiveVenue';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/discovery" component={ArtistDiscovery} />
      <Route path="/calendar" component={VenueCalendar} />
      <Route path="/bands/:id" component={BandDetailPage} />
    </Switch>
  );
}

function MainContent() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <div className="font-bold text-xl mr-6">VenueBuddy</div>
          <nav className="flex items-center space-x-4 lg:space-x-6">
            <a href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </a>
            <a href="/discovery" className="text-sm font-medium transition-colors hover:text-primary">
              Artist Discovery
            </a>
            <a href="/calendar" className="text-sm font-medium transition-colors hover:text-primary">
              Calendar
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">
        <Router />
      </main>
      <footer className="bg-secondary py-4 text-center text-sm text-secondary-foreground">
        <div className="container mx-auto">
          &copy; {new Date().getFullYear()} Venue Buddy - All rights reserved
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActiveVenueProvider>
        <MainContent />
        <Toaster />
      </ActiveVenueProvider>
    </QueryClientProvider>
  );
}

export default App;