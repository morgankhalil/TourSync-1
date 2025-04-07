import axios from 'axios';
import { Band, Tour, TourDate, Venue, InsertBand, InsertTour, InsertTourDate, InsertVenue } from '@shared/schema';
import { storage } from '../storage';
import { format, isAfter, isBefore, parseISO, differenceInDays, addDays } from 'date-fns';
import { WebSocket, WebSocketServer } from 'ws';
import { uploadFile, downloadFile } from '../storage/object-storage';
import NodeCache from 'node-cache';

interface ArtistCache {
    artist: any;
    events: any[];
    lastFetched: Date;
}

interface EventWithVenue {
    event: any;
    venue: any;
}

interface ImportResult {
    band: Band | null;
    tour: Tour | null;
    tourDates: TourDate[];
    success: boolean;
    message: string;
}

interface RouteAnalysis {
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
}

interface VenueImportResult {
    venue: Venue;
    isNew: boolean;
}

export class BandsintownIntegration {
    private apiKey: string;
    private baseUrl = 'https://rest.bandsintown.com';
    private websocketClients: Map<string, WebSocket[]> = new Map();
    private artistCache: NodeCache = new NodeCache({ stdTTL: 3600 }); // 1-hour default TTL
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private priorityArtists: Set<string> = new Set();
    
    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.initializeWebSocketServer();
        this.loadCachedData();
    }

    /**
     * Loads previously cached artist data from storage
     */
    private async loadCachedData() {
        try {
            const cacheData = await downloadFile('bandsintown-cache.json');
            if (cacheData) {
                const cache = JSON.parse(cacheData.toString());
                for (const [artistName, data] of Object.entries(cache)) {
                    // Make sure to set a reasonable TTL based on last fetch time
                    const cacheEntry = data as ArtistCache;
                    const now = new Date();
                    const lastFetched = new Date(cacheEntry.lastFetched);
                    const ageInSeconds = (now.getTime() - lastFetched.getTime()) / 1000;
                    
                    // Only use cache entries less than 24 hours old
                    if (ageInSeconds < 24 * 60 * 60) {
                        this.artistCache.set(
                            artistName, 
                            { artist: cacheEntry.artist, events: cacheEntry.events, lastFetched },
                            24 * 60 * 60 - ageInSeconds // TTL is what remains of the 24 hours
                        );
                    }
                }
                console.log(`Loaded cached data for ${this.artistCache.keys().length} artists`);
            }
        } catch (error) {
            console.error('Error loading cached Bandsintown data:', error);
        }
    }

    /**
     * Saves current cache to persistent storage
     */
    private async saveCacheToStorage() {
        try {
            const cacheData: Record<string, ArtistCache> = {};
            
            this.artistCache.keys().forEach(key => {
                const value = this.artistCache.get<ArtistCache>(key);
                if (value) {
                    cacheData[key] = value;
                }
            });
            
            await uploadFile(
                'bandsintown-cache.json', 
                JSON.stringify(cacheData)
            );
            console.log(`Saved cache data for ${Object.keys(cacheData).length} artists`);
        } catch (error) {
            console.error('Error saving Bandsintown cache:', error);
        }
    }

    private initializeWebSocketServer() {
        const wss = new WebSocketServer({ 
            port: 8080,
            host: '0.0.0.0',
            clientTracking: true
        });

        wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                const data = JSON.parse(message.toString());
                if (data.type === 'subscribe' && data.artistName) {
                    this.subscribeToArtist(data.artistName, ws);
                }
            });

            ws.on('close', () => {
                this.removeWebSocketClient(ws);
            });
        });
        
        // Set up regular cache saving
        setInterval(() => this.saveCacheToStorage(), 15 * 60 * 1000); // Save cache every 15 minutes
    }

    private subscribeToArtist(artistName: string, ws: WebSocket) {
        if (!this.websocketClients.has(artistName)) {
            this.websocketClients.set(artistName, []);
            this.startArtistPolling(artistName);
        }
        this.websocketClients.get(artistName)?.push(ws);
        
        // Mark as priority if there are multiple subscribers
        if ((this.websocketClients.get(artistName)?.length || 0) > 3) {
            this.priorityArtists.add(artistName);
        }
    }

    private removeWebSocketClient(ws: WebSocket) {
        this.websocketClients.forEach((clients, artistName) => {
            const index = clients.indexOf(ws);
            if (index > -1) {
                clients.splice(index, 1);
                if (clients.length === 0) {
                    this.websocketClients.delete(artistName);
                    // Stop polling if there are no subscribers
                    const interval = this.pollingIntervals.get(artistName);
                    if (interval) {
                        clearInterval(interval);
                        this.pollingIntervals.delete(artistName);
                    }
                    
                    // Remove from priority if needed
                    if (this.priorityArtists.has(artistName)) {
                        this.priorityArtists.delete(artistName);
                    }
                }
            }
        });
    }

    private startArtistPolling(artistName: string) {
        // Use adaptive polling frequency:
        // - Priority artists (popular/many subscribers): 5 minutes
        // - Regular artists: 15 minutes
        const pollInterval = this.priorityArtists.has(artistName) 
            ? 5 * 60 * 1000  // 5 minutes for priority
            : 15 * 60 * 1000; // 15 minutes for regular

        const poll = async () => {
            if (!this.websocketClients.has(artistName)) {
                return; // Stop polling if no subscribers
            }

            try {
                const [artist, events] = await Promise.all([
                    this.getArtist(artistName, true), // Force refresh
                    this.getArtistEvents(artistName, true) // Force refresh
                ]);

                const clients = this.websocketClients.get(artistName) || [];
                const update = { artist, events, timestamp: new Date() };

                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(update));
                    }
                });
            } catch (error) {
                console.error(`Error polling artist ${artistName}:`, error);
            }
        };

        poll(); // Initial poll
        const interval = setInterval(poll, pollInterval);
        this.pollingIntervals.set(artistName, interval);
    }

    /**
     * Gets artist data, using cache unless refresh is forced
     */
    async getArtist(artistName: string, forceRefresh = false) {
        const cacheKey = `artist:${artistName}`;
        
        // Try to get from cache first
        if (!forceRefresh) {
            const cachedData = this.artistCache.get<ArtistCache>(cacheKey);
            if (cachedData) {
                return cachedData.artist;
            }
        }
        
        try {
            const response = await axios.get(
                `${this.baseUrl}/artists/${encodeURIComponent(artistName)}`,
                { params: { app_id: this.apiKey } }
            );
            
            // Update cache
            const existingCache = this.artistCache.get<ArtistCache>(cacheKey);
            this.artistCache.set(cacheKey, {
                artist: response.data,
                events: existingCache?.events || [],
                lastFetched: new Date()
            }, 24 * 60 * 60); // 24-hour TTL
            
            return response.data;
        } catch (error) {
            console.error(`Error fetching artist data for ${artistName}:`, error);
            return null;
        }
    }

    /**
     * Gets artist events, using cache unless refresh is forced
     */
    async getArtistEvents(artistName: string, forceRefresh = false) {
        const cacheKey = `artist:${artistName}`;
        
        // Try to get from cache first
        if (!forceRefresh) {
            const cachedData = this.artistCache.get<ArtistCache>(cacheKey);
            if (cachedData) {
                return cachedData.events;
            }
        }
        
        try {
            const response = await axios.get(
                `${this.baseUrl}/artists/${encodeURIComponent(artistName)}/events`,
                { params: { app_id: this.apiKey } }
            );
            
            // Update cache
            const existingCache = this.artistCache.get<ArtistCache>(cacheKey);
            this.artistCache.set(cacheKey, {
                artist: existingCache?.artist || null,
                events: response.data,
                lastFetched: new Date()
            }, 24 * 60 * 60); // 24-hour TTL
            
            return response.data;
        } catch (error) {
            console.error(`Error fetching events for ${artistName}:`, error);
            return [];
        }
    }

    /**
     * Imports an artist from Bandsintown and creates tour data
     */
    async importArtistWithTourData(artistName: string): Promise<ImportResult> {
        try {
            const artist = await this.getArtist(artistName, true);
            if (!artist) {
                return {
                    band: null,
                    tour: null,
                    tourDates: [],
                    success: false,
                    message: `Could not find artist ${artistName}`
                };
            }

            const events = await this.getArtistEvents(artistName, true);
            
            if (!events || events.length === 0) {
                return {
                    band: null,
                    tour: null,
                    tourDates: [],
                    success: false,
                    message: `No events found for artist ${artistName}`
                };
            }
            
            // Create or update band
            let band = await this.findOrCreateBand(artist);
            
            // Create tour
            let tour = await this.createTourFromEvents(band, events);
            
            // Create tour dates
            let tourDates: TourDate[] = [];
            if (tour) {
                tourDates = await this.createTourDates(tour, events);
            }
            
            return {
                band,
                tour,
                tourDates,
                success: true,
                message: `Successfully imported ${artistName} with ${tourDates.length} tour dates`
            };
        } catch (error) {
            console.error(`Error importing artist ${artistName}:`, error);
            return {
                band: null,
                tour: null,
                tourDates: [],
                success: false,
                message: `Error importing artist: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    
    /**
     * Batch imports multiple artists
     */
    async batchImportArtists(artistNames: string[]): Promise<ImportResult[]> {
        const results: ImportResult[] = [];
        
        for (const artistName of artistNames) {
            const result = await this.importArtistWithTourData(artistName);
            results.push(result);
        }
        
        return results;
    }
    
    /**
     * Extracts venues from artist events
     */
    async extractVenuesFromEvents(artistNames: string[]): Promise<EventWithVenue[]> {
        const uniqueVenues: Map<string, EventWithVenue> = new Map();
        
        for (const artistName of artistNames) {
            const events = await this.getArtistEvents(artistName);
            
            for (const event of events) {
                if (event.venue) {
                    const venueKey = `${event.venue.name}:${event.venue.city}:${event.venue.region}`;
                    
                    if (!uniqueVenues.has(venueKey)) {
                        uniqueVenues.set(venueKey, { event, venue: event.venue });
                    }
                }
            }
        }
        
        return Array.from(uniqueVenues.values());
    }
    
    /**
     * Imports venues from extracted events
     */
    async importExtractedVenues(artistNames: string[]): Promise<VenueImportResult[]> {
        const extractedVenues = await this.extractVenuesFromEvents(artistNames);
        const results: VenueImportResult[] = [];
        
        for (const { venue: extractedVenue } of extractedVenues) {
            try {
                // Look for existing venue with same name and location
                const existingVenues = await storage.getVenues();
                const existingVenue = existingVenues.find(v => 
                    v.name === extractedVenue.name && 
                    v.city === extractedVenue.city &&
                    v.state === extractedVenue.region
                );
                
                if (existingVenue) {
                    results.push({
                        venue: existingVenue,
                        isNew: false
                    });
                    continue;
                }
                
                // Create new venue
                const venueData: InsertVenue = {
                    name: extractedVenue.name,
                    address: extractedVenue.address || '',
                    city: extractedVenue.city || '',
                    state: extractedVenue.region || '',
                    country: extractedVenue.country || 'United States',
                    postalCode: extractedVenue.postal_code || '',
                    capacity: 0, // Unknown capacity
                    latitude: extractedVenue.latitude?.toString() || '',
                    longitude: extractedVenue.longitude?.toString() || '',
                    website: '',
                    phone: '',
                    email: '',
                    description: `Imported from Bandsintown on ${new Date().toLocaleDateString()}`,
                    amenities: '',
                    preferredGenres: '',
                    ageRestriction: '',
                    parking: '',
                    curfew: '',
                    loadIn: ''
                };
                
                const newVenue = await storage.createVenue(venueData);
                results.push({
                    venue: newVenue,
                    isNew: true
                });
                
            } catch (error) {
                console.error(`Error importing venue ${extractedVenue.name}:`, error);
            }
        }
        
        return results;
    }
    
    /**
     * Finds bands passing near a specific venue on a given date range
     */
    async findBandsNearVenue(venueId: number, startDate: Date, endDate: Date, radius: number): Promise<{band: Band, route: RouteAnalysis}[]> {
        // Get venue details
        const venue = await storage.getVenue(venueId);
        if (!venue || !venue.latitude || !venue.longitude) {
            throw new Error('Venue not found or missing location data');
        }
        
        const venueLat = parseFloat(venue.latitude);
        const venueLng = parseFloat(venue.longitude);
        
        // Get all current bands and tours
        const bands = await storage.getBands();
        const results: {band: Band, route: RouteAnalysis}[] = [];
        
        for (const band of bands) {
            try {
                // Get tour dates for this band
                const tours = await storage.getTours(band.id);
                
                for (const tour of tours) {
                    const tourDates = await storage.getTourDates(tour.id);
                    
                    // Skip if no tour dates or if tour is over
                    if (tourDates.length === 0 || 
                        (tour.endDate && isBefore(new Date(tour.endDate), new Date()))) {
                        continue;
                    }
                    
                    // Find tour dates within the requested date range
                    const filteredDates = tourDates.filter(td => {
                        const tourDate = new Date(td.date);
                        return isAfter(tourDate, startDate) && isBefore(tourDate, endDate);
                    });
                    
                    if (filteredDates.length > 0) {
                        // Sort by date
                        filteredDates.sort((a, b) => 
                            new Date(a.date).getTime() - new Date(b.date).getTime()
                        );
                        
                        // Analyze route to find if there's a gap where this venue could fit
                        const routeAnalysis = this.analyzeRouteForVenueFit(
                            filteredDates, venueLat, venueLng, radius
                        );
                        
                        if (routeAnalysis) {
                            results.push({
                                band,
                                route: routeAnalysis
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error analyzing band ${band.name}:`, error);
            }
        }
        
        // Sort by best fits (closest to route with most available days)
        results.sort((a, b) => {
            // Prioritize by detour distance (lower is better)
            const detourDiff = a.route.detourDistance - b.route.detourDistance;
            
            // If detour distances are close, prioritize by days available
            if (Math.abs(detourDiff) < 10) {
                return b.route.daysAvailable - a.route.daysAvailable;
            }
            
            return detourDiff;
        });
        
        return results;
    }

    /**
     * Refreshes tour routes based on Bandsintown data for a specific period
     * @param fromDate Start date to look for upcoming tours
     * @param toDate End date to look for upcoming tours
     * @param minArtistCount Minimum number of artists to process
     */
    async refreshUpcomingTourRoutes(
        fromDate: Date = new Date(), 
        toDate: Date = addDays(new Date(), 180), 
        minArtistCount: number = 50
    ): Promise<{processed: number, updated: number, failed: number}> {
        const bands = await storage.getBands();
        const processed: Set<number> = new Set();
        let updated = 0;
        let failed = 0;
        
        // Process bands in batches to avoid overwhelming the API
        const batchSize = 5;
        for (let i = 0; i < bands.length && processed.size < minArtistCount; i += batchSize) {
            const batch = bands.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (band) => {
                try {
                    // Check if we have enough artist data already
                    if (processed.size >= minArtistCount) {
                        return;
                    }
                    
                    // Get latest tour info from Bandsintown
                    const artistName = band.name;
                    const events = await this.getArtistEvents(artistName, true);
                    
                    // Filter to only relevant dates
                    const relevantEvents = events.filter(event => {
                        const eventDate = parseISO(event.datetime);
                        return isAfter(eventDate, fromDate) && isBefore(eventDate, toDate);
                    });
                    
                    if (relevantEvents.length > 0) {
                        // Create or update tour
                        const tour = await this.createTourFromEvents(band, relevantEvents);
                        if (tour) {
                            await this.createTourDates(tour, relevantEvents);
                            updated++;
                        }
                    }
                    
                    processed.add(band.id);
                } catch (error) {
                    console.error(`Error refreshing tour data for ${band.name}:`, error);
                    failed++;
                }
            }));
            
            // Add a small delay between batches to be gentle with the API
            if (i + batchSize < bands.length && processed.size < minArtistCount) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        return {
            processed: processed.size,
            updated,
            failed
        };
    }
    
    /**
     * Finds or creates a band from Bandsintown artist data
     */
    private async findOrCreateBand(artist: any): Promise<Band> {
        // Look for existing band with same name
        const existingBands = await storage.getBands();
        const existingBand = existingBands.find(b => 
            b.name.toLowerCase() === artist.name.toLowerCase()
        );
        
        if (existingBand) {
            return existingBand;
        }
        
        // Create new band
        const bandData: InsertBand = {
            name: artist.name,
            description: `Imported from Bandsintown on ${new Date().toLocaleDateString()}`,
            genre: artist.genre || '',
            formedYear: null,
            hometown: artist.hometown || '',
            website: artist.url || '',
            drawSize: null,
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            socialMediaFacebook: artist.facebook_page_url || '',
            socialMediaInstagram: '',
            socialMediaTwitter: '',
            socialMediaYoutube: '',
            socialMediaSpotify: '',
            photo: artist.image_url || '',
            pressKit: ''
        };
        
        return await storage.createBand(bandData);
    }
    
    /**
     * Creates a tour from events data
     */
    private async createTourFromEvents(band: Band, events: any[]): Promise<Tour | null> {
        if (events.length === 0) {
            return null;
        }
        
        // Sort events by date
        events.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
        
        const firstEvent = events[0];
        const lastEvent = events[events.length - 1];
        
        // Generate a descriptive name based on date range and region
        const regions = new Set(events.map(e => e.venue.region));
        const regionStr = Array.from(regions).slice(0, 3).join('/');
        const tourName = `${band.name} - ${format(new Date(firstEvent.datetime), 'MMM yyyy')} ${regionStr} Tour`;
        
        // Create tour
        const tourData: InsertTour = {
            bandId: band.id,
            name: tourName,
            startDate: new Date(firstEvent.datetime),
            endDate: new Date(lastEvent.datetime),
            description: `Imported from Bandsintown with ${events.length} events`,
            budget: null,
            status: 'planned'
        };
        
        // Check if a similar tour already exists
        const existingTours = await storage.getTours(band.id);
        const similarTour = existingTours.find(t => {
            // Consider tours similar if they have same band and similar date range
            if (t.bandId !== band.id) return false;
            
            const existingStart = new Date(t.startDate);
            const existingEnd = new Date(t.endDate);
            const newStart = new Date(tourData.startDate);
            const newEnd = new Date(tourData.endDate);
            
            // Tours overlap significantly
            return (
                (isAfter(existingStart, newStart) && isBefore(existingStart, newEnd)) ||
                (isAfter(existingEnd, newStart) && isBefore(existingEnd, newEnd)) ||
                (isBefore(existingStart, newStart) && isAfter(existingEnd, newEnd))
            );
        });
        
        if (similarTour) {
            // Update existing tour with new date range if needed
            const startDate = isBefore(new Date(firstEvent.datetime), new Date(similarTour.startDate))
                ? new Date(firstEvent.datetime)
                : new Date(similarTour.startDate);
                
            const endDate = isAfter(new Date(lastEvent.datetime), new Date(similarTour.endDate))
                ? new Date(lastEvent.datetime)
                : new Date(similarTour.endDate);
                
            await storage.updateTour(similarTour.id, {
                startDate,
                endDate,
                description: `Updated from Bandsintown on ${new Date().toLocaleDateString()}`
            });
            
            return await storage.getTour(similarTour.id) || null;
        }
        
        // Create new tour
        return await storage.createTour(tourData);
    }
    
    /**
     * Creates tour dates from events data
     */
    private async createTourDates(tour: Tour, events: any[]): Promise<TourDate[]> {
        const results: TourDate[] = [];
        
        // Get existing tour dates to avoid duplicates
        const existingDates = await storage.getTourDates(tour.id);
        
        for (const event of events) {
            try {
                const eventDate = new Date(event.datetime);
                const venue = event.venue;
                
                // Check if we already have this date
                const existingDate = existingDates.find(d => 
                    d.tourId === tour.id &&
                    d.city === venue.city &&
                    d.state === venue.region &&
                    Math.abs(new Date(d.date).getTime() - eventDate.getTime()) < 24 * 60 * 60 * 1000 // Within 24 hours
                );
                
                if (existingDate) {
                    results.push(existingDate);
                    continue;
                }
                
                // Create tour date
                const tourDateData: InsertTourDate = {
                    tourId: tour.id,
                    venueId: null, // We might not have the venue in our database
                    date: eventDate,
                    startTime: format(eventDate, 'HH:mm'),
                    status: 'confirmed', // Events from Bandsintown are usually confirmed
                    city: venue.city || '',
                    state: venue.region || '',
                    venueName: venue.name || 'Unknown Venue',
                    notes: event.description || `Imported from Bandsintown: ${event.url}`,
                    guaranteeAmount: null,
                    ticketPrice: null,
                    expectedDraw: null
                };
                
                const newTourDate = await storage.createTourDate(tourDateData);
                results.push(newTourDate);
            } catch (error) {
                console.error(`Error creating tour date:`, error);
            }
        }
        
        return results;
    }
    
    /**
     * Analyzes a tour route to see if a venue fits within the route
     */
    private analyzeRouteForVenueFit(
        tourDates: TourDate[], 
        venueLat: number, 
        venueLng: number, 
        radius: number
    ): RouteAnalysis | null {
        if (tourDates.length < 2) {
            return null;
        }
        
        let bestFit: RouteAnalysis | null = null;
        let minDetour = Infinity;
        
        // Check each pair of consecutive dates
        for (let i = 0; i < tourDates.length - 1; i++) {
            const dateA = tourDates[i];
            const dateB = tourDates[i + 1];
            
            // Skip if we don't have location data
            if (!dateA.city || !dateA.state || !dateB.city || !dateB.state) {
                continue;
            }
            
            // Use mock coordinates since we don't currently have real lat/lng
            // In a real implementation, we would use geocoding or real venue coordinates
            const mockLocationA = this.getMockCoordinates(dateA.city, dateA.state);
            const mockLocationB = this.getMockCoordinates(dateB.city, dateB.state);
            
            // Check if enough days between shows
            const daysBetween = differenceInDays(
                new Date(dateB.date),
                new Date(dateA.date)
            );
            
            if (daysBetween < 2) {
                continue; // Need at least 2 days between shows
            }
            
            // Calculate distances
            const distAToVenue = this.calculateDistance(
                mockLocationA.lat, mockLocationA.lng,
                venueLat, venueLng
            );
            
            const distVenueToB = this.calculateDistance(
                venueLat, venueLng,
                mockLocationB.lat, mockLocationB.lng
            );
            
            const distAToB = this.calculateDistance(
                mockLocationA.lat, mockLocationA.lng,
                mockLocationB.lat, mockLocationB.lng
            );
            
            // Calculate detour distance (how much extra driving to go through the venue)
            const detourDistance = (distAToVenue + distVenueToB) - distAToB;
            
            // Check if detour is reasonable and venue is within radius of route
            const isNearRoute = distAToVenue <= radius || distVenueToB <= radius;
            
            if (isNearRoute && detourDistance < minDetour) {
                minDetour = detourDistance;
                bestFit = {
                    origin: {
                        city: dateA.city,
                        state: dateA.state,
                        date: dateA.date.toString(),
                        lat: mockLocationA.lat,
                        lng: mockLocationA.lng
                    },
                    destination: {
                        city: dateB.city,
                        state: dateB.state,
                        date: dateB.date.toString(),
                        lat: mockLocationB.lat,
                        lng: mockLocationB.lng
                    },
                    distanceToVenue: Math.min(distAToVenue, distVenueToB),
                    detourDistance,
                    daysAvailable: daysBetween
                };
            }
        }
        
        return bestFit;
    }
    
    /**
     * Gets mock coordinates for a city/state
     * In a real implementation, we would use a geocoding service
     */
    private getMockCoordinates(city: string, state: string): {lat: number, lng: number} {
        // These are mock values - in a real implementation, we would use geocoding
        const baseCoordinates = {
            'NY': { lat: 40.7128, lng: -74.0060 }, // New York
            'CA': { lat: 34.0522, lng: -118.2437 }, // Los Angeles
            'IL': { lat: 41.8781, lng: -87.6298 }, // Chicago
            'TX': { lat: 29.7604, lng: -95.3698 }, // Houston
            'FL': { lat: 25.7617, lng: -80.1918 }, // Miami
        };
        
        // If we have the state, use its coordinates
        if (baseCoordinates[state]) {
            // Add slight randomness to differentiate cities in the same state
            return {
                lat: baseCoordinates[state].lat + (Math.random() - 0.5) * 0.5,
                lng: baseCoordinates[state].lng + (Math.random() - 0.5) * 0.5
            };
        }
        
        // Default to center of US
        return { lat: 39.8283, lng: -98.5795 };
    }
    
    /**
     * Calculates distance between two points in km using Haversine formula
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = R * c; // Distance in km
        return distance;
    }
    
    private deg2rad(deg: number): number {
        return deg * (Math.PI/180);
    }
}

// Helper function to create an integration instance
export function createBandsintownIntegration(apiKey: string): BandsintownIntegration {
    return new BandsintownIntegration(apiKey);
}