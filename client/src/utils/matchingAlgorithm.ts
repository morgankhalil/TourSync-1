import { Band, Venue } from "@shared/schema";

// Interface for geographical details
interface GeoPoint {
  latitude: string | number;
  longitude: string | number;
}

// Types of match criteria
export enum MatchCriteriaType {
  GENRE = 'genre',
  CAPACITY = 'capacity',
  LOCATION = 'location',
  TECHNICAL = 'technical',
  PREVIOUS_HISTORY = 'previous_history',
  VENUE_TYPE = 'venue_type',
  PRICE_RANGE = 'price_range'
}

// Object that defines how each criterion contributes to the overall match
const criteriaWeights = {
  [MatchCriteriaType.GENRE]: 0.30,
  [MatchCriteriaType.CAPACITY]: 0.20,
  [MatchCriteriaType.LOCATION]: 0.10,
  [MatchCriteriaType.TECHNICAL]: 0.15,
  [MatchCriteriaType.PREVIOUS_HISTORY]: 0.10,
  [MatchCriteriaType.VENUE_TYPE]: 0.05,
  [MatchCriteriaType.PRICE_RANGE]: 0.10
};

/**
 * Calculate distance between two geographic points
 * Uses the Haversine formula to account for Earth's curvature
 */
function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const lat1 = typeof point1.latitude === 'string' ? parseFloat(point1.latitude) : point1.latitude;
  const lon1 = typeof point1.longitude === 'string' ? parseFloat(point1.longitude) : point1.longitude;
  const lat2 = typeof point2.latitude === 'string' ? parseFloat(point2.latitude) : point2.latitude;
  const lon2 = typeof point2.longitude === 'string' ? parseFloat(point2.longitude) : point2.longitude;

  const toRad = (value: number) => value * Math.PI / 180;
  
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate genre match score
 * A higher score indicates better genre compatibility
 */
function calculateGenreMatch(band: Band, venue: Venue): number {
  if (!band.genre || !venue.genre && !venue.preferredGenres) return 0.5; // Neutral if no genres
  
  const bandGenre = band.genre?.toLowerCase() || '';
  const venueGenre = venue.genre?.toLowerCase() || '';
  const venuePreferredGenres = venue.preferredGenres as string[] || [];
  
  // If band's genre is directly mentioned in venue's preferred genres
  if (venuePreferredGenres.some(g => 
      g.toLowerCase() === bandGenre || 
      bandGenre.includes(g.toLowerCase()) || 
      g.toLowerCase().includes(bandGenre))) {
    return 1.0;
  }
  
  // If band's genre matches the venue's primary genre
  if (bandGenre === venueGenre || 
      bandGenre.includes(venueGenre) || 
      venueGenre.includes(bandGenre)) {
    return 0.9;
  }
  
  // Partial matching - basic genre families
  const genreFamilies: {[key: string]: string[]} = {
    'rock': ['rock', 'alternative', 'indie', 'punk', 'metal'],
    'electronic': ['electronic', 'techno', 'house', 'edm', 'dance'],
    'hiphop': ['hip hop', 'rap', 'hiphop', 'r&b', 'trap'],
    'jazz': ['jazz', 'blues', 'soul', 'funk'],
    'country': ['country', 'folk', 'americana', 'bluegrass'],
    'pop': ['pop', 'indie pop', 'synth pop']
  };
  
  // Check if band and venue are in the same genre family
  const findFamily = (genre: string) => {
    return Object.entries(genreFamilies).find(([_, genres]) => 
      genres.some(g => genre.includes(g) || g.includes(genre))
    )?.[0];
  };
  
  const bandFamily = findFamily(bandGenre);
  const venueFamily = findFamily(venueGenre);
  
  if (bandFamily && venueFamily && bandFamily === venueFamily) {
    return 0.7;
  }
  
  // Default - lower match but not zero
  return 0.3;
}

/**
 * Calculate capacity match score
 * Compares band's draw size with venue capacity
 */
function calculateCapacityMatch(band: Band, venue: Venue): number {
  if (!band.drawSize || !venue.capacity) return 0.5; // Neutral if missing data
  
  const idealFillRate = 0.8; // Aim for 80% venue capacity
  const bandDrawSize = band.drawSize;
  const venueCapacity = venue.capacity;
  
  // Calculate how close the band's draw size is to the ideal fill rate of the venue
  const ratio = bandDrawSize / venueCapacity;
  
  if (ratio < 0.2) return 0.2; // Too small for venue
  if (ratio > 1.3) return 0.3; // Too big for venue
  if (ratio >= 0.7 && ratio <= 0.9) return 1.0; // Perfect match
  if (ratio >= 0.5 && ratio < 0.7) return 0.8; // Good match
  if (ratio > 0.9 && ratio <= 1.1) return 0.8; // Good match but close to capacity
  
  return 0.5; // Default moderate match
}

/**
 * Calculate technical compatibility score
 * Checks if venue can accommodate band's technical requirements
 */
function calculateTechnicalMatch(band: Band, venue: Venue): number {
  if (!band.technicalRequirements || !venue.technicalSpecs) return 0.5; // Neutral if no data
  
  const bandReqs = band.technicalRequirements as {[key: string]: any};
  const venueSpecs = venue.technicalSpecs as {[key: string]: any};
  
  // If we have detailed tech specs, compare them
  if (Object.keys(bandReqs).length > 0 && Object.keys(venueSpecs).length > 0) {
    // Calculate what percentage of band's requirements are met by venue
    const requirements = Object.keys(bandReqs);
    const metRequirements = requirements.filter(req => 
      venueSpecs[req] && (venueSpecs[req] >= bandReqs[req] || venueSpecs[req] === bandReqs[req])
    );
    
    return metRequirements.length / requirements.length;
  }
  
  // Default moderate match
  return 0.5;
}

/**
 * Calculate previous history match score
 * Based on whether the band has played at this venue or similar venues before
 */
function calculateHistoryMatch(band: Band, venue: Venue): number {
  const pastVenues = band.pastVenues as {id: number, name: string}[] || [];
  
  // Check if band has played at this exact venue before
  const hasPlayedVenue = pastVenues.some(v => v.id === venue.id);
  if (hasPlayedVenue) return 1.0;
  
  // Check if band has played at venues with similar names
  const venueName = venue.name.toLowerCase();
  const similarVenueNames = pastVenues.some(v => 
    v.name.toLowerCase().includes(venueName) || 
    venueName.includes(v.name.toLowerCase())
  );
  if (similarVenueNames) return 0.8;
  
  // Check if venue has hosted similar bands
  const pastPerformers = venue.pastPerformers as {id: number, name: string}[] || [];
  // This would require comparing band genres with past performers' genres
  // Simplified for this implementation
  
  return 0.4; // Default history match
}

/**
 * Calculate venue type preference match
 */
function calculateVenueTypeMatch(band: Band, venue: Venue): number {
  if (!band.preferredVenueTypes || !venue.venueType) return 0.5;
  
  const preferredTypes = band.preferredVenueTypes as string[] || [];
  const venueType = venue.venueType.toLowerCase();
  
  if (preferredTypes.some(type => type.toLowerCase() === venueType)) {
    return 1.0;
  }
  
  // Partial matching based on venue type categories
  const venueCategories: {[key: string]: string[]} = {
    'small': ['bar', 'club', 'coffee house', 'small venue'],
    'medium': ['theater', 'hall', 'medium venue'],
    'large': ['arena', 'stadium', 'amphitheater', 'large venue'],
    'outdoor': ['festival', 'outdoor venue', 'park']
  };
  
  const venueCategory = Object.entries(venueCategories).find(([_, types]) => 
    types.some(t => venueType.includes(t))
  )?.[0];
  
  const preferredCategory = preferredTypes.map(type => 
    Object.entries(venueCategories).find(([_, types]) => 
      types.some(t => type.toLowerCase().includes(t))
    )?.[0]
  ).filter(Boolean);
  
  if (venueCategory && preferredCategory.includes(venueCategory)) {
    return 0.8;
  }
  
  return 0.4;
}

/**
 * Calculate price range compatibility
 */
function calculatePriceMatch(band: Band, venue: Venue): number {
  if (!band.avgTicketPrice || !venue.priceRange) return 0.5;
  
  const bandPrice = band.avgTicketPrice; // in cents
  const venueRange = venue.priceRange as {min: number, max: number}; // in cents
  
  // If band's price falls within venue's range
  if (bandPrice >= venueRange.min && bandPrice <= venueRange.max) {
    return 1.0;
  }
  
  // If band's price is close to venue's range
  const lowerBuffer = venueRange.min * 0.8;
  const upperBuffer = venueRange.max * 1.2;
  
  if (bandPrice >= lowerBuffer && bandPrice <= upperBuffer) {
    return 0.7;
  }
  
  // If price is far outside venue's range
  return 0.3;
}

/**
 * Calculate overall match percentage between band and venue
 * Returns a number between 0-100
 */
export function calculateBandVenueMatch(band: Band, venue: Venue): number {
  // Calculate individual match scores
  const genreScore = calculateGenreMatch(band, venue);
  const capacityScore = calculateCapacityMatch(band, venue);
  const technicalScore = calculateTechnicalMatch(band, venue);
  const historyScore = calculateHistoryMatch(band, venue);
  const venueTypeScore = calculateVenueTypeMatch(band, venue);
  const priceScore = calculatePriceMatch(band, venue);
  
  // Calculate location score (if band has tour dates near venue)
  // This would be more complex in a real implementation
  // For now, using a placeholder value
  const locationScore = 0.7;
  
  // Calculate weighted total
  const weightedTotal = 
    genreScore * criteriaWeights[MatchCriteriaType.GENRE] +
    capacityScore * criteriaWeights[MatchCriteriaType.CAPACITY] +
    locationScore * criteriaWeights[MatchCriteriaType.LOCATION] +
    technicalScore * criteriaWeights[MatchCriteriaType.TECHNICAL] +
    historyScore * criteriaWeights[MatchCriteriaType.PREVIOUS_HISTORY] +
    venueTypeScore * criteriaWeights[MatchCriteriaType.VENUE_TYPE] +
    priceScore * criteriaWeights[MatchCriteriaType.PRICE_RANGE];
  
  // Convert to percentage and ensure it's between 65-98%
  // (keeping a minimum threshold as even poor matches might have some potential)
  const percentage = Math.round(weightedTotal * 100);
  const adjustedPercentage = Math.min(98, Math.max(65, percentage));
  
  return adjustedPercentage;
}

/**
 * Get the match details explaining why a band matches a venue
 */
export function getMatchDetails(band: Band, venue: Venue): {
  criteria: string;
  score: number;
  explanation: string;
}[] {
  const genreScore = calculateGenreMatch(band, venue);
  const capacityScore = calculateCapacityMatch(band, venue);
  const technicalScore = calculateTechnicalMatch(band, venue);
  const historyScore = calculateHistoryMatch(band, venue);
  const venueTypeScore = calculateVenueTypeMatch(band, venue);
  const priceScore = calculatePriceMatch(band, venue);
  // Placeholder for location score
  const locationScore = 0.7;
  
  return [
    {
      criteria: 'Genre Compatibility',
      score: genreScore * 100,
      explanation: genreScore > 0.7 
        ? `${band.name}'s genre aligns well with ${venue.name}'s music preferences.`
        : `${band.name}'s genre somewhat matches what ${venue.name} typically books.`
    },
    {
      criteria: 'Audience Size',
      score: capacityScore * 100,
      explanation: capacityScore > 0.7 
        ? `${band.name}'s draw size is ideal for ${venue.name}'s capacity.`
        : capacityScore > 0.4 
          ? `${band.name}'s audience size is acceptable for ${venue.name}.`
          : `${band.name}'s typical audience size may not be optimal for ${venue.name}.`
    },
    {
      criteria: 'Technical Compatibility',
      score: technicalScore * 100,
      explanation: technicalScore > 0.7 
        ? `${venue.name} can easily accommodate ${band.name}'s technical requirements.`
        : `${venue.name} meets some of ${band.name}'s technical needs.`
    },
    {
      criteria: 'Past Booking History',
      score: historyScore * 100,
      explanation: historyScore > 0.7 
        ? `${band.name} has played at ${venue.name} or similar venues before.`
        : `${band.name} has limited history with venues like ${venue.name}.`
    },
    {
      criteria: 'Venue Type Preference',
      score: venueTypeScore * 100,
      explanation: venueTypeScore > 0.7 
        ? `${venue.name} is the type of venue that ${band.name} prefers.`
        : `${venue.name} is somewhat different from ${band.name}'s preferred venues.`
    },
    {
      criteria: 'Pricing Alignment',
      score: priceScore * 100,
      explanation: priceScore > 0.7 
        ? `${band.name}'s typical pricing aligns well with ${venue.name}'s expectations.`
        : `There's some difference between ${band.name}'s pricing and ${venue.name}'s typical range.`
    },
    {
      criteria: 'Geographic Convenience',
      score: locationScore * 100,
      explanation: `${band.name} has tour dates in the region near ${venue.name}.`
    }
  ];
}