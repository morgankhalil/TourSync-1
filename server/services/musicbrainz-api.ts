
import axios from 'axios';
import NodeCache from 'node-cache';

// Cache configuration
const API_CACHE = new NodeCache({
  stdTTL: 3600, // 1 hour standard TTL
  checkperiod: 120
});

interface MusicBrainzArtist {
  id: string;
  name: string;
  type?: string;
  country?: string;
  disambiguation?: string;
  tags?: Array<{name: string; count: number}>;
  genres?: Array<{name: string; count: number}>;
}

export class MusicBrainzApiService {
  private baseUrl = 'https://musicbrainz.org/ws/2';
  private cache = API_CACHE;
  private userAgent: string;

  constructor() {
    // MusicBrainz requires a meaningful User-Agent header
    this.userAgent = 'TourRoutingApp/1.0.0';
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const cacheKey = `mb:${endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get<T>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Add format=json to get JSON response
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: { ...params, fmt: 'json' },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        }
      });

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('MusicBrainz API error:', error);
      throw error;
    }
  }

  async searchArtist(query: string): Promise<MusicBrainzArtist[]> {
    const response = await this.makeRequest<{artists: MusicBrainzArtist[]}>('/artist', {
      query: query,
      limit: '10'
    });
    return response.artists;
  }

  async getArtist(mbid: string): Promise<MusicBrainzArtist> {
    const response = await this.makeRequest<MusicBrainzArtist>(`/artist/${mbid}`, {
      inc: 'tags,genres'
    });
    return response;
  }

  async getArtistReleases(mbid: string) {
    const response = await this.makeRequest(`/release-group`, {
      artist: mbid,
      limit: '100',
      type: 'album'
    });
    return response;
  }
}

export function createMusicBrainzApi(): MusicBrainzApiService {
  return new MusicBrainzApiService();
}
