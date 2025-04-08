
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ActiveVenueProvider } from './hooks/useActiveVenue';
import { GoogleMapsKey } from './components/GoogleMapsKey';
import { SidebarProvider } from './context/SidebarContext';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <ActiveVenueProvider>
          <GoogleMapsKey />
          <App />
        </ActiveVenueProvider>
      </SidebarProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
