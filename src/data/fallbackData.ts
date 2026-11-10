import { NeighborhoodStats } from '../types';

export const FALLBACK_DEFAULT_ADR = 150.0;
export const DEFAULT_MONTHLY_RENT = 2458.0;

/**
 * Washington, D.C. residential monthly rent market medians by neighborhood cluster.
 * Directly mapped from the official Zillow Observed Rent Index (ZORI) dataset (September 2026).
 */
export const DC_NEIGHBORHOOD_MEDIAN_RENTS: Record<string, number> = {
  'Capitol Hill, Lincoln Park': 2499, // ZIP 20002 ($2,458) & 20003 ($2,540) average
  'Dupont Circle, Connecticut Avenue/K Street': 2571, // ZIP 20036 ($2,500) & 20009 ($2,641) average
  'Georgetown, Burleith/Hillandale': 2521, // ZIP 20007 ($2,521)
  'Shaw, Logan Circle': 2609, // ZIP 20001 ($2,653) & 20005 ($2,565) average
  'Columbia Heights, Mt. Pleasant, Pleasant Plains, Park View': 2259, // ZIP 20010 ($2,259)
  'Union Station, Stanton Park, Kingman Park': 2458, // ZIP 20002 ($2,458)
  'Near Southeast, Navy Yard': 2540, // ZIP 20003 ($2,540)
  'Brookland, Brentwood, Langdon': 2275, // ZIP 20017 ($2,394) & 20018 ($2,155) average
  'Historic Anacostia': 1940, // ZIP 20020 ($1,940)
  'Brightwood Park, Crestwood, Petworth': 2275, // ZIP 20011 ($2,275)
  'Cathedral Heights, McLean Gardens, Glover Park': 2631, // ZIP 20007 ($2,521) & 20016 ($2,740) average
  'Cleveland Park, Woodley Park, Massachusetts Avenue Heights, Woodland-Normanstone Terrace': 2160, // ZIP 20008 ($2,160)
  'Downtown, Chinatown, Penn Quarters, Mount Vernon Square, North Downtown': 2717, // ZIP 20004 ($2,781) & 20001 ($2,653) average
  'West End, Foggy Bottom, GWU': 2678, // ZIP 20037 ($2,678)
  'Kalorama Heights, Adams Morgan, Lanier Heights': 2641, // ZIP 20009 ($2,641)
  'Southwest Employment Area, Southwest/Waterfront, Fort McNair, Buzzard Point': 2476, // ZIP 20024 ($2,476)
  'Edgewood, Bloomingdale, Truxton Circle, Eckington': 2556, // ZIP 20001 ($2,653) & 20002 ($2,458) average
  'Takoma, Brightwood, Manor Park': 2177, // ZIP 20012 ($2,177)
  'Woodridge, Fort Lincoln, South Burleith': 2155, // ZIP 20018 ($2,155)
  'Congress Heights, Bellevue, Washington Highlands': 1529, // ZIP 20032 ($1,529)
  'Deanwood, Burrville, Grant Park, Lincoln Heights, Fairmont Heights': 1817, // ZIP 20019 ($1,817)
  'Friendship Heights, American University Park, Tenleytown': 2740, // ZIP 20016 ($2,740)
  'North Cleveland Park, Forest Hills, Van Ness': 2160, // ZIP 20008 ($2,160)
  'Howard University, Le Droit Park, Cardozo/Shaw': 2653, // ZIP 20001 ($2,653)
  'Ivy City, Arboretum, Trinidad, Carver Langston': 2458, // ZIP 20002 ($2,458)
  'Colonial Village, Shepherd Park, North Portal Estates': 2177, // ZIP 20012 ($2,177)
  'Hawthorne, Barnaby Woods, Chevy Chase': 2604, // ZIP 20015 ($2,604)
  'Spring Valley, Palisades, Wesley Heights, Foxhall Crescent, Foxhall Village, Georgetown Reservoir': 2740, // ZIP 20016 ($2,740)
  'Capitol View, Marshall Heights, Benning Heights': 1817, // ZIP 20019 ($1,817)
  'Douglas, Shipley Terrace': 1735, // ZIP 20020 ($1,940) & 20032 ($1,529) average
  'Eastland Gardens, Kenilworth': 1817, // ZIP 20019 ($1,817)
  'Fairfax Village, Naylor Gardens, Hillcrest, Summit Park': 1940, // ZIP 20020 ($1,940)
  'Lamont Riggs, Queens Chapel, Fort Totten, Pleasant Hill': 2335, // ZIP 20011 ($2,275) & 20017 ($2,394) average
  'Mayfair, Hillbrook, Mahaning Heights': 1817, // ZIP 20019 ($1,817)
  'North Michigan Park, Michigan Park, University Heights': 2394, // ZIP 20017 ($2,394)
  'River Terrace, Benning, Greenway, Fort Dupont': 1817, // ZIP 20019 ($1,817)
  'Sheridan, Barry Farm, Buena Vista': 1940, // ZIP 20020 ($1,940)
  'Twining, Fairlawn, Randle Highlands, Penn Branch, Fort Davis Park, Dupont Park': 1940, // ZIP 20020 ($1,940)
  'Woodland/Fort Stanton, Garfield Heights, Knox Hill': 1940, // ZIP 20020 ($1,940)
};

/**
 * Returns the DC market median monthly rent for a given neighborhood cluster name.
 * Uses exact match first, then fuzzy keyword matching on the cluster's primary name.
 */
export function getNeighborhoodMedianRent(neighborhoodName: string): number {
  if (!neighborhoodName) return DEFAULT_MONTHLY_RENT;
  const exact = DC_NEIGHBORHOOD_MEDIAN_RENTS[neighborhoodName];
  if (exact) return exact;

  const targetLower = neighborhoodName.toLowerCase();
  const primaryName = targetLower.split(',')[0].trim();

  for (const [key, val] of Object.entries(DC_NEIGHBORHOOD_MEDIAN_RENTS)) {
    const keyLower = key.toLowerCase();
    const keyPrimary = keyLower.split(',')[0].trim();
    if (targetLower.includes(keyPrimary) || keyLower.includes(primaryName)) {
      return val;
    }
  }

  return DEFAULT_MONTHLY_RENT;
}

export const DEFAULT_NEIGHBORHOOD_STATS: Record<string, NeighborhoodStats> = {
  'Capitol Hill, Lincoln Park': {
    name: 'Capitol Hill, Lincoln Park',
    count: 4,
    medianPrice: 176,
    meanPrice: 176,
    minPrice: 161,
    maxPrice: 192,
    entireHomeCount: 2,
    entireHomeMedianPrice: 181,
    privateRoomCount: 2,
    privateRoomMedianPrice: 172,
    latitude: 38.8897,
    longitude: -76.9907,
    medianMonthlyRent: 2499,
  },
  'Dupont Circle, Connecticut Avenue/K Street': {
    name: 'Dupont Circle, Connecticut Avenue/K Street',
    count: 3,
    medianPrice: 192,
    meanPrice: 176,
    minPrice: 133,
    maxPrice: 205,
    entireHomeCount: 2,
    entireHomeMedianPrice: 198,
    privateRoomCount: 1,
    privateRoomMedianPrice: 133,
    latitude: 38.9134,
    longitude: -77.0411,
    medianMonthlyRent: 2571,
  },
  'Georgetown, Burleith/Hillandale': {
    name: 'Georgetown, Burleith/Hillandale',
    count: 3,
    medianPrice: 156,
    meanPrice: 187,
    minPrice: 145,
    maxPrice: 261,
    entireHomeCount: 2,
    entireHomeMedianPrice: 203,
    privateRoomCount: 1,
    privateRoomMedianPrice: 156,
    latitude: 38.9091,
    longitude: -77.0625,
    medianMonthlyRent: 2521,
  },
  'Shaw, Logan Circle': {
    name: 'Shaw, Logan Circle',
    count: 4,
    medianPrice: 216,
    meanPrice: 275,
    minPrice: 117,
    maxPrice: 551,
    entireHomeCount: 2,
    entireHomeMedianPrice: 424,
    privateRoomCount: 2,
    privateRoomMedianPrice: 126,
    latitude: 38.9115,
    longitude: -77.0227,
    medianMonthlyRent: 2609,
  },
  'Columbia Heights, Mt. Pleasant, Pleasant Plains, Park View': {
    name: 'Columbia Heights, Mt. Pleasant, Pleasant Plains, Park View',
    count: 4,
    medianPrice: 131,
    meanPrice: 143,
    minPrice: 92,
    maxPrice: 218,
    entireHomeCount: 2,
    entireHomeMedianPrice: 193,
    privateRoomCount: 2,
    privateRoomMedianPrice: 93,
    latitude: 38.9312,
    longitude: -77.0327,
    medianMonthlyRent: 2259,
  },
  'Union Station, Stanton Park, Kingman Park': {
    name: 'Union Station, Stanton Park, Kingman Park',
    count: 4,
    medianPrice: 215,
    meanPrice: 224,
    minPrice: 128,
    maxPrice: 340,
    entireHomeCount: 2,
    entireHomeMedianPrice: 310,
    privateRoomCount: 2,
    privateRoomMedianPrice: 138,
    latitude: 38.8977,
    longitude: -76.9939,
    medianMonthlyRent: 2458,
  },
  'Near Southeast, Navy Yard': {
    name: 'Near Southeast, Navy Yard',
    count: 2,
    medianPrice: 297,
    meanPrice: 297,
    minPrice: 213,
    maxPrice: 380,
    entireHomeCount: 1,
    entireHomeMedianPrice: 380,
    privateRoomCount: 1,
    privateRoomMedianPrice: 213,
    latitude: 38.8751,
    longitude: -77.0054,
    medianMonthlyRent: 2540,
  },
  'Brookland, Brentwood, Langdon': {
    name: 'Brookland, Brentwood, Langdon',
    count: 3,
    medianPrice: 136,
    meanPrice: 164,
    minPrice: 118,
    maxPrice: 237,
    entireHomeCount: 2,
    entireHomeMedianPrice: 187,
    privateRoomCount: 1,
    privateRoomMedianPrice: 118,
    latitude: 38.9328,
    longitude: -76.9848,
    medianMonthlyRent: 2275,
  },
  'Historic Anacostia': {
    name: 'Historic Anacostia',
    count: 3,
    medianPrice: 121,
    meanPrice: 125,
    minPrice: 102,
    maxPrice: 152,
    entireHomeCount: 1,
    entireHomeMedianPrice: 152,
    privateRoomCount: 2,
    privateRoomMedianPrice: 112,
    latitude: 38.8622,
    longitude: -76.9839,
    medianMonthlyRent: 1940,
  },
};
