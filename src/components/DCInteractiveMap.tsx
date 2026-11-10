import React, { useState, useMemo } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  Polygon,
  AdvancedMarker,
  InfoWindow,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { AirbnbListing, NeighborhoodStats } from '../types';
import { formatCurrency } from '../utils/csvParser';
import dcBoundariesData from '../data/dcBoundaries.json';
import {
  MapPin,
  Building,
  Bed,
  DollarSign,
  Compass,
  KeyRound,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';

interface DCInteractiveMapProps {
  listings: AirbnbListing[];
  neighborhoodStats: Map<string, NeighborhoodStats>;
  selectedNeighborhood: string;
  onSelectNeighborhood: (name: string) => void;
  onNavigateToScenarios: (name: string) => void;
}

// Washington D.C. Center Coordinates
const DC_CENTER = { lat: 38.9072, lng: -77.0369 };

// Type for boundary dictionary
type BoundaryRings = Array<Array<{ lat: number; lng: number }>>;
const dcBoundaries: Record<string, BoundaryRings> = dcBoundariesData as Record<string, BoundaryRings>;

// Determine color based on median price tier
export function getRateTierColor(price: number): { bg: string; border: string; label: string } {
  if (price < 150) {
    return { bg: '#10b981', border: '#059669', label: 'Budget (< $150)' }; // emerald
  }
  if (price <= 230) {
    return { bg: '#3b82f6', border: '#2563eb', label: 'Moderate ($150 - $230)' }; // blue
  }
  if (price <= 350) {
    return { bg: '#8b5cf6', border: '#7c3aed', label: 'Premium ($231 - $350)' }; // purple
  }
  return { bg: '#f43f5e', border: '#e11d48', label: 'Luxury ($351+)' }; // rose
}

export const DCInteractiveMap: React.FC<DCInteractiveMapProps> = ({
  listings,
  neighborhoodStats,
  selectedNeighborhood,
  onSelectNeighborhood,
  onNavigateToScenarios,
}) => {
  const [activeInfoName, setActiveInfoName] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [mapEngine, setMapEngine] = useState<'google' | 'vector'>('google');
  const [showPriceBadges, setShowPriceBadges] = useState<boolean>(true);
  const [customKey, setCustomKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  const updateCursorPos = (clientX: number, clientY: number) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    setCursorPos({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  // Check if API key is provided via env var, window global, or user manual input
  const apiKey =
    customKey.trim() ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof window !== 'undefined' ? window.GOOGLE_MAPS_API_KEY : '') ||
    '';

  const statsArray = useMemo(() => Array.from(neighborhoodStats.values()), [neighborhoodStats]);
  const activeStat = neighborhoodStats.get(selectedNeighborhood) ?? statsArray[0];
  const infoStat = activeInfoName ? neighborhoodStats.get(activeInfoName) : null;

  // Bounding box for vector projection
  const bounds = {
    minLat: 38.815,
    maxLat: 38.995,
    minLng: -77.125,
    maxLng: -76.905,
  };

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              DC Neighborhood Boundary & Rate Map
            </h3>
            <p className="text-xs text-slate-500">
              Each bordered area represents an official DC neighborhood cluster, color-coded by median nightly rate.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
          {/* Badge toggle */}
          <button
            type="button"
            onClick={() => setShowPriceBadges(!showPriceBadges)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border ${
              showPriceBadges
                ? 'bg-slate-100 text-slate-900 border-slate-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Nightly Rate Badges on the map"
          >
            {showPriceBadges ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showPriceBadges ? 'Rate Badges On' : 'Borders Only'}</span>
          </button>

          {/* Map View Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setMapEngine('google')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                mapEngine === 'google'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Google Maps View
            </button>
            <button
              onClick={() => setMapEngine('vector')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                mapEngine === 'vector'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DC Boundary View
            </button>
          </div>

          {mapEngine === 'google' && !apiKey && (
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              title="Add API Key"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{showKeyInput ? 'Hide Key Input' : 'Add Key'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Manual API Key input bar if key is not set */}
      {showKeyInput && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-center gap-3 text-xs">
          <span className="text-amber-900 font-medium">Enter Google Maps API Key:</span>
          <input
            type="text"
            placeholder="AIzaSy..."
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded text-slate-900 font-mono"
          />
          <button
            onClick={() => setShowKeyInput(false)}
            className="px-3 py-1.5 bg-slate-900 text-white rounded font-semibold"
          >
            Save & Load Map
          </button>
        </div>
      )}

      {/* Price Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-100 rounded-lg text-[11px] text-slate-600 font-medium">
        <span className="font-bold text-slate-800">Nightly Rate Tier Legend:</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500 inline-block border border-emerald-600 shadow-xs" />
            <span>Budget (&lt; $150)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-blue-500 inline-block border border-blue-600 shadow-xs" />
            <span>Moderate ($150 - $230)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-purple-500 inline-block border border-purple-600 shadow-xs" />
            <span>Premium ($231 - $350)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-rose-500 inline-block border border-rose-600 shadow-xs" />
            <span>Luxury ($351+)</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
            <span className="w-3.5 h-3.5 rounded-sm bg-slate-900 border-2 border-white inline-block shadow-xs" />
            <span className="font-semibold text-slate-900">Active Selection</span>
          </div>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div
        ref={mapContainerRef}
        onMouseMove={(e) => updateCursorPos(e.clientX, e.clientY)}
        onMouseLeave={() => {
          setHoveredName(null);
          setCursorPos(null);
        }}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs relative"
      >
        {/* Floating Tooltip Attached to Cursor */}
        {hoveredName && cursorPos && (
          <div
            className="pointer-events-none absolute z-50 select-none transition-transform duration-75 ease-out"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              transform: `translate(${cursorPos.x > 500 ? '-105%' : '14px'}, ${cursorPos.y > 430 ? '-105%' : '14px'})`,
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-xs text-white px-3 py-2 rounded-lg shadow-2xl border border-slate-700/80 text-xs flex flex-col gap-1 max-w-[280px]">
              <div className="font-bold tracking-tight text-white flex items-center gap-1.5 leading-snug">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/30"
                  style={{
                    backgroundColor: getRateTierColor(neighborhoodStats.get(hoveredName)?.medianPrice ?? 150).border,
                  }}
                />
                <span className="truncate">{hoveredName}</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(neighborhoodStats.get(hoveredName)?.medianPrice ?? 150)}/night
                </span>
                <span className="text-slate-400 text-[10px]">
                  {neighborhoodStats.get(hoveredName)?.count ?? 0} listings
                </span>
              </div>
              <div className="text-[10px] text-slate-300 flex items-center justify-between gap-2 pt-0.5">
                <span className="text-slate-400">DC Market Rent:</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {formatCurrency(neighborhoodStats.get(hoveredName)?.medianMonthlyRent ?? 2400)}/mo
                </span>
              </div>
            </div>
          </div>
        )}

        {mapEngine === 'google' ? (
          <div className="w-full h-[540px] relative bg-slate-100">
            <APIProvider apiKey={apiKey}>
              <GoogleMap
                id="dc-market-map"
                mapId="DEMO_MAP_ID"
                defaultCenter={DC_CENTER}
                defaultZoom={11.8}
                gestureHandling="greedy"
                disableDefaultUI={false}
                onMouseMove={(e: MapMouseEvent) => {
                  if (e.domEvent && 'clientX' in e.domEvent) {
                    updateCursorPos(e.domEvent.clientX, e.domEvent.clientY);
                  }
                }}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {/* Render Colored Polygons for all 39 DC Neighborhoods */}
                {Object.entries(dcBoundaries).map(([name, rings]) => {
                  const stat = neighborhoodStats.get(name);
                  const price = stat?.medianPrice ?? 150;
                  const colors = getRateTierColor(price);
                  const isSelected = selectedNeighborhood === name;
                  const isHovered = hoveredName === name;

                  return (
                    <Polygon
                      key={`poly-${name}`}
                      paths={rings[0]}
                      strokeColor={isSelected ? '#0f172a' : isHovered ? '#0f172a' : colors.border}
                      strokeOpacity={isSelected ? 1.0 : isHovered ? 1.0 : 0.85}
                      strokeWeight={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                      fillColor={isSelected ? colors.bg : colors.bg}
                      fillOpacity={isSelected ? 0.65 : isHovered ? 0.55 : 0.35}
                      clickable={true}
                      onClick={() => {
                        onSelectNeighborhood(name);
                        setActiveInfoName(name);
                      }}
                      onMouseOver={(e: MapMouseEvent) => {
                        setHoveredName(name);
                        if (e?.domEvent && 'clientX' in e.domEvent) {
                          updateCursorPos(e.domEvent.clientX, e.domEvent.clientY);
                        }
                      }}
                      onMouseOut={() => setHoveredName(null)}
                    />
                  );
                })}

                {/* Optional centroid rate badges */}
                {showPriceBadges &&
                  statsArray.map((stat) => {
                    const isSelected = selectedNeighborhood === stat.name;
                    const colors = getRateTierColor(stat.medianPrice);

                    return (
                      <AdvancedMarker
                        key={`label-${stat.name}`}
                        position={{ lat: stat.latitude, lng: stat.longitude }}
                        title={`${stat.name} - ${formatCurrency(stat.medianPrice)}/night`}
                        onClick={() => {
                          onSelectNeighborhood(stat.name);
                          setActiveInfoName(stat.name);
                        }}
                      >
                        <div
                          className={`px-1.5 py-0.5 rounded shadow-sm text-[10px] font-mono font-bold transition-transform cursor-pointer border ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 scale-110 ring-2 ring-white z-30'
                              : 'bg-white/95 text-slate-800 border-slate-300 hover:scale-105 z-10'
                          }`}
                        >
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                            style={{ backgroundColor: colors.border }}
                          />
                          <span>${stat.medianPrice}</span>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                {/* InfoWindow for clicked neighborhood */}
                {activeInfoName && infoStat && (
                  <InfoWindow
                    position={{ lat: infoStat.latitude, lng: infoStat.longitude }}
                    onCloseClick={() => setActiveInfoName(null)}
                    maxWidth={320}
                  >
                    <div className="p-1 text-slate-900 font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2">
                        <span className="font-bold text-xs text-slate-900 leading-tight">
                          {infoStat.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                          {infoStat.count} listing{infoStat.count > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Median Nightly Rate:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(infoStat.medianPrice)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">DC Market Median Rent:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(infoStat.medianMonthlyRent ?? 2400)}/mo
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Entire Home Median Rate:</span>
                          <span className="font-mono text-slate-700">
                            {infoStat.entireHomeMedianPrice > 0 ? formatCurrency(infoStat.entireHomeMedianPrice) : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Private Room Median Rate:</span>
                          <span className="font-mono text-slate-700">
                            {infoStat.privateRoomMedianPrice > 0 ? formatCurrency(infoStat.privateRoomMedianPrice) : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Observed Range:</span>
                          <span className="font-mono">${infoStat.minPrice} - ${infoStat.maxPrice}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectNeighborhood(infoStat.name);
                            onNavigateToScenarios(infoStat.name);
                          }}
                          className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          <span>Apply to Step 3 Scenarios</span>
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </APIProvider>
          </div>
        ) : (
          /* High-Fidelity DC Vector / Boundary Canvas */
          <div className="w-full h-[540px] relative bg-slate-950 p-6 flex flex-col justify-between overflow-hidden">
            {/* Top Bar on Vector Canvas */}
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white">Washington D.C. Boundary Choropleth Map</span>
                <span>·</span>
                <span>39 Official Clusters</span>
              </div>
              <span className="text-slate-400">Click or hover any neighborhood to inspect</span>
            </div>

            {/* Vector SVG Polygons with DC rivers */}
            <div className="relative z-10 flex-1 my-2 flex items-center justify-center">
              <svg
                viewBox="0 0 800 650"
                className="w-full h-full max-h-[420px] drop-shadow-md select-none"
              >
                {/* Water bodies backdrop */}
                <path
                  d="M 120 80 Q 240 260 380 370 T 640 450"
                  fill="none"
                  stroke="#0369a1"
                  strokeWidth="10"
                  opacity="0.35"
                />
                <path
                  d="M 520 120 Q 580 270 450 410"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="8"
                  opacity="0.35"
                />

                {/* Render each neighborhood as SVG polygon */}
                {Object.entries(dcBoundaries).map(([name, rings]) => {
                  const stat = neighborhoodStats.get(name);
                  const price = stat?.medianPrice ?? 150;
                  const colors = getRateTierColor(price);
                  const isSelected = selectedNeighborhood === name;
                  const isHovered = hoveredName === name;

                  // Convert coordinates to SVG points
                  const pointsStr = rings[0]
                    .map((pt) => {
                      const x = ((pt.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 800;
                      const y = (1 - (pt.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 650;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');

                  return (
                    <polygon
                      key={`svg-${name}`}
                      points={pointsStr}
                      fill={colors.bg}
                      fillOpacity={isSelected ? 0.75 : isHovered ? 0.6 : 0.4}
                      stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff' : colors.border}
                      strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1}
                      className="cursor-pointer transition-colors"
                      onClick={() => {
                        onSelectNeighborhood(name);
                        setActiveInfoName(name);
                      }}
                      onMouseEnter={(e) => {
                        setHoveredName(name);
                        updateCursorPos(e.clientX, e.clientY);
                      }}
                      onMouseMove={(e) => {
                        setHoveredName(name);
                        updateCursorPos(e.clientX, e.clientY);
                      }}
                      onMouseLeave={() => setHoveredName(null)}
                    >
                      <title>{`${name} - $${price}/night`}</title>
                    </polygon>
                  );
                })}

                {/* Centroid Labels in SVG if enabled */}
                {showPriceBadges &&
                  statsArray.map((stat) => {
                    const x = ((stat.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 800;
                    const y = (1 - (stat.latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 650;
                    const isSelected = selectedNeighborhood === stat.name;

                    return (
                      <g
                        key={`svg-lbl-${stat.name}`}
                        transform={`translate(${x}, ${y})`}
                        className="pointer-events-none select-none"
                      >
                        <rect
                          x="-18"
                          y="-9"
                          width="36"
                          height="18"
                          rx="4"
                          fill={isSelected ? '#0f172a' : '#1e293b'}
                          stroke={isSelected ? '#ffffff' : '#475569'}
                          strokeWidth="1"
                          opacity="0.95"
                        />
                        <text
                          x="0"
                          y="3"
                          fill="#ffffff"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          ${stat.medianPrice}
                        </text>
                      </g>
                    );
                  })}
              </svg>
            </div>
          </div>
        )}

        {/* Selected Neighborhood Footer Card */}
        {activeStat && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                style={{ backgroundColor: getRateTierColor(activeStat.medianPrice).border }}
              >
                <Building className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {activeStat.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Active in Step 3 Scenarios
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-3">
                  <span>Median Nightly Rate: <strong className="text-slate-900 font-mono">{formatCurrency(activeStat.medianPrice)}</strong></span>
                  <span>·</span>
                  <span>DC Market Rent: <strong className="text-slate-900 font-mono">{formatCurrency(activeStat.medianMonthlyRent ?? 2400)}/mo</strong></span>
                  <span>·</span>
                  <span>Entire Home: <strong className="text-slate-900 font-mono">{formatCurrency(activeStat.entireHomeMedianPrice)}</strong></span>
                  <span>·</span>
                  <span>Private Room: <strong className="text-slate-900 font-mono">{formatCurrency(activeStat.privateRoomMedianPrice)}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToScenarios(activeStat.name)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <span>Test Financial Scenarios in Step 3 for {activeStat.name.split(',')[0]}</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
