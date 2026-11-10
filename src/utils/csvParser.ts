import { AirbnbListing, NeighborhoodStats } from '../types';
import { getNeighborhoodMedianRent } from '../data/fallbackData';

/**
 * Clean a price value from text or numbers (e.g. "$1,200.00", "$99", "180.5") into a valid float.
 */
export function cleanPrice(val: unknown): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;
  const str = String(val).trim();
  // Remove currency signs, commas, whitespace, quotes
  const cleaned = str.replace(/[$,'"\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Robust CSV parser that handles quoted cells containing commas, escaped quotes, and newlines.
 * Does not strip quotes prematurely before splitting fields.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in CRLF
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.length > 0 && currentRow.some((field) => field.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Push final field/row if text doesn't end in newline
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((field) => field.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  // Clean headers (trim whitespace, lowercase)
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const records: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const record: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = (row[c] ?? '').trim();
    }
    records.push(record);
  }

  return records;
}

/**
 * Convert raw CSV records into typed AirbnbListing objects
 */
export function processRawRecords(records: Record<string, string>[]): AirbnbListing[] {
  const listings: AirbnbListing[] = [];

  for (const r of records) {
    // Look for neighbourhood name
    const rawNeighbourhood =
      r['neighbourhood_cleansed'] ||
      r['neighbourhood'] ||
      r['neighborhood'] ||
      r['neighbourhood_group'] ||
      r['area'] ||
      '';

    const neighbourhood = rawNeighbourhood.trim();
    if (!neighbourhood) continue;

    // Look for price
    const rawPrice = r['price_usd'] || r['price'] || r['nightly_price'] || r['rate'] || '0';
    const price = cleanPrice(rawPrice);
    if (price <= 0 || price > 10000) continue; // Filter out erroneous $0 or absurd extremes

    const roomType = r['room_type'] || (r['property_type']?.toLowerCase().includes('private') ? 'Private room' : 'Entire home/apt');

    listings.push({
      id: r['id'] || String(Math.random()),
      listingUrl: r['listing_url'] || (r['id'] ? `https://www.airbnb.com/rooms/${r['id']}` : undefined),
      neighbourhood,
      roomType,
      propertyType: r['property_type'],
      accommodates: r['accommodates'] ? parseInt(r['accommodates'], 10) : undefined,
      bedrooms: r['bedrooms'] ? parseFloat(r['bedrooms']) : undefined,
      price,
      availability365: r['availability_365'] ? parseInt(r['availability_365'], 10) : undefined,
      numberOfReviews: r['number_of_reviews'] ? parseInt(r['number_of_reviews'], 10) : undefined,
      reviewRating: r['review_scores_rating'] ? parseFloat(r['review_scores_rating']) : undefined,
      isSuperhost: r['host_is_superhost'] === 't' || r['host_is_superhost'] === 'true',
      estimatedRevenue365: r['estimated_revenue_l365d'] ? cleanPrice(r['estimated_revenue_l365d']) : undefined,
      licenseType: r['license_type_as_listed'],
      latitude: r['latitude'] ? parseFloat(r['latitude']) : undefined,
      longitude: r['longitude'] ? parseFloat(r['longitude']) : undefined,
    });
  }

  return listings;
}

/**
 * Calculate statistical median of an array of numbers
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Aggregate neighborhood statistics
 */
export function computeNeighborhoodStats(listings: AirbnbListing[]): Map<string, NeighborhoodStats> {
  const groups = new Map<string, AirbnbListing[]>();

  for (const l of listings) {
    const list = groups.get(l.neighbourhood) || [];
    list.push(l);
    groups.set(l.neighbourhood, list);
  }

  const result = new Map<string, NeighborhoodStats>();

  groups.forEach((items, name) => {
    const allPrices = items.map((i) => i.price);
    const entireHomePrices = items.filter((i) => i.roomType.toLowerCase().includes('entire')).map((i) => i.price);
    const privateRoomPrices = items.filter((i) => i.roomType.toLowerCase().includes('private')).map((i) => i.price);

    const validLats = items.map((i) => i.latitude).filter((lat): lat is number => typeof lat === 'number' && !isNaN(lat));
    const validLngs = items.map((i) => i.longitude).filter((lng): lng is number => typeof lng === 'number' && !isNaN(lng));
    const avgLat = validLats.length > 0 ? validLats.reduce((a, b) => a + b, 0) / validLats.length : 38.9072;
    const avgLng = validLngs.length > 0 ? validLngs.reduce((a, b) => a + b, 0) / validLngs.length : -77.0369;

    const sum = allPrices.reduce((acc, p) => acc + p, 0);
    const mean = sum / (allPrices.length || 1);
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);

    result.set(name, {
      name,
      count: items.length,
      medianPrice: Math.round(calculateMedian(allPrices)),
      medianMonthlyRent: getNeighborhoodMedianRent(name),
      meanPrice: Math.round(mean),
      minPrice: Math.round(min),
      maxPrice: Math.round(max),
      entireHomeCount: entireHomePrices.length,
      entireHomeMedianPrice: entireHomePrices.length > 0 ? Math.round(calculateMedian(entireHomePrices)) : Math.round(calculateMedian(allPrices)),
      privateRoomCount: privateRoomPrices.length,
      privateRoomMedianPrice: privateRoomPrices.length > 0 ? Math.round(calculateMedian(privateRoomPrices)) : Math.round(calculateMedian(allPrices) * 0.6),
      latitude: Number(avgLat.toFixed(5)),
      longitude: Number(avgLng.toFixed(5)),
    });
  });

  return result;
}

/**
 * Format currency with tabular-safe formatting
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
