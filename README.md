# DC Airbnb Homeowner Decision Tool & Financial Evaluator

An interactive financial decision and regulatory compliance tool for Washington, D.C. homeowners. This application models the legal and financial trade-offs between residential long-term leasing, hosted short-term rentals, and unhosted short-term rentals under the **District of Columbia Short-Term Rental Regulation Act (D.C. Act 22-540 / D.C. Official Code § 30-201)**.

---

## 🚀 Key Features & Multi-Step Workflow

The application is structured into a streamlined 3-step decision pipeline followed by a legal roadmap and formal PDF export:

### 1. Step 1: Statutory Eligibility Screener (`EligibilityScreener.tsx`)
* Evaluates homeowner eligibility under D.C. Department of Licensing and Consumer Protection (DLCP) rules:
  * **Primary Residence Requirement**: Must hold the DC Homestead Deduction or prove 183+ days/year occupancy.
  * **Ownership Status**: Tenants are strictly prohibited from operating short-term rentals in D.C. (owner-only).
  * **HOA / Condo Bylaws**: Checks for private lease restrictions or condominium bylaws prohibiting STRs.
* Outputs instant statutory determinations: Fully Eligible, Vacation Rental Cap Warning, or Ineligible.

### 2. Step 2: D.C. Neighborhood Market Data & Nightly Rates (`NeighborhoodExplorer.tsx` & `DCInteractiveMap.tsx`)
* Visualizes real Airbnb market metrics across **all 46 official D.C. neighborhood clusters**.
* Features both an **Interactive D.C. Map** (Google Maps Platform with vector fallback) and an **Aggregated Data Table**.
* Displays cluster metrics:
  * Median nightly rate (ADR)
  * Superhost percentage & listing count
  * Entire-home vs. private-room price splits
  * D.C. residential monthly rent medians
* Homeowners can select any cluster to carry its calibrated data directly into Step 3.

### 3. Step 3: Three-Way Scenario Comparison (`ScenarioComparison.tsx`)
Models and compares the three legally permitted occupancy strategies side-by-side:
1. **Scenario 1: Long-Term Residential Lease (365 Nights)**
   * Stable 12-month standard residential tenancy.
   * **100% Tax-Exempt** under DC Code § 47-2001(n)(1)(A).
2. **Scenario 2: Hosted Private Room (Uncapped Nights, default 180)**
   * Host remains on-site during guest stays. Uncapped under D.C. law.
3. **Scenario 3: Whole-Home Unhosted Short-Term Rental (90-Night Statutory Cap)**
   * Host is off-site. Subject to D.C.'s strict **90-night statutory annual limit** (unless a DLCP hardship waiver is granted).

#### Advanced Step 3 Capabilities:
* **Bedroom Disaggregation Dropdown Menu**: Options from **1 to 10 Bedrooms** (or *All Bedrooms*). Disaggregates market ADR and monthly residential rent medians using empirical D.C. market curves.
* **Operating Expense Dropdowns**: Each of the 3 scenario cards includes a dropdown with an itemized breakdown of expected operating expenses (routine maintenance reserves, vacancy buffer, landlord DP-3 insurance, DLCP licensing, Airbnb platform fees, guest amenities, etc.).
* **14.95% D.C. Transient Tax Toggle**: Models the impact of D.C.'s 10.05% transient accommodations sales tax + 4.90% Convention Center hotel surcharge.
* **Homeowner Strategy Selector**: Allows the homeowner to pick between any of the 3 scenarios, synchronizing the dynamic highlights and executive report to their choice.
* **Break-Even Analysis**: Calculates required nightly rates and nights hosted to beat long-term leasing.

### 4. Regulatory & Licensing Guide (`RegulationGuide.tsx`)
* Step-by-step roadmap for obtaining a D.C. Basic Business License (BBL) with Short-Term Rental or Vacation Rental endorsement from the DLCP.
* Explains Clean Hands Certification (<$100 outstanding D.C. debt), Form FR-500 tax registration, and marketplace platform collection rules.

### 5. Executive Decision Report (PDF Export) (`ReportModal.tsx` & `pdfGenerator.ts`)
* Generates a formal, print-ready, 2-page PDF report.
* Features executive recommendations, side-by-side financial tables, itemized operating expenses, and a 5-step DLCP licensing roadmap.

---

## 📊 Data Sources & Methodology

1. **Short-Term Rental Listings & ADR**:
   * Sourced from **Inside Airbnb** open data snapshot for Washington, D.C. (`/public/listings.csv`).
   * Provides real listing-level pricing, bedroom counts, coordinates, room types, and review counts.

2. **Long-Term Monthly Rent Market Medians**:
   * Sourced directly from **Zillow Research Data – Zillow Observed Rent Index (ZORI)** (`Zip_zori_uc_sfrcondomfr_sm_month_6d36a5f2.csv`).
   * Evaluated across all 23 D.C. residential ZIP codes and mapped to D.C.'s 46 neighborhood clusters (e.g., Capitol Hill ~$2,499/mo, Dupont Circle ~$2,571/mo, Georgetown ~$2,521/mo, Shaw/Logan Circle ~$2,609/mo, Tenleytown ~$2,740/mo, Anacostia ~$1,940/mo).
   * Cross-referenced against **HUD Fair Market Rents (FMR)** for the Washington, D.C. metropolitan area.

---

## 🛠️ Project Structure

```
├── public/
│   ├── assets/aistudio/
│   │   ├── dc_airbnb_100_homeowner_decision_sample_sep2026_ce380ff2.csv
│   │   └── Zip_zori_uc_sfrcondomfr_sm_month_6d36a5f2.csv (Zillow DC ZORI)
│   └── listings.csv
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Top bar, step tabs, reset action, report button
│   │   ├── EligibilityScreener.tsx # Step 1: DLCP statutory rules assessment
│   │   ├── NeighborhoodExplorer.tsx# Step 2: D.C. market explorer and data table
│   │   ├── DCInteractiveMap.tsx    # Step 2: Interactive map with marker clustering
│   │   ├── ScenarioComparison.tsx  # Step 3: 3-way financial modeling & bedroom dropdown
│   │   ├── RegulationGuide.tsx     # Legal guide, tax mechanics & 5-step DLCP roadmap
│   │   └── ReportModal.tsx         # Modal preview for generating Decision Report PDF
│   ├── data/
│   │   └── fallbackData.ts         # Zillow ZORI cluster rents & default medians
│   ├── utils/
│   │   ├── csvParser.ts            # CSV parsing, median calculations & data transforms
│   │   └── pdfGenerator.ts         # 2-page jsPDF report generation engine
│   ├── types.ts                    # TypeScript data models and interfaces
│   ├── App.tsx                     # Main state container & view router
│   └── main.tsx                    # React application entry point
├── package.json
└── vite.config.ts
```

---

## 💻 Local Development Setup

If running locally with Node.js:

```bash
# 1. Install dependencies
npm install

# 2. Run the Vite development server
npm run dev

# 3. Build for production
npm run build
```

---

## 💡 Quick Tips for Collaborating in Google AI Studio

When working with this repo in Google AI Studio Build:
* **Ask the AI to inspect specific components**: e.g., *"Show me how the bedroom disaggregation scales in ScenarioComparison.tsx"* or *"Update the styling on the PDF report in pdfGenerator.ts"*.
* **Interactive State**: State flows from `App.tsx` down through each step component (`activeTab`: `'screener'` → `'explorer'` → `'scenarios'` → `'regulations'`).
* **Environment Variables**: Google Maps API key can optionally be supplied via `VITE_GOOGLE_MAPS_API_KEY` in `.env.local` (the application includes an automated vector map fallback when an API key is not present).
