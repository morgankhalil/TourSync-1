/**
 * Enhanced Bandsintown Discovery Client for Frontend
 * This provides access to the improved v2 discovery service that leverages
 * the Bandsintown API to find artists passing near a venue with improved
 * routing intelligence.
 */

export interface ArtistRoute {
  origin: {
    city: string;
    state: string;
    date: string;
    lat: number;
    lng: number;
  } | null;
  destination: {
    city: string;
    state: string;
    date: string;
    lat: number;
    lng: number;
  } | null;
  distanceToVenue: number;
  detourDistance: number;
  daysAvailable: number;
  routingScore: number;
}

export interface DiscoveryResult {
  name: string;
  image: string;
  url: string;
  upcomingEvents: number;
  route: ArtistRoute;
  events: Array<{
    id: string;
    datetime: string;
    venue: {
      name: string;
      city: string;
      region: string;
      country: string;
      latitude: string;
      longitude: string;
    };
  }>;
  genre?: string;
  bandsintownId?: string;
  drawSize?: number;
  website?: string;
}

export interface DiscoveryStats {
  artistsQueried: number;
  artistsWithEvents: number;
  artistsPassingNear: number;
  totalEventsFound: number;
  elapsedTimeMs: number;
  apiCacheStats: {
    keys: number;
    hits: number;
    misses: number;
  };
}

export interface DiscoveryResponse {
  data: DiscoveryResult[];
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: string;
    longitude: string;
  };
  stats: DiscoveryStats;
}

/**
 * Enhanced Bandsintown Discovery Service Client
 * This provides access to the improved v2 discovery service
 */
export class EnhancedBandsintownDiscoveryClient {
  /**
   * Check the status of the Bandsintown API connection
   */
  static async checkStatus(): Promise<{
    status: string;
    message: string;
    apiKey: boolean;
    apiResponse?: any;
  }> {
    try {
      const response = await fetch('/api/bandsintown-discovery-v2/status');

      if (!response.ok) {
        throw new Error('API status check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check Bandsintown API status', error);
      return { 
        status: 'error',
        message: 'Failed to connect to Bandsintown API service',
        apiKey: false
      };
    }
  }



  /**
   * Find bands that will be near a venue in a given date range
   */
  static async findBandsNearVenue(options: {
    venueId: number;
    startDate: string;
    endDate: string;
    radius?: number;
    maxBands?: number;
    lookAheadDays?: number;
    useDemoMode?: boolean;
    onIncrementalResults?: (newResults: DiscoveryResult[]) => void;
  }): Promise<DiscoveryResponse> {
    try {
      console.log("Starting discovery with options:", {
        venueId: options.venueId,
        startDate: options.startDate,
        endDate: options.endDate,
        radius: options.radius || 100,
        maxBands: options.maxBands || 20,
        streaming: !!options.onIncrementalResults
      });

      const queryParams = new URLSearchParams({
        venueId: options.venueId.toString(),
        startDate: options.startDate,
        endDate: options.endDate,
        radius: (options.radius || 100).toString(),
        maxBands: (options.maxBands || 20).toString(),
        lookAheadDays: (options.lookAheadDays || 90).toString(),
        useDemoMode: (options.useDemoMode || false).toString(),
        streaming: options.onIncrementalResults ? 'true' : 'false'
      });

      console.log("Fetching from:", `/api/bandsintown-discovery-v2/discover?${queryParams}`);
      const response = await fetch(`/api/bandsintown-discovery-v2/discover?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Discovery API request failed with status ${response.status}`);
      }

      // If incremental results callback is provided, set up streaming response handling
      if (options.onIncrementalResults) {
        console.log("Setting up streaming response handling");

        // This is our simple approach - just create several fake results for testing
        if (options.useDemoMode) {
          console.log("Using demo mode, generating fake incremental results");

          // Create several demo bands to simulate incremental results
          const demoBands = [
            {
              name: "The Roadtrippers",
              image: "https://picsum.photos/id/1/400/400",
              genre: "Indie Rock",
              routingScore: 15,
              distanceToVenue: 45,
              detourDistance: 10,
              daysAvailable: 2,
              originCity: "Buffalo",
              originState: "NY",
              destCity: "Pittsburgh", 
              destState: "PA",
            },
            {
              name: "Midnight Drivers",
              image: "https://picsum.photos/id/25/400/400",
              genre: "Alternative",
              routingScore: 30,
              distanceToVenue: 65,
              detourDistance: 25,
              daysAvailable: 3,
              originCity: "Toronto",
              originState: "ON",
              destCity: "Cleveland", 
              destState: "OH",
            },
            {
              name: "Coast to Coast",
              image: "https://picsum.photos/id/65/400/400",
              genre: "Folk",
              routingScore: 45,
              distanceToVenue: 120,
              detourDistance: 40,
              daysAvailable: 4,
              originCity: "Syracuse",
              originState: "NY",
              destCity: "Columbus", 
              destState: "OH",
            }
          ];

          // Simulate incremental results appearing
          setTimeout(() => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const demoResult: DiscoveryResult = {
              name: demoBands[0].name,
              image: demoBands[0].image,
              url: "https://bandsintown.com",
              upcomingEvents: 8,
              route: {
                origin: {
                  city: demoBands[0].originCity,
                  state: demoBands[0].originState,
                  date: now.toISOString().substring(0, 10),
                  lat: 42.8864,
                  lng: -78.8784
                },
                destination: {
                  city: demoBands[0].destCity,
                  state: demoBands[0].destState,
                  date: nextWeek.toISOString().substring(0, 10),
                  lat: 40.4406,
                  lng: -79.9959
                },
                distanceToVenue: demoBands[0].distanceToVenue,
                detourDistance: demoBands[0].detourDistance,
                daysAvailable: demoBands[0].daysAvailable,
                routingScore: demoBands[0].routingScore
              },
              events: [{
                id: "demo1",
                datetime: now.toISOString(),
                venue: {
                  name: demoBands[0].originCity + " Music Hall",
                  city: demoBands[0].originCity,
                  region: demoBands[0].originState,
                  country: "US",
                  latitude: "42.8864",
                  longitude: "-78.8784"
                }
              }, {
                id: "demo2",
                datetime: nextWeek.toISOString(),
                venue: {
                  name: demoBands[0].destCity + " Arena",
                  city: demoBands[0].destCity,
                  region: demoBands[0].destState,
                  country: "US",
                  latitude: "40.4406",
                  longitude: "-79.9959"
                }
              }],
              genre: demoBands[0].genre,
              drawSize: 150
            };

            options.onIncrementalResults!([demoResult]);
          }, 1500);

          // Send second result after a bit
          setTimeout(() => {
            const now = new Date();
            const dayAfter = new Date(now);
            dayAfter.setDate(dayAfter.getDate() + 2);
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 9);

            const demoResult: DiscoveryResult = {
              name: demoBands[1].name,
              image: demoBands[1].image,
              url: "https://bandsintown.com",
              upcomingEvents: 12,
              route: {
                origin: {
                  city: demoBands[1].originCity,
                  state: demoBands[1].originState,
                  date: dayAfter.toISOString().substring(0, 10),
                  lat: 43.6532,
                  lng: -79.3832
                },
                destination: {
                  city: demoBands[1].destCity,
                  state: demoBands[1].destState,
                  date: nextWeek.toISOString().substring(0, 10),
                  lat: 41.4993,
                  lng: -81.6944
                },
                distanceToVenue: demoBands[1].distanceToVenue,
                detourDistance: demoBands[1].detourDistance,
                daysAvailable: demoBands[1].daysAvailable,
                routingScore: demoBands[1].routingScore
              },
              events: [{
                id: "demo3",
                datetime: dayAfter.toISOString(),
                venue: {
                  name: demoBands[1].originCity + " Concert Hall",
                  city: demoBands[1].originCity,
                  region: demoBands[1].originState,
                  country: "CA",
                  latitude: "43.6532",
                  longitude: "-79.3832"
                }
              }, {
                id: "demo4",
                datetime: nextWeek.toISOString(),
                venue: {
                  name: demoBands[1].destCity + " Stadium",
                  city: demoBands[1].destCity,
                  region: demoBands[1].destState,
                  country: "US",
                  latitude: "41.4993",
                  longitude: "-81.6944"
                }
              }],
              genre: demoBands[1].genre,
              drawSize: 200
            };

            options.onIncrementalResults!([demoResult]);
          }, 3000);

          // Send third result later
          setTimeout(() => {
            const now = new Date();
            const dayAfter = new Date(now);
            dayAfter.setDate(dayAfter.getDate() + 4);
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 12);

            const demoResult: DiscoveryResult = {
              name: demoBands[2].name,
              image: demoBands[2].image,
              url: "https://bandsintown.com",
              upcomingEvents: 15,
              route: {
                origin: {
                  city: demoBands[2].originCity,
                  state: demoBands[2].originState,
                  date: dayAfter.toISOString().substring(0, 10),
                  lat: 43.0481,
                  lng: -76.1474
                },
                destination: {
                  city: demoBands[2].destCity,
                  state: demoBands[2].destState,
                  date: nextWeek.toISOString().substring(0, 10),
                  lat: 39.9612,
                  lng: -82.9988
                },
                distanceToVenue: demoBands[2].distanceToVenue,
                detourDistance: demoBands[2].detourDistance,
                daysAvailable: demoBands[2].daysAvailable,
                routingScore: demoBands[2].routingScore
              },
              events: [{
                id: "demo5",
                datetime: dayAfter.toISOString(),
                venue: {
                  name: demoBands[2].originCity + " Arena",
                  city: demoBands[2].originCity,
                  region: demoBands[2].originState,
                  country: "US",
                  latitude: "43.0481",
                  longitude: "-76.1474"
                }
              }, {
                id: "demo6",
                datetime: nextWeek.toISOString(),
                venue: {
                  name: demoBands[2].destCity + " Amphitheater",
                  city: demoBands[2].destCity,
                  region: demoBands[2].destState,
                  country: "US",
                  latitude: "39.9612",
                  longitude: "-82.9988"
                }
              }],
              genre: demoBands[2].genre,
              drawSize: 300
            };

            options.onIncrementalResults!([demoResult]);
          }, 4500);

          // Return final full response after all bands have been added incrementally
          return new Promise((resolve) => {
            setTimeout(() => {
              const fullData = demoBands.map((band, index) => {
                const now = new Date();
                const dayAfter = new Date(now);
                dayAfter.setDate(dayAfter.getDate() + (index * 2 + 1));
                const nextWeek = new Date(now);
                nextWeek.setDate(nextWeek.getDate() + (index * 3 + 7));

                return {
                  name: band.name,
                  image: band.image,
                  url: "https://bandsintown.com",
                  upcomingEvents: 8 + index * 4,
                  route: {
                    origin: {
                      city: band.originCity,
                      state: band.originState,
                      date: dayAfter.toISOString().substring(0, 10),
                      lat: 42.8864 + index,
                      lng: -78.8784 - index
                    },
                    destination: {
                      city: band.destCity,
                      state: band.destState,
                      date: nextWeek.toISOString().substring(0, 10),
                      lat: 40.4406 - index,
                      lng: -79.9959 + index
                    },
                    distanceToVenue: band.distanceToVenue,
                    detourDistance: band.detourDistance,
                    daysAvailable: band.daysAvailable,
                    routingScore: band.routingScore
                  },
                  events: [{
                    id: `demo-orig-${index}`,
                    datetime: dayAfter.toISOString(),
                    venue: {
                      name: band.originCity + " Music Hall",
                      city: band.originCity,
                      region: band.originState,
                      country: "US",
                      latitude: "42.8864",
                      longitude: "-78.8784"
                    }
                  }, {
                    id: `demo-dest-${index}`,
                    datetime: nextWeek.toISOString(),
                    venue: {
                      name: band.destCity + " Arena",
                      city: band.destCity,
                      region: band.destState,
                      country: "US",
                      latitude: "40.4406",
                      longitude: "-79.9959"
                    }
                  }],
                  genre: band.genre,
                  drawSize: 150 + index * 50
                };
              });

              resolve({
                data: fullData,
                stats: {
                  artistsQueried: 100,
                  artistsWithEvents: 50,
                  artistsPassingNear: 3,
                  totalEventsFound: 150,
                  elapsedTimeMs: 5000,
                  apiCacheStats: { keys: 100, hits: 50, misses: 50 }
                },
                venue: { 
                  id: options.venueId, 
                  name: 'Demo Venue', 
                  address: '123 Main St', 
                  city: 'Demoville', 
                  state: 'DM', 
                  zipCode: '12345', 
                  latitude: '40.7128', 
                  longitude: '-74.0060' 
                }
              });
            }, 6000);
          });
        }

        // Get a reader from the response body
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let allResults: DiscoveryResult[] = [];
        let buffer = '';
        let stats: DiscoveryStats | null = null;
        let venue: any = null;

        console.log("Starting to read stream");
        // Process the stream
        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            console.log("Stream reading complete");
            break;
          }

          // Decode the chunk and add it to our buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          console.log("Received chunk:", chunk);

          // Process complete lines in the buffer
          const lines = buffer.split('\n');

          // Keep the last line in the buffer if it's incomplete
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue; // Skip empty lines

            try {
              console.log("Processing line:", line);
              const data = JSON.parse(line);
              console.log("Parsed data:", data);

              if (data.status === 'in-progress' && data.results) {
                console.log("Got in-progress results:", data.results.length);
                // Call the incremental results callback with the new results
                options.onIncrementalResults(data.results);

                // Add to our accumulated results
                allResults = [...allResults, ...data.results];
              } else if (data.status === 'complete') {
                console.log("Got complete results");
                // Final complete result set
                if (data.results) {
                  allResults = data.results;
                }
                if (data.stats) {
                  stats = data.stats;
                }
                if (data.venue) {
                  venue = data.venue;
                }
              }
            } catch (err) {
              console.error('Error parsing streaming response:', err, 'Line:', line);
            }
          }
        }

        // Return the final accumulated result
        console.log("Returning final result:", allResults.length, "artists");
        return {
          data: allResults,
          stats: stats || {
            artistsQueried: 0,
            artistsWithEvents: 0,
            artistsPassingNear: 0,
            totalEventsFound: 0,
            elapsedTimeMs: 0,
            apiCacheStats: { keys: 0, hits: 0, misses: 0 }
          },
          venue: venue || { id: options.venueId, name: '', address: '', city: '', state: '', zipCode: '', latitude: '0', longitude: '0' }
        };
      }

      // For non-streaming requests, just return the JSON response
      console.log("Non-streaming request, returning JSON response");
      return await response.json();
    } catch (error) {
      console.error('Failed to perform band discovery:', error);
      throw error;
    }
  }

  /**
   * Clear the API request cache
   * This is useful when changing venues or search parameters to get fresh results
   */
  static async clearCache(): Promise<{ status: string; message: string }> {
    try {
      console.log('Clearing Bandsintown API cache...');
      const response = await fetch('/api/bandsintown-discovery-v2/clear-cache', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to clear API cache');
      }

      const result = await response.json();
      console.log('Cache cleared successfully', result);
      return result;
    } catch (error) {
      console.error('Failed to clear Bandsintown API cache:', error);
      return {
        status: 'error',
        message: 'Failed to clear API cache'
      };
    }
  }
}