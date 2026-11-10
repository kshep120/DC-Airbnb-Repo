import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Home, RefreshCw, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeaderProps {
  activeTab: 'screener' | 'scenarios' | 'explorer' | 'regulations';
  setActiveTab: (tab: 'screener' | 'scenarios' | 'explorer' | 'regulations') => void;
  onReset: () => void;
  totalListings: number;
  selectedNeighborhood: string;
  onOpenReportModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onReset,
  totalListings,
  selectedNeighborhood,
  onOpenReportModal,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = navRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll]);

  // Auto-scroll selected step tab into view
  useEffect(() => {
    const el = navRef.current;
    if (el) {
      const activeEl = el.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    checkScroll();
  }, [activeTab, checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = navRef.current;
    if (el) {
      const delta = 160;
      el.scrollBy({
        left: direction === 'left' ? -delta : delta,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4 py-2 md:py-2.5 min-h-[4.25rem]">
          {/* Top row on mobile / Left column on desktop: Brand Wordmark */}
          <div className="flex items-center justify-between md:justify-start gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <Home className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
                  DC Airbnb Host Eligibility &amp; Estimator
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline whitespace-nowrap">
                  District of Columbia Short-Term Rental Act Decision Tool
                </span>
              </div>
            </div>

            {/* Mobile-only action buttons in top row */}
            <div className="flex items-center gap-1.5 md:hidden">
              {onOpenReportModal && (
                <button
                  type="button"
                  onClick={onOpenReportModal}
                  title="Generate and download 2-page executive homeowner decision report (PDF)"
                  className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer border border-slate-700/60"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>PDF</span>
                </button>
              )}
              <button
                onClick={onReset}
                title="Reset all inputs to defaults"
                className="p-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Zone 2: Navigation Steps with Visible Scroll Bar and Navigation Hints */}
          <div className="relative flex items-center min-w-0 flex-1 max-w-full md:max-w-xl lg:max-w-2xl mx-auto w-full md:w-auto">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScroll('left')}
                aria-label="Scroll steps left"
                className="absolute left-0 z-10 -ml-1 p-1 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 rounded-full shadow-xs border border-slate-200 cursor-pointer backdrop-blur-xs transition-opacity"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <nav
              ref={navRef}
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full pb-2 pt-1 px-1 steps-scrollbar scroll-smooth"
              aria-label="Application Steps Navigation"
            >
              <button
                data-active={activeTab === 'screener'}
                onClick={() => setActiveTab('screener')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'screener'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50/70 border border-slate-200/60'
                }`}
              >
                <span>📋 Step 1: Eligibility</span>
              </button>
              <button
                data-active={activeTab === 'explorer'}
                onClick={() => setActiveTab('explorer')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'explorer'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50/70 border border-slate-200/60'
                }`}
              >
                <span>🗺️ Step 2: DC Market Data</span>
              </button>
              <button
                data-active={activeTab === 'scenarios'}
                onClick={() => setActiveTab('scenarios')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'scenarios'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50/70 border border-slate-200/60'
                }`}
              >
                <span>📊 Step 3: 3-Way Scenarios</span>
              </button>
              <button
                data-active={activeTab === 'regulations'}
                onClick={() => setActiveTab('regulations')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'regulations'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50/70 border border-slate-200/60'
                }`}
              >
                <span>📜 Legal &amp; Licensing</span>
              </button>
            </nav>

            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScroll('right')}
                aria-label="Scroll steps right"
                className="absolute right-0 z-10 -mr-1 p-1 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 rounded-full shadow-xs border border-slate-200 cursor-pointer backdrop-blur-xs transition-opacity"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Zone 3: Primary Action (desktop) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {onOpenReportModal && (
              <button
                type="button"
                onClick={onOpenReportModal}
                title="Generate and download 2-page executive homeowner decision report (PDF)"
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer border border-slate-700/60"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden lg:inline">Generate Report PDF</span>
                <span className="lg:hidden">PDF Report</span>
              </button>
            )}

            <button
              onClick={onReset}
              title="Reset all inputs to defaults"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Reset Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

