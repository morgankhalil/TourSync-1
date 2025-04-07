/**
 * BandsinTown discovery service for client
 * This service directly queries the API without database storage for real-time artist data
 */

import { apiRequest } from '@/lib/queryClient';
import { BandDiscoveryResult, RouteAnalysis } from '../types';

export interface BandsintownDiscoveryOptions {
  venueId: number;
  startDate: Date | string;
  endDate: Date | string;
  radius?: number;
}

/**
 * Direct Bandsintown discovery service - polls API directly without storing artist data
 */
export const bandsintownDiscoveryService = {
  /**
   * Discover bands passing near a venue within a date range
   * This directly queries the Bandsintown API without storing data in our database
   */
  async findBandsNearVenue({
    venueId,
    startDate,
    endDate,
    radius = 50
  }: BandsintownDiscoveryOptions): Promise<BandDiscoveryResult[]> {
    // Format dates as ISO strings if they're Date objects
    const formattedStartDate = typeof startDate === 'string' ? startDate : startDate.toISOString();
    const formattedEndDate = typeof endDate === 'string' ? endDate : endDate.toISOString();
    
    const response = await apiRequest('/api/bandsintown/discover-bands-near-venue', {
      method: 'POST',
      body: JSON.stringify({
        venueId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        radius
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error fetching bands near venue');
    }
    
    const result = await response.json();
    return result.data || [];
  },
  
  /**
   * Check the status of the Bandsintown discovery service
   */
  async checkStatus(): Promise<{ 
    status: string;
    apiKeyConfigured: boolean;
    discoveryEnabled: boolean;
  }> {
    const response = await apiRequest('/api/bandsintown/discovery-status');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error checking Bandsintown API status');
    }
    
    return await response.json();
  }
};