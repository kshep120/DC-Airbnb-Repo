import React, { useState, useEffect, useId, useMemo } from 'react';
import { AirbnbListing, NeighborhoodStats, ScreenerAnswers } from '../types';
import { formatCurrency, calculateMedian } from '../utils/csvParser';
import { getNeighborhoodMedianRent } from '../data/fallbackData';
import {
  TrendingUp,
  Award,
  DollarSign,
  Calendar,
  Building2,
  Bed,
  Home,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle,
  AlertCircle,
  Receipt,
  ArrowRight,
  Scale,
  FileText,
  Sparkles
} from 'lucide-react';

export interface ReportFinancialParams {
  monthlyRent: number;
  adr: number;
  includeOccupancyTax: boolean;
  longTermExpenseRate: number;
  strExpenseRate: number;
  hostedNights: number;
  wholeHomeNights: number;
  privateRoomRatio: number;
  selectedScenarioId?: 'long_term' | 'hosted_room' | 'whole_home';
  selectedBedrooms?: number | 'all';
}

interface ScenarioComparisonProps {
  listings?: AirbnbListing[];
  neighborhoodStats: Map<string, NeighborhoodStats>;
  selectedNeighborhood: string;
  setSelectedNeighborhood: (name: string) => void;
  screenerAnswers: ScreenerAnswers;
  onNavigateToScreener: () => void;
  onNavigateToLegal?: () => void;
  onOpenReportModal?: () => void;
  onUpdateReportParams?: (params: ReportFinancialParams) => void;
}

// DC Market Empirical bedroom multipliers for whole numbers (capped at 10)
const BEDROOM_ADR_MULTIPLIERS: Record<number, number> = {
  1: 0.88,  // 1 BR: ~$132-$150/nt
  2: 1.55,  // 2 BR: ~$230-$260/nt
  3: 2.15,  // 3 BR: ~$320-$370/nt
  4: 2.75,  // 4 BR: ~$410-$470/nt
  5: 3.35,  // 5 BR: ~$500-$570/nt
  6: 3.95,  // 6 BR: ~$590-$680/nt
  7: 4.55,  // 7 BR: ~$680-$780/nt
  8: 5.15,  // 8 BR: ~$770-$890/nt
  9: 5.75,  // 9 BR: ~$860-$990/nt
  10: 6.35, // 10 BR: ~$950-$1,100/nt
};

const BEDROOM_RENT_MULTIPLIERS: Record<number, number> = {
  1: 0.82,  // 1 BR: ~$1,950-$2,150/mo
  2: 1.15,  // 2 BR: ~$2,750-$3,100/mo
  3: 1.55,  // 3 BR: ~$3,700-$4,200/mo
  4: 2.05,  // 4 BR: ~$4,900-$5,600/mo
  5: 2.55,  // 5 BR: ~$6,100-$7,000/mo
  6: 3.05,  // 6 BR: ~$7,300-$8,400/mo
  7: 3.55,  // 7 BR: ~$8,500-$9,800/mo
  8: 4.05,  // 8 BR: ~$9,700-$11,200/mo
  9: 4.55,  // 9 BR: ~$10,900-$12,600/mo
  10: 5.05, // 10 BR: ~$12,100-$14,000/mo
};

export function getCalibratedBedroomStats(
  bedrooms: number | 'all',
  neighborhood: string,
  stats?: NeighborhoodStats,
  listings: AirbnbListing[] = []
) {
  const baseADR = stats?.entireHomeMedianPrice ?? stats?.medianPrice ?? 150;
  const baseRent = stats?.medianMonthlyRent ?? getNeighborhoodMedianRent(neighborhood);

  if (bedrooms === 'all') {
    return {
      medianADR: baseADR,
      medianRent: baseRent,
      sampleSize: stats?.count ?? 0,
      isFallback: false,
      sampleLabel: `${stats?.count ?? 0} listings in cluster`,
    };
  }

  // Filter listings for this neighborhood and specific whole-number bedroom count
  const nListings = listings.filter(
    (l) => l.neighbourhood === neighborhood && Math.round(l.bedrooms || 0) === bedrooms
  );

  // Citywide listings for this whole-number bedroom count
  const cListings = listings.filter(
    (l) => Math.round(l.bedrooms || 0) === bedrooms
  );

  let medianADR = baseADR;
  let sampleSize = 0;
  let sampleLabel = '';

  if (nListings.length >= 2) {
    medianADR = Math.round(calculateMedian(nListings.map((l) => l.price)));
    sampleSize = nListings.length;
    sampleLabel = `${sampleSize} listing${sampleSize > 1 ? 's' : ''} in ${neighborhood.split(',')[0]}`;
  } else if (cListings.length >= 2) {
    const citywideBedMedian = calculateMedian(cListings.map((l) => l.price));
    medianADR = Math.round(citywideBedMedian);
    sampleSize = cListings.length;
    sampleLabel = `${sampleSize} DC citywide listing${sampleSize > 1 ? 's' : ''}`;
  } else {
    // Model scaling for larger homes (e.g. 5-10 bedrooms)
    const mult = BEDROOM_ADR_MULTIPLIERS[bedrooms] || (1 + (bedrooms - 1) * 0.6);
    medianADR = Math.round(baseADR * mult);
    sampleSize = 0;
    sampleLabel = 'DC Market Model Projection';
  }

  const rentMult = BEDROOM_RENT_MULTIPLIERS[bedrooms] || (1 + (bedrooms - 1) * 0.5);
  const medianRent = Math.round(baseRent * rentMult);

  return {
    medianADR,
    medianRent,
    sampleSize,
    isFallback: sampleSize === 0,
    sampleLabel,
  };
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  listings = [],
  neighborhoodStats,
  selectedNeighborhood,
  setSelectedNeighborhood,
  screenerAnswers,
  onNavigateToScreener,
  onNavigateToLegal,
  onOpenReportModal,
  onUpdateReportParams,
}) => {
  // Current neighborhood stats
  const currentStats = neighborhoodStats.get(selectedNeighborhood);

  // Disaggregate by whole-number bedrooms (1 to 10 or 'all')
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | 'all'>('all');

  // Calibrated stats based on bedroom disaggregation
  const bedroomStats = useMemo(() => {
    return getCalibratedBedroomStats(selectedBedrooms, selectedNeighborhood, currentStats, listings);
  }, [selectedBedrooms, selectedNeighborhood, currentStats, listings]);

  const neighborhoodMedianRent = bedroomStats.medianRent;
  const calibratedADR = bedroomStats.medianADR;

  // Core Inputs
  const [adr, setAdr] = useState<number>(calibratedADR);
  const [monthlyRent, setMonthlyRent] = useState<number>(neighborhoodMedianRent);

  // Optional DC Sales & Transient Occupancy Tax Toggle (14.95%)
  // 10.05% DC Sales Tax on Transient Accommodations + 4.90% Convention Center Hotel Surcharge
  const DC_TRANSIENT_TAX_RATE = 14.95;
  const [includeOccupancyTax, setIncludeOccupancyTax] = useState<boolean>(false);

  // Advanced toggles
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [hostedNights, setHostedNights] = useState<number>(180);
  const [wholeHomeNights, setWholeHomeNights] = useState<number>(90);
  const [longTermExpenseRate, setLongTermExpenseRate] = useState<number>(10); // 10%
  const [strExpenseRate, setStrExpenseRate] = useState<number>(15); // 15%
  const [privateRoomRatio, setPrivateRoomRatio] = useState<number>(60); // 60%

  // User scenario selection state ('long_term' | 'hosted_room' | 'whole_home' | null)
  // When null, it defaults to the calculated highest-net winner
  const [selectedScenarioId, setSelectedScenarioId] = useState<'long_term' | 'hosted_room' | 'whole_home' | null>(null);

  // Dropdown open states for operating expense breakdowns in the 3 cards
  const [openExpenseDropdown, setOpenExpenseDropdown] = useState<{
    long_term: boolean;
    hosted_room: boolean;
    whole_home: boolean;
  }>({
    long_term: false,
    hosted_room: false,
    whole_home: false,
  });

  const toggleExpenseDropdown = (scenarioKey: 'long_term' | 'hosted_room' | 'whole_home') => {
    setOpenExpenseDropdown((prev) => ({
      ...prev,
      [scenarioKey]: !prev[scenarioKey],
    }));
  };

  // Itemized breakdowns for expected operating expenses
  const longTermBreakdown = [
    {
      label: 'Routine Maintenance & Repairs Reserve',
      sharePercent: 40,
      effectivePercent: Number((longTermExpenseRate * 0.40).toFixed(1)),
      description: 'HVAC servicing, plumbing, appliance repairs, electrical upkeep, and general tenant wear-and-tear.',
    },
    {
      label: 'Vacancy & Lease Turnover Buffer',
      sharePercent: 30,
      effectivePercent: Number((longTermExpenseRate * 0.30).toFixed(1)),
      description: 'Turnover re-painting, deep carpet shampooing, lock re-keying, and marketing buffer between leases.',
    },
    {
      label: 'Landlord Property Insurance Differential',
      sharePercent: 20,
      effectivePercent: Number((longTermExpenseRate * 0.20).toFixed(1)),
      description: 'Incremental premium for DC dwelling policy (DP-3) and tenant liability over standard homeowner insurance.',
    },
    {
      label: 'DC BBL Licensing & RAD Rent Registration',
      sharePercent: 10,
      effectivePercent: Number((longTermExpenseRate * 0.10).toFixed(1)),
      description: 'DLCP Basic Business License for rental housing ($198 / 2-year fee), RAD filing, and biennial inspections.',
    },
  ];

  const hostedRoomBreakdown = [
    {
      label: 'Guest Supplies & Amenities Restocking',
      sharePercent: 30,
      effectivePercent: Number((strExpenseRate * 0.30).toFixed(1)),
      description: 'Fresh bath towels, bed sheets, luxury toiletries, complimentary coffee/tea, welcome snacks, and paper goods.',
    },
    {
      label: 'Incremental Utilities & High-Speed WiFi',
      sharePercent: 25,
      effectivePercent: Number((strExpenseRate * 0.25).toFixed(1)),
      description: 'Additional guest shower water, climate control AC/heating, and gigabit mesh network bandwidth.',
    },
    {
      label: 'Airbnb Host Service Fee (3%)',
      sharePercent: 20,
      effectivePercent: Number((strExpenseRate * 0.20).toFixed(1)),
      description: 'Standard 3% host platform split-fee commission deducted directly from reservation payouts by Airbnb/VRBO.',
    },
    {
      label: 'Laundry & Sanitization Consumables',
      sharePercent: 15,
      effectivePercent: Number((strExpenseRate * 0.15).toFixed(1)),
      description: 'High-temperature linen washing detergent, fabric care, sanitizing protocol wipes, and turnover cleaning aids.',
    },
    {
      label: 'DLCP STR Licensing & Safety Gear',
      sharePercent: 10,
      effectivePercent: Number((strExpenseRate * 0.10).toFixed(1)),
      description: 'DC DLCP STR license fee ($104.50 / 2-year fee), annual extinguisher inspections, replacement CO/smoke sensors.',
    },
  ];

  const wholeHomeBreakdown = [
    {
      label: 'Professional Turnover Cleanings',
      sharePercent: 40,
      effectivePercent: Number((strExpenseRate * 0.40).toFixed(1)),
      description: 'Whole-home cleaning crew turnarounds between guests, linen steaming, trash removal, and staging.',
    },
    {
      label: 'Airbnb Host Platform Fee (3%)',
      sharePercent: 20,
      effectivePercent: Number((strExpenseRate * 0.20).toFixed(1)),
      description: 'Standard 3% booking platform commission automatically deducted from gross host payout by Airbnb/VRBO.',
    },
    {
      label: 'Guest Consumables & Linen Replacement',
      sharePercent: 15,
      effectivePercent: Number((strExpenseRate * 0.15).toFixed(1)),
      description: 'Kitchen pantry staples (olive oil, spices), bath amenities, and periodic replacement of worn towels and sheets.',
    },
    {
      label: 'Smart Locks, Noise Monitoring & Tech',
      sharePercent: 15,
      effectivePercent: Number((strExpenseRate * 0.15).toFixed(1)),
      description: 'Keyless smart deadbolt access, NoiseAware / Minut decibel compliance monitor subscription, high-speed WiFi.',
    },
    {
      label: 'DC DLCP License, Clean Hands & Filing',
      sharePercent: 10,
      effectivePercent: Number((strExpenseRate * 0.10).toFixed(1)),
      description: 'DC DLCP unhosted STR license fee ($104.50 / 2-year), OTR business tax registration, Clean Hands verification.',
    },
  ];

  // Unique IDs for form inputs to ensure accessibility and valid label associations
  const bedroomSelectId = useId();
  const neighborhoodSelectId = useId();
  const monthlyRentInputId = useId();
  const wholeHomeAdrInputId = useId();
  const hostedNightsInputId = useId();
  const wholeHomeNightsInputId = useId();
  const longTermExpenseInputId = useId();
  const strExpenseInputId = useId();
  const roomRatioInputId = useId();

  // Handle disaggregation by bedroom count (whole numbers 1 to 10 or 'all')
  const handleBedroomChange = (bedrooms: number | 'all') => {
    setSelectedBedrooms(bedrooms);
    const calibrated = getCalibratedBedroomStats(bedrooms, selectedNeighborhood, currentStats, listings);
    setAdr(calibrated.medianADR);
    setMonthlyRent(calibrated.medianRent);
  };

  // Sync ADR and Expected Monthly Rent when neighborhood changes
  const handleNeighborhoodChange = (newNeighbourhood: string) => {
    setSelectedNeighborhood(newNeighbourhood);
    const stats = neighborhoodStats.get(newNeighbourhood);
    const calibrated = getCalibratedBedroomStats(selectedBedrooms, newNeighbourhood, stats, listings);
    setAdr(calibrated.medianADR);
    setMonthlyRent(calibrated.medianRent);
  };

  // Calculations:
  // 1. Long-Term Lease (365 Nights)
  // Projected Annual Net Income = (Expected Monthly Rent * 12) minus 10% operating expenses.
  // 100% EXEMPT from transient accommodations tax (residential lease > 90 days)
  const scenario1Gross = monthlyRent * 12;
  const scenario1Expenses = scenario1Gross * (longTermExpenseRate / 100);
  const scenario1Tax = 0; // 0% - Long-term leases are exempt from DC transient tax
  const scenario1Net = scenario1Gross - scenario1Expenses;
  const scenario1MonthlyNet = scenario1Net / 12;
  const scenario1NightlyNet = scenario1Net / 365;

  // 2. Hosted Private Room (180 Nights)
  // Projected Annual Net Income = (60% of whole-home ADR * 180 nights) minus 15% operating expenses.
  // Subject to DC 14.95% transient occupancy tax on short-term bookings (<90 days)
  const privateRoomADR = adr * (privateRoomRatio / 100);
  const scenario2Gross = privateRoomADR * hostedNights;
  const scenario2Expenses = scenario2Gross * (strExpenseRate / 100);
  const scenario2Tax = scenario2Gross * (DC_TRANSIENT_TAX_RATE / 100);
  const scenario2Net = scenario2Gross - scenario2Expenses - (includeOccupancyTax ? scenario2Tax : 0);
  const scenario2MonthlyNet = scenario2Net / 12;
  const scenario2NightlyNet = hostedNights > 0 ? scenario2Net / hostedNights : 0;

  // 3. Whole Home Short-Term (90-Night Cap)
  // Projected Annual Net Income = (Whole-home ADR * 90 nights) minus 15% operating expenses.
  // Subject to DC 14.95% transient occupancy tax on short-term bookings (<90 days)
  const scenario3Gross = adr * wholeHomeNights;
  const scenario3Expenses = scenario3Gross * (strExpenseRate / 100);
  const scenario3Tax = scenario3Gross * (DC_TRANSIENT_TAX_RATE / 100);
  const scenario3Net = scenario3Gross - scenario3Expenses - (includeOccupancyTax ? scenario3Tax : 0);
  const scenario3MonthlyNet = scenario3Net / 12;
  const scenario3NightlyNet = wholeHomeNights > 0 ? scenario3Net / wholeHomeNights : 0;

  // Identify Winner
  const scenarios = [
    {
      id: 'long_term',
      name: 'Long-Term Lease (365 Nights)',
      net: scenario1Net,
      gross: scenario1Gross,
      expenses: scenario1Expenses,
      tax: scenario1Tax,
      isTaxExempt: true,
      icon: Building2,
      tag: 'Passive · Full Year',
    },
    {
      id: 'hosted_room',
      name: 'Hosted Private Room (180 Nights)',
      net: scenario2Net,
      gross: scenario2Gross,
      expenses: scenario2Expenses,
      tax: scenario2Tax,
      isTaxExempt: false,
      icon: Bed,
      tag: 'Active · Primary Residence',
    },
    {
      id: 'whole_home',
      name: 'Whole Home Short-Term (90-Night Cap)',
      net: scenario3Net,
      gross: scenario3Gross,
      expenses: scenario3Expenses,
      tax: scenario3Tax,
      isTaxExempt: false,
      icon: Home,
      tag: 'Capped · Peak Stays',
    },
  ];

  const sortedByNet = [...scenarios].sort((a, b) => b.net - a.net);
  const winner = sortedByNet[0];
  const secondPlace = sortedByNet[1];
  const deltaFromSecond = winner.net - secondPlace.net;

  // Active scenario is the homeowner's explicit selection or defaults to highest net
  const activeScenarioId = selectedScenarioId || winner.id;
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || winner;
  const isSelectedHighestNet = activeScenario.id === winner.id;

  // Sync latest scenario financial parameters and selection to parent for PDF generation
  useEffect(() => {
    onUpdateReportParams?.({
      monthlyRent,
      adr,
      includeOccupancyTax,
      longTermExpenseRate,
      strExpenseRate,
      hostedNights,
      wholeHomeNights,
      privateRoomRatio,
      selectedScenarioId: activeScenarioId as 'long_term' | 'hosted_room' | 'whole_home',
      selectedBedrooms,
    });
  }, [
    monthlyRent,
    adr,
    includeOccupancyTax,
    longTermExpenseRate,
    strExpenseRate,
    hostedNights,
    wholeHomeNights,
    privateRoomRatio,
    activeScenarioId,
    selectedBedrooms,
    onUpdateReportParams,
  ]);

  // Break-even metrics:
  // What monthly rent equals Scenario 3 Whole-Home net?
  // Monthly Rent * 12 * (1 - longTermExpenseRate/100) = scenario3Net
  const breakEvenMonthlyRent = scenario3Net / (12 * (1 - longTermExpenseRate / 100));

  // What Whole-Home ADR needed to equal Long-Term net?
  // Factoring in expenses and optional 14.95% DC transient tax
  const strEffectiveNetMargin = Math.max(0.01, 1 - strExpenseRate / 100 - (includeOccupancyTax ? DC_TRANSIENT_TAX_RATE / 100 : 0));
  const breakEvenWholeHomeADR = scenario1Net / (wholeHomeNights * strEffectiveNetMargin);

  // How many nights of Hosted Room needed to equal Long-Term net?
  const breakEvenHostedNights = privateRoomADR > 0
    ? Math.round(scenario1Net / (privateRoomADR * strEffectiveNetMargin))
    : 0;

  // Max net for bar chart scaling
  const maxNet = Math.max(scenario1Net, scenario2Net, scenario3Net, 1);

  // Alphabetical list of neighborhoods
  const neighborhoodOptions = Array.from(neighborhoodStats.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-8">
      {/* Top Banner / Context */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>Financial Modeling</span>
              <span aria-hidden="true">·</span>
              <span>DC Market Calibration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Step 3: Three-Way Scenario Comparison
            </h1>
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
              Compare your property's net earning potential under the three legal DC occupancy models:
              a stable 12-month lease, an uncapped hosted room, or the 90-night unhosted cap.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {onOpenReportModal && (
              <button
                type="button"
                onClick={onOpenReportModal}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm cursor-pointer border border-slate-700"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Generate Report PDF</span>
              </button>
            )}

            {/* Quick Eligibility State Pill/Indicator */}
            {screenerAnswers.isPrimaryResidence !== null && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 shrink-0 max-w-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900">Your Eligibility Profile:</span>
                  <button
                    onClick={onNavigateToScreener}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Edit Answers
                  </button>
                </div>
                <div>
                  Primary Home: {screenerAnswers.isPrimaryResidence ? 'Yes' : 'No'} · Owner: {screenerAnswers.isTenant === false ? 'Yes' : 'No'} · HOA Ban: {screenerAnswers.hasHOABan ? 'Yes' : 'No'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bedroom Disaggregation Dropdown Menu (At the Top of Step 3) */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Left Column: Label, Icon, and Dropdown Menu */}
              <div className="flex-1 max-w-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Bed className="w-4 h-4" />
                  </div>
                  <label
                    htmlFor={bedroomSelectId}
                    className="text-xs font-bold uppercase tracking-wider text-slate-900"
                  >
                    Number of Bedrooms Renting Out
                  </label>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Whole numbers only (1 – 10)
                  </span>
                </div>

                <div className="relative">
                  <select
                    id={bedroomSelectId}
                    value={selectedBedrooms}
                    onChange={(e) =>
                      handleBedroomChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="all">All Bedrooms (Aggregated Cluster Median)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Bedroom' : 'Bedrooms'}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-slate-500 mt-1.5">
                  Selecting a bedroom size disaggregates market daily rates (ADR), DC median rent, and financial yields for your specific property.
                </p>
              </div>

              {/* Right Column: Calibrated Status & Metrics */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 md:min-w-[280px] shrink-0 space-y-1.5">
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
                  <span className="font-bold text-slate-700">
                    {selectedBedrooms === 'all'
                      ? 'Aggregated Baseline'
                      : `${selectedBedrooms} Bedroom${selectedBedrooms > 1 ? 's' : ''} Calibrated`}
                  </span>
                  <span className="text-[11px] text-slate-400 italic">
                    {bedroomStats.sampleLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nightly ADR:</span>
                    <strong className="text-slate-900 font-mono text-sm tabular-nums">
                      {formatCurrency(bedroomStats.medianADR)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">DC Market Rent:</span>
                    <strong className="text-slate-900 font-mono text-sm tabular-nums">
                      {formatCurrency(bedroomStats.medianRent)}/mo
                    </strong>
                  </div>
                </div>

                {(monthlyRent !== bedroomStats.medianRent || adr !== bedroomStats.medianADR) && (
                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAdr(bedroomStats.medianADR);
                        setMonthlyRent(bedroomStats.medianRent);
                      }}
                      className="w-full py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold transition-colors cursor-pointer text-center"
                    >
                      Reset Inputs to {selectedBedrooms === 'all' ? 'Cluster' : `${selectedBedrooms}-BR`} Medians
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Input Controls Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Neighborhood Selector */}
          <div>
            <label htmlFor={neighborhoodSelectId} className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              DC Neighborhood
            </label>
            <select
              id={neighborhoodSelectId}
              value={selectedNeighborhood}
              onChange={(e) => handleNeighborhoodChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            >
              {neighborhoodOptions.map((n) => (
                <option key={n.name} value={n.name}>
                  {n.name} ({n.count} listing{n.count > 1 ? 's' : ''} · Med. ${n.medianPrice})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Loaded from Step 2 DC Market Data.
            </p>
          </div>

          {/* Expected Monthly Rent */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label htmlFor={monthlyRentInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Expected Monthly Rent
              </label>
              <div className="flex items-center gap-1.5">
                {monthlyRent !== bedroomStats.medianRent && (
                  <button
                    type="button"
                    onClick={() => setMonthlyRent(bedroomStats.medianRent)}
                    className="text-[11px] px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded transition-colors border border-blue-200 cursor-pointer"
                    title={`Snap to DC residential market median for ${selectedNeighborhood.split(',')[0]} (${selectedBedrooms === 'all' ? 'All BRs' : `${selectedBedrooms} BR`})`}
                  >
                    Use Median ({formatCurrency(bedroomStats.medianRent)})
                  </button>
                )}
                <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                  {formatCurrency(monthlyRent)}/mo
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={monthlyRentInputId}
                type="range"
                min={500}
                max={Math.max(8000, Math.round(bedroomStats.medianRent * 2.2))}
                step={50}
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <input
                type="number"
                min={500}
                max={25000}
                step={50}
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Math.max(0, Number(e.target.value)))}
                aria-label="Expected monthly rent in dollars"
                className="w-24 px-2 py-1 text-sm border border-slate-300 rounded font-mono tabular-nums text-right"
              />
            </div>
            <div className="mt-1.5 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-1">
              <span>
                <strong className="text-slate-700 font-semibold">DC Market median</strong> ({selectedBedrooms === 'all' ? 'Overall' : `${selectedBedrooms} BR`}):{' '}
                <span className="font-semibold text-slate-900 font-mono tabular-nums">
                  {formatCurrency(bedroomStats.medianRent)}/mo
                </span>
              </span>
              <span className="text-slate-400 font-mono">
                Annual gross: {formatCurrency(scenario1Gross)}
              </span>
            </div>
          </div>

          {/* Whole-Home Airbnb Average Daily Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label htmlFor={wholeHomeAdrInputId} className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Whole-Home ADR ($/Night)
              </label>
              <div className="flex items-center gap-1.5">
                {adr !== bedroomStats.medianADR && (
                  <button
                    type="button"
                    onClick={() => setAdr(bedroomStats.medianADR)}
                    className="text-[11px] px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded transition-colors border border-blue-200 cursor-pointer"
                    title={`Snap to DC STR median ADR for ${selectedNeighborhood.split(',')[0]} (${selectedBedrooms === 'all' ? 'All BRs' : `${selectedBedrooms} BR`})`}
                  >
                    Use Median ({formatCurrency(bedroomStats.medianADR)})
                  </button>
                )}
                <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                  {formatCurrency(adr)}/night
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={wholeHomeAdrInputId}
                type="range"
                min={50}
                max={Math.max(1000, Math.round(bedroomStats.medianADR * 2.5))}
                step={5}
                value={adr}
                onChange={(e) => setAdr(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <input
                type="number"
                min={50}
                max={5000}
                step={5}
                value={adr}
                onChange={(e) => setAdr(Math.max(0, Number(e.target.value)))}
                aria-label="Whole-home average daily rate in dollars"
                className="w-24 px-2 py-1 text-sm border border-slate-300 rounded font-mono tabular-nums text-right"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              <strong className="text-slate-700 font-semibold">Median ADR</strong> ({selectedBedrooms === 'all' ? 'Overall' : `${selectedBedrooms} BR`}):{' '}
              <span className="font-semibold text-slate-900 font-mono tabular-nums">
                {formatCurrency(bedroomStats.medianADR)}/nt
              </span>
            </p>
          </div>
        </div>

        {/* Advanced Parameter Accordion */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Advanced Assumptions & Operating Expenses' : 'Customize Nights, Expenses & Room Discounts'}</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-4 p-5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label htmlFor={hostedNightsInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                  Hosted Room Nights
                </label>
                <input
                  id={hostedNightsInputId}
                  type="number"
                  min={30}
                  max={365}
                  value={hostedNights}
                  onChange={(e) => setHostedNights(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded font-mono tabular-nums"
                />
                <span className="text-[11px] text-slate-500">Standard default: 180 nights</span>
              </div>

              <div>
                <label htmlFor={wholeHomeNightsInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                  Whole Home Nights (Cap)
                </label>
                <input
                  id={wholeHomeNightsInputId}
                  type="number"
                  min={10}
                  max={180}
                  value={wholeHomeNights}
                  onChange={(e) => setWholeHomeNights(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded font-mono tabular-nums"
                />
                <span className="text-[11px] text-slate-500">DC statutory limit: 90 nights</span>
              </div>

              <div>
                <label htmlFor={longTermExpenseInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                  Long-Term Expenses (%)
                </label>
                <input
                  id={longTermExpenseInputId}
                  type="number"
                  min={0}
                  max={40}
                  value={longTermExpenseRate}
                  onChange={(e) => setLongTermExpenseRate(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded font-mono tabular-nums"
                />
                <span className="text-[11px] text-slate-500">Standard default: 10%</span>
              </div>

              <div>
                <label htmlFor={strExpenseInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                  STR Expenses (%)
                </label>
                <input
                  id={strExpenseInputId}
                  type="number"
                  min={0}
                  max={50}
                  value={strExpenseRate}
                  onChange={(e) => setStrExpenseRate(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded font-mono tabular-nums"
                />
                <span className="text-[11px] text-slate-500">Cleaning, utilities, fees: 15%</span>
              </div>

              <div>
                <label htmlFor={roomRatioInputId} className="block text-xs font-semibold text-slate-700 mb-1">
                  Private Room Rate Ratio (%)
                </label>
                <input
                  id={roomRatioInputId}
                  type="number"
                  min={20}
                  max={100}
                  value={privateRoomRatio}
                  onChange={(e) => setPrivateRoomRatio(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded font-mono tabular-nums"
                />
                <span className="text-[11px] text-slate-500">Room Rate = 60% of Whole-Home Average Daily Rate</span>
              </div>
            </div>
          )}
        </div>
        {/* D.C. Sales & Transient Occupancy Tax (14.95%) Optional Toggle Banner */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
            includeOccupancyTax
              ? 'bg-indigo-50/80 border-indigo-200 ring-1 ring-indigo-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  includeOccupancyTax ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      D.C. Sales &amp; Transient Occupancy Tax (14.95%)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      includeOccupancyTax
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {includeOccupancyTax ? 'After-Tax Mode Active' : 'Pre-Tax Standard View'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    D.C. imposes a <strong>14.95% transient accommodations tax</strong> (10.05% sales tax + 4.90% hotel convention surcharge) on all short-term bookings under 90 days. <strong>Long-term 12-month residential leases are 100% tax-exempt.</strong> Toggle on to deduct this 14.95% tax from short-term rental gross earnings to calculate true after-tax homeowner net take-home pay.
                  </p>
                  {onNavigateToLegal && (
                    <button
                      type="button"
                      onClick={onNavigateToLegal}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline mt-1.5 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read official D.C. tax &amp; FR-500 registration guide under Legal &amp; Licensing</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <span className="text-xs font-semibold text-slate-700">
                  {includeOccupancyTax ? 'After-Tax Net' : 'Pre-Tax Net'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={includeOccupancyTax}
                  onClick={() => setIncludeOccupancyTax(!includeOccupancyTax)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                    includeOccupancyTax ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                  title="Toggle D.C. 14.95% Transient Occupancy Tax"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      includeOccupancyTax ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Choose Strategy Focus
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Customizes Summary &amp; PDF Report
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select between the three DC occupancy models to highlight your preferred strategy in the dynamic summary and generated decision PDF report.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/90 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setSelectedScenarioId(null)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedScenarioId === null
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Automatically highlight the mathematical highest net income scenario"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto (Highest Net)</span>
            </button>
            {scenarios.map((sc) => {
              const isCurrent = activeScenarioId === sc.id && selectedScenarioId !== null;
              const IconComp = sc.icon;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setSelectedScenarioId(sc.id as 'long_term' | 'hosted_room' | 'whole_home')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{sc.name.split(' (')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Recommendation Summary Box */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              {isSelectedHighestNet ? (
                <Award className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              )}
              <span>
                {isSelectedHighestNet
                  ? 'Dynamic Recommendation Summary'
                  : 'Homeowner Selected Strategy Focus'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isSelectedHighestNet
                  ? (includeOccupancyTax
                      ? 'Highest After-Tax Net Yield (14.95% DC Tax Deducted)'
                      : 'Highest Financial Net Yield')
                  : 'User Selected Scenario'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isSelectedHighestNet
                ? `${activeScenario.name} delivers the highest net income`
                : `Selected Strategy: ${activeScenario.name}`}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {isSelectedHighestNet ? (
                <>
                  Based on your current parameters{includeOccupancyTax ? ' (factoring in D.C.\'s 14.95% sales & transient occupancy tax)' : ''},{' '}
                  <strong className="text-white font-semibold">{activeScenario.name}</strong> projects{' '}
                  <strong className="text-emerald-400 font-mono font-bold tabular-nums">
                    {formatCurrency(activeScenario.net)}
                  </strong>{' '}
                  in annual net take-home earnings. That is{' '}
                  <strong className="text-white font-mono tabular-nums">{formatCurrency(deltaFromSecond)}</strong> more per year than
                  the runner-up ({secondPlace.name}).
                </>
              ) : (
                <>
                  You have selected <strong className="text-white font-semibold">{activeScenario.name}</strong> as your target model, projecting{' '}
                  <strong className="text-emerald-400 font-mono font-bold tabular-nums">
                    {formatCurrency(activeScenario.net)}
                  </strong>{' '}
                  in annual net take-home earnings ({formatCurrency(activeScenario.net / 12)}/month). For financial comparison, the top mathematical yield is{' '}
                  <strong className="text-white font-mono tabular-nums">{winner.name}</strong> at{' '}
                  <strong className="text-amber-300 font-mono tabular-nums">{formatCurrency(winner.net)}</strong>/yr (+{formatCurrency(winner.net - activeScenario.net)} delta).
                </>
              )}
            </p>

            {/* Strategic insight text */}
            <div className="pt-3 text-xs text-slate-400 space-y-2">
              {includeOccupancyTax && (
                <div className="p-3 rounded-lg bg-indigo-950/70 border border-indigo-800 text-indigo-200 flex items-start gap-2">
                  <Receipt className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">After-Tax Dynamic: </span>
                    <span>
                      Long-term residential leases are 100% exempt from the 14.95% transient tax ($0 tax). Short-term rental models forfeit 14.95% of gross revenue (${formatCurrency(scenario3Tax)} on whole-home, ${formatCurrency(scenario2Tax)} on room), substantially favoring long-term leasing.
                    </span>
                  </div>
                </div>
              )}

              {activeScenario.id === 'long_term' && (
                <p>
                  💡 <span className="text-slate-200">Homeowner Insight:</span> Because DC caps unhosted rentals at 90 nights{includeOccupancyTax ? ' and subjects STRs to a 14.95% occupancy tax' : ''}, a regular long-term tenant produces a steady, passive monthly cashflow that comfortably outpaces short-term rental earnings in this price tier without guest turnover overhead.
                </p>
              )}
              {activeScenario.id === 'hosted_room' && (
                <p>
                  💡 <span className="text-slate-200">Homeowner Insight:</span> By hosting a private room while remaining in your home, you legally bypass the 90-night unhosted cap. At {hostedNights} nights per year, this strategy maximizes your home equity while keeping your property compliant.
                </p>
              )}
              {activeScenario.id === 'whole_home' && (
                <p>
                  💡 <span className="text-slate-200">Homeowner Insight:</span> High Average Daily Rate in this market allows the 90-night unhosted cap to out-earn the alternative options in just 3 months of peak hosting, leaving your home exclusively to you for the remaining 275 days.
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-5 shrink-0 min-w-[240px]">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              {isSelectedHighestNet
                ? (includeOccupancyTax ? 'Top After-Tax Net Income' : 'Top Annual Net Income')
                : 'Selected Strategy Net Income'}
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {formatCurrency(activeScenario.net)}
            </div>
            <div className="mt-1 text-xs text-slate-300 font-mono tabular-nums">
              {formatCurrency(activeScenario.net / 12)} / month net
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
              <span>Effective Net Margin:</span>
              <span className="font-mono text-slate-200">
                {Math.round(((activeScenario.net) / (activeScenario.gross || 1)) * 100)}% net
              </span>
            </div>

            {onOpenReportModal && (
              <button
                type="button"
                onClick={onOpenReportModal}
                className="mt-3.5 w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Report PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side 3 Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Scenario 1: Long-Term Lease */}
        <div
          className={`rounded-xl border p-6 flex flex-col justify-between transition-all ${
            activeScenarioId === 'long_term'
              ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30 shadow-md'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3 min-h-[40px]">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end min-h-[28px]">
                {activeScenarioId === 'long_term' && (
                  <span className="text-xs font-bold text-white bg-emerald-600 px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Selected</span>
                  </span>
                )}
                {winner.id === 'long_term' && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Top Net</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scenario 1</div>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">Long-Term Lease</h3>
            <div className="text-xs text-slate-500 mt-1 min-h-[20px]">365 Nights · Standard 12-Month Lease</div>

            {/* Net Income Metric */}
            <div className="mt-5 p-4 bg-slate-50 rounded-lg border border-slate-100 min-h-[114px] flex flex-col justify-between">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center justify-between min-h-[20px]">
                <span>{includeOccupancyTax ? 'After-Tax Net Income' : 'Projected Annual Net Income'}</span>
                {includeOccupancyTax ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded normal-case">
                    Tax-Exempt
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">Pre-Tax</span>
                )}
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1 leading-tight">
                  {formatCurrency(scenario1Net)}
                </div>
                <div className="text-xs text-slate-600 font-mono tabular-nums mt-1">
                  {formatCurrency(scenario1MonthlyNet)}/mo net · {formatCurrency(scenario1NightlyNet)}/day
                </div>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="mt-6 space-y-1 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[50px]">
                <div>
                  <div className="text-slate-700 font-medium">Expected Monthly Rent</div>
                  <div className="text-[11px] text-slate-400">
                    DC market median: {formatCurrency(neighborhoodMedianRent)}/mo
                  </div>
                </div>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(monthlyRent)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[40px]">
                <span className="text-slate-600">Gross Annual Revenue (12 mo)</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(scenario1Gross)}
                </span>
              </div>
              {/* Operating Expenses with Dropdown Breakdown */}
              <div className="py-2 border-b border-slate-100 min-h-[40px]">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpenseDropdown('long_term')}
                    className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 group cursor-pointer text-left focus:outline-none"
                    aria-expanded={openExpenseDropdown.long_term}
                  >
                    <span className="font-medium text-slate-700">Operating Expenses ({longTermExpenseRate}%)</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors">
                      <span>{openExpenseDropdown.long_term ? 'Hide' : 'Breakdown'}</span>
                      {openExpenseDropdown.long_term ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </button>
                  <span className="font-mono font-medium text-rose-600 tabular-nums">
                    - {formatCurrency(scenario1Expenses)}
                  </span>
                </div>

                {/* Dropdown Breakdown Panel */}
                {openExpenseDropdown.long_term && (
                  <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                      <span>Itemized Long-Term Expenses</span>
                      <span className="font-mono">Est. Cost ({longTermExpenseRate}% total)</span>
                    </div>

                    <div className="space-y-2">
                      {longTermBreakdown.map((item, idx) => {
                        const amount = scenario1Expenses * (item.sharePercent / 100);
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center justify-between text-slate-800 font-medium">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                <span>{item.label}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({item.effectivePercent}%)</span>
                              </span>
                              <span className="font-mono font-semibold text-rose-700 tabular-nums">
                                - {formatCurrency(amount)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 pl-3 leading-tight">
                              {item.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick rate preset bar */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span className="text-slate-500 font-medium">Rate Preset:</span>
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'Low (8%)', val: 8 },
                          { label: 'Default (10%)', val: 10 },
                          { label: 'Managed (15%)', val: 15 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setLongTermExpenseRate(preset.val)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                              longTermExpenseRate === preset.val
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[40px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">D.C. Transient Tax (14.95%)</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Exempt
                  </span>
                </div>
                <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                  $0 (100% Exempt)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[40px]">
                <span className="text-slate-600">Annual Night Limit</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">365 nights (Full Year)</span>
              </div>
              <div className="flex items-center justify-between py-2 min-h-[40px]">
                <span className="text-slate-600">Host Operational Burden</span>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Passive
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <button
              type="button"
              onClick={() => setSelectedScenarioId('long_term')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                activeScenarioId === 'long_term'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}
            >
              {activeScenarioId === 'long_term' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Selected Strategy</span>
                </>
              ) : (
                <span>Select This Strategy</span>
              )}
            </button>
            <div className="text-xs text-slate-500 leading-relaxed min-h-[64px]">
              <strong>DC Legal Note:</strong> Requires standard DC Basic Business License (BBL) for One-Family Accommodations. Subject to DC tenant rights and eviction protections. Leases &gt;90 days are 100% exempt from DC transient sales tax.
            </div>
          </div>
        </div>

        {/* Scenario 2: Hosted Private Room */}
        <div
          className={`rounded-xl border p-6 flex flex-col justify-between transition-all ${
            activeScenarioId === 'hosted_room'
              ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30 shadow-md'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3 min-h-[40px]">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Bed className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end min-h-[28px]">
                {activeScenarioId === 'hosted_room' && (
                  <span className="text-xs font-bold text-white bg-emerald-600 px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Selected</span>
                  </span>
                )}
                {winner.id === 'hosted_room' && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Top Net</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scenario 2</div>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">Hosted Private Room</h3>
            <div className="text-xs text-slate-500 mt-1 min-h-[20px]">{hostedNights} Nights · Host Present on Premises</div>

            {/* Net Income Metric */}
            <div className="mt-5 p-4 bg-slate-50 rounded-lg border border-slate-100 min-h-[114px] flex flex-col justify-between">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center justify-between min-h-[20px]">
                <span>{includeOccupancyTax ? 'After-Tax Net Income' : 'Projected Annual Net Income'}</span>
                {includeOccupancyTax ? (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded normal-case">
                    After 14.95% Tax
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">Pre-Tax</span>
                )}
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1 leading-tight">
                  {formatCurrency(scenario2Net)}
                </div>
                <div className="text-xs text-slate-600 font-mono tabular-nums mt-1">
                  {formatCurrency(scenario2MonthlyNet)}/mo net · {formatCurrency(scenario2NightlyNet)}/night
                </div>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="mt-6 space-y-1 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[50px]">
                <div>
                  <div className="text-slate-700 font-medium">Hosted Room Average Daily Rate</div>
                  <div className="text-[11px] text-slate-400">
                    {privateRoomRatio}% of whole-home rate ({formatCurrency(adr)}/night)
                  </div>
                </div>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(privateRoomADR)}/night
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[40px]">
                <span className="text-slate-600">Gross Annual Revenue ({hostedNights} nights)</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(scenario2Gross)}
                </span>
              </div>
              {/* Operating Expenses with Dropdown Breakdown */}
              <div className="py-2 border-b border-slate-100 min-h-[40px]">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpenseDropdown('hosted_room')}
                    className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 group cursor-pointer text-left focus:outline-none"
                    aria-expanded={openExpenseDropdown.hosted_room}
                  >
                    <span className="font-medium text-slate-700">Operating Expenses ({strExpenseRate}%)</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors">
                      <span>{openExpenseDropdown.hosted_room ? 'Hide' : 'Breakdown'}</span>
                      {openExpenseDropdown.hosted_room ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </button>
                  <span className="font-mono font-medium text-rose-600 tabular-nums">
                    - {formatCurrency(scenario2Expenses)}
                  </span>
                </div>

                {/* Dropdown Breakdown Panel */}
                {openExpenseDropdown.hosted_room && (
                  <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                      <span>Itemized Hosted Room Expenses</span>
                      <span className="font-mono">Est. Cost ({strExpenseRate}% total)</span>
                    </div>

                    <div className="space-y-2">
                      {hostedRoomBreakdown.map((item, idx) => {
                        const amount = scenario2Expenses * (item.sharePercent / 100);
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center justify-between text-slate-800 font-medium">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{item.label}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({item.effectivePercent}%)</span>
                              </span>
                              <span className="font-mono font-semibold text-rose-700 tabular-nums">
                                - {formatCurrency(amount)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 pl-3 leading-tight">
                              {item.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick rate preset bar */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span className="text-slate-500 font-medium">Rate Preset:</span>
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'Lean (12%)', val: 12 },
                          { label: 'Default (15%)', val: 15 },
                          { label: 'Co-Host (22%)', val: 22 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setStrExpenseRate(preset.val)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                              strExpenseRate === preset.val
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[40px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">D.C. Transient Tax (14.95%)</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    includeOccupancyTax ? 'text-indigo-700 bg-indigo-50' : 'text-slate-500 bg-slate-100'
                  }`}>
                    {includeOccupancyTax ? 'Deducted' : 'Pre-Tax'}
                  </span>
                </div>
                <span className={`font-mono tabular-nums ${includeOccupancyTax ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>
                  {includeOccupancyTax ? `- ${formatCurrency(scenario2Tax)}` : `(${formatCurrency(scenario2Tax)} est.)`}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[40px]">
                <span className="text-slate-600">Annual Night Limit</span>
                <span className="font-mono font-semibold text-emerald-700 tabular-nums">Unlimited (No Cap)</span>
              </div>
              <div className="flex items-center justify-between py-2 min-h-[40px]">
                <span className="text-slate-600">Host Operational Burden</span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  High Active
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <button
              type="button"
              onClick={() => setSelectedScenarioId('hosted_room')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                activeScenarioId === 'hosted_room'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}
            >
              {activeScenarioId === 'hosted_room' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Selected Strategy</span>
                </>
              ) : (
                <span>Select This Strategy</span>
              )}
            </button>
            <div className="text-xs text-slate-500 leading-relaxed min-h-[64px]">
              <strong>DC Legal Note:</strong> Fully exempt from the 90-night cap because the owner is present during the guest's stay. Requires DC DLCP Short-Term Rental license. Subject to 14.95% transient tax.
            </div>
          </div>
        </div>

        {/* Scenario 3: Whole Home Short-Term */}
        <div
          className={`rounded-xl border p-6 flex flex-col justify-between transition-all ${
            activeScenarioId === 'whole_home'
              ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30 shadow-md'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3 min-h-[40px]">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end min-h-[28px]">
                {activeScenarioId === 'whole_home' && (
                  <span className="text-xs font-bold text-white bg-emerald-600 px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Selected</span>
                  </span>
                )}
                {winner.id === 'whole_home' && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Top Net</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scenario 3</div>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">Whole Home Short-Term</h3>
            <div className="text-xs text-slate-500 mt-1 min-h-[20px]">{wholeHomeNights} Nights · Statutory 90-Day Cap</div>

            {/* Net Income Metric */}
            <div className="mt-5 p-4 bg-slate-50 rounded-lg border border-slate-100 min-h-[114px] flex flex-col justify-between">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center justify-between min-h-[20px]">
                <span>{includeOccupancyTax ? 'After-Tax Net Income' : 'Projected Annual Net Income'}</span>
                {includeOccupancyTax && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded normal-case">
                    After 14.95% Tax
                  </span>
                )}
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1 leading-tight">
                  {formatCurrency(scenario3Net)}
                </div>
                <div className="text-xs text-slate-600 font-mono tabular-nums mt-1">
                  {formatCurrency(scenario3MonthlyNet)}/mo net · {formatCurrency(scenario3NightlyNet)}/night
                </div>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="mt-6 space-y-1 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[50px]">
                <div>
                  <div className="text-slate-700 font-medium">Whole-Home Average Daily Rate</div>
                  <div className="text-[11px] text-slate-400">
                    DC market median: {formatCurrency(currentStats?.medianPrice ?? 150)}/night
                  </div>
                </div>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(adr)}/night
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[40px]">
                <span className="text-slate-600">Gross Annual Revenue ({wholeHomeNights} nights)</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(scenario3Gross)}
                </span>
              </div>
              {/* Operating Expenses with Dropdown Breakdown */}
              <div className="py-2 border-b border-slate-100 min-h-[40px]">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpenseDropdown('whole_home')}
                    className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 group cursor-pointer text-left focus:outline-none"
                    aria-expanded={openExpenseDropdown.whole_home}
                  >
                    <span className="font-medium text-slate-700">Operating Expenses ({strExpenseRate}%)</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 group-hover:bg-purple-100 px-1.5 py-0.5 rounded transition-colors">
                      <span>{openExpenseDropdown.whole_home ? 'Hide' : 'Breakdown'}</span>
                      {openExpenseDropdown.whole_home ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </button>
                  <span className="font-mono font-medium text-rose-600 tabular-nums">
                    - {formatCurrency(scenario3Expenses)}
                  </span>
                </div>

                {/* Dropdown Breakdown Panel */}
                {openExpenseDropdown.whole_home && (
                  <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                      <span>Itemized Whole-Home Expenses</span>
                      <span className="font-mono">Est. Cost ({strExpenseRate}% total)</span>
                    </div>

                    <div className="space-y-2">
                      {wholeHomeBreakdown.map((item, idx) => {
                        const amount = scenario3Expenses * (item.sharePercent / 100);
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center justify-between text-slate-800 font-medium">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                                <span>{item.label}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({item.effectivePercent}%)</span>
                              </span>
                              <span className="font-mono font-semibold text-rose-700 tabular-nums">
                                - {formatCurrency(amount)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 pl-3 leading-tight">
                              {item.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick rate preset bar */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span className="text-slate-500 font-medium">Rate Preset:</span>
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'Lean (12%)', val: 12 },
                          { label: 'Default (15%)', val: 15 },
                          { label: 'Co-Host (22%)', val: 22 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setStrExpenseRate(preset.val)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                              strExpenseRate === preset.val
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[40px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">D.C. Transient Tax (14.95%)</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    includeOccupancyTax ? 'text-indigo-700 bg-indigo-50' : 'text-slate-500 bg-slate-100'
                  }`}>
                    {includeOccupancyTax ? 'Deducted' : 'Pre-Tax'}
                  </span>
                </div>
                <span className={`font-mono tabular-nums ${includeOccupancyTax ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>
                  {includeOccupancyTax ? `- ${formatCurrency(scenario3Tax)}` : `(${formatCurrency(scenario3Tax)} est.)`}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 min-h-[40px]">
                <span className="text-slate-600">Annual Night Limit</span>
                <span className="font-mono font-semibold text-rose-600 tabular-nums">90 nights max (DC Cap)</span>
              </div>
              <div className="flex items-center justify-between py-2 min-h-[40px]">
                <span className="text-slate-600">Host Operational Burden</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Moderate
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <button
              type="button"
              onClick={() => setSelectedScenarioId('whole_home')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                activeScenarioId === 'whole_home'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}
            >
              {activeScenarioId === 'whole_home' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Selected Strategy</span>
                </>
              ) : (
                <span>Select This Strategy</span>
              )}
            </button>
            <div className="text-xs text-slate-500 leading-relaxed min-h-[64px]">
              <strong>DC Legal Note:</strong> Capped strictly at 90 nights per year under DC Act 22-540. Platforms automatically lock listings once 90 unhosted nights are reached. Subject to 14.95% transient tax.
            </div>
          </div>
        </div>
      </div>

      {/* Visual Relative Yield & Break-Even Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Comparison Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Visual Comparison: {includeOccupancyTax ? 'Projected After-Tax Net Income' : 'Projected Annual Net Income'}
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            {includeOccupancyTax
              ? 'Net returns after deducting operating expenses AND D.C.\'s 14.95% sales & transient occupancy tax on short-term rentals.'
              : `Net returns after subtracting operating expenses (${longTermExpenseRate}% long-term, ${strExpenseRate}% STR).`}
          </p>

          <div className="space-y-5">
            {/* Bar 1 */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Long-Term Lease (365 Nights)</span>
                <span className="font-mono tabular-nums">{formatCurrency(scenario1Net)}</span>
              </div>
              <div className="w-full bg-slate-100 h-6 rounded-md overflow-hidden relative">
                <div
                  className="bg-blue-600 h-full rounded-md transition-all duration-300"
                  style={{ width: `${Math.max(4, Math.min(100, (scenario1Net / maxNet) * 100))}%` }}
                />
              </div>
            </div>

            {/* Bar 2 */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Hosted Private Room ({hostedNights} Nights)</span>
                <span className="font-mono tabular-nums">{formatCurrency(scenario2Net)}</span>
              </div>
              <div className="w-full bg-slate-100 h-6 rounded-md overflow-hidden relative">
                <div
                  className="bg-emerald-600 h-full rounded-md transition-all duration-300"
                  style={{ width: `${Math.max(4, Math.min(100, (scenario2Net / maxNet) * 100))}%` }}
                />
              </div>
            </div>

            {/* Bar 3 */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Whole Home Short-Term ({wholeHomeNights} Nights)</span>
                <span className="font-mono tabular-nums">{formatCurrency(scenario3Net)}</span>
              </div>
              <div className="w-full bg-slate-100 h-6 rounded-md overflow-hidden relative">
                <div
                  className="bg-purple-600 h-full rounded-md transition-all duration-300"
                  style={{ width: `${Math.max(4, Math.min(100, (scenario3Net / maxNet) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Break-Even Benchmarks */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Key Break-Even Benchmarks
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Specific price thresholds required for short-term models to out-earn the traditional lease.
            </p>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-bold text-slate-900 mb-1">Whole-Home Average Daily Rate Parity:</div>
                <p className="text-slate-600 leading-relaxed">
                  To match your current long-term lease net ({formatCurrency(scenario1Net)}), your Whole-Home Average Daily Rate over {wholeHomeNights} capped nights would need to average{' '}
                  <strong className="text-slate-900 font-mono font-bold">{formatCurrency(breakEvenWholeHomeADR)}/night</strong> (current input is {formatCurrency(adr)}/night).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-bold text-slate-900 mb-1">Hosted Room Occupancy Parity:</div>
                <p className="text-slate-600 leading-relaxed">
                  At a room Average Daily Rate of {formatCurrency(privateRoomADR)}/night, you would need to host guests for approximately{' '}
                  <strong className="text-slate-900 font-mono font-bold">{breakEvenHostedNights} nights/year</strong> to equal the long-term rental net.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-bold text-slate-900 mb-1">90-Day Whole Home Monthly Equivalent:</div>
                <p className="text-slate-600 leading-relaxed">
                  The 90-night whole-home net ({formatCurrency(scenario3Net)}) is equivalent to renting your home to a standard tenant for{' '}
                  <strong className="text-slate-900 font-mono font-bold">{formatCurrency(breakEvenMonthlyRent)}/month</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
