import React from 'react';
import { ArtistImporter } from '@/components/bandsintown/ArtistImporter';
// Using direct import instead of alias
import { SidebarLayout } from '../components/layout/SidebarLayout';

export default function BandsintownPage() {
  return (
    <SidebarLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Bandsintown Integration</h1>
        <p className="text-muted-foreground mb-8">
          This page allows you to import real artist and tour data from Bandsintown. 
          Search for your favorite artists to add them to the platform with their real tour dates and venues.
        </p>
        <ArtistImporter />
      </div>
    </SidebarLayout>
  );
}