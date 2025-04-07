/**
 * ArtistsDatabase: A service to manage artist information and event data
 * - Stores a larger database of artists to query
 * - Handles caching of API responses
 * - Provides retry and fallback mechanisms
 */

import { storage } from '../storage';
import { Artist } from '@/types';

interface ArtistQueryOptions {
  limit?: number;
  genres?: string[];
}

/**
 * Get a list of artists to query from our database
 */
export async function getArtistsToQuery(options: ArtistQueryOptions = {}): Promise<Artist[]> {
  const { limit = 100, genres = [] } = options;

  try {
    // Get artists from storage
    const artists = await storage.getArtists({
      limit,
      genres: genres.length > 0 ? genres : undefined
    });

    // Filter out artists without proper names
    const validArtists = artists.filter(artist => artist.name && artist.name.trim().length > 0);

    return validArtists;
  } catch (error) {
    console.error('Error getting artists to query:', error);
    return [];
  }
}

export async function recordArtistDiscovery(artist: Artist): Promise<void> {
  try {
    await storage.recordArtistDiscovery({
      artistId: artist.id,
      lastChecked: new Date().toISOString(),
      timesChecked: 1
    });
  } catch (error) {
    console.error('Error recording artist discovery:', error);
  }
}

// Static list of artists to query
// This is a significantly expanded list from our original set
// This is kept for potential fallback or testing purposes.
export const baseArtistList = [
  // Mainstream touring acts
  'The Killers', 'Foo Fighters', 'Green Day', 'Metallica',
  'Pearl Jam', 'Red Hot Chili Peppers', 'Tool',
  'Jack White', 'Tame Impala', 'Arctic Monkeys', 'The Strokes', 'Vampire Weekend',
  'The Black Keys', 'The National', 'Arcade Fire', 'LCD Soundsystem',
  'The War On Drugs', 'Spoon', 'Fleet Foxes', 'Bon Iver',
  'St. Vincent', 'Angel Olsen', 'Phoebe Bridgers', 'Mitski', 'Japanese Breakfast',
  'Wilco', 'Radiohead', 'Pavement', 'Sleater-Kinney', 'The Mountain Goats',
  'Beach House', 'Animal Collective', 'Yo La Tengo', 'Broken Social Scene',
  'Sufjan Stevens', 'Andrew Bird', 'Iron & Wine', 'The Decemberists',

  // More indie and regional touring acts
  'King Gizzard & The Lizard Wizard', 'Car Seat Headrest', 'Beach House', 'Big Thief',
  'Black Midi', 'Parquet Courts', 'Fontaines D.C.', 'Idles', 'Shame',
  'Courtney Barnett', 'Kurt Vile', 'Ty Segall', 'Mac DeMarco', 'Oh Sees',
  'Real Estate', 'Alvvays', 'Snail Mail', 'Soccer Mommy', 'Lucy Dacus',
  'Julien Baker', 'The Mountain Goats', 'Phosphorescent', 'Kevin Morby',
  'Whitney', 'Wolf Parade', 'Pinegrove', 'Dinosaur Jr.', 'Built to Spill',
  'Cloud Nothings', 'Guided By Voices', 'Modest Mouse', 'Bright Eyes',
  'Why?', 'Black Country, New Road', 'LVL UP', 'Hop Along', 'Joyce Manor',
  'Destroyer', 'Protomartyr', 'Speedy Ortiz', 'Preoccupations', 'Gang of Four',
  'La Luz', 'Hand Habits', 'Swearin', 'Pedro the Lion', 'Mothers',
  'The Antlers', 'Deerhunter', 'Cate Le Bon', 'The Wrens', 'Jay Som',
  'Alex G', 'Frankie Cosmos', 'The Body', 'Thee Oh Sees', 'Wavves',
  'TOPS', 'Wild Nothing', 'Twin Peaks', 'Yves Tumor', 'Perfume Genius',
  'Big Ups', 'DIIV', 'Algiers', 'Porches', 'Dehd', 'Squid', 'Dry Cleaning',

  // Regional artists that tour venues like Bug Jar
  'Pile', 'Geese', 'Wednesday', 'Hotline TNT', 'Ratboys', 'Horse Jumper of Love',
  'Duster', 'Slothrust', 'Weakened Friends', 'Fat Night', 'Stove', 'Kneecap',
  'Squirrel Flower', 'Really From', 'Guerilla Toss', 'Pkew Pkew Pkew',
  'Wild Pink', 'Hovvdy', 'Oso Oso', 'Camp Cope', 'Future Teens', 'Another Michael',
  'Dirt Buyer', 'Mal Devisa', 'Florist', 'Lomelda', 'Illuminati Hotties',
  'Peaer', 'Pom Pom Squad', 'Kal Marks', 'The Ophelias', '2nd Grade',
  'Proper.', 'Spirit of the Beehive', 'They Are Gutting a Body of Water', 'Bellows',
  'Strange Ranger', 'Palehound', 'Adult Mom', 'Urochromes', 'Acid Dad',
  'Palberta', 'Water From Your Eyes', 'Crumb', 'Omni', 'Corridor',
  'Durand Jones & The Indications', 'Model/Actriz', 'Twen', 'Activity', 'GIFT',
  'THICK', 'Trash Kit', 'Mdou Moctar', 'Mannequin Pussy', 'Knot', 'Wares',
  'Bully', 'Sweeping Promises', 'Fury', 'Vundabar', 'Slow Pulp',

  // More underground/DIY bands that might benefit from venue discovery
  'CIVIC', 'Uranium Club', 'Tropical Fuck Storm', 'Stella Donnelly', 'Grace Ives',
  'Kiwi Jr.', 'THUS LOVE', 'Fake Dad', 'Narrow Head', 'Koyo', 'Prince Daddy & The Hyena',
  'The Obsessives', 'Hit Like a Girl', 'Gouge Away', 'Truth Cult',
  'Origami Angel', 'Dollar Signs', 'Thank You I\'m Sorry', 'Equipment',
  'Nudes', 'Dump Him', 'awakebutstillinbed', 'Diva Sweetly', 'Nervous Dater',
  'Long Neck', 'Big Nothing', 'See Through Dresses', 'No Better', 'Dogleg',
  'Gulfer', 'Short Fictions', 'Macseal', 'Insignificant Other', 'Barely Civil',
  'Retirement Party', 'Pool Kids', 'Charmer', 'Drunk Uncle', 'Greet Death',
  'Barely March', 'Hospital Bracelet', 'Carpool Tunnel', 'PONY', 'Flowerhead',
  'Catbite', 'Bad Moves', 'Stay Inside', 'Gel', 'Korine', 'Patio',

  // Even more artists for diverse genre coverage
  'King Tuff', 'Twin Shadow', 'The Nude Party', 'Priests', 'Pile',
  'Flasher', 'Baths', 'Helado Negro', 'Haley Heynderickx', 'Nilufer Yanya',
  'Boy Harsher', 'HMLTD', 'No Age', 'True Widow', 'Cheekface',
  'Linda Lindas', 'MUNA', 'Hurray for the Riff Raff', 'illuminati hotties',
  'SASAMI', 'Waxahatchee', 'Miya Folick', 'Sheer Mag', 'Xiu Xiu',
  'The Lemon Twigs', 'Show Me the Body', 'Ought', 'U.S. Girls', 'The Weather Station',
  'Wand', 'Wet Leg', 'Crack Cloud', 'Girl Band', 'Mall Grab',
  'Bladee', 'Hatchie', 'Tirzah', 'Kate Bollinger', 'Horsegirl',
  'Cloakroom', 'Horse Lords', 'Mizmor', 'A Place to Bury Strangers', 'Liturgy',
  'Have a Nice Life', 'clipping.', 'L\'Rain', 'Spirit of the Beehive', 'Black Marble',
  'Gilla Band', 'Ceremony', 'Kelly Lee Owens', 'Eartheater', 'Lingua Ignota',

  // Electronic and hip-hop acts that tour with indie bands
  'SOPHIE', 'Four Tet', 'Floating Points', 'SBTRKT', 'James Blake',
  'FKA twigs', 'Kaytranada', 'Jamie xx', 'Caribou', 'Bonobo',
  'Jon Hopkins', 'Actress', 'Burial', 'Mount Kimbie', 'Flying Lotus',
  'Arca', 'Oneohtrix Point Never', 'Kero Kero Bonito', 'JPEGMAFIA', 'BROCKHAMPTON',
  'Earl Sweatshirt', 'Death Grips', '100 gecs', 'Danny Brown', 'Vince Staples'
];

/**
 * Retrieves a list of artists to query based on the provided parameters
 * @param options Optional parameters to filter or expand the artist list
 * @returns List of artist names to query
 */
//This function is kept for potential fallback or testing purposes.  The new async version is preferred.
export function getArtistsToQueryOld(options: {
  limit?: number;
  genres?: string[];
  includeMainstream?: boolean;
  includeUnderground?: boolean;
  prioritize?: boolean; // New option to prioritize artists instead of random shuffle
} = {}): string[] {
  const {
    limit = 150,
    genres = [],
    includeMainstream = true,
    includeUnderground = true,
    prioritize = true, // Default to prioritized list
  } = options;

  // Define categories of artists by touring likelihood
  const highPriorityArtists = [
    // Active touring artists that frequently book smaller venues
    'Big Thief', 'Parquet Courts', 'Fontaines D.C.', 'Car Seat Headrest', 'Japanese Breakfast',
    'Snail Mail', 'Lucy Dacus', 'Julien Baker', 'Mitski', 'Phoebe Bridgers',
    'Mannequin Pussy', 'Jeff Rosenstock', 'PUP', 'IDLES', 'Shame',
    'King Gizzard & The Lizard Wizard', 'Black Midi', 'The Mountain Goats', 'Pinegrove',
    'Crack Cloud', 'Protomartyr', 'Cloud Nothings', 'Hop Along', 'Joyce Manor',
    'Soccer Mommy', 'Alvvays', 'Illuminati Hotties', 'PONY', 'Gulfer',
    'Short Fictions', 'Prince Daddy & The Hyena', 'Origami Angel', 'Equipment'
  ];

  // Filter artists based on genres if provided
  let filteredList = [...baseArtistList];
  if (genres.length > 0) {
    // In the future, we can implement proper genre filtering
    // For now, just a placeholder that doesn't filter anything
    console.log(`Genre filtering requested for: ${genres.join(', ')}`);
  }

  // If prioritization is enabled, structure the list with higher priority artists first
  if (prioritize) {
    // First, create a set for O(1) lookups
    const highPrioritySet = new Set(highPriorityArtists);

    // Split the list into high priority and normal priority
    const highPriority: string[] = [];
    const normalPriority: string[] = [];

    filteredList.forEach(artist => {
      if (highPrioritySet.has(artist)) {
        highPriority.push(artist);
      } else {
        normalPriority.push(artist);
      }
    });

    // Shuffle within each priority group
    const shuffledHighPriority = [...highPriority].sort(() => Math.random() - 0.5);
    const shuffledNormalPriority = [...normalPriority].sort(() => Math.random() - 0.5);

    // Create the prioritized list (high priority first, then normal)
    filteredList = [...shuffledHighPriority, ...shuffledNormalPriority];

    console.log(`Prioritized ${shuffledHighPriority.length} high-touring-likelihood artists`);
  } else {
    // Traditional random shuffle
    filteredList = [...filteredList].sort(() => Math.random() - 0.5);
  }

  // Return the limited list
  return filteredList.slice(0, limit);
}