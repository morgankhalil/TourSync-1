import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';

import Dashboard from './pages/Dashboard';
import ArtistDiscovery from './pages/ArtistDiscovery';
import ArtistProfile from './pages/ArtistProfile';
import EventCalendar from './pages/EventCalendar';
import CollaborationRequests from './pages/CollaborationRequests';
import NotFound from './pages/not-found';

export default function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/artists/discovery" component={ArtistDiscovery} />
        <Route path="/artists/:id" component={ArtistProfile} />
        <Route path="/calendar" component={EventCalendar} />
        <Route path="/collaboration-requests" component={CollaborationRequests} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}