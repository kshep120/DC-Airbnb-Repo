import React from 'react';
import {
  FileCheck2,
  AlertTriangle,
  Scale,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  DollarSign,
  Receipt,
  Building,
  ArrowRight,
  Info
} from 'lucide-react';

interface RegulationGuideProps {
  onNavigateToScenarios?: () => void;
}

export const RegulationGuide: React.FC<RegulationGuideProps> = ({ onNavigateToScenarios }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          <span>District of Columbia Legal Reference</span>
          <span aria-hidden="true">·</span>
          <span>DC Official Code § 30-201 &amp; § 47-2002</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          DC Short-Term Rental Regulatory &amp; Licensing Roadmap
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
          The Short-Term Rental Regulation Act of 2018 (enforced by the Department of Licensing and Consumer
          Protection — DLCP) requires every residential host in the District of Columbia to be certified, licensed, and registered.
        </p>
      </div>

      {/* 5-Step Step-by-Step Licensing Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-blue-600" />
          <span>The 5-Step DLCP License Roadmap</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-blue-600 mb-1">Step 01</div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Homestead Check</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verify your property receives the DC Homestead Property Tax Deduction (confirms primary residency).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-blue-600 mb-1">Step 02</div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Clean Hands Cert</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Obtain a Clean Hands Certificate from the Office of Tax and Revenue (confirms &lt;$100 in DC debt).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-blue-600 mb-1">Step 03</div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Life Safety Inspection</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Install functioning smoke/CO detectors, certified 2A:10B:C fire extinguisher, and emergency egress map.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-blue-600 mb-1">Step 04</div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">DLCP STR Application</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submit the online Short-Term Rental License application ($99.00 fee; valid for 2 years).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-blue-600 mb-1">Step 05</div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Platform Linking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Input your active DLCP license number directly into Airbnb/VRBO to clear platform automated audits.
            </p>
          </div>
        </div>
      </div>

      {/* D.C. Sales & Transient Occupancy Tax (15.95%) Compliance Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" />
              <span>Tax Compliance · D.C. Official Code § 47-2002 &amp; § 47-2002.02</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              D.C. Sales &amp; Transient Occupancy Tax (15.95%) Guide
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              All short-term rental accommodations in the District of Columbia are subject to a combined 15.95% transient tax.
              Understanding how this tax is collected, who is exempt, and what forms must be filed with the D.C. Office of Tax and Revenue (OTR) is essential for every homeowner.
            </p>
          </div>

          {onNavigateToScenarios && (
            <button
              type="button"
              onClick={onNavigateToScenarios}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer shadow-xs"
            >
              <span>Test 15.95% After-Tax Impact in Step 3</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3-Tier Tax Rate Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
              Base Transient Sales Tax
            </div>
            <div className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              10.05%
            </div>
            <div className="text-xs text-slate-600 mt-1 leading-relaxed">
              District of Columbia sales tax on transient accommodations (DC Code § 47-2002).
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
              Convention Hotel Surcharge
            </div>
            <div className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              4.90%
            </div>
            <div className="text-xs text-slate-600 mt-1 leading-relaxed">
              Washington Convention and Sports Authority hotel tax surcharge (DC Code § 47-2002.02).
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
            <div className="text-xs uppercase font-bold tracking-wider text-indigo-700 mb-1">
              Total Combined DC STR Tax
            </div>
            <div className="text-3xl font-extrabold font-mono text-indigo-900 tabular-nums">
              15.95%
            </div>
            <div className="text-xs text-indigo-800 mt-1 leading-relaxed">
              Applied to gross guest room charges, cleaning fees, and booking totals for stays under 90 consecutive days.
            </div>
          </div>
        </div>

        {/* Key Rules Matrix: Long-Term vs STR vs Form FR-500 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Exemption Comparison */}
          <div className="p-5 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>Who Must Pay vs. Who is Legally Exempt?</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span>
                  <strong>Short-Term Rentals (&lt;90 Nights):</strong> Subject to the full 15.95% transient tax. Applies to whole homes and hosted private rooms rented for fewer than 90 consecutive days.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>
                  <strong>Long-Term Leases (30+ / 90+ Nights):</strong> <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">100% Tax-Exempt</span> under DC Code § 47-2001(n)(1)(A). Standard residential tenants signing a 12-month lease pay $0 in transient taxes, making gross rental income pure cash flow.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Why This Matters for Decisions:</strong> In Step 3, toggling the 15.95% after-tax option reveals that a long-term lease often out-earns short-term rentals because long-term rentals avoid this heavy 15.95% haircut.
                </span>
              </li>
            </ul>
          </div>

          {/* Platform Remittance & Form FR-500 */}
          <div className="p-5 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Platform Remittance &amp; Mandatory FR-500 Filing</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>
                  <strong>Marketplace Facilitator Remittance:</strong> Under D.C. Law 22-311, Airbnb and VRBO automatically collect the 15.95% tax from guests and remit it directly to the D.C. Office of Tax and Revenue on platform bookings.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>
                  <strong>Mandatory Form FR-500 Registration:</strong> Even though Airbnb remits the tax, <em>every licensed host must register their rental with the D.C. OTR via MyTax.DC.gov (Form FR-500 Combined Business Registration)</em> to receive a tax ID.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span>
                  <strong>Direct / Off-Platform Bookings:</strong> If you book guests directly (off Airbnb), you are personally responsible for collecting and remitting the 15.95% tax monthly or quarterly to D.C. OTR.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Income Tax vs Transient Tax Disclaimer Card */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Sales &amp; Transient Tax vs. Federal &amp; D.C. Income Taxes:</span>
            <p className="leading-relaxed text-amber-800">
              The 15.95% transient tax is a consumption tax paid by guests on accommodations. Homeowners must still report net rental income on IRS Schedule E (or Schedule C if substantial services are provided) and D.C. Individual Income Tax (Form D-40). If your rental gross receipts exceed $12,000, you may also need to file D.C. Form D-30 (Unincorporated Business Franchise Tax). Consult a certified DC tax advisor for personalized tax planning.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Law Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* The 90-Night Unhosted Rule */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>The 90-Day Unhosted Cap Mechanics</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            How the 90-Night Unhosted Limit Operates
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Under DC Law, an &quot;unhosted rental&quot; is defined as any stay where the host does not physically remain on
            the premises during the guest&apos;s occupancy.
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Cumulative Calendar Cap:</strong> You are granted a hard ceiling of 90 cumulative nights per calendar year across all booking platforms combined.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Automated Platform Lockouts:</strong> Platforms like Airbnb automatically monitor booking counts. Once 90 unhosted nights are reserved, your calendar is programmatically blocked until Jan 1.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Temporary Relocation Exemption:</strong> If your employer or military assignment temporarily relocates you outside the DC metropolitan area, you may petition DLCP for a one-time 90-day extension (up to 180 nights total).</span>
            </li>
          </ul>
        </div>

        {/* Enforcement & Fines */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Enforcement &amp; Fines for Illegal Hosting</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Strict Penalties for Non-Compliant Hosts
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            DLCP conducts active web scraping, neighbor complaint reviews, and platform data subpoenas.
            Operating without a license or exceeding limits incurs severe administrative sanctions.
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-rose-50 border border-rose-100 flex items-center justify-between">
              <span className="font-semibold text-rose-900">1st Administrative Infraction</span>
              <span className="font-mono font-bold text-rose-700">$250 fine</span>
            </div>
            <div className="p-2.5 rounded bg-rose-50 border border-rose-100 flex items-center justify-between">
              <span className="font-semibold text-rose-900">2nd Administrative Infraction</span>
              <span className="font-mono font-bold text-rose-700">$1,000 fine</span>
            </div>
            <div className="p-2.5 rounded bg-rose-50 border border-rose-100 flex items-center justify-between">
              <span className="font-semibold text-rose-900">3rd Administrative Infraction</span>
              <span className="font-mono font-bold text-rose-700">$5,000 fine + License Revocation</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Note: Falsifying primary residence to DC DLCP can trigger revocation of your DC Homestead Property Tax Deduction, requiring back taxes plus penalties.
          </p>
        </div>
      </div>

      {/* Official Links & Contact */}
      <div className="p-6 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">Ready to apply or register your business?</h3>
          <p className="text-xs text-slate-300 mt-1">
            Access the District&apos;s DLCP Short-Term Rental portal and the Office of Tax and Revenue portal (MyTax.DC.gov).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://mytax.dc.gov"
            target="_blank"
            rel="noreferrer noopener"
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <span>MyTax.DC.gov (FR-500)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://dlcp.dc.gov/page/operating-short-term-rental-district-columbia"
            target="_blank"
            rel="noreferrer noopener"
            className="px-4 py-2 bg-white text-slate-900 font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <span>DC DLCP STR Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
