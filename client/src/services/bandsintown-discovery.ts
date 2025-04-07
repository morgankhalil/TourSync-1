import { BandsintownArtist, DiscoveryOptions, DiscoveryResult } from '@/types';
import { calculateRouteMatch } from '@/utils/matchingAlgorithm';

export class BandsintownDiscoveryService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async discoverArtists(options: DiscoveryOptions): Promise<DiscoveryResult[]> {
    const response = await fetch('/api/bandsintown/discover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to discover artists');
    }

    return response.json();
  }

  // Add other unified methods here
}

export default new BandsintownDiscoveryService(import.meta.env.VITE_BANDSINTOWN_API_KEY);