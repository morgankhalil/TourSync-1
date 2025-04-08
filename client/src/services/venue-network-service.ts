import { apiRequest } from "../lib/queryClient";

// Types
type VenueRelationship = {
  id: number;
  venueId1: number;
  venueId2: number;
  relationshipTypeId: number | null;
  strength: number;
  status: string;
  notes: string | null;
  otherVenue: any;
  relationshipType: any;
};

type VenueCluster = {
  id: number;
  name: string;
  description: string | null;
  regionCode: string;
  isStatic: boolean | null;
  centerLatitude: string | null;
  centerLongitude: string | null;
  radiusKm: number | null;
  createdAt: string;
  updatedAt: string | null;
  members?: Array<{
    clusterId: number;
    venueId: number;
    addedAt: string;
    venue: any;
  }>;
  venueCount?: number; // Used for regional clusters
};

type RoutingPattern = {
  id: number;
  sourceVenueId: number;
  destinationVenueId: number;
  frequency: number;
  averageDaysGap: number | null;
  confidenceScore: number;
  lastObserved: string | null;
  otherVenue?: any;
  isSource?: boolean;
};

type RoutingGap = {
  id: number;
  priorVenueId: number;
  nextVenueId: number;
  bandId: number | null;
  bandName: string;
  gapStartDate: string;
  gapEndDate: string;
  eligibleVenues: number[] | null;
  notifiedVenues: number[] | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  priorVenue?: any;
  nextVenue?: any;
  isEligible?: boolean;
};

type SharedBooking = {
  id: number;
  sourceVenueId: number;
  bandId: number | null;
  bandName: string;
  bookingDate: string;
  sharingLevel: string;
  confirmedStatus: string;
  sharerId: number | null;
  routeEligible: boolean;
  createdAt: string;
  contactInfo: string | null;
  sourceVenue?: any;
};

type CollaborativeOffer = {
  id: number;
  name: string;
  bandId: number | null;
  bandName: string;
  initiatingVenueId: number;
  dateRange: {
    start: string;
    end: string;
  };
  status: string;
  offerDetails: any | null;
  createdAt: string;
  expiresAt: string | null;
  initiatingVenue?: any;
  participants?: Array<{
    offerId: number;
    venueId: number;
    proposedDate: string | null;
    confirmationStatus: string;
    venueNotes: string | null;
    venueOffer: any | null;
    addedAt: string;
    venue: any;
  }>;
};

/**
 * Venue Relationship API functions
 */
export const getVenueRelationshipTypes = async (): Promise<any[]> => {
  return apiRequest({
    url: "/api/venue-network/relationship-types",
    method: "GET",
  });
};

export const getVenueRelationships = async (venueId: number): Promise<VenueRelationship[]> => {
  return apiRequest({
    url: `/api/venue-network/relationships/${venueId}`,
    method: "GET",
  });
};

export const createVenueRelationship = async (data: {
  venueId1: number;
  venueId2: number;
  relationshipTypeId?: number;
  strength?: number;
  notes?: string;
}): Promise<VenueRelationship> => {
  return apiRequest({
    url: "/api/venue-network/relationships",
    method: "POST",
    data,
  });
};

export const updateVenueRelationship = async (
  id: number,
  data: Partial<{
    relationshipTypeId: number;
    strength: number;
    notes: string;
    status: string;
  }>
): Promise<VenueRelationship> => {
  return apiRequest({
    url: `/api/venue-network/relationships/${id}`,
    method: "PATCH",
    data,
  });
};

export const deleteVenueRelationship = async (id: number): Promise<void> => {
  return apiRequest({
    url: `/api/venue-network/relationships/${id}`,
    method: "DELETE",
  });
};

/**
 * Venue Cluster API functions
 */
export const getVenueClusters = async (): Promise<VenueCluster[]> => {
  const response = await apiRequest("/api/venue-network/clusters", {
    method: "GET"
  });
  return response || [];
};

export const getVenueCluster = async (id: number): Promise<VenueCluster> => {
  return apiRequest({
    url: `/api/venue-network/clusters/${id}`,
    method: "GET",
  });
};

export const createVenueCluster = async (data: {
  name: string;
  description?: string;
  centerLatitude?: string;
  centerLongitude?: string;
  radiusKm?: number;
}): Promise<VenueCluster> => {
  return apiRequest({
    url: "/api/venue-network/clusters",
    method: "POST",
    data,
  });
};

export const addVenueToCluster = async (
  clusterId: number,
  venueId: number
): Promise<{ clusterId: number; venueId: number; addedAt: string; venue: any }> => {
  return apiRequest({
    url: `/api/venue-network/clusters/${clusterId}/members`,
    method: "POST",
    data: { venueId },
  });
};

export const removeVenueFromCluster = async (
  clusterId: number,
  venueId: number
): Promise<void> => {
  return apiRequest({
    url: `/api/venue-network/clusters/${clusterId}/members/${venueId}`,
    method: "DELETE",
  });
};

export const createAutomaticClusters = async (params: {
  distanceThresholdKm?: number;
  minVenuesPerCluster?: number;
  maxVenuesPerCluster?: number;
  namePrefix?: string;
}): Promise<{
  clusters: VenueCluster[];
  totalClusters: number;
  totalVenuesAssigned: number;
}> => {
  return apiRequest(
    "/api/venue-network/auto-cluster",
    {
      method: "POST",
      body: params,
    }
  );
};

/**
 * Creates static regional clusters based on predefined US geographic regions
 */
export const createRegionalClusters = async (): Promise<{
  clusters: VenueCluster[];
  totalClusters: number;
  totalVenuesAssigned: number;
}> => {
  return apiRequest(
    "/api/venue-network/create-regional-clusters",
    {
      method: "POST"
    }
  );
};

/**
 * Creates capacity-based venue clusters (small, medium, large)
 */
export const createCapacityClusters = async (): Promise<{
  clusters: VenueCluster[];
  totalClusters: number;
  totalVenuesAssigned: number;
}> => {
  return apiRequest(
    "/api/venue-network/create-capacity-clusters",
    {
      method: "POST"
    }
  );
};

/**
 * Routing Pattern API functions
 */
export const getRoutingPatterns = async (): Promise<RoutingPattern[]> => {
  return apiRequest({
    url: "/api/venue-network/routing-patterns",
    method: "GET",
  });
};

export const getVenueRoutingPatterns = async (venueId: number): Promise<RoutingPattern[]> => {
  return apiRequest({
    url: `/api/venue-network/routing-patterns/venue/${venueId}`,
    method: "GET",
  });
};

/**
 * Routing Gap API functions
 */
export const getRoutingGaps = async (params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<RoutingGap[]> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  
  return apiRequest({
    url: `/api/venue-network/routing-gaps${queryString}`,
    method: "GET",
  });
};

export const getVenueRoutingGaps = async (venueId: number): Promise<RoutingGap[]> => {
  return apiRequest({
    url: `/api/venue-network/routing-gaps/venue/${venueId}`,
    method: "GET",
  });
};

export const createRoutingGap = async (data: {
  priorVenueId: number;
  nextVenueId: number;
  bandName: string;
  gapStartDate: string;
  gapEndDate: string;
  bandId?: number;
  eligibleVenues?: number[];
  status?: string;
}): Promise<RoutingGap> => {
  return apiRequest({
    url: "/api/venue-network/routing-gaps",
    method: "POST",
    data,
  });
};

/**
 * Shared Booking API functions
 */
export const getSharedBookings = async (params?: {
  venueId?: number;
  startDate?: string;
  endDate?: string;
  sharingLevel?: string;
}): Promise<SharedBooking[]> => {
  const queryParams = new URLSearchParams();
  if (params?.venueId) queryParams.append("venueId", params.venueId.toString());
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.sharingLevel) queryParams.append("sharingLevel", params.sharingLevel);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  
  return apiRequest({
    url: `/api/venue-network/shared-bookings${queryString}`,
    method: "GET",
  });
};

export const createSharedBooking = async (data: {
  sourceVenueId: number;
  bandName: string;
  bookingDate: string;
  bandId?: number;
  sharingLevel?: string;
  confirmedStatus?: string;
  sharerId?: number;
  routeEligible?: boolean;
  contactInfo?: string;
}): Promise<SharedBooking> => {
  return apiRequest({
    url: "/api/venue-network/shared-bookings",
    method: "POST",
    data,
  });
};

/**
 * Collaborative Offer API functions
 */
export const getCollaborativeOffers = async (params?: {
  venueId?: number;
  status?: string;
}): Promise<CollaborativeOffer[]> => {
  const queryParams = new URLSearchParams();
  if (params?.venueId) queryParams.append("venueId", params.venueId.toString());
  if (params?.status) queryParams.append("status", params.status);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  
  return apiRequest({
    url: `/api/venue-network/collaborative-offers${queryString}`,
    method: "GET",
  });
};

export const createCollaborativeOffer = async (data: {
  name: string;
  bandName: string;
  initiatingVenueId: number;
  dateRange: { start: string; end: string };
  bandId?: number;
  status?: string;
  offerDetails?: any;
  expiresAt?: string;
}): Promise<CollaborativeOffer> => {
  return apiRequest({
    url: "/api/venue-network/collaborative-offers",
    method: "POST",
    data,
  });
};

export const addOfferParticipant = async (
  offerId: number,
  data: {
    venueId: number;
    proposedDate?: string;
    confirmationStatus?: string;
    venueNotes?: string;
    venueOffer?: any;
  }
): Promise<{
  offerId: number;
  venueId: number;
  proposedDate: string | null;
  confirmationStatus: string;
  venueNotes: string | null;
  venueOffer: any | null;
  addedAt: string;
  venue: any;
}> => {
  return apiRequest({
    url: `/api/venue-network/collaborative-offers/${offerId}/participants`,
    method: "POST",
    data,
  });
};

export const updateCollaborativeOffer = async (
  id: number,
  data: Partial<{
    name: string;
    status: string;
    offerDetails: any;
    expiresAt: string;
  }>
): Promise<CollaborativeOffer> => {
  return apiRequest({
    url: `/api/venue-network/collaborative-offers/${id}`,
    method: "PATCH",
    data,
  });
};