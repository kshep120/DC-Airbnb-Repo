import React from 'react';
import { ScreenerAnswers, ScreenerResult } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ArrowRight, ShieldCheck, Scale, FileText } from 'lucide-react';

interface EligibilityScreenerProps {
  answers: ScreenerAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<ScreenerAnswers>>;
  onProceedToScenarios: () => void;
}

export function evaluateEligibility(answers: ScreenerAnswers): ScreenerResult {
  const { isPrimaryResidence, isTenant, hasHOABan } = answers;

  if (isPrimaryResidence === null || isTenant === null || hasHOABan === null) {
    return {
      status: 'incomplete',
      title: 'Incomplete Assessment',
      message: 'Please answer all three questions above to determine your legal host status under DC law.',
      details: 'DC short-term rental laws (DC Official Code § 30-201) are strictly enforced by the Department of Licensing and Consumer Protection (DLCP). Answering each question reveals your compliance status.',
      badgeType: 'neutral',
    };
  }

  // Question 2: Are you a tenant/renter instead of the owner?
  if (isTenant === true) {
    return {
      status: 'tenant_error',
      title: 'Host Disqualification: Owner-Only Regulation',
      message: "⚠️ This probably won't work... DC regulations require the STR license applicant to be the deeded property owner.",
      details: 'Under DC Code § 30-201.02, only the natural person fee-simple owner who resides at the property can apply for and hold a Short-Term Rental license. Renters, sub-letters, and corporate leaseholders are legally prohibited from listing DC residential units as short-term rentals.',
      badgeType: 'error',
    };
  }

  // Question 3: Does HOA, co-op, or lease explicitly ban STRs?
  if (hasHOABan === true) {
    return {
      status: 'hoa_error',
      title: 'Private Covenant Restriction: HOA / Co-op Ban',
      message: "⚠️ This probably won't work... your building or HOA bylaws prohibit short-term rentals, putting you at risk of substantial fines, injunctions, or eviction.",
      details: 'Even if DC would issue a municipal license, the DC Short-Term Rental Act requires applicants to certify that short-term hosting does not violate HOA bylaws, condominium declarations, or master deeds. Operating in defiance triggers HOA daily fines ($250–$1,000/day) and revocation of city permits.',
      badgeType: 'error',
    };
  }

  // Question 1: Is this property your primary residence?
  if (isPrimaryResidence === false) {
    return {
      status: 'vacation_rental_warning',
      title: 'Primary Residence Mandate: 30+ Night Rentals Only',
      message: '⚠️ Vacation Rental restriction applies. Since this is not your primary residence, you cannot host short-term rentals (under 30 consecutive days) under standard DC STR licenses.',
      details: 'Washington D.C. eliminated unrestricted short-term vacation rentals for secondary homes and investment properties. You may only lease this property for long-term leases (30 consecutive nights or more) under a standard Basic Business License (BBL) for One-Family Accommodations.',
      badgeType: 'warning',
    };
  }

  // Otherwise: Eligible
  return {
    status: 'eligible',
    title: 'Eligible for DC Short-Term Rental License',
    message: '✅ Eligible for Short-Term Rental License! You are authorized to rent a private room indefinitely while present, or your entire home for up to 90 nights per year.',
    details: 'As a primary resident owner without HOA prohibitions, you qualify for the official DC Department of Licensing and Consumer Protection (DLCP) Short-Term Rental License ($99.00 for a 2-year license). You can host guests in your home while present (hosted) with no annual night limit, or host unhosted entire-home stays up to 90 nights per calendar year.',
    badgeType: 'success',
  };
}

export const EligibilityScreener: React.FC<EligibilityScreenerProps> = ({
  answers,
  setAnswers,
  onProceedToScenarios,
}) => {
  const result = evaluateEligibility(answers);

  const handleSelect = (field: keyof ScreenerAnswers, value: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const allAnswered = answers.isPrimaryResidence !== null && answers.isTenant !== null && answers.hasHOABan !== null;

  return (
    <div className="space-y-8">
      {/* Introduction Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>District of Columbia STR Act Compliance</span>
            <span aria-hidden="true">·</span>
            <span>DLCP Regulations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Step 1: DC Short-Term Rental Eligibility Screener
          </h1>
          <p className="mt-3 text-slate-600 text-base leading-relaxed">
            Washington D.C. enforces some of the strictest municipal short-term rental laws in the United States under the
            <strong className="text-slate-800 font-semibold"> Short-Term Rental Regulation Act of 2018 (DC Act 22-540)</strong>.
            Answer three straightforward questions to instantly determine your legal listing options.
          </p>
        </div>

        {/* 3 Interactive Questions */}
        <div className="mt-8 grid grid-cols-1 gap-6">
          {/* Question 1 */}
          <div className="p-5 sm:p-6 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <span>Question 1 of 3</span>
                  <span aria-hidden="true">·</span>
                  <span>Residency Requirement</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Is this property your primary residence?
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Do you physically live here for at least 185 days per calendar year and claim the DC Homestead Property Tax Deduction?
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleSelect('isPrimaryResidence', true)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    answers.isPrimaryResidence === true
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('isPrimaryResidence', false)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    answers.isPrimaryResidence === false
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Question 2 */}
          <div className="p-5 sm:p-6 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <span>Question 2 of 3</span>
                  <span aria-hidden="true">·</span>
                  <span>Ownership Status</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Are you a tenant/renter instead of the property owner?
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Are you leasing or renting this property from a landlord or property management company?
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleSelect('isTenant', true)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    answers.isTenant === true
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  Yes, I Rent
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('isTenant', false)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    answers.isTenant === false
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  No, I Own
                </button>
              </div>
            </div>
          </div>

          {/* Question 3 */}
          <div className="p-5 sm:p-6 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <span>Question 3 of 3</span>
                  <span aria-hidden="true">·</span>
                  <span>HOA & Bylaws</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Does your HOA, condo board, co-op, or lease explicitly ban short-term rentals?
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Do community rules, condo declarations, or building bylaws prohibit rentals of fewer than 30 or 60 days?
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleSelect('hasHOABan', true)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    answers.hasHOABan === true
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  Yes, Banned
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('hasHOABan', false)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    answers.hasHOABan === false
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  No / Allowed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outcome / Result Banner */}
      <div
        className={`rounded-xl border p-6 sm:p-8 transition-all ${
          result.badgeType === 'success'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : result.badgeType === 'error'
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : result.badgeType === 'warning'
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-0.5">
            {result.badgeType === 'success' && <CheckCircle2 className="w-7 h-7 text-emerald-600" />}
            {result.badgeType === 'error' && <XCircle className="w-7 h-7 text-rose-600" />}
            {result.badgeType === 'warning' && <AlertTriangle className="w-7 h-7 text-amber-600" />}
            {result.badgeType === 'neutral' && <HelpCircle className="w-7 h-7 text-slate-400" />}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Determination Status</span>
              <span aria-hidden="true">·</span>
              <span>
                {result.badgeType === 'success'
                  ? 'Eligible Host'
                  : result.badgeType === 'error'
                  ? 'Ineligible'
                  : result.badgeType === 'warning'
                  ? 'Conditional Restriction'
                  : 'Pending Inputs'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{result.title}</h2>
            <p className="mt-2 text-base font-semibold leading-relaxed">{result.message}</p>
            <p className="mt-2 text-sm leading-relaxed opacity-90">{result.details}</p>

            {/* Quick action button */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onProceedToScenarios}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Continue to Step 2: DC Market Data &amp; Rates</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setAnswers({ isPrimaryResidence: true, isTenant: false, hasHOABan: false })}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Test Standard Eligible Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DC Regulatory Primer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Primary Residence Only</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            DC law prohibits non-owner investors from running short-term rentals. You must live in the property as your primary domicile and be approved for the DC Homestead deduction.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">The 90-Night Unhosted Cap</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            When you are not physically on the property (entire home rental), DC caps your bookings at <strong className="text-slate-900 font-semibold">90 nights per calendar year</strong>. Hosted private rooms have no night cap!
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">DLCP License & Clean Hands</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Before listing on Airbnb, you must register through the DLCP portal ($99.00 fee), obtain a Certificate of Clean Hands from the Office of Tax and Revenue, and post your license number.
          </p>
        </div>
      </div>
    </div>
  );
};
