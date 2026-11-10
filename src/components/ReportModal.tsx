import React, { useState } from 'react';
import { NeighborhoodStats, ScreenerAnswers } from '../types';
import { formatCurrency } from '../utils/csvParser';
import { generateDecisionReportPDF } from '../utils/pdfGenerator';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle,
  Building2,
  Bed,
  Home,
  Receipt,
  Scale,
  Award
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNeighborhood: string;
  monthlyRent: number;
  adr: number;
  includeOccupancyTax: boolean;
  longTermExpenseRate: number;
  strExpenseRate: number;
  hostedNights: number;
  wholeHomeNights: number;
  privateRoomRatio: number;
  screenerAnswers: ScreenerAnswers;
  neighborhoodStats?: NeighborhoodStats;
  selectedScenarioId?: 'long_term' | 'hosted_room' | 'whole_home';
  selectedBedrooms?: number | 'all';
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  selectedNeighborhood,
  monthlyRent,
  adr,
  includeOccupancyTax,
  longTermExpenseRate,
  strExpenseRate,
  hostedNights,
  wholeHomeNights,
  privateRoomRatio,
  screenerAnswers,
  neighborhoodStats,
  selectedScenarioId = 'long_term',
  selectedBedrooms = 'all',
}) => {
  const [propertyLabel, setPropertyLabel] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [modalScenarioId, setModalScenarioId] = useState<'long_term' | 'hosted_room' | 'whole_home'>(selectedScenarioId);

  // Sync when prop changes
  React.useEffect(() => {
    if (selectedScenarioId) {
      setModalScenarioId(selectedScenarioId);
    }
  }, [selectedScenarioId]);

  if (!isOpen) return null;

  // Financial computations
  const DC_TRANSIENT_TAX_RATE = 14.95;

  // Scenario 1: Long-term lease
  const s1Gross = monthlyRent * 12;
  const s1Expenses = s1Gross * (longTermExpenseRate / 100);
  const s1Net = s1Gross - s1Expenses;

  // Scenario 2: Hosted room
  const privateRoomADR = adr * (privateRoomRatio / 100);
  const s2Gross = privateRoomADR * hostedNights;
  const s2Expenses = s2Gross * (strExpenseRate / 100);
  const s2Tax = s2Gross * (DC_TRANSIENT_TAX_RATE / 100);
  const s2Net = s2Gross - s2Expenses - (includeOccupancyTax ? s2Tax : 0);

  // Scenario 3: Whole-home STR (90-night cap)
  const s3Gross = adr * wholeHomeNights;
  const s3Expenses = s3Gross * (strExpenseRate / 100);
  const s3Tax = s3Gross * (DC_TRANSIENT_TAX_RATE / 100);
  const s3Net = s3Gross - s3Expenses - (includeOccupancyTax ? s3Tax : 0);

  const scenarios = [
    { id: 'long_term' as const, name: 'Long-Term Lease (365 Nights)', net: s1Net, gross: s1Gross, icon: Building2, tag: 'Passive' },
    { id: 'hosted_room' as const, name: `Hosted Private Room (${hostedNights} Nights)`, net: s2Net, gross: s2Gross, icon: Bed, tag: 'Uncapped' },
    { id: 'whole_home' as const, name: `Whole Home STR (${wholeHomeNights} Nights)`, net: s3Net, gross: s3Gross, icon: Home, tag: 'DC 90-Day Cap' },
  ];

  const sortedScenarios = [...scenarios].sort((a, b) => b.net - a.net);
  const highestNetScenario = sortedScenarios[0];
  const activeSelected = scenarios.find((s) => s.id === modalScenarioId) || highestNetScenario;
  const isHighestSelected = activeSelected.id === highestNetScenario.id;

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    try {
      generateDecisionReportPDF({
        neighborhood: selectedNeighborhood,
        propertyLabel: propertyLabel.trim() || undefined,
        monthlyRent,
        adr,
        includeOccupancyTax,
        longTermExpenseRate,
        strExpenseRate,
        hostedNights,
        wholeHomeNights,
        privateRoomRatio,
        screenerAnswers,
        neighborhoodStats,
        selectedScenarioId: modalScenarioId,
        selectedBedrooms,
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white leading-tight">
                  Generate Homeowner Decision Report (PDF)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  2-Page Executive Brief
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                A formal executive assessment of your property&apos;s financial returns under DC short-term rental regulations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Strategy Selection Feature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Strategy for Report Focus
              </label>
              <span className="text-[11px] text-slate-500">
                Customizes dynamic summary &amp; report emphasis
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {scenarios.map((sc) => {
                const isCurrent = sc.id === modalScenarioId;
                const isTopNet = sc.id === highestNetScenario.id;
                const IconComponent = sc.icon;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setModalScenarioId(sc.id)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <IconComponent className={`w-4 h-4 ${isCurrent ? 'text-emerald-700' : 'text-slate-500'}`} />
                        {isTopNet && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Top Net
                          </span>
                        )}
                        {isCurrent && !isTopNet && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {sc.name.split(' (')[0]}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 font-mono text-xs font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(sc.net)}<span className="text-[10px] font-normal text-slate-500">/yr</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Property Customization */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Property Nickname or Address (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Capitol Hill Rowhouse or 421 East Capitol St NE"
              value={propertyLabel}
              onChange={(e) => setPropertyLabel(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              This label will appear on the report header alongside the cluster name (<strong>{selectedNeighborhood.split(',')[0]}</strong> · DC Market Median Rent: <strong>{formatCurrency(neighborhoodStats?.medianMonthlyRent ?? 2400)}/mo</strong>).
            </span>
          </div>

          {/* Report Highlights Preview Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Report Focus Summary</span>
              <span className="font-mono text-slate-500">Mode: {includeOccupancyTax ? 'After-Tax (14.95% STR Tax)' : 'Standard Pre-Tax'}</span>
            </div>

            {/* Selected Scenario pill */}
            <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isHighestSelected ? (
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    {isHighestSelected ? 'Selected Strategy (Highest Net Yield)' : 'Homeowner Selected Strategy'}
                  </div>
                  <div className="text-sm font-bold text-white">{activeSelected.name}</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-base font-extrabold text-emerald-400">{formatCurrency(activeSelected.net)}</div>
                <div className="text-[10px] text-slate-300">{formatCurrency(activeSelected.net / 12)}/mo net</div>
              </div>
            </div>

            {/* Included in this PDF */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Three-Way Financial Projections:</strong> Side-by-side comparison of 365-day lease vs 180-day hosted room vs 90-day whole home.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Itemized Operating Expense Breakdown:</strong> Specific DC repairs, turnover, Airbnb platform fees, and insurance reserves.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>D.C. Tax &amp; Licensing Roadmap:</strong> 14.95% sales tax rules, marketplace collection, and 5-step DLCP licensing checklist.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="Print document or save via system PDF dialog"
            >
              <Printer className="w-4 h-4" />
              <span>Print Preview</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isGenerating ? 'Generating PDF...' : 'Download Report PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
