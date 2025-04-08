import { Request, Response, Router } from "express";
import { db } from "../db";
import {
  venues,
  venueRelationshipTypes,
  venueRelationships,
  venueClusters,
  venueClusterMembers,
  routingPatterns,
  sharedBookings,
  collaborativeOffers,
  offerParticipants,
  routingGaps,
  venueNotificationPreferences,
  insertVenueRelationshipSchema,
  insertVenueClusterSchema,
  insertVenueClusterMemberSchema,
  insertRoutingPatternSchema,
  insertSharedBookingSchema,
  insertCollaborativeOfferSchema,
  insertOfferParticipantSchema,
  insertRoutingGapSchema,
  insertVenueNotificationPreferenceSchema
} from "../../shared/schema";
import { eq, and, or, gte, lte, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { calculateDistance } from "../utils/geo-utils";

const router = Router();

// Get all venue relationship types
router.get("/relationship-types", async (_req: Request, res: Response) => {
  try {
    const types = await db.select().from(venueRelationshipTypes);
    return res.json(types);
  } catch (error) {
    console.error("Error fetching venue relationship types:", error);
    return res.status(500).json({ error: "Failed to fetch venue relationship types" });
  }
});

// Get venue relationships for a specific venue
router.get("/relationships/:venueId", async (req: Request, res: Response) => {
  try {
    const venueId = parseInt(req.params.venueId);
    if (isNaN(venueId)) {
      return res.status(400).json({ error: "Invalid venue ID" });
    }

    // Get relationships where the venue is either venue1 or venue2
    const relationships = await db
      .select({
        id: venueRelationships.id,
        venue1: venueRelationships.venueId1,
        venue2: venueRelationships.venueId2,
        relationshipTypeId: venueRelationships.relationshipTypeId,
        strength: venueRelationships.strength,
        status: venueRelationships.status,
        notes: venueRelationships.notes
      })
      .from(venueRelationships)
      .where(
        or(
          eq(venueRelationships.venueId1, venueId),
          eq(venueRelationships.venueId2, venueId)
        )
      );

    // Get all related venue IDs
    const relatedVenueIds = new Set<number>();
    relationships.forEach(rel => {
      if (rel.venue1 === venueId) {
        relatedVenueIds.add(rel.venue2);
      } else {
        relatedVenueIds.add(rel.venue1);
      }
    });

    // Get venue details for all related venues
    const relatedVenues = await db
      .select()
      .from(venues)
      .where(inArray(venues.id, Array.from(relatedVenueIds)));

    // Get relationship type details
    const relationshipTypeIds = relationships
      .map(rel => rel.relationshipTypeId)
      .filter((id): id is number => id !== null);

    const relationshipTypes = relationshipTypeIds.length > 0 
      ? await db
          .select()
          .from(venueRelationshipTypes)
          .where(inArray(venueRelationshipTypes.id, relationshipTypeIds))
      : [];

    // Create a map of venue IDs to venue details
    const venueMap = new Map();
    relatedVenues.forEach(venue => {
      venueMap.set(venue.id, venue);
    });

    // Create a map of relationship type IDs to relationship type details
    const relationshipTypeMap = new Map();
    relationshipTypes.forEach(type => {
      relationshipTypeMap.set(type.id, type);
    });

    // Enrich relationships with venue and relationship type details
    const enrichedRelationships = relationships.map(rel => {
      const otherVenueId = rel.venue1 === venueId ? rel.venue2 : rel.venue1;
      const otherVenue = venueMap.get(otherVenueId);
      const relType = rel.relationshipTypeId ? relationshipTypeMap.get(rel.relationshipTypeId) : null;

      return {
        ...rel,
        otherVenue,
        relationshipType: relType
      };
    });

    return res.json(enrichedRelationships);
  } catch (error) {
    console.error("Error fetching venue relationships:", error);
    return res.status(500).json({ error: "Failed to fetch venue relationships" });
  }
});

// Create a new venue relationship
router.post("/relationships", async (req: Request, res: Response) => {
  try {
    const validationResult = insertVenueRelationshipSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid venue relationship data", 
        details: validationResult.error.errors 
      });
    }

    const relationshipData = validationResult.data;

    // Check if venues exist
    const venue1 = await db.select().from(venues).where(eq(venues.id, relationshipData.venueId1)).limit(1);
    const venue2 = await db.select().from(venues).where(eq(venues.id, relationshipData.venueId2)).limit(1);

    if (venue1.length === 0 || venue2.length === 0) {
      return res.status(404).json({ error: "One or both venues do not exist" });
    }

    // Check if relationship already exists
    const existingRelationship = await db
      .select()
      .from(venueRelationships)
      .where(
        and(
          eq(venueRelationships.venueId1, relationshipData.venueId1),
          eq(venueRelationships.venueId2, relationshipData.venueId2)
        )
      )
      .limit(1);

    if (existingRelationship.length > 0) {
      return res.status(409).json({ 
        error: "Relationship already exists", 
        existingRelationship: existingRelationship[0] 
      });
    }

    // Create the relationship
    const newRelationship = await db.insert(venueRelationships).values(relationshipData).returning();
    return res.status(201).json(newRelationship[0]);
  } catch (error) {
    console.error("Error creating venue relationship:", error);
    return res.status(500).json({ error: "Failed to create venue relationship" });
  }
});

// Update a venue relationship
router.patch("/relationships/:id", async (req: Request, res: Response) => {
  try {
    const relationshipId = parseInt(req.params.id);
    if (isNaN(relationshipId)) {
      return res.status(400).json({ error: "Invalid relationship ID" });
    }

    // Get the existing relationship
    const existingRelationship = await db
      .select()
      .from(venueRelationships)
      .where(eq(venueRelationships.id, relationshipId))
      .limit(1);

    if (existingRelationship.length === 0) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    // Update the relationship
    const updatedRelationship = await db
      .update(venueRelationships)
      .set(req.body)
      .where(eq(venueRelationships.id, relationshipId))
      .returning();

    return res.json(updatedRelationship[0]);
  } catch (error) {
    console.error("Error updating venue relationship:", error);
    return res.status(500).json({ error: "Failed to update venue relationship" });
  }
});

// Delete a venue relationship
router.delete("/relationships/:id", async (req: Request, res: Response) => {
  try {
    const relationshipId = parseInt(req.params.id);
    if (isNaN(relationshipId)) {
      return res.status(400).json({ error: "Invalid relationship ID" });
    }

    // Check if relationship exists
    const existingRelationship = await db
      .select()
      .from(venueRelationships)
      .where(eq(venueRelationships.id, relationshipId))
      .limit(1);

    if (existingRelationship.length === 0) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    // Delete the relationship
    await db
      .delete(venueRelationships)
      .where(eq(venueRelationships.id, relationshipId));

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting venue relationship:", error);
    return res.status(500).json({ error: "Failed to delete venue relationship" });
  }
});

// Get all venue clusters
router.get("/clusters", async (_req: Request, res: Response) => {
  try {
    const clusters = await db.select().from(venueClusters);
    return res.json(clusters);
  } catch (error) {
    console.error("Error fetching venue clusters:", error);
    return res.status(500).json({ error: "Failed to fetch venue clusters" });
  }
});

// Get a specific venue cluster with its members
router.get("/clusters/:id", async (req: Request, res: Response) => {
  try {
    const clusterId = parseInt(req.params.id);
    if (isNaN(clusterId)) {
      return res.status(400).json({ error: "Invalid cluster ID" });
    }

    // Get the cluster
    const cluster = await db
      .select()
      .from(venueClusters)
      .where(eq(venueClusters.id, clusterId))
      .limit(1);

    if (cluster.length === 0) {
      return res.status(404).json({ error: "Cluster not found" });
    }

    // Get cluster members
    const members = await db
      .select({
        clusterId: venueClusterMembers.clusterId,
        venueId: venueClusterMembers.venueId,
        addedAt: venueClusterMembers.addedAt
      })
      .from(venueClusterMembers)
      .where(eq(venueClusterMembers.clusterId, clusterId));

    // Get venue details for all members
    const venueIds = members.map(member => member.venueId);
    const venueDetails = venueIds.length > 0
      ? await db.select().from(venues).where(inArray(venues.id, venueIds))
      : [];

    // Create a map of venue IDs to venue details
    const venueMap = new Map();
    venueDetails.forEach(venue => {
      venueMap.set(venue.id, venue);
    });

    // Enrich members with venue details
    const enrichedMembers = members.map(member => ({
      ...member,
      venue: venueMap.get(member.venueId)
    }));

    return res.json({
      ...cluster[0],
      members: enrichedMembers
    });
  } catch (error) {
    console.error("Error fetching venue cluster:", error);
    return res.status(500).json({ error: "Failed to fetch venue cluster" });
  }
});

// Create a new venue cluster
router.post("/clusters", async (req: Request, res: Response) => {
  try {
    const validationResult = insertVenueClusterSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid venue cluster data", 
        details: validationResult.error.errors 
      });
    }

    const clusterData = validationResult.data;
    const newCluster = await db.insert(venueClusters).values(clusterData).returning();
    return res.status(201).json(newCluster[0]);
  } catch (error) {
    console.error("Error creating venue cluster:", error);
    return res.status(500).json({ error: "Failed to create venue cluster" });
  }
});

// Add a venue to a cluster
router.post("/clusters/:clusterId/members", async (req: Request, res: Response) => {
  try {
    const clusterId = parseInt(req.params.clusterId);
    if (isNaN(clusterId)) {
      return res.status(400).json({ error: "Invalid cluster ID" });
    }

    const validationSchema = z.object({
      venueId: z.number()
    });

    const validationResult = validationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid data", 
        details: validationResult.error.errors 
      });
    }

    const { venueId } = validationResult.data;

    // Check if cluster exists
    const cluster = await db
      .select()
      .from(venueClusters)
      .where(eq(venueClusters.id, clusterId))
      .limit(1);

    if (cluster.length === 0) {
      return res.status(404).json({ error: "Cluster not found" });
    }

    // Check if venue exists
    const venue = await db
      .select()
      .from(venues)
      .where(eq(venues.id, venueId))
      .limit(1);

    if (venue.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Check if venue is already in the cluster
    const existingMember = await db
      .select()
      .from(venueClusterMembers)
      .where(
        and(
          eq(venueClusterMembers.clusterId, clusterId),
          eq(venueClusterMembers.venueId, venueId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return res.status(409).json({ 
        error: "Venue is already a member of this cluster" 
      });
    }

    // Add venue to cluster
    const newMember = await db
      .insert(venueClusterMembers)
      .values({
        clusterId,
        venueId
      })
      .returning();

    return res.status(201).json({
      ...newMember[0],
      venue: venue[0]
    });
  } catch (error) {
    console.error("Error adding venue to cluster:", error);
    return res.status(500).json({ error: "Failed to add venue to cluster" });
  }
});

// Remove a venue from a cluster
router.delete("/clusters/:clusterId/members/:venueId", async (req: Request, res: Response) => {
  try {
    const clusterId = parseInt(req.params.clusterId);
    const venueId = parseInt(req.params.venueId);
    
    if (isNaN(clusterId) || isNaN(venueId)) {
      return res.status(400).json({ error: "Invalid cluster ID or venue ID" });
    }

    // Check if membership exists
    const existingMember = await db
      .select()
      .from(venueClusterMembers)
      .where(
        and(
          eq(venueClusterMembers.clusterId, clusterId),
          eq(venueClusterMembers.venueId, venueId)
        )
      )
      .limit(1);

    if (existingMember.length === 0) {
      return res.status(404).json({ error: "Venue is not a member of this cluster" });
    }

    // Remove venue from cluster
    await db
      .delete(venueClusterMembers)
      .where(
        and(
          eq(venueClusterMembers.clusterId, clusterId),
          eq(venueClusterMembers.venueId, venueId)
        )
      );

    return res.status(204).send();
  } catch (error) {
    console.error("Error removing venue from cluster:", error);
    return res.status(500).json({ error: "Failed to remove venue from cluster" });
  }
});

// Get routing patterns
router.get("/routing-patterns", async (_req: Request, res: Response) => {
  try {
    const patterns = await db
      .select({
        id: routingPatterns.id,
        sourceVenueId: routingPatterns.sourceVenueId,
        destinationVenueId: routingPatterns.destinationVenueId,
        frequency: routingPatterns.frequency,
        averageDaysGap: routingPatterns.averageDaysGap,
        confidenceScore: routingPatterns.confidenceScore,
        lastObserved: routingPatterns.lastObserved
      })
      .from(routingPatterns);

    return res.json(patterns);
  } catch (error) {
    console.error("Error fetching routing patterns:", error);
    return res.status(500).json({ error: "Failed to fetch routing patterns" });
  }
});

// Get routing patterns for a specific venue
router.get("/routing-patterns/venue/:venueId", async (req: Request, res: Response) => {
  try {
    const venueId = parseInt(req.params.venueId);
    if (isNaN(venueId)) {
      return res.status(400).json({ error: "Invalid venue ID" });
    }

    // Get patterns where the venue is either source or destination
    const patterns = await db
      .select({
        id: routingPatterns.id,
        sourceVenueId: routingPatterns.sourceVenueId,
        destinationVenueId: routingPatterns.destinationVenueId,
        frequency: routingPatterns.frequency,
        averageDaysGap: routingPatterns.averageDaysGap,
        confidenceScore: routingPatterns.confidenceScore,
        lastObserved: routingPatterns.lastObserved
      })
      .from(routingPatterns)
      .where(
        or(
          eq(routingPatterns.sourceVenueId, venueId),
          eq(routingPatterns.destinationVenueId, venueId)
        )
      );

    // Get all related venue IDs
    const venueIds = new Set<number>();
    patterns.forEach(pattern => {
      venueIds.add(pattern.sourceVenueId);
      venueIds.add(pattern.destinationVenueId);
    });
    venueIds.delete(venueId); // Remove the query venue

    // Get venue details for all related venues
    const venueDetails = venueIds.size > 0
      ? await db.select().from(venues).where(inArray(venues.id, Array.from(venueIds)))
      : [];

    // Create a map of venue IDs to venue details
    const venueMap = new Map();
    venueDetails.forEach(venue => {
      venueMap.set(venue.id, venue);
    });

    // Enrich patterns with venue details
    const enrichedPatterns = patterns.map(pattern => {
      const otherVenueId = pattern.sourceVenueId === venueId 
        ? pattern.destinationVenueId 
        : pattern.sourceVenueId;
      
      const otherVenue = venueMap.get(otherVenueId);
      const isSource = pattern.sourceVenueId === venueId;

      return {
        ...pattern,
        otherVenue,
        isSource
      };
    });

    return res.json(enrichedPatterns);
  } catch (error) {
    console.error("Error fetching venue routing patterns:", error);
    return res.status(500).json({ error: "Failed to fetch venue routing patterns" });
  }
});

// Create the geographic clusters based on venue coordinates
router.post("/auto-cluster", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      distanceThresholdKm: z.number().default(100),
      minVenuesPerCluster: z.number().default(2),
      maxVenuesPerCluster: z.number().optional(),
      namePrefix: z.string().default("Cluster")
    });

    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid parameters",
        details: validationResult.error.errors
      });
    }

    const { 
      distanceThresholdKm, 
      minVenuesPerCluster, 
      maxVenuesPerCluster,
      namePrefix 
    } = validationResult.data;

    // Get all venues with coordinates
    const allVenues = await db
      .select({
        id: venues.id,
        name: venues.name,
        latitude: venues.latitude,
        longitude: venues.longitude,
        city: venues.city,
        state: venues.state
      })
      .from(venues);

    // Filter out venues without valid coordinates
    const venuesWithCoords = allVenues.filter(venue => {
      return venue.latitude && venue.longitude && 
             !isNaN(parseFloat(venue.latitude)) && 
             !isNaN(parseFloat(venue.longitude));
    });

    // Create clusters based on geographic proximity
    const clusters = [];
    const assignedVenues = new Set<number>();

    for (const venue of venuesWithCoords) {
      if (assignedVenues.has(venue.id)) continue;

      // Find all venues within the distance threshold
      const nearbyVenues = venuesWithCoords
        .filter(otherVenue => {
          if (otherVenue.id === venue.id || assignedVenues.has(otherVenue.id)) return false;
          
          const distance = calculateDistance(
            parseFloat(venue.latitude), 
            parseFloat(venue.longitude),
            parseFloat(otherVenue.latitude), 
            parseFloat(otherVenue.longitude)
          );
          
          return distance <= distanceThresholdKm;
        })
        .sort((a, b) => {
          // Sort by distance from the seed venue
          const distA = calculateDistance(
            parseFloat(venue.latitude), 
            parseFloat(venue.longitude),
            parseFloat(a.latitude), 
            parseFloat(a.longitude)
          );
          
          const distB = calculateDistance(
            parseFloat(venue.latitude), 
            parseFloat(venue.longitude),
            parseFloat(b.latitude), 
            parseFloat(b.longitude)
          );
          
          return distA - distB;
        });

      // If we have enough venues for a cluster (including the seed venue)
      if (nearbyVenues.length + 1 >= minVenuesPerCluster) {
        // Limit the number of venues if maxVenuesPerCluster is specified
        const clusterVenues = maxVenuesPerCluster 
          ? [venue, ...nearbyVenues.slice(0, maxVenuesPerCluster - 1)]
          : [venue, ...nearbyVenues];
        
        // Calculate the cluster center (average lat/lng)
        const center = clusterVenues.reduce(
          (acc, v) => {
            return {
              lat: acc.lat + parseFloat(v.latitude),
              lng: acc.lng + parseFloat(v.longitude)
            };
          },
          { lat: 0, lng: 0 }
        );
        
        center.lat /= clusterVenues.length;
        center.lng /= clusterVenues.length;
        
        // Get the primary state/region for the cluster
        const stateCount = clusterVenues.reduce((acc, v) => {
          acc[v.state] = (acc[v.state] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        let primaryState = Object.keys(stateCount).reduce((a, b) => 
          stateCount[a] > stateCount[b] ? a : b
        );
        
        // Create a sensible name for the cluster
        const clusterName = `${namePrefix} - ${primaryState}`;
        
        // Calculate max distance from center (for radius)
        let maxDist = 0;
        for (const v of clusterVenues) {
          const dist = calculateDistance(
            center.lat, 
            center.lng,
            parseFloat(v.latitude), 
            parseFloat(v.longitude)
          );
          maxDist = Math.max(maxDist, dist);
        }
        
        // Add to clusters
        clusters.push({
          name: clusterName,
          description: `${clusterVenues.length} venues in ${primaryState}`,
          centerLatitude: center.lat.toString(),
          centerLongitude: center.lng.toString(),
          radiusKm: Math.ceil(maxDist),
          venues: clusterVenues
        });
        
        // Mark all venues in this cluster as assigned
        for (const v of clusterVenues) {
          assignedVenues.add(v.id);
        }
      }
    }

    // Save the clusters to the database
    const savedClusters = [];
    for (const cluster of clusters) {
      const { venues: clusterVenues, ...clusterData } = cluster;
      
      // Create the cluster
      const insertedCluster = await db
        .insert(venueClusters)
        .values(clusterData)
        .returning();
      
      const clusterId = insertedCluster[0].id;
      
      // Add venues to the cluster
      for (const venue of clusterVenues) {
        await db
          .insert(venueClusterMembers)
          .values({
            clusterId,
            venueId: venue.id
          });
      }
      
      savedClusters.push({
        ...insertedCluster[0],
        venues: clusterVenues
      });
    }

    return res.status(201).json({
      clusters: savedClusters,
      totalClusters: savedClusters.length,
      totalVenuesAssigned: assignedVenues.size
    });
  } catch (error) {
    console.error("Error creating automatic clusters:", error);
    return res.status(500).json({ error: "Failed to create automatic clusters" });
  }
});

// Get routing gaps
router.get("/routing-gaps", async (req: Request, res: Response) => {
  try {
    // Filter by status
    let query = db.select().from(routingGaps);
    
    if (req.query.status) {
      query = query.where(eq(routingGaps.status, req.query.status as string));
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query = query.where(
        and(
          gte(routingGaps.gapStartDate, req.query.startDate as string),
          lte(routingGaps.gapEndDate, req.query.endDate as string)
        )
      );
    }
    
    const gaps = await query;
    return res.json(gaps);
  } catch (error) {
    console.error("Error fetching routing gaps:", error);
    return res.status(500).json({ error: "Failed to fetch routing gaps" });
  }
});

// Get routing gaps relevant to a specific venue
router.get("/routing-gaps/venue/:venueId", async (req: Request, res: Response) => {
  try {
    const venueId = parseInt(req.params.venueId);
    if (isNaN(venueId)) {
      return res.status(400).json({ error: "Invalid venue ID" });
    }

    // Get the venue
    const venue = await db
      .select({
        id: venues.id,
        name: venues.name,
        latitude: venues.latitude,
        longitude: venues.longitude
      })
      .from(venues)
      .where(eq(venues.id, venueId))
      .limit(1);

    if (venue.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Find gaps where this venue is explicitly listed or is within eligibleVenues
    const gaps = await db
      .select()
      .from(routingGaps)
      .where(
        or(
          eq(routingGaps.priorVenueId, venueId),
          eq(routingGaps.nextVenueId, venueId),
          sql`${venueId} = ANY(${routingGaps.eligibleVenues})`
        )
      );

    // For each gap, get the prior and next venue details
    const venueIds = new Set<number>();
    gaps.forEach(gap => {
      venueIds.add(gap.priorVenueId);
      venueIds.add(gap.nextVenueId);
    });

    const venueDetails = venueIds.size > 0
      ? await db
          .select({
            id: venues.id,
            name: venues.name,
            address: venues.address,
            city: venues.city,
            state: venues.state,
            latitude: venues.latitude,
            longitude: venues.longitude
          })
          .from(venues)
          .where(inArray(venues.id, Array.from(venueIds)))
      : [];

    // Create a map of venue IDs to venue details
    const venueMap = new Map();
    venueDetails.forEach(venue => {
      venueMap.set(venue.id, venue);
    });

    // Enrich gaps with venue details
    const enrichedGaps = gaps.map(gap => ({
      ...gap,
      priorVenue: venueMap.get(gap.priorVenueId),
      nextVenue: venueMap.get(gap.nextVenueId),
      isEligible: gap.eligibleVenues ? (gap.eligibleVenues as number[]).includes(venueId) : false
    }));

    return res.json(enrichedGaps);
  } catch (error) {
    console.error("Error fetching venue routing gaps:", error);
    return res.status(500).json({ error: "Failed to fetch venue routing gaps" });
  }
});

// Create a routing gap
router.post("/routing-gaps", async (req: Request, res: Response) => {
  try {
    const validationResult = insertRoutingGapSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid routing gap data", 
        details: validationResult.error.errors 
      });
    }

    const gapData = validationResult.data;
    const newGap = await db.insert(routingGaps).values(gapData).returning();
    return res.status(201).json(newGap[0]);
  } catch (error) {
    console.error("Error creating routing gap:", error);
    return res.status(500).json({ error: "Failed to create routing gap" });
  }
});

// Get shared bookings
router.get("/shared-bookings", async (req: Request, res: Response) => {
  try {
    // Filter by source venue
    let query = db.select().from(sharedBookings);
    
    if (req.query.venueId) {
      const venueId = parseInt(req.query.venueId as string);
      if (!isNaN(venueId)) {
        query = query.where(eq(sharedBookings.sourceVenueId, venueId));
      }
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query = query.where(
        and(
          gte(sharedBookings.bookingDate, req.query.startDate as string),
          lte(sharedBookings.bookingDate, req.query.endDate as string)
        )
      );
    }

    // Filter by sharing level
    if (req.query.sharingLevel) {
      query = query.where(eq(sharedBookings.sharingLevel, req.query.sharingLevel as string));
    }
    
    const bookings = await query;
    
    // Get source venue details
    const venueIds = bookings.map(booking => booking.sourceVenueId);
    const venueDetails = venueIds.length > 0
      ? await db
          .select({
            id: venues.id,
            name: venues.name,
            city: venues.city,
            state: venues.state
          })
          .from(venues)
          .where(inArray(venues.id, venueIds))
      : [];

    // Create a map of venue IDs to venue details
    const venueMap = new Map();
    venueDetails.forEach(venue => {
      venueMap.set(venue.id, venue);
    });

    // Enrich bookings with venue details
    const enrichedBookings = bookings.map(booking => ({
      ...booking,
      sourceVenue: venueMap.get(booking.sourceVenueId)
    }));
    
    return res.json(enrichedBookings);
  } catch (error) {
    console.error("Error fetching shared bookings:", error);
    return res.status(500).json({ error: "Failed to fetch shared bookings" });
  }
});

// Create a shared booking
router.post("/shared-bookings", async (req: Request, res: Response) => {
  try {
    const validationResult = insertSharedBookingSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid shared booking data", 
        details: validationResult.error.errors 
      });
    }

    const bookingData = validationResult.data;
    const newBooking = await db.insert(sharedBookings).values(bookingData).returning();
    return res.status(201).json(newBooking[0]);
  } catch (error) {
    console.error("Error creating shared booking:", error);
    return res.status(500).json({ error: "Failed to create shared booking" });
  }
});

// Get collaborative offers
router.get("/collaborative-offers", async (req: Request, res: Response) => {
  try {
    // Filter by venue
    let query = db.select().from(collaborativeOffers);
    
    if (req.query.venueId) {
      const venueId = parseInt(req.query.venueId as string);
      if (!isNaN(venueId)) {
        query = query.where(eq(collaborativeOffers.initiatingVenueId, venueId));
      }
    }
    
    // Filter by status
    if (req.query.status) {
      query = query.where(eq(collaborativeOffers.status, req.query.status as string));
    }
    
    const offers = await query;
    
    // Get all offer IDs
    const offerIds = offers.map(offer => offer.id);
    
    // Get participants for all offers
    const participants = offerIds.length > 0
      ? await db
          .select()
          .from(offerParticipants)
          .where(inArray(offerParticipants.offerId, offerIds))
      : [];
    
    // Get all venue IDs
    const venueIds = new Set<number>();
    offers.forEach(offer => venueIds.add(offer.initiatingVenueId));
    participants.forEach(participant => venueIds.add(participant.venueId));
    
    // Get venue details
    const venueDetails = venueIds.size > 0
      ? await db
          .select({
            id: venues.id,
            name: venues.name,
            city: venues.city,
            state: venues.state
          })
          .from(venues)
          .where(inArray(venues.id, Array.from(venueIds)))
      : [];
    
    // Create a map of venue IDs to venue details
    const venueMap = new Map();
    venueDetails.forEach(venue => {
      venueMap.set(venue.id, venue);
    });
    
    // Group participants by offer ID
    const participantsByOffer = participants.reduce((acc, participant) => {
      if (!acc[participant.offerId]) {
        acc[participant.offerId] = [];
      }
      acc[participant.offerId].push({
        ...participant,
        venue: venueMap.get(participant.venueId)
      });
      return acc;
    }, {} as Record<number, any[]>);
    
    // Enrich offers with venue details and participants
    const enrichedOffers = offers.map(offer => ({
      ...offer,
      initiatingVenue: venueMap.get(offer.initiatingVenueId),
      participants: participantsByOffer[offer.id] || []
    }));
    
    return res.json(enrichedOffers);
  } catch (error) {
    console.error("Error fetching collaborative offers:", error);
    return res.status(500).json({ error: "Failed to fetch collaborative offers" });
  }
});

// Create a collaborative offer
router.post("/collaborative-offers", async (req: Request, res: Response) => {
  try {
    const validationResult = insertCollaborativeOfferSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid collaborative offer data", 
        details: validationResult.error.errors 
      });
    }

    const offerData = validationResult.data;
    const newOffer = await db.insert(collaborativeOffers).values(offerData).returning();
    return res.status(201).json(newOffer[0]);
  } catch (error) {
    console.error("Error creating collaborative offer:", error);
    return res.status(500).json({ error: "Failed to create collaborative offer" });
  }
});

// Add a participant to a collaborative offer
router.post("/collaborative-offers/:offerId/participants", async (req: Request, res: Response) => {
  try {
    const offerId = parseInt(req.params.offerId);
    if (isNaN(offerId)) {
      return res.status(400).json({ error: "Invalid offer ID" });
    }

    const validationResult = insertOfferParticipantSchema.safeParse({
      ...req.body,
      offerId
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid participant data", 
        details: validationResult.error.errors 
      });
    }

    const participantData = validationResult.data;
    
    // Check if offer exists
    const offer = await db
      .select()
      .from(collaborativeOffers)
      .where(eq(collaborativeOffers.id, offerId))
      .limit(1);

    if (offer.length === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Check if venue exists
    const venue = await db
      .select()
      .from(venues)
      .where(eq(venues.id, participantData.venueId))
      .limit(1);

    if (venue.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Check if participant already exists
    const existingParticipant = await db
      .select()
      .from(offerParticipants)
      .where(
        and(
          eq(offerParticipants.offerId, offerId),
          eq(offerParticipants.venueId, participantData.venueId)
        )
      )
      .limit(1);

    if (existingParticipant.length > 0) {
      return res.status(409).json({ 
        error: "Venue is already a participant in this offer" 
      });
    }

    // Add participant
    const newParticipant = await db
      .insert(offerParticipants)
      .values(participantData)
      .returning();

    return res.status(201).json({
      ...newParticipant[0],
      venue: venue[0]
    });
  } catch (error) {
    console.error("Error adding offer participant:", error);
    return res.status(500).json({ error: "Failed to add offer participant" });
  }
});

// Update a collaborative offer
router.patch("/collaborative-offers/:id", async (req: Request, res: Response) => {
  try {
    const offerId = parseInt(req.params.id);
    if (isNaN(offerId)) {
      return res.status(400).json({ error: "Invalid offer ID" });
    }

    // Check if offer exists
    const offer = await db
      .select()
      .from(collaborativeOffers)
      .where(eq(collaborativeOffers.id, offerId))
      .limit(1);

    if (offer.length === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Update the offer
    const updatedOffer = await db
      .update(collaborativeOffers)
      .set(req.body)
      .where(eq(collaborativeOffers.id, offerId))
      .returning();

    return res.json(updatedOffer[0]);
  } catch (error) {
    console.error("Error updating collaborative offer:", error);
    return res.status(500).json({ error: "Failed to update collaborative offer" });
  }
});

export { router as venueNetworkRouter };