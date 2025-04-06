/**
 * Represents a past performance at a venue
 */
export interface PastPerformance {
  id: string; // Generated unique ID
  artistName: string; // Name of the artist/band
  date: string; // ISO date string (YYYY-MM-DD)
  genre?: string; // Genre of the artist
  drawSize?: number; // Approximate attendance
  ticketPrice?: number; // Average ticket price in cents
  notes?: string; // Additional notes about the show
  poster?: string; // URL to poster image (if available)
  isSoldOut?: boolean; // Whether the show sold out
  isHeadliner?: boolean; // Whether this was the headlining act
}

/**
 * Type for the request to add a past performance
 */
export type AddPastPerformanceRequest = Omit<PastPerformance, 'id'>;

/**
 * Type for a collection of past performances grouped by year
 */
export interface PastPerformancesByYear {
  [year: string]: PastPerformance[];
}

/**
 * Helper function to generate a unique ID for a past performance
 */
export function generatePastPerformanceId(): string {
  return `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper function to group past performances by year
 */
export function groupPerformancesByYear(performances: PastPerformance[]): PastPerformancesByYear {
  return performances.reduce((acc, performance) => {
    const year = performance.date.substring(0, 4);
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(performance);
    return acc;
  }, {} as PastPerformancesByYear);
}