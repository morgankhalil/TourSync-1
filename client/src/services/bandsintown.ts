import axios from 'axios';
import { Artist, ArtistEvent, ImportResult, BandPassingNearby, VenueImportResult } from '../types';
import { apiRequest } from '@/lib/queryClient';

/**
 * Bandsintown API Service
 * Provides methods to interact with the Bandsintown API via our backend
 */
export const bandsintownService = {
  /**
   * Get artist information from Bandsintown
   */
  async getArtist(name: string): Promise<Artist> {
    return apiRequest<Artist>('get', `/api/bandsintown/artist/${encodeURIComponent(name)}`);
  },

  /**
   * Get artist events from Bandsintown
   */
  async getArtistEvents(name: string): Promise<ArtistEvent[]> {
    return apiRequest<ArtistEvent[]>('get', `/api/bandsintown/artist/${encodeURIComponent(name)}/events`);
  },

  /**
   * Import an artist from Bandsintown
   */
  async importArtist(name: string): Promise<ImportResult> {
    return apiRequest<ImportResult>('post', '/api/bandsintown/import/artist', { artistName: name });
  },

  /**
   * Batch import multiple artists from Bandsintown
   */
  async batchImportArtists(names: string[]): Promise<ImportResult[]> {
    return apiRequest<ImportResult[]>('post', '/api/bandsintown/import/batch', { artistNames: names });
  },

  /**
   * Extract venues from artist events on Bandsintown
   */
  async extractVenues(names: string[]): Promise<any[]> {
    return apiRequest<any[]>('post', '/api/bandsintown/extract-venues', { artistNames: names });
  },

  /**
   * Import venues from Bandsintown data
   */
  async importVenues(names: string[]): Promise<VenueImportResult[]> {
    return apiRequest<VenueImportResult[]>('post', '/api/bandsintown/import-venues', { artistNames: names });
  },

  /**
   * Find bands near a venue in a date range
   */
  async findBandsNearVenue(
    venueId: number,
    startDate: Date | string,
    endDate: Date | string,
    radius: number = 50
  ): Promise<BandPassingNearby[]> {
    const start = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
    const end = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
    
    return apiRequest<BandPassingNearby[]>('post', '/api/bandsintown/find-bands-near-venue', {
      venueId,
      startDate: start,
      endDate: end,
      radius
    });
  },

  /**
   * Refresh tour routes and update the database with the latest Bandsintown data
   */
  async refreshTourRoutes(
    fromDate?: Date | string,
    toDate?: Date | string,
    minArtistCount?: number
  ): Promise<{ message: string, processedArtists: number }> {
    const start = fromDate ? (typeof fromDate === 'string' ? fromDate : fromDate.toISOString().split('T')[0]) : undefined;
    const end = toDate ? (typeof toDate === 'string' ? toDate : toDate.toISOString().split('T')[0]) : undefined;
    
    return apiRequest<{ message: string, processedArtists: number }>('post', '/api/bandsintown/refresh-tour-routes', {
      fromDate: start,
      toDate: end,
      minArtistCount
    });
  },

  /**
   * Get the status of the Bandsintown integration
   */
  async getStatus(): Promise<any> {
    return apiRequest<any>('get', '/api/bandsintown/status');
  }
};

/**
 * Creates a cached key for storing artist data
 */
export function getCacheKey(artistName: string): string {
  return `bandsintown_artist_${artistName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

/**
 * Creates a cached key for storing artist events
 */
export function getEventsCacheKey(artistName: string): string {
  return `bandsintown_events_${artistName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}