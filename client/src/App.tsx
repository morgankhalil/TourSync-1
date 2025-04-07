import { Route, Switch } from 'wouter';
import Dashboard from './pages/Dashboard';
import ArtistDiscovery from './pages/ArtistDiscovery';
import VenueCalendar from './pages/VenueCalendar';
import BandDetailPage from './pages/BandDetailPage';
import { Toaster } from './components/ui/toaster';
import { ActiveVenueProvider } from './hooks/useActiveVenue';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Sidebar from './components/Sidebar';

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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background">
          <div className="flex h-16 items-center px-6">
            <div className="flex-1"></div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-6 overflow-auto">
          <Router />
        </main>
        <footer className="bg-secondary py-3 text-center text-xs text-secondary-foreground">
          <div className="container mx-auto">
            &copy; {new Date().getFullYear()} VenueBuddy - All rights reserved
          </div>
        </footer>
      </div>
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