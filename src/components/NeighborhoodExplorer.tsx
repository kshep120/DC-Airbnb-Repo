import React, { useState, useId } from 'react';
import { AirbnbListing, NeighborhoodStats } from '../types';
import { formatCurrency } from '../utils/csvParser';
import {
  Search,
  ArrowUpDown,
  Check,
  ExternalLink,
  Building,
  Bed,
  Star,
  Shield,
  Layers,
  Filter,
  ArrowRight
} from 'lucide-react';

import { DCInteractiveMap } from './DCInteractiveMap';

interface NeighborhoodExplorerProps {
  listings: AirbnbListing[];
  neighborhoodStats: Map<string, NeighborhoodStats>;
  selectedNeighborhood: string;
  onSelectNeighborhood: (name: string) => void;
  onNavigateToScenarios: (name: string) => void;
}

export const NeighborhoodExplorer: React.FC<NeighborhoodExplorerProps> = ({
  listings,
  neighborhoodStats,
  selectedNeighborhood,
  onSelectNeighborhood,
  onNavigateToScenarios,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'entire' | 'private'>('all');
  const [sortField, setSortField] = useState<'name' | 'medianPrice' | 'medianMonthlyRent' | 'count'>('medianPrice');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'map' | 'neighborhoods' | 'listings'>('map');
  const searchInputId = useId();

  // Summary Metrics
  const totalListings = listings.length;
  const allPrices = listings.map((l) => l.price);
  const citywideMedian = allPrices.length > 0
    ? [...allPrices].sort((a, b) => a - b)[Math.floor(allPrices.length / 2)]
    : 150;
  const superhostCount = listings.filter((l) => l.isSuperhost).length;
  const superhostPercentage = totalListings > 0 ? Math.round((superhostCount / totalListings) * 100) : 0;

  // Filtered Neighborhoods
  const statsList = Array.from(neighborhoodStats.values()).filter((n) =>
    n.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  statsList.sort((a, b) => {
    let comp = 0;
    if (sortField === 'name') comp = a.name.localeCompare(b.name);
    if (sortField === 'medianPrice') comp = a.medianPrice - b.medianPrice;
    if (sortField === 'medianMonthlyRent') comp = (a.medianMonthlyRent || 0) - (b.medianMonthlyRent || 0);
    if (sortField === 'count') comp = a.count - b.count;
    return sortAsc ? comp : -comp;
  });

  // Filtered Listings
  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.neighbourhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.propertyType && l.propertyType.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType =
      roomTypeFilter === 'all'
        ? true
        : roomTypeFilter === 'entire'
        ? l.roomType.toLowerCase().includes('entire')
        : l.roomType.toLowerCase().includes('private');
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>Step 2</span>
              <span aria-hidden="true">·</span>
              <span>DC Market Intelligence</span>
              <span aria-hidden="true">·</span>
              <span>39 Neighborhood Clusters</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Step 2: DC Neighborhood Market Data &amp; Nightly Rates
            </h1>
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
              Inspect DC nightly rates and residential market median rents. Selecting any neighborhood cluster
              here will immediately calibrate your <strong>Step 3 Three-Way Financial Scenario</strong>.
            </p>
          </div>

          {/* Quick Navigation to Step 3 */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToScenarios(selectedNeighborhood)}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Continue to Step 3: Scenarios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Summary KPIs */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Listings Loaded
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
              {totalListings}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Across {neighborhoodStats.size} DC clusters
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              DC Median Nightly Rate
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
              {formatCurrency(citywideMedian)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Across all listing types
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Superhost Share
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
              {superhostPercentage}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {superhostCount} verified Superhosts
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Selection
            </div>
            <div className="text-sm font-bold text-slate-900 truncate mt-1" title={selectedNeighborhood}>
              {selectedNeighborhood.split(',')[0]}
            </div>
            <div className="text-xs text-blue-600 font-semibold mt-0.5">
              Linked to Step 3 Scenarios
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('map')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'map'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗺️ Interactive DC Map
          </button>
          <button
            onClick={() => setActiveSubTab('neighborhoods')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'neighborhoods'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Neighborhood Table ({neighborhoodStats.size})
          </button>
          <button
            onClick={() => setActiveSubTab('listings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'listings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Listings Sample ({filteredListings.length})
          </button>
        </div>

        {activeSubTab !== 'map' && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id={searchInputId}
                type="text"
                placeholder="Search DC neighborhood..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search DC neighborhood"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {activeSubTab === 'listings' && (
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value as 'all' | 'entire' | 'private')}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="all">All Room Types</option>
                <option value="entire">Entire Home</option>
                <option value="private">Private Room</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* SubTab 0: Interactive DC Map */}
      {activeSubTab === 'map' && (
        <MapErrorBoundary>
          <DCInteractiveMap
            listings={listings}
            neighborhoodStats={neighborhoodStats}
            selectedNeighborhood={selectedNeighborhood}
            onSelectNeighborhood={onSelectNeighborhood}
            onNavigateToScenarios={onNavigateToScenarios}
          />
        </MapErrorBoundary>
      )}

      {/* SubTab 1: Neighborhood Table */}
      {activeSubTab === 'neighborhoods' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                    onClick={() => {
                      if (sortField === 'name') setSortAsc(!sortAsc);
                      else { setSortField('name'); setSortAsc(true); }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Neighborhood Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                    onClick={() => {
                      if (sortField === 'medianPrice') setSortAsc(!sortAsc);
                      else { setSortField('medianPrice'); setSortAsc(false); }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Median Nightly Rate</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                    onClick={() => {
                      if (sortField === 'medianMonthlyRent') setSortAsc(!sortAsc);
                      else { setSortField('medianMonthlyRent'); setSortAsc(false); }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>DC Market Rent (mo)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Entire Home Median Rate</th>
                  <th className="py-3 px-4 text-right">Private Room Median Rate</th>
                  <th className="py-3 px-4 text-right">Price Range (Min - Max)</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                    onClick={() => {
                      if (sortField === 'count') setSortAsc(!sortAsc);
                      else { setSortField('count'); setSortAsc(false); }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Sample Size</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {statsList.map((stat) => {
                  const isSelected = selectedNeighborhood === stat.name;
                  return (
                    <tr
                      key={stat.name}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          <span>{stat.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(stat.medianPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {stat.medianMonthlyRent ? formatCurrency(stat.medianMonthlyRent) + '/mo' : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                        {stat.entireHomeMedianPrice > 0 ? formatCurrency(stat.entireHomeMedianPrice) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                        {stat.privateRoomMedianPrice > 0 ? formatCurrency(stat.privateRoomMedianPrice) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500 tabular-nums">
                        ${stat.minPrice} - ${stat.maxPrice}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                        {stat.count} listing{stat.count > 1 ? 's' : ''}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            onSelectNeighborhood(stat.name);
                            onNavigateToScenarios(stat.name);
                          }}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? 'Active in Step 3' : 'Select for Step 3'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 2: Individual Listings Table */}
      {activeSubTab === 'listings' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Neighborhood</th>
                  <th className="py-3 px-4">Room Type</th>
                  <th className="py-3 px-4">Property Type</th>
                  <th className="py-3 px-4 text-right">Nightly Price</th>
                  <th className="py-3 px-4 text-center">Superhost</th>
                  <th className="py-3 px-4 text-right">Rating</th>
                  <th className="py-3 px-4 text-right">Reviews</th>
                  <th className="py-3 px-4 text-right">License Type</th>
                  <th className="py-3 px-4 text-center">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredListings.slice(0, 50).map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {l.neighbourhood}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        {l.roomType.toLowerCase().includes('entire') ? (
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Bed className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{l.roomType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {l.propertyType || 'Residential'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(l.price)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {l.isSuperhost ? (
                        <span className="text-emerald-700 font-semibold">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {l.reviewRating ? `${l.reviewRating.toFixed(2)} ★` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                      {l.numberOfReviews ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono text-[11px]">
                      {l.licenseType || 'hosted_only'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {l.listingUrl ? (
                        <a
                          href={l.listingUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-blue-600 hover:text-blue-800 p-1 inline-flex items-center"
                          title="View on Airbnb"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredListings.length > 50 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
              Showing top 50 of {filteredListings.length} matching listings. Use search to refine.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('Map component error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[540px] bg-slate-900 text-white rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
            🗺️
          </div>
          <h3 className="text-lg font-bold">Interactive Map View Unavailable</h3>
          <p className="text-xs text-slate-300 max-w-md leading-relaxed">
            The map rendering encountered an unexpected issue. You can seamlessly explore all 39 neighborhood clusters using the Neighborhood Table or Listings Sample tabs above.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

