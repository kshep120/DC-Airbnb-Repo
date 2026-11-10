/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { EligibilityScreener } from './components/EligibilityScreener';
import { ScenarioComparison, ReportFinancialParams } from './components/ScenarioComparison';
import { NeighborhoodExplorer } from './components/NeighborhoodExplorer';
import { RegulationGuide } from './components/RegulationGuide';
import { ReportModal } from './components/ReportModal';
import { AirbnbListing, NeighborhoodStats, ScreenerAnswers } from './types';
import { parseCSV, processRawRecords, computeNeighborhoodStats } from './utils/csvParser';
import { DEFAULT_NEIGHBORHOOD_STATS, FALLBACK_DEFAULT_ADR } from './data/fallbackData';
import { AlertCircle, CheckCircle, Database } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'screener' | 'scenarios' | 'explorer' | 'regulations'>('screener');
  
  // Screener answers (default to null for interactive assessment or let user test)
  const [screenerAnswers, setScreenerAnswers] = useState<ScreenerAnswers>({
    isPrimaryResidence: true,
    isTenant: false,
    hasHOABan: false,
  });

  // Listings & Neighborhoods state
  const [listings, setListings] = useState<AirbnbListing[]>([]);
  const [neighborhoodStats, setNeighborhoodStats] = useState<Map<string, NeighborhoodStats>>(
    new Map(Object.entries(DEFAULT_NEIGHBORHOOD_STATS))
  );
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('Capitol Hill, Lincoln Park');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [dataSourceNote, setDataSourceNote] = useState<string>('Loading local DC listings dataset...');
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  // Executive Decision Report PDF modal state & active financial parameters
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportParams, setReportParams] = useState<ReportFinancialParams>({
    monthlyRent: 2499,
    adr: 150,
    includeOccupancyTax: false,
    longTermExpenseRate: 10,
    strExpenseRate: 15,
    hostedNights: 180,
    wholeHomeNights: 90,
    privateRoomRatio: 60,
    selectedScenarioId: 'long_term',
    selectedBedrooms: 'all',
  });

  // Listen for Google Maps Platform quota defense events
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Scroll to top of the page whenever the user switches between tabs
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Load dataset on initial mount
  useEffect(() => {
    loadInitialDataset();
  }, []);

  async function loadInitialDataset() {
    setIsLoadingData(true);
    let csvText = '';
    let sourceUsed = '';

    // Attempt 1: Check /listings.csv
    try {
      const res = await fetch('/listings.csv');
      if (res.ok) {
        csvText = await res.text();
        sourceUsed = 'Local listings.csv';
      }
    } catch {
      // ignore
    }

    // Attempt 2: Check attached sample asset
    if (!csvText || csvText.length < 50) {
      try {
        const res2 = await fetch('/assets/aistudio/dc_airbnb_100_homeowner_decision_sample_sep2026_ce380ff2.csv');
        if (res2.ok) {
          csvText = await res2.text();
          sourceUsed = 'Sample DC Listings Dataset (Sept 2026)';
        }
      } catch {
        // ignore
      }
    }

    if (csvText && csvText.length > 50) {
      try {
        const rawRecords = parseCSV(csvText);
        const parsedListings = processRawRecords(rawRecords);
        if (parsedListings.length > 0) {
          const statsMap = computeNeighborhoodStats(parsedListings);
          setListings(parsedListings);
          setNeighborhoodStats(statsMap);
          setDataSourceNote(`Loaded ${parsedListings.length} listings from ${sourceUsed}.`);

          // Set default neighborhood to Capitol Hill or first available
          if (statsMap.has('Capitol Hill, Lincoln Park')) {
            setSelectedNeighborhood('Capitol Hill, Lincoln Park');
          } else {
            const first = statsMap.keys().next().value;
            if (first) setSelectedNeighborhood(first);
          }
          setIsLoadingData(false);
          return;
        }
      } catch (err) {
        console.error('Failed to parse CSV:', err);
      }
    }

    // Fallback if no dataset was found or parsing failed
    setNeighborhoodStats(new Map(Object.entries(DEFAULT_NEIGHBORHOOD_STATS)));
    setSelectedNeighborhood('Capitol Hill, Lincoln Park');
    setDataSourceNote('No CSV dataset found. Using calibrated DC default market medians ($150.00 fallback Average Daily Rate).');
    setIsLoadingData(false);
  }

  // Reset to initial defaults
  const handleReset = () => {
    setScreenerAnswers({
      isPrimaryResidence: true,
      isTenant: false,
      hasHOABan: false,
    });
    if (neighborhoodStats.has('Capitol Hill, Lincoln Park')) {
      setSelectedNeighborhood('Capitol Hill, Lincoln Park');
    }
    setActiveTab('screener');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header complying with Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleReset}
        totalListings={listings.length}
        selectedNeighborhood={selectedNeighborhood}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Google Maps Quota Warning Banner per Section 8 */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main Container - wide layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Subtle Data Source Indicator */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-white border border-slate-200/80 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Dataset Status:</span>
            <span>{dataSourceNote}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Selected DC Cluster:</span>
            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {selectedNeighborhood.split(',')[0]}
            </span>
          </div>
        </div>

        {/* View Selection Tabs */}
        {activeTab === 'screener' && (
          <EligibilityScreener
            answers={screenerAnswers}
            setAnswers={setScreenerAnswers}
            onProceedToScenarios={() => setActiveTab('explorer')}
          />
        )}

        {activeTab === 'scenarios' && (
          <ScenarioComparison
            listings={listings}
            neighborhoodStats={neighborhoodStats}
            selectedNeighborhood={selectedNeighborhood}
            setSelectedNeighborhood={setSelectedNeighborhood}
            screenerAnswers={screenerAnswers}
            onNavigateToScreener={() => setActiveTab('screener')}
            onNavigateToLegal={() => setActiveTab('regulations')}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onUpdateReportParams={setReportParams}
          />
        )}

        {activeTab === 'explorer' && (
          <NeighborhoodExplorer
            listings={listings}
            neighborhoodStats={neighborhoodStats}
            selectedNeighborhood={selectedNeighborhood}
            onSelectNeighborhood={(name) => {
              setSelectedNeighborhood(name);
            }}
            onNavigateToScenarios={(name) => {
              setSelectedNeighborhood(name);
              setActiveTab('scenarios');
            }}
          />
        )}

        {activeTab === 'regulations' && (
          <RegulationGuide onNavigateToScenarios={() => setActiveTab('scenarios')} />
        )}
      </main>

      {/* Executive Decision Report PDF Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedNeighborhood={selectedNeighborhood}
        monthlyRent={reportParams.monthlyRent}
        adr={reportParams.adr}
        includeOccupancyTax={reportParams.includeOccupancyTax}
        longTermExpenseRate={reportParams.longTermExpenseRate}
        strExpenseRate={reportParams.strExpenseRate}
        hostedNights={reportParams.hostedNights}
        wholeHomeNights={reportParams.wholeHomeNights}
        privateRoomRatio={reportParams.privateRoomRatio}
        screenerAnswers={screenerAnswers}
        neighborhoodStats={neighborhoodStats.get(selectedNeighborhood)}
        selectedScenarioId={reportParams.selectedScenarioId}
        selectedBedrooms={reportParams.selectedBedrooms}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>DC Airbnb Homeowner Decision Tool</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Educational and financial decision aid for Washington D.C. homeowners</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>DC Act 22-540</span>
            <span aria-hidden="true">·</span>
            <span>DLCP Regulations Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
