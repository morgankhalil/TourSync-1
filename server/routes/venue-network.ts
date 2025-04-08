import { Request, Response } from "express";
import { db } from "../db";
import { SQL, and, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import {
  venueRelationships,
  venueRelationshipTypes,
  venueClusters,
  venueClusterMembers,
  routingPatterns,
  routingGaps,
  sharedBookings,
  collaborativeOffers,
  venues
} from "../../shared/schema";
import { US_REGIONS, getRegionForState, regionToCluster, determineVenueRegion } from "../utils/region-utils";

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 * @param deg Angle in degrees
 * @returns Angle in radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Register venue network routes
 */
export async function registerVenueNetworkRoutes(app: any) {
  /**
   * Venue Relationship Types API
   */
  app.get("/api/venue-network/relationship-types", async (req: Request, res: Response) => {
    try {
      const types = await db.select().from(venueRelationshipTypes);
      res.json(types);
    } catch (error) {
      console.error("Error fetching venue relationship types:", error);
      res.status(500).json({ error: "Failed to fetch venue relationship types" });
    }
  });

  app.post("/api/venue-network/relationship-types", async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const result = await db.insert(venueRelationshipTypes).values({
        name,
        description
      }).returning();

      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating venue relationship type:", error);
      res.status(500).json({ error: "Failed to create venue relationship type" });
    }
  });

  /**
   * Venue Relationships API
   */
  app.get("/api/venue-network/relationships/:venueId", async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.venueId);

      if (isNaN(venueId)) {
        return res.status(400).json({ error: "Invalid venue ID" });
      }

      // Find all relationships where the venue is either venueId1 or venueId2
      const relationshipsAsVenue1 = await db
        .select()
        .from(venueRelationships)
        .leftJoin(venues, eq(venueRelationships.venueId2, venues.id))
        .leftJoin(venueRelationshipTypes, eq(venueRelationships.relationshipTypeId, venueRelationshipTypes.id))
        .where(eq(venueRelationships.venueId1, venueId));

      const relationshipsAsVenue2 = await db
        .select()
        .from(venueRelationships)
        .leftJoin(venues, eq(venueRelationships.venueId1, venues.id))
        .leftJoin(venueRelationshipTypes, eq(venueRelationships.relationshipTypeId, venueRelationshipTypes.id))
        .where(eq(venueRelationships.venueId2, venueId));

      // Transform the results to have consistent format
      const relationships = [
        ...relationshipsAsVenue1.map(r => ({
          ...r.venue_relationships,
          otherVenue: r.venues,
          relationshipType: r.venue_relationship_types
        })),
        ...relationshipsAsVenue2.map(r => ({
          ...r.venue_relationships,
          // Swap venueId1 and venueId2 for consistent representation
          venueId1: r.venue_relationships.venueId2,
          venueId2: r.venue_relationships.venueId1,
          otherVenue: r.venues,
          relationshipType: r.venue_relationship_types
        }))
      ];

      res.json(relationships);
    } catch (error) {
      console.error("Error fetching venue relationships:", error);
      res.status(500).json({ error: "Failed to fetch venue relationships" });
    }
  });

  app.post("/api/venue-network/relationships", async (req: Request, res: Response) => {
    try {
      const { venueId1, venueId2, relationshipTypeId, strength, notes } = req.body;

      if (!venueId1 || !venueId2) {
        return res.status(400).json({ error: "Both venue IDs are required" });
      }

      if (venueId1 === venueId2) {
        return res.status(400).json({ error: "Cannot create a relationship with the same venue" });
      }

      // Check if relationship already exists
      const existingRelationship = await db
        .select()
        .from(venueRelationships)
        .where(
          sql`(${eq(venueRelationships.venueId1, venueId1)} AND ${eq(venueRelationships.venueId2, venueId2)}) OR 
              (${eq(venueRelationships.venueId1, venueId2)} AND ${eq(venueRelationships.venueId2, venueId1)})`
        );

      if (existingRelationship.length > 0) {
        return res.status(409).json({ 
          error: "A relationship between these venues already exists",
          existingRelationship: existingRelationship[0]
        });
      }

      // Get venue details for response
      const venue2Details = await db
        .select()
        .from(venues)
        .where(eq(venues.id, venueId2));

      if (venue2Details.length === 0) {
        return res.status(404).json({ error: "Venue 2 not found" });
      }

      // Get relationship type details for response
      let relationshipTypeDetails = null;
      if (relationshipTypeId) {
        const typeResult = await db
          .select()
          .from(venueRelationshipTypes)
          .where(eq(venueRelationshipTypes.id, relationshipTypeId));

        if (typeResult.length > 0) {
          relationshipTypeDetails = typeResult[0];
        }
      }

      // Create the relationship
      const result = await db.insert(venueRelationships).values({
        venueId1: venueId1,
        venueId2: venueId2,
        relationshipTypeId: relationshipTypeId || null,
        strength: strength || 5, // Default to medium strength
        status: 'active',
        notes: notes || null
      }).returning();

      // Return the created relationship with the other venue and relationship type details
      res.status(201).json({
        ...result[0],
        otherVenue: venue2Details[0],
        relationshipType: relationshipTypeDetails
      });
    } catch (error) {
      console.error("Error creating venue relationship:", error);
      res.status(500).json({ error: "Failed to create venue relationship" });
    }
  });

  app.patch("/api/venue-network/relationships/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { relationshipTypeId, strength, status, notes } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid relationship ID" });
      }

      // Check if relationship exists
      const existingRelationship = await db
        .select()
        .from(venueRelationships)
        .where(eq(venueRelationships.id, id));

      if (existingRelationship.length === 0) {
        return res.status(404).json({ error: "Relationship not found" });
      }

      // Update the relationship
      const result = await db
        .update(venueRelationships)
        .set({
          relationshipTypeId: relationshipTypeId !== undefined ? relationshipTypeId : existingRelationship[0].relationshipTypeId,
          strength: strength !== undefined ? strength : existingRelationship[0].strength,
          status: status || existingRelationship[0].status,
          notes: notes !== undefined ? notes : existingRelationship[0].notes
        })
        .where(eq(venueRelationships.id, id))
        .returning();

      // Get venue and relationship type details for response
      const venue2Details = await db
        .select()
        .from(venues)
        .where(eq(venues.id, result[0].venueId2));

      let relationshipTypeDetails = null;
      if (result[0].relationshipTypeId) {
        const typeResult = await db
          .select()
          .from(venueRelationshipTypes)
          .where(eq(venueRelationshipTypes.id, result[0].relationshipTypeId));

        if (typeResult.length > 0) {
          relationshipTypeDetails = typeResult[0];
        }
      }

      res.json({
        ...result[0],
        otherVenue: venue2Details[0],
        relationshipType: relationshipTypeDetails
      });
    } catch (error) {
      console.error("Error updating venue relationship:", error);
      res.status(500).json({ error: "Failed to update venue relationship" });
    }
  });

  app.delete("/api/venue-network/relationships/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid relationship ID" });
      }

      // Check if relationship exists
      const existingRelationship = await db
        .select()
        .from(venueRelationships)
        .where(eq(venueRelationships.id, id));

      if (existingRelationship.length === 0) {
        return res.status(404).json({ error: "Relationship not found" });
      }

      // Delete the relationship
      await db
        .delete(venueRelationships)
        .where(eq(venueRelationships.id, id));

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting venue relationship:", error);
      res.status(500).json({ error: "Failed to delete venue relationship" });
    }
  });

  /**
   * Venue Clusters API
   */
  app.get("/api/venue-network/clusters", async (req: Request, res: Response) => {
    try {
      const clusters = await db.select().from(venueClusters);

      // For each cluster, get its members
      for (const cluster of clusters) {
        const members = await db
          .select()
          .from(venueClusterMembers)
          .leftJoin(venues, eq(venueClusterMembers.venueId, venues.id))
          .where(eq(venueClusterMembers.clusterId, cluster.id));

        cluster.members = members.map(m => ({
          ...m.venue_cluster_members,
          venue: m.venues
        }));
      }

      res.json(clusters);
    } catch (error) {
      console.error("Error fetching venue clusters:", error);
      res.status(500).json({ error: "Failed to fetch venue clusters" });
    }
  });

  app.get("/api/venue-network/clusters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid cluster ID" });
      }

      const clusters = await db
        .select()
        .from(venueClusters)
        .where(eq(venueClusters.id, id));

      if (clusters.length === 0) {
        return res.status(404).json({ error: "Cluster not found" });
      }

      const cluster = clusters[0];

      // Get the cluster members
      const members = await db
        .select()
        .from(venueClusterMembers)
        .leftJoin(venues, eq(venueClusterMembers.venueId, venues.id))
        .where(eq(venueClusterMembers.clusterId, id));

      cluster.members = members.map(m => ({
        ...m.venue_cluster_members,
        venue: m.venues
      }));

      res.json(cluster);
    } catch (error) {
      console.error("Error fetching venue cluster:", error);
      res.status(500).json({ error: "Failed to fetch venue cluster" });
    }
  });

  app.post("/api/venue-network/clusters", async (req: Request, res: Response) => {
    try {
      const { name, description, centerLatitude, centerLongitude, radiusKm } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const result = await db.insert(venueClusters).values({
        name,
        description: description || null,
        centerLatitude: centerLatitude || null,
        centerLongitude: centerLongitude || null,
        radiusKm: radiusKm || null,
        createdAt: new Date(),
        updatedAt: null
      }).returning();

      res.status(201).json({
        ...result[0],
        members: []
      });
    } catch (error) {
      console.error("Error creating venue cluster:", error);
      res.status(500).json({ error: "Failed to create venue cluster" });
    }
  });

  app.post("/api/venue-network/clusters/:clusterId/members", async (req: Request, res: Response) => {
    try {
      const clusterId = parseInt(req.params.clusterId);
      const { venueId } = req.body;

      if (isNaN(clusterId) || !venueId) {
        return res.status(400).json({ error: "Valid cluster ID and venue ID are required" });
      }

      // Check if cluster exists
      const clusters = await db
        .select()
        .from(venueClusters)
        .where(eq(venueClusters.id, clusterId));

      if (clusters.length === 0) {
        return res.status(404).json({ error: "Cluster not found" });
      }

      // Check if venue exists
      const venueResult = await db
        .select()
        .from(venues)
        .where(eq(venues.id, venueId));

      if (venueResult.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      // Check if venue is already a member
      const existingMember = await db
        .select()
        .from(venueClusterMembers)
        .where(
          and(
            eq(venueClusterMembers.clusterId, clusterId),
            eq(venueClusterMembers.venueId, venueId)
          )
        );

      if (existingMember.length > 0) {
        return res.status(409).json({ 
          error: "Venue is already a member of this cluster",
          existingMember: existingMember[0]
        });
      }

      const addedAt = new Date().toISOString();

      // Add venue to cluster
      const result = await db.insert(venueClusterMembers).values({
        clusterId,
        venueId,
        addedAt
      }).returning();

      res.status(201).json({
        ...result[0],
        venue: venueResult[0]
      });
    } catch (error) {
      console.error("Error adding venue to cluster:", error);
      res.status(500).json({ error: "Failed to add venue to cluster" });
    }
  });

  app.delete("/api/venue-network/clusters/:clusterId/members/:venueId", async (req: Request, res: Response) => {
    try {
      const clusterId = parseInt(req.params.clusterId);
      const venueId = parseInt(req.params.venueId);

      if (isNaN(clusterId) || isNaN(venueId)) {
        return res.status(400).json({ error: "Valid cluster ID and venue ID are required" });
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
        );

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

      res.status(204).send();
    } catch (error) {
      console.error("Error removing venue from cluster:", error);
      res.status(500).json({ error: "Failed to remove venue from cluster" });
    }
  });

  /**
   * Dynamically generate venue clusters based on proximity
   */
  app.post("/api/venue-network/auto-cluster", async (req: Request, res: Response) => {
    try {
      const {
        distanceThresholdKm = 100,
        minVenuesPerCluster = 2,
        maxVenuesPerCluster = 10,
        namePrefix = "Venue Cluster"
      } = req.body;

      // Fetch all venues with coordinates
      const allVenues = await db
        .select()
        .from(venues)
        .where(
          and(
            sql`${venues.latitude} IS NOT NULL`,
            sql`${venues.longitude} IS NOT NULL`
          )
        );

      if (allVenues.length === 0) {
        return res.status(404).json({ error: "No venues with valid coordinates found" });
      }

      // Group venues by proximity
      const clusters: { center: typeof allVenues[0]; members: typeof allVenues }[] = [];
      const assignedVenues = new Set<number>();

      // For each venue not yet assigned to a cluster
      for (const venue of allVenues) {
        if (assignedVenues.has(venue.id)) continue;

        // Start a new potential cluster with this venue as the center
        const clusterMembers = [venue];
        assignedVenues.add(venue.id);

        // Find all venues within the distance threshold
        for (const otherVenue of allVenues) {
          if (otherVenue.id === venue.id || assignedVenues.has(otherVenue.id)) continue;

          const distance = calculateDistance(
            parseFloat(venue.latitude),
            parseFloat(venue.longitude),
            parseFloat(otherVenue.latitude),
            parseFloat(otherVenue.longitude)
          );

          if (distance <= distanceThresholdKm && clusterMembers.length < maxVenuesPerCluster) {
            clusterMembers.push(otherVenue);
            assignedVenues.add(otherVenue.id);
          }
        }

        // Only keep clusters with minimum number of venues
        if (clusterMembers.length >= minVenuesPerCluster) {
          clusters.push({
            center: venue,
            members: clusterMembers
          });
        } else {
          // Remove assignment if not enough members
          assignedVenues.delete(venue.id);
        }
      }

      // Create database records for valid clusters
      const createdClusters = [];

      for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        const centerVenue = cluster.center;

        // Insert cluster record
        const clusterResult = await db.insert(venueClusters).values({
          name: `${namePrefix} ${i + 1}`,
          description: `Automatic cluster centered around ${centerVenue.name}`,
          regionCode: determineVenueRegion(centerVenue.state),
          isStatic: false,
          centerLatitude: centerVenue.latitude,
          centerLongitude: centerVenue.longitude,
          radiusKm: distanceThresholdKm
          // Let the database handle timestamps
        }).returning();

        const clusterId = clusterResult[0].id;

        // Add members to cluster
        for (const member of cluster.members) {
          await db.insert(venueClusterMembers).values({
            clusterId,
            venueId: member.id
            // Let the database handle addedAt timestamp
          });
        }

        // Get the complete cluster with members
        const completeCluster = await db
          .select()
          .from(venueClusters)
          .where(eq(venueClusters.id, clusterId));

        const members = await db
          .select()
          .from(venueClusterMembers)
          .leftJoin(venues, eq(venueClusterMembers.venueId, venues.id))
          .where(eq(venueClusterMembers.clusterId, clusterId));

        completeCluster[0].members = members.map(m => ({
          ...m.venue_cluster_members,
          venue: m.venues
        }));

        createdClusters.push(completeCluster[0]);
      }

      res.status(201).json({
        clusters: createdClusters,
        totalClusters: createdClusters.length,
        totalVenuesAssigned: assignedVenues.size
      });
    } catch (error) {
      console.error("Error generating automatic clusters:", error);
      res.status(500).json({ error: "Failed to generate automatic clusters" });
    }
  });
  
  /**
   * Generate static region-based clusters across the US
   */
  app.post("/api/venue-network/create-regional-clusters", async (req: Request, res: Response) => {
    try {
      // Check if region clusters already exist
      const existingRegionalClusters = await db
        .select()
        .from(venueClusters)
        .where(eq(venueClusters.isStatic, true));

      if (existingRegionalClusters.length > 0) {
        return res.status(409).json({
          error: "Regional clusters already exist",
          clusters: existingRegionalClusters
        });
      }

      // Fetch all venues with state info
      const allVenues = await db
        .select()
        .from(venues)
        .where(sql`${venues.state} IS NOT NULL`);

      if (allVenues.length === 0) {
        return res.status(404).json({ error: "No venues with state information found" });
      }

      // Create clusters for each US region
      const createdClusters = [];

      for (const region of US_REGIONS) {
        // Insert cluster for this region
        const clusterResult = await db.insert(venueClusters).values(
          regionToCluster(region)
        ).returning();

        const clusterId = clusterResult[0].id;
        
        // Find all venues in this region
        const regionVenues = allVenues.filter(venue => 
          region.states.includes(venue.state.toUpperCase())
        );
        
        // Add venues to this cluster
        for (const venue of regionVenues) {
          await db.insert(venueClusterMembers).values({
            clusterId,
            venueId: venue.id
          });
        }
        
        // Get complete cluster with members
        const completeCluster = await db
          .select()
          .from(venueClusters)
          .where(eq(venueClusters.id, clusterId));

        const members = await db
          .select()
          .from(venueClusterMembers)
          .leftJoin(venues, eq(venueClusterMembers.venueId, venues.id))
          .where(eq(venueClusterMembers.clusterId, clusterId));

        const result = {
          ...completeCluster[0],
          members: members.map(m => ({
            ...m.venue_cluster_members,
            venue: m.venues
          })),
          venueCount: members.length
        };
        
        createdClusters.push(result);
      }

      res.status(201).json({
        clusters: createdClusters,
        totalClusters: createdClusters.length,
        totalVenuesAssigned: createdClusters.reduce((total, cluster) => total + cluster.venueCount, 0)
      });
    } catch (error) {
      console.error("Error generating regional clusters:", error);
      res.status(500).json({ error: "Failed to generate regional clusters" });
    }
  });

  /**
   * Routing Patterns API
   */
  app.get("/api/venue-network/routing-patterns", async (req: Request, res: Response) => {
    try {
      const patterns = await db.select().from(routingPatterns);
      res.json(patterns);
    } catch (error) {
      console.error("Error fetching routing patterns:", error);
      res.status(500).json({ error: "Failed to fetch routing patterns" });
    }
  });

  app.get("/api/venue-network/routing-patterns/venue/:venueId", async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.venueId);

      if (isNaN(venueId)) {
        return res.status(400).json({ error: "Invalid venue ID" });
      }

      // Find patterns where the venue is the source
      const sourcePatterns = await db
        .select()
        .from(routingPatterns)
        .leftJoin(venues, eq(routingPatterns.destinationVenueId, venues.id))
        .where(eq(routingPatterns.sourceVenueId, venueId));

      // Find patterns where the venue is the destination
      const destinationPatterns = await db
        .select()
        .from(routingPatterns)
        .leftJoin(venues, eq(routingPatterns.sourceVenueId, venues.id))
        .where(eq(routingPatterns.destinationVenueId, venueId));

      // Transform the results to have consistent format
      const patterns = [
        ...sourcePatterns.map(p => ({
          ...p.routing_patterns,
          otherVenue: p.venues,
          isSource: true
        })),
        ...destinationPatterns.map(p => ({
          ...p.routing_patterns,
          otherVenue: p.venues,
          isSource: false
        }))
      ];

      res.json(patterns);
    } catch (error) {
      console.error("Error fetching venue routing patterns:", error);
      res.status(500).json({ error: "Failed to fetch venue routing patterns" });
    }
  });

  /**
   * Routing Gaps API
   */
  app.get("/api/venue-network/routing-gaps", async (req: Request, res: Response) => {
    try {
      const { status, startDate, endDate } = req.query;

      let query = db.select().from(routingGaps);

      // Apply filters
      if (status) {
        query = query.where(eq(routingGaps.status, status as string));
      }

      if (startDate) {
        query = query.where(gte(routingGaps.gapStartDate, startDate as string));
      }

      if (endDate) {
        query = query.where(lte(routingGaps.gapEndDate, endDate as string));
      }

      const gaps = await query;

      // Get venue details for prior and next venues
      for (const gap of gaps) {
        const priorVenue = await db
          .select()
          .from(venues)
          .where(eq(venues.id, gap.priorVenueId));

        const nextVenue = await db
          .select()
          .from(venues)
          .where(eq(venues.id, gap.nextVenueId));

        gap.priorVenue = priorVenue.length > 0 ? priorVenue[0] : null;
        gap.nextVenue = nextVenue.length > 0 ? nextVenue[0] : null;
      }

      res.json(gaps);
    } catch (error) {
      console.error("Error fetching routing gaps:", error);
      res.status(500).json({ error: "Failed to fetch routing gaps" });
    }
  });

  app.get("/api/venue-network/routing-gaps/venue/:venueId", async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.venueId);

      if (isNaN(venueId)) {
        return res.status(400).json({ error: "Invalid venue ID" });
      }

      // Find gaps where the venue is eligible
      const gaps = await db
        .select()
        .from(routingGaps)
        .where(
          sql`${venueId} = ANY(${routingGaps.eligibleVenues}) OR 
              ${routingGaps.priorVenueId} = ${venueId} OR 
              ${routingGaps.nextVenueId} = ${venueId}`
        );

      // Get venue details and mark if venue is eligible
      for (const gap of gaps) {
        const priorVenue = await db
          .select()
          .from(venues)
          .where(eq(venues.id, gap.priorVenueId));

        const nextVenue = await db
          .select()
          .from(venues)
          .where(eq(venues.id, gap.nextVenueId));

        gap.priorVenue = priorVenue.length > 0 ? priorVenue[0] : null;
        gap.nextVenue = nextVenue.length > 0 ? nextVenue[0] : null;

        // Mark if venue is in the eligible venues array
        gap.isEligible = gap.eligibleVenues?.includes(venueId) || false;
      }

      res.json(gaps);
    } catch (error) {
      console.error("Error fetching venue routing gaps:", error);
      res.status(500).json({ error: "Failed to fetch venue routing gaps" });
    }
  });

  app.post("/api/venue-network/routing-gaps", async (req: Request, res: Response) => {
    try {
      const { 
        priorVenueId, 
        nextVenueId, 
        bandName, 
        gapStartDate, 
        gapEndDate,
        bandId = null,
        eligibleVenues = null,
        status = 'open'
      } = req.body;

      if (!priorVenueId || !nextVenueId || !bandName || !gapStartDate || !gapEndDate) {
        return res.status(400).json({ 
          error: "Prior venue ID, next venue ID, band name, and gap dates are required" 
        });
      }

      const createdAt = new Date().toISOString();

      const result = await db.insert(routingGaps).values({
        priorVenueId,
        nextVenueId,
        bandId,
        bandName,
        gapStartDate,
        gapEndDate,
        eligibleVenues,
        notifiedVenues: null,
        status,
        createdAt,
        resolvedAt: null
      }).returning();

      // Get venue details for response
      const priorVenue = await db
        .select()
        .from(venues)
        .where(eq(venues.id, priorVenueId));

      const nextVenue = await db
        .select()
        .from(venues)
        .where(eq(venues.id, nextVenueId));

      res.status(201).json({
        ...result[0],
        priorVenue: priorVenue.length > 0 ? priorVenue[0] : null,
        nextVenue: nextVenue.length > 0 ? nextVenue[0] : null
      });
    } catch (error) {
      console.error("Error creating routing gap:", error);
      res.status(500).json({ error: "Failed to create routing gap" });
    }
  });

  /**
   * Shared Bookings API
   */
  app.get("/api/venue-network/shared-bookings", async (req: Request, res: Response) => {
    try {
      const { venueId, startDate, endDate, sharingLevel } = req.query;

      let query = db.select().from(sharedBookings);

      // Apply filters
      if (venueId) {
        query = query.where(eq(sharedBookings.sourceVenueId, parseInt(venueId as string)));
      }

      if (startDate) {
        query = query.where(gte(sharedBookings.bookingDate, startDate as string));
      }

      if (endDate) {
        query = query.where(lte(sharedBookings.bookingDate, endDate as string));
      }

      if (sharingLevel) {
        query = query.where(eq(sharedBookings.sharingLevel, sharingLevel as string));
      }

      const bookings = await query;

      // Get source venue details
      for (const booking of bookings) {
        const sourceVenue = await db
          .select()
          .from(venues)
          .where(eq(venues.id, booking.sourceVenueId));

        booking.sourceVenue = sourceVenue.length > 0 ? sourceVenue[0] : null;
      }

      res.json(bookings);
    } catch (error) {
      console.error("Error fetching shared bookings:", error);
      res.status(500).json({ error: "Failed to fetch shared bookings" });
    }
  });

  app.post("/api/venue-network/shared-bookings", async (req: Request, res: Response) => {
    try {
      const { 
        sourceVenueId, 
        bandName, 
        bookingDate,
        bandId = null,
        sharingLevel = 'trusted',
        confirmedStatus = 'confirmed',
        sharerId = null,
        routeEligible = true,
        contactInfo = null
      } = req.body;

      if (!sourceVenueId || !bandName || !bookingDate) {
        return res.status(400).json({ 
          error: "Source venue ID, band name, and booking date are required" 
        });
      }

      const createdAt = new Date().toISOString();

      const result = await db.insert(sharedBookings).values({
        sourceVenueId,
        bandId,
        bandName,
        bookingDate,
        sharingLevel,
        confirmedStatus,
        sharerId,
        routeEligible,
        createdAt,
        contactInfo
      }).returning();

      // Get source venue details for response
      const sourceVenue = await db
        .select()
        .from(venues)
        .where(eq(venues.id, sourceVenueId));

      res.status(201).json({
        ...result[0],
        sourceVenue: sourceVenue.length > 0 ? sourceVenue[0] : null
      });
    } catch (error) {
      console.error("Error creating shared booking:", error);
      res.status(500).json({ error: "Failed to create shared booking" });
    }
  });

  /**
   * Collaborative Offers API
   */
  app.get("/api/venue-network/collaborative-offers", async (req: Request, res: Response) => {
    try {
      const { venueId, status } = req.query;

      let query = db.select().from(collaborativeOffers);

      // Apply filters
      if (venueId) {
        const venueIdInt = parseInt(venueId as string);

        // Find offers where the venue is the initiator or a participant
        const participantOfferIds = await db
          .select({ offerId: collaborativeOfferParticipants.offerId })
          .from(collaborativeOfferParticipants)
          .where(eq(collaborativeOfferParticipants.venueId, venueIdInt));

        if (participantOfferIds.length > 0) {
          const offerIds = participantOfferIds.map(p => p.offerId);
          query = query.where(
            sql`${collaborativeOffers.initiatingVenueId} = ${venueIdInt} OR ${collaborativeOffers.id} IN (${offerIds.join(',')})`
          );
        } else {
          query = query.where(eq(collaborativeOffers.initiatingVenueId, venueIdInt));
        }
      }

      if (status) {
        query = query.where(eq(collaborativeOffers.status, status as string));
      }

      const offers = await query;

      // Get initiating venue details and participants
      for (const offer of offers) {
        const initiatingVenue = await db
          .select()
          .from(venues)
          .where(eq(venues.id, offer.initiatingVenueId));

        offer.initiatingVenue = initiatingVenue.length > 0 ? initiatingVenue[0] : null;

        const participants = await db
          .select()
          .from(collaborativeOfferParticipants)
          .leftJoin(venues, eq(collaborativeOfferParticipants.venueId, venues.id))
          .where(eq(collaborativeOfferParticipants.offerId, offer.id));

        offer.participants = participants.map(p => ({
          ...p.collaborative_offer_participants,
          venue: p.venues
        }));
      }

      res.json(offers);
    } catch (error) {
      console.error("Error fetching collaborative offers:", error);
      res.status(500).json({ error: "Failed to fetch collaborative offers" });
    }
  });

  app.post("/api/venue-network/collaborative-offers", async (req: Request, res: Response) => {
    try {
      const { 
        name, 
        bandName, 
        initiatingVenueId,
        dateRange,
        bandId = null,
        status = 'draft',
        offerDetails = null,
        expiresAt = null
      } = req.body;

      if (!name || !bandName || !initiatingVenueId || !dateRange || !dateRange.start || !dateRange.end) {
        return res.status(400).json({ 
          error: "Name, band name, initiating venue ID, and date range are required" 
        });
      }

      const createdAt = new Date().toISOString();

      const result = await db.insert(collaborativeOffers).values({
        name,
        bandId,
        bandName,
        initiatingVenueId,
        dateRange,
        status,
        offerDetails,
        createdAt,
        expiresAt
      }).returning();

      // Get initiating venue details for response
      const initiatingVenue = await db
        .select()
        .from(venues)
        .where(eq(venues.id, initiatingVenueId));

      res.status(201).json({
        ...result[0],
        initiatingVenue: initiatingVenue.length > 0 ? initiatingVenue[0] : null,
        participants: []
      });
    } catch (error) {
      console.error("Error creating collaborative offer:", error);
      res.status(500).json({ error: "Failed to create collaborative offer" });
    }
  });

  app.post("/api/venue-network/collaborative-offers/:offerId/participants", async (req: Request, res: Response) => {
    try {
      const offerId = parseInt(req.params.offerId);
      const { 
        venueId, 
        proposedDate = null,
        confirmationStatus = 'pending',
        venueNotes = null,
        venueOffer = null
      } = req.body;

      if (isNaN(offerId) || !venueId) {
        return res.status(400).json({ error: "Valid offer ID and venue ID are required" });
      }

      // Check if offer exists
      const offers = await db
        .select()
        .from(collaborativeOffers)
        .where(eq(collaborativeOffers.id, offerId));

      if (offers.length === 0) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Check if venue exists
      const venueResult = await db
        .select()
        .from(venues)
        .where(eq(venues.id, venueId));

      if (venueResult.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      // Check if venue is already a participant
      const existingParticipant = await db
        .select()
        .from(collaborativeOfferParticipants)
        .where(
          and(
            eq(collaborativeOfferParticipants.offerId, offerId),
            eq(collaborativeOfferParticipants.venueId, venueId)
          )
        );

      if (existingParticipant.length > 0) {
        return res.status(409).json({ 
          error: "Venue is already a participant in this offer",
          existingParticipant: existingParticipant[0]
        });
      }

      const addedAt = new Date().toISOString();

      // Add venue to offer participants
      const result = await db.insert(collaborativeOfferParticipants).values({
        offerId,
        venueId,
        proposedDate,
        confirmationStatus,
        venueNotes,
        venueOffer,
        addedAt
      }).returning();

      res.status(201).json({
        ...result[0],
        venue: venueResult[0]
      });
    } catch (error) {
      console.error("Error adding participant to offer:", error);
      res.status(500).json({ error: "Failed to add participant to offer" });
    }
  });

  app.patch("/api/venue-network/collaborative-offers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, status, offerDetails, expiresAt } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid offer ID" });
      }

      // Check if offer exists
      const existingOffer = await db
        .select()
        .from(collaborativeOffers)
        .where(eq(collaborativeOffers.id, id));

      if (existingOffer.length === 0) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Update the offer
      const result = await db
        .update(collaborativeOffers)
        .set({
          name: name || existingOffer[0].name,
          status: status || existingOffer[0].status,
          offerDetails: offerDetails !== undefined ? offerDetails : existingOffer[0].offerDetails,
          expiresAt: expiresAt !== undefined ? expiresAt : existingOffer[0].expiresAt
        })
        .where(eq(collaborativeOffers.id, id))
        .returning();

      // Get initiating venue details for response
      const initiatingVenue = await db
        .select()
        .from(venues)
        .where(eq(venues.id, result[0].initiatingVenueId));

      // Get participants
      const participants = await db
        .select()
        .from(collaborativeOfferParticipants)
        .leftJoin(venues, eq(collaborativeOfferParticipants.venueId, venues.id))
        .where(eq(collaborativeOfferParticipants.offerId, id));

      res.json({
        ...result[0],
        initiatingVenue: initiatingVenue.length > 0 ? initiatingVenue[0] : null,
        participants: participants.map(p => ({
          ...p.collaborative_offer_participants,
          venue: p.venues
        }))
      });
    } catch (error) {
      console.error("Error updating collaborative offer:", error);
      res.status(500).json({ error: "Failed to update collaborative offer" });
    }
  });

  /**
   * Generate capacity-based venue clusters
   * Groups venues into small (0-300), medium (301-800), and large (801+) capacity categories
   */
  app.post("/api/venue-network/create-capacity-clusters", async (req: Request, res: Response) => {
    try {
      // Define capacity categories
      const capacityCategories = [
        { name: "Small Venues", min: 0, max: 300, description: "Intimate venues with capacity up to 300" },
        { name: "Medium Venues", min: 301, max: 800, description: "Mid-sized venues with capacity from 301 to 800" },
        { name: "Large Venues", min: 801, max: Number.MAX_SAFE_INTEGER, description: "Large venues with capacity over 800" },
      ];
      
      // Check if capacity clusters already exist
      // Delete existing capacity clusters if they exist
      await db
        .delete(venueClusters)
        .where(sql`${venueClusters.name} LIKE '%Venues' AND ${venueClusters.description} LIKE '%capacity%'`);

      // Fetch all venues with capacity information
      const allVenues = await db
        .select()
        .from(venues)
        .where(sql`${venues.capacity} IS NOT NULL`);

      if (allVenues.length === 0) {
        return res.status(404).json({ error: "No venues with capacity information found" });
      }

      // Create clusters for each capacity category
      const createdClusters = [];

      for (const category of capacityCategories) {
        // Insert capacity cluster
        const clusterResult = await db.insert(venueClusters).values({
          name: category.name,
          description: category.description,
          regionCode: "CAPACITY", // Custom code to indicate this is a capacity-based cluster
          isStatic: true,  // These are static clusters
        }).returning();

        const clusterId = clusterResult[0].id;
        
        // Find all venues in this capacity range
        const capacityVenues = allVenues.filter(venue => 
          venue.capacity !== null && 
          venue.capacity >= category.min && 
          venue.capacity <= category.max
        );
        
        // Add venues to this cluster
        for (const venue of capacityVenues) {
          await db.insert(venueClusterMembers).values({
            clusterId,
            venueId: venue.id
          });
        }
        
        // Get complete cluster with members
        const completeCluster = await db
          .select()
          .from(venueClusters)
          .where(eq(venueClusters.id, clusterId));

        const members = await db
          .select()
          .from(venueClusterMembers)
          .leftJoin(venues, eq(venueClusterMembers.venueId, venues.id))
          .where(eq(venueClusterMembers.clusterId, clusterId));

        const result = {
          ...completeCluster[0],
          members: members.map(m => ({
            ...m.venue_cluster_members,
            venue: m.venues
          })),
          venueCount: members.length
        };
        
        createdClusters.push(result);
      }

      res.status(201).json({
        clusters: createdClusters,
        totalClusters: createdClusters.length,
        totalVenuesAssigned: createdClusters.reduce((sum, cluster) => sum + cluster.venueCount, 0)
      });
    } catch (error) {
      console.error("Error creating capacity-based clusters:", error);
      res.status(500).json({ error: "Failed to create capacity-based clusters" });
    }
  });
}