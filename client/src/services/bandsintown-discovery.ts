import axios from 'axios';
import { BandDiscoveryResult } from '@/types';

class BandsintownDiscoveryService {
  private apiUrl = '/api/bandsintown';
  private websocketUrl: string;

  constructor() {
    // Properly construct WebSocket URL based on the current hostname
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // This will correctly get the hostname and port
    this.websocketUrl = `${protocol}//${host}`;
  }

  async checkStatus(): Promise<{
    status: string;
    apiKeyConfigured: boolean;
    discoveryEnabled: boolean;
  }> {
    const response = await axios.get(`${this.apiUrl}/discovery-status`);
    return response.data;
  }

  async findBandsNearVenue({ venueId, startDate, endDate, radius, useDemo = false, onIncrementalResults }: {
    venueId: number | string;
    startDate: string;
    endDate: string;
    radius?: number;
    useDemo?: boolean;
    onIncrementalResults?: (results: BandDiscoveryResult[]) => void;
  }): Promise<BandDiscoveryResult[]> {
    try {
      // If we have a callback for incremental results, set up WebSocket connection
      if (onIncrementalResults) {
        try {
          const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/bandsintown-discovery`);

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'incremental-results' && data.data.results) {
              onIncrementalResults(data.data.results);
            }
          };

          // Close WebSocket after 5 minutes to avoid resource leaks
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          }, 5 * 60 * 1000);
        } catch (wsError) {
          console.error('WebSocket connection failed:', wsError);
          // Continue with regular API call if WebSocket fails
        }
      }

      // Add demo parameter to query string if useDemo is true
      const url = params.useDemo 
        ? `${this.apiUrl}/discover-bands-near-venue?demo=true` 
        : `${this.apiUrl}/discover-bands-near-venue`;

      // Strip useDemo from params before sending to API
      const { useDemo, ...apiParams } = params;

      console.log(`[Service] Requesting artist discovery data with${useDemo ? ' DEMO MODE' : ' LIVE API'}`);

      // Set a longer timeout for this API call since it might take a while
      const response = await axios.post(url, apiParams, { 
        timeout: 120000 // 2 minute timeout
      });

      const resultCount = (response.data.data || []).length;
      console.log(`[Service] Response received with ${resultCount} bands`);

      if (resultCount === 0) {
        console.warn('[Service] No bands found in discovery results');
      }

      return response.data.data || [];
    } catch (error) {
      console.error('Error finding bands near venue:', error);
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        throw new Error('The discovery request timed out. Please try again or use demo mode.');
      }
      throw error;
    }
  }

  // Other methods for the discovery service
}

export const bandsintownDiscoveryService = new BandsintownDiscoveryService();