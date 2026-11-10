export interface AirbnbListing {
  id: string;
  listingUrl?: string;
  neighbourhood: string;
  roomType: string;
  propertyType?: string;
  accommodates?: number;
  bedrooms?: number;
  price: number;
  availability365?: number;
  numberOfReviews?: number;
  reviewRating?: number;
  isSuperhost?: boolean;
  estimatedRevenue365?: number;
  licenseType?: string;
  latitude?: number;
  longitude?: number;
}

export interface NeighborhoodStats {
  name: string;
  count: number;
  medianPrice: number;
  meanPrice: number;
  minPrice: number;
  maxPrice: number;
  entireHomeCount: number;
  entireHomeMedianPrice: number;
  privateRoomCount: number;
  privateRoomMedianPrice: number;
  latitude: number;
  longitude: number;
  medianMonthlyRent?: number;
}

export interface ScreenerAnswers {
  isPrimaryResidence: boolean | null;
  isTenant: boolean | null;
  hasHOABan: boolean | null;
}

export interface ScreenerResult {
  status: 'eligible' | 'vacation_rental_warning' | 'tenant_error' | 'hoa_error' | 'incomplete';
  title: string;
  message: string;
  details: string;
  badgeType: 'success' | 'warning' | 'error' | 'neutral';
}

export interface ScenarioResult {
  name: string;
  description: string;
  nightsHosted: number;
  dailyRate: number;
  grossAnnualRevenue: number;
  expenseRate: number;
  operatingExpenses: number;
  taxRate?: number;
  taxAmount?: number;
  isTaxExempt?: boolean;
  netAnnualIncome: number;
  effectiveMonthlyNet: number;
  effortLevel: 'Passive' | 'Moderate' | 'High Active';
  legalNotes: string;
}
