/**
 * ArtistsDatabase: A service to manage artist information and event data
 * - Stores a larger database of artists to query
 * - Handles caching of API responses
 * - Provides retry and fallback mechanisms
 */

// Static list of artists to query
// This is a significantly expanded list from our original set
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
export function getArtistsToQuery(options: {
  limit?: number;
  genres?: string[];
  includeMainstream?: boolean;
  includeUnderground?: boolean;
} = {}): string[] {
  const {
    limit = 150,
    genres = [],
    includeMainstream = true,
    includeUnderground = true,
  } = options;
  
  // For now just return a subset of the base list
  // TODO: Implement genre filtering and other options
  
  // Randomize the list to get different artists each time if limit is less than full list
  const shuffledList = [...baseArtistList].sort(() => Math.random() - 0.5);
  
  // Return the limited list
  return shuffledList.slice(0, limit);
}