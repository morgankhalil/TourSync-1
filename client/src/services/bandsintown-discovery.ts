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

  async findBandsNearVenue(params: {
    venueId: number | string;
    startDate: string;
    endDate: string;
    radius?: number;
  }): Promise<BandDiscoveryResult[]> {
    try {
      const response = await axios.post(`${this.apiUrl}/discover-bands-near-venue`, params);
      return response.data.data || [];
    } catch (error) {
      console.error('Error finding bands near venue:', error);
      throw error;
    }
  }

  // Other methods for the discovery service
}

export const bandsintownDiscoveryService = new BandsintownDiscoveryService();