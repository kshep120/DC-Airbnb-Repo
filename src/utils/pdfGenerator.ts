import jsPDF from 'jspdf';
import { NeighborhoodStats, ScreenerAnswers } from '../types';
import { formatCurrency } from './csvParser';

export interface PDFReportData {
  neighborhood: string;
  propertyLabel?: string;
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

export function generateDecisionReportPDF(data: PDFReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 612 pt
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // 532 pt

  // Financial Calculations
  const DC_TRANSIENT_TAX_RATE = 14.95;

  // Scenario 1: Long-term lease
  const s1Gross = data.monthlyRent * 12;
  const s1Expenses = s1Gross * (data.longTermExpenseRate / 100);
  const s1Tax = 0;
  const s1Net = s1Gross - s1Expenses;
  const s1MonthlyNet = s1Net / 12;

  // Scenario 2: Hosted room
  const privateRoomADR = data.adr * (data.privateRoomRatio / 100);
  const s2Gross = privateRoomADR * data.hostedNights;
  const s2Expenses = s2Gross * (data.strExpenseRate / 100);
  const s2Tax = s2Gross * (DC_TRANSIENT_TAX_RATE / 100);
  const s2Net = s2Gross - s2Expenses - (data.includeOccupancyTax ? s2Tax : 0);
  const s2MonthlyNet = s2Net / 12;

  // Scenario 3: Whole-home STR (90-night cap)
  const s3Gross = data.adr * data.wholeHomeNights;
  const s3Expenses = s3Gross * (data.strExpenseRate / 100);
  const s3Tax = s3Gross * (DC_TRANSIENT_TAX_RATE / 100);
  const s3Net = s3Gross - s3Expenses - (data.includeOccupancyTax ? s3Tax : 0);
  const s3MonthlyNet = s3Net / 12;

  // All 3 scenarios
  const scenarios = [
    { id: 'long_term', name: 'Long-Term Lease (365 Nights)', net: s1Net, monthly: s1MonthlyNet, gross: s1Gross, exp: s1Expenses, tax: s1Tax },
    { id: 'hosted_room', name: 'Hosted Private Room (' + data.hostedNights + ' Nights)', net: s2Net, monthly: s2MonthlyNet, gross: s2Gross, exp: s2Expenses, tax: s2Tax },
    { id: 'whole_home', name: 'Whole Home STR (' + data.wholeHomeNights + '-Night Cap)', net: s3Net, monthly: s3MonthlyNet, gross: s3Gross, exp: s3Expenses, tax: s3Tax },
  ];
  const sorted = [...scenarios].sort((a, b) => b.net - a.net);
  const highestNetScenario = sorted[0];
  const secondHighest = sorted[1];

  // Resolve homeowner selected scenario (default to highest net if not explicitly picked)
  const activeScenarioId = data.selectedScenarioId || highestNetScenario.id;
  const selectedScenario = scenarios.find((s) => s.id === activeScenarioId) || highestNetScenario;
  const isSelectedHighest = selectedScenario.id === highestNetScenario.id;

  // Colors
  const cSlate900 = [15, 23, 42];
  const cSlate600 = [71, 85, 105];
  const cSlate100 = [241, 245, 249];
  const cEmerald700 = [4, 120, 87];
  const cBlue700 = [29, 78, 216];
  const cIndigo900 = [30, 27, 75];
  const cRose700 = [190, 18, 60];

  let y = margin;

  // ==================== PAGE 1 ====================
  // Header Top Bar
  doc.setFillColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.rect(margin, y, contentWidth, 54, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DC AIRBNB HOMEOWNER DECISION REPORT', margin + 14, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('DC Short-Term Rental Regulation Act Assessment · DC Official Code § 30-201', margin + 14, y + 38);

  // Date on right
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  doc.text('Report Date: ' + today, margin + contentWidth - 14, y + 22, { align: 'right' });
  doc.text('Tax Mode: ' + (data.includeOccupancyTax ? 'After-Tax (14.95%)' : 'Pre-Tax Standard'), margin + contentWidth - 14, y + 38, { align: 'right' });

  y += 66;

  // Property & Location Context Banner
  doc.setFillColor(cSlate100[0], cSlate100[1], cSlate100[2]);
  doc.roundedRect(margin, y, contentWidth, 42, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.text('EVALUATED PROPERTY CONTEXT:', margin + 12, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(cSlate600[0], cSlate600[1], cSlate600[2]);
  const bedText = data.selectedBedrooms && data.selectedBedrooms !== 'all' ? data.selectedBedrooms + ' BR · ' : 'All BRs · ';
  const propText = (data.propertyLabel ? data.propertyLabel + ' · ' : '') + bedText + 'DC Cluster: ' + data.neighborhood.split(',')[0];
  doc.text(propText, margin + 12, y + 30, { maxWidth: 300 });

  const marketText = 'ADR: $' + (data.neighborhoodStats?.medianPrice ?? 150) + ' · Median Rent: $' + (data.neighborhoodStats?.medianMonthlyRent ?? 2400) + '/mo';
  doc.text(marketText, margin + contentWidth - 12, y + 30, { align: 'right' });

  y += 50;

  // Executive Decision Summary Box
  doc.setFillColor(cIndigo900[0], cIndigo900[1], cIndigo900[2]);
  doc.roundedRect(margin, y, contentWidth, 76, 5, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(251, 191, 36); // Amber 400
  const boxTitle = isSelectedHighest
    ? '[SELECTED STRATEGY] HIGHEST MATHEMATICAL NET YIELD'
    : '[SELECTED STRATEGY] HOMEOWNER DECISION FOCUS';
  doc.text(boxTitle, margin + 14, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(selectedScenario.name, margin + 14, y + 40, { maxWidth: contentWidth - 170 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(52, 211, 153); // Emerald 400
  doc.text(formatCurrency(selectedScenario.net) + ' / yr', margin + contentWidth - 14, y + 38, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  let subtext = '';
  if (isSelectedHighest) {
    const delta = highestNetScenario.net - secondHighest.net;
    subtext = 'Selected by homeowner. Generates ' + formatCurrency(delta) + ' more net income annually than runner-up (' + secondHighest.name + '). ' +
      (data.includeOccupancyTax ? 'Includes D.C.\'s 14.95% transient occupancy tax deduction.' : 'Standard operational expenses modeled.');
  } else {
    const diff = highestNetScenario.net - selectedScenario.net;
    subtext = 'Selected by homeowner (' + formatCurrency(selectedScenario.monthly) + '/mo net). Top financial yield is ' + highestNetScenario.name + ' (' + formatCurrency(highestNetScenario.net) + '/yr, +' + formatCurrency(diff) + ' delta).';
  }
  doc.text(subtext, margin + 14, y + 59, { maxWidth: contentWidth - 28 });

  y += 88;

  // Step 1: Legal Eligibility Screener Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.text('1. D.C. SHORT-TERM RENTAL COMPLIANCE & ELIGIBILITY VERDICT', margin, y);
  y += 14;

  const isEligible = data.screenerAnswers.isPrimaryResidence === true &&
    data.screenerAnswers.isTenant === false &&
    data.screenerAnswers.hasHOABan === false;

  doc.setFillColor(isEligible ? 240 : 254, isEligible ? 253 : 242, isEligible ? 244 : 242);
  doc.roundedRect(margin, y, contentWidth, 38, 4, 4, 'F');
  doc.setDrawColor(isEligible ? 187 : 254, isEligible ? 247 : 202, isEligible ? 208 : 202);
  doc.roundedRect(margin, y, contentWidth, 38, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(isEligible ? cEmerald700[0] : cRose700[0], isEligible ? cEmerald700[1] : cRose700[1], isEligible ? cEmerald700[2] : cRose700[2]);
  doc.text(
    isEligible
      ? '[ELIGIBLE] FULLY COMPLIANT FOR D.C. SHORT-TERM RENTAL LICENSE (DLCP ACT 22-540)'
      : '[REGULATORY RESTRICTION] COMPLIANCE DEFICIT DETECTED UNDER DC CODE § 30-201',
    margin + 12,
    y + 16
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cSlate600[0], cSlate600[1], cSlate600[2]);
  const answersLine = 'Primary Residence: ' + (data.screenerAnswers.isPrimaryResidence ? 'YES' : 'NO') +
    '   ·   Property Owner (Not Tenant): ' + (data.screenerAnswers.isTenant === false ? 'YES' : 'NO') +
    '   ·   HOA / Lease Prohibitions: ' + (data.screenerAnswers.hasHOABan ? 'YES (Banned)' : 'NO (Clear)');
  doc.text(answersLine, margin + 12, y + 29);

  y += 50;

  // Step 2: Three-Way Financial Comparison Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.text('2. THREE-WAY OCCUPANCY SCENARIO COMPARISON (SIDE-BY-SIDE)', margin, y);
  y += 14;

  // Geometry: Col 0: 160 pt, Col 1: 124 pt, Col 2: 124 pt, Col 3: 124 pt -> Total = 532 pt (exact contentWidth)
  const col0W = 160;
  const colW = 124;
  const col1X = margin + col0W;
  const col2X = col1X + colW;
  const col3X = col2X + colW;
  const tableX = margin;

  // Table Header
  doc.setFillColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.rect(tableX, y, contentWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('FINANCIAL METRIC', tableX + 8, y + 14);

  const h1 = '1. LONG-TERM LEASE' + (activeScenarioId === 'long_term' ? ' *' : '');
  const h2 = '2. HOSTED ROOM' + (activeScenarioId === 'hosted_room' ? ' *' : '');
  const h3 = '3. WHOLE HOME STR' + (activeScenarioId === 'whole_home' ? ' *' : '');

  doc.text(h1, col1X + 6, y + 14, { maxWidth: colW - 10 });
  doc.text(h2, col2X + 6, y + 14, { maxWidth: colW - 10 });
  doc.text(h3, col3X + 6, y + 14, { maxWidth: colW - 10 });

  y += 22;

  // Table Rows Data (All strings strictly ASCII and sized to never overflow 124 pt)
  const rows = [
    {
      label: 'Occupancy / Night Cap',
      s1: '365 Nights (12 Mo)',
      s2: data.hostedNights + ' Nights (Uncapped)',
      s3: data.wholeHomeNights + ' Nights (DC Cap)'
    },
    {
      label: 'Base Rate Assumption',
      s1: formatCurrency(data.monthlyRent) + '/mo (Med $' + (data.neighborhoodStats?.medianMonthlyRent ?? 2400) + ')',
      s2: formatCurrency(privateRoomADR) + '/nt (' + data.privateRoomRatio + '%)',
      s3: formatCurrency(data.adr) + '/nt (ADR)'
    },
    {
      label: 'Gross Annual Revenue',
      s1: formatCurrency(s1Gross),
      s2: formatCurrency(s2Gross),
      s3: formatCurrency(s3Gross)
    },
    {
      label: 'Operating Expenses Rate',
      s1: data.longTermExpenseRate + '% of gross',
      s2: data.strExpenseRate + '% of gross',
      s3: data.strExpenseRate + '% of gross'
    },
    {
      label: 'Operating Expenses ($)',
      s1: '- ' + formatCurrency(s1Expenses),
      s2: '- ' + formatCurrency(s2Expenses),
      s3: '- ' + formatCurrency(s3Expenses)
    },
    {
      label: 'D.C. Transient Tax (14.95%)',
      s1: '$0 (100% Tax-Exempt)',
      s2: data.includeOccupancyTax ? '- ' + formatCurrency(s2Tax) : 'Excl. (' + formatCurrency(s2Tax) + ' est)',
      s3: data.includeOccupancyTax ? '- ' + formatCurrency(s3Tax) : 'Excl. (' + formatCurrency(s3Tax) + ' est)'
    },
    {
      label: 'Projected Annual Net Income',
      s1: formatCurrency(s1Net),
      s2: formatCurrency(s2Net),
      s3: formatCurrency(s3Net),
      bold: true,
      highlight: true
    },
    {
      label: 'Effective Monthly Net',
      s1: formatCurrency(s1MonthlyNet) + ' / mo',
      s2: formatCurrency(s2MonthlyNet) + ' / mo',
      s3: formatCurrency(s3MonthlyNet) + ' / mo'
    },
    {
      label: 'Homeowner Strategy Status',
      s1: activeScenarioId === 'long_term' ? '[SELECTED STRATEGY]' : (highestNetScenario.id === 'long_term' ? 'Top Net Yield' : 'Alternative Model'),
      s2: activeScenarioId === 'hosted_room' ? '[SELECTED STRATEGY]' : (highestNetScenario.id === 'hosted_room' ? 'Top Net Yield' : 'Alternative Model'),
      s3: activeScenarioId === 'whole_home' ? '[SELECTED STRATEGY]' : (highestNetScenario.id === 'whole_home' ? 'Top Net Yield' : 'Alternative Model'),
      bold: true,
      highlight: true
    },
    {
      label: 'Host Operational Burden',
      s1: 'Passive (Tenant)',
      s2: 'High Active (Host Present)',
      s3: 'Moderate (Turnovers)'
    },
  ];

  rows.forEach((row, i) => {
    const isEven = i % 2 === 0;
    const rowHeight = row.highlight ? 20 : 17;

    if (row.highlight) {
      doc.setFillColor(236, 253, 245); // light emerald
    } else if (isEven) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(tableX, y, contentWidth, rowHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(tableX, y, contentWidth, rowHeight, 'S');

    doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
    doc.setFontSize(row.highlight ? 7.5 : 7.5);
    doc.setTextColor(
      row.highlight ? cEmerald700[0] : cSlate900[0],
      row.highlight ? cEmerald700[1] : cSlate900[1],
      row.highlight ? cEmerald700[2] : cSlate900[2]
    );

    const textY = y + (row.highlight ? 13 : 11.5);
    doc.text(row.label, tableX + 8, textY, { maxWidth: col0W - 12 });
    doc.text(row.s1, col1X + 6, textY, { maxWidth: colW - 10 });
    doc.text(row.s2, col2X + 6, textY, { maxWidth: colW - 10 });
    doc.text(row.s3, col3X + 6, textY, { maxWidth: colW - 10 });

    y += rowHeight;
  });

  y += 16;

  // Break-Even Benchmarks Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.text('3. KEY BREAK-EVEN DECISION THRESHOLDS', margin, y);
  y += 12;

  const strNetMargin = Math.max(0.01, 1 - data.strExpenseRate / 100 - (data.includeOccupancyTax ? DC_TRANSIENT_TAX_RATE / 100 : 0));
  const breakEvenWholeADR = s1Net / (data.wholeHomeNights * strNetMargin);
  const breakEvenHostedNights = privateRoomADR > 0 ? Math.round(s1Net / (privateRoomADR * strNetMargin)) : 0;
  const breakEvenRent = s3Net / (12 * (1 - data.longTermExpenseRate / 100));

  doc.setFillColor(cSlate100[0], cSlate100[1], cSlate100[2]);
  doc.roundedRect(margin, y, contentWidth, 48, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 48, 4, 4, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cSlate600[0], cSlate600[1], cSlate600[2]);

  doc.text(
    '- Whole-Home ADR Parity: Average Daily Rate must reach ' + formatCurrency(breakEvenWholeADR) + '/night over 90 days to equal traditional lease net (' + formatCurrency(s1Net) + ').',
    margin + 10,
    y + 14,
    { maxWidth: contentWidth - 20 }
  );
  doc.text(
    '- Hosted Room Occupancy Parity: Must host approximately ' + breakEvenHostedNights + ' nights/yr at ' + formatCurrency(privateRoomADR) + '/night to match traditional lease net.',
    margin + 10,
    y + 27,
    { maxWidth: contentWidth - 20 }
  );
  doc.text(
    '- 90-Night Whole-Home Equivalent: 90 capped nights (' + formatCurrency(s3Net) + ' net) equals renting to a traditional tenant at ' + formatCurrency(breakEvenRent) + '/month.',
    margin + 10,
    y + 40,
    { maxWidth: contentWidth - 20 }
  );

  // ==================== PAGE 2: ITEMIZED EXPENSES & LEGAL ROADMAP ====================
  doc.addPage();
  y = margin;

  // Page 2 Header Top Bar (No text collisions)
  doc.setFillColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.rect(margin, y, contentWidth, 34, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('DETAILED OPERATING EXPENSES & REGULATORY ROADMAP', margin + 14, y + 21, { maxWidth: 320 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Page 2 of 2 · District of Columbia Reference', margin + contentWidth - 14, y + 21, { align: 'right' });

  y += 48;

  // Itemized Operating Expenses Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.text('4. ITEMIZED OPERATING EXPENSES BREAKDOWN BY SCENARIO', margin, y);
  y += 12;

  // 3 Columns of expense breakdowns
  const cardWidth = (contentWidth - 16) / 3;

  // Col 1: Long-term expenses
  const isS1Selected = activeScenarioId === 'long_term';
  doc.setFillColor(isS1Selected ? 240 : 248, isS1Selected ? 253 : 250, isS1Selected ? 244 : 252);
  doc.roundedRect(margin, y, cardWidth, 140, 4, 4, 'F');
  doc.setDrawColor(isS1Selected ? 52 : 226, isS1Selected ? 211 : 232, isS1Selected ? 153 : 240);
  doc.roundedRect(margin, y, cardWidth, 140, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(isS1Selected ? cEmerald700[0] : cBlue700[0], isS1Selected ? cEmerald700[1] : cBlue700[1], isS1Selected ? cEmerald700[2] : cBlue700[2]);
  doc.text('Long-Term Lease (' + data.longTermExpenseRate + '%)' + (isS1Selected ? ' [Selected]' : ''), margin + 8, y + 16, { maxWidth: cardWidth - 16 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cSlate600[0], cSlate600[1], cSlate600[2]);
  doc.text('- Repairs & HVAC: 40% (' + formatCurrency(s1Expenses * 0.4) + ')', margin + 8, y + 36, { maxWidth: cardWidth - 16 });
  doc.text('- Vacancy Buffer: 30% (' + formatCurrency(s1Expenses * 0.3) + ')', margin + 8, y + 54, { maxWidth: cardWidth - 16 });
  doc.text('- Landlord Insurance: 20% (' + formatCurrency(s1Expenses * 0.2) + ')', margin + 8, y + 72, { maxWidth: cardWidth - 16 });
  doc.text('- DC BBL & RAD Filing: 10% (' + formatCurrency(s1Expenses * 0.1) + ')', margin + 8, y + 90, { maxWidth: cardWidth - 16 });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.text('Total: - ' + formatCurrency(s1Expenses) + ' / yr', margin + 8, y + 124);

  // Col 2: Hosted room expenses
  const expCol2X = margin + cardWidth + 8;
  const isS2Selected = activeScenarioId === 'hosted_room';
  doc.setFillColor(isS2Selected ? 240 : 248, isS2Selected ? 253 : 250, isS2Selected ? 244 : 252);
  doc.roundedRect(expCol2X, y, cardWidth, 140, 4, 4, 'F');
  doc.setDrawColor(isS2Selected ? 52 : 226, isS2Selected ? 211 : 232, isS2Selected ? 153 : 240);
  doc.roundedRect(expCol2X, y, cardWidth, 140, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(isS2Selected ? cEmerald700[0] : cEmerald700[0], isS2Selected ? cEmerald700[1] : cEmerald700[1], isS2Selected ? cEmerald700[2] : cEmerald700[2]);
  doc.text('Hosted Room (' + data.strExpenseRate + '%)' + (isS2Selected ? ' [Selected]' : ''), expCol2X + 8, y + 16, { maxWidth: cardWidth - 16 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cSlate600[0], cSlate600[1], cSlate600[2]);
  doc.text('- Supplies & Linen: 30% (' + formatCurrency(s2Expenses * 0.3) + ')', expCol2X + 8, y + 36, { maxWidth: cardWidth - 16 });
  doc.text('- Utilities & WiFi: 25% (' + formatCurrency(s2Expenses * 0.25) + ')', expCol2X + 8, y + 54, { maxWidth: cardWidth - 16 });
  doc.text('- Airbnb Fee (3%): 20% (' + formatCurrency(s2Expenses * 0.2) + ')', expCol2X + 8, y + 72, { maxWidth: cardWidth - 16 });
  doc.text('- Laundry & Clean: 15% (' + formatCurrency(s2Expenses * 0.15) + ')', expCol2X + 8, y + 90, { maxWidth: cardWidth - 16 });
  doc.text('- DLCP STR License: 10% (' + formatCurrency(s2Expenses * 0.1) + ')', expCol2X + 8, y + 108, { maxWidth: cardWidth - 16 });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.text('Total: - ' + formatCurrency(s2Expenses) + ' / yr', expCol2X + 8, y + 124);

  // Col 3: Whole-home expenses
  const expCol3X = margin + (cardWidth + 8) * 2;
  const isS3Selected = activeScenarioId === 'whole_home';
  doc.setFillColor(isS3Selected ? 240 : 248, isS3Selected ? 253 : 250, isS3Selected ? 244 : 252);
  doc.roundedRect(expCol3X, y, cardWidth, 140, 4, 4, 'F');
  doc.setDrawColor(isS3Selected ? 52 : 226, isS3Selected ? 211 : 232, isS3Selected ? 153 : 240);
  doc.roundedRect(expCol3X, y, cardWidth, 140, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(isS3Selected ? cEmerald700[0] : cSlate900[0], isS3Selected ? cEmerald700[1] : cSlate900[1], isS3Selected ? cEmerald700[2] : cSlate900[2]);
  doc.text('Whole Home STR (' + data.strExpenseRate + '%)' + (isS3Selected ? ' [Selected]' : ''), expCol3X + 8, y + 16, { maxWidth: cardWidth - 16 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cSlate600[0], cSlate600[1], cSlate600[2]);
  doc.text('- Turnover Cleans: 40% (' + formatCurrency(s3Expenses * 0.4) + ')', expCol3X + 8, y + 36, { maxWidth: cardWidth - 16 });
  doc.text('- Airbnb Fee (3%): 20% (' + formatCurrency(s3Expenses * 0.2) + ')', expCol3X + 8, y + 54, { maxWidth: cardWidth - 16 });
  doc.text('- Supplies Restock: 15% (' + formatCurrency(s3Expenses * 0.15) + ')', expCol3X + 8, y + 72, { maxWidth: cardWidth - 16 });
  doc.text('- Noise Sensor & Lock: 15% (' + formatCurrency(s3Expenses * 0.15) + ')', expCol3X + 8, y + 90, { maxWidth: cardWidth - 16 });
  doc.text('- DLCP Lic. & FR-500: 10% (' + formatCurrency(s3Expenses * 0.1) + ')', expCol3X + 8, y + 108, { maxWidth: cardWidth - 16 });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.text('Total: - ' + formatCurrency(s3Expenses) + ' / yr', expCol3X + 8, y + 124);

  y += 154;

  // D.C. Tax & Licensing Roadmap
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.text('5. D.C. SHORT-TERM RENTAL TAX & LICENSING ROADMAP', margin, y);
  y += 12;

  // Tax box
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.roundedRect(margin, y, contentWidth, 54, 4, 4, 'F');
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, y, contentWidth, 54, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(cIndigo900[0], cIndigo900[1], cIndigo900[2]);
  doc.text('D.C. Sales & Transient Occupancy Tax (14.95% Total)', margin + 10, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cSlate600[0], cSlate600[1], cSlate600[2]);
  doc.text(
    '- Composition: 10.05% D.C. Sales Tax on Transient Accommodations + 4.90% Convention Hotel Surcharge.\n' +
    '- Exemption Rule: Stays <90 days are subject to 14.95%. Residential leases >= 90 days (12 mo lease) are 100% Tax-Exempt.\n' +
    '- Collection: Airbnb & VRBO collect and remit the 14.95% tax automatically on marketplace bookings.',
    margin + 10,
    y + 27,
    { maxWidth: contentWidth - 20 }
  );

  y += 64;

  // 5-Step DLCP Checklist Box (Explicit 2-column layout to prevent ANY overlapping text)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 126, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 126, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(cSlate900[0], cSlate900[1], cSlate900[2]);
  doc.text('Mandatory 5-Step DLCP Licensing Checklist (Before Listing on Airbnb)', margin + 12, y + 16);

  const steps = [
    { num: 'Step 1', title: 'Homestead Check:', desc: 'Confirm property receives DC Homestead Tax Deduction (verifies primary residency).' },
    { num: 'Step 2', title: 'Clean Hands Cert:', desc: 'Obtain from DC Office of Tax & Revenue (verifies <$100 outstanding debt to DC).' },
    { num: 'Step 3', title: 'Life Safety Gear:', desc: 'Install functioning smoke/CO alarms, 2A:10B:C fire extinguisher & egress diagram.' },
    { num: 'Step 4', title: 'DLCP Application:', desc: 'Submit online application at dlcp.dc.gov ($104.50 fee; valid for 2 full years).' },
    { num: 'Step 5', title: 'FR-500 Tax Reg:', desc: 'Register business with DC OTR via MyTax.DC.gov and input license # on Airbnb/VRBO.' },
  ];

  const titleColW = 125;
  const descColX = margin + 12 + titleColW + 6; // margin + 143 pt
  const descColW = contentWidth - (12 + titleColW + 6 + 12); // ~370 pt

  steps.forEach((st, idx) => {
    const stepY = y + 33 + idx * 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(cBlue700[0], cBlue700[1], cBlue700[2]);
    doc.text(st.num + ' · ' + st.title, margin + 12, stepY, { maxWidth: titleColW });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(cSlate600[0], cSlate600[1], cSlate600[2]);
    doc.text(st.desc, descColX, stepY, { maxWidth: descColW });
  });

  y += 136;

  // Footer Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // Slate 400
  const disclaimer = 'Disclaimer: This report is generated by the DC Airbnb Homeowner Decision Tool for financial modeling and educational purposes based on District of Columbia Act 22-540 and DLCP guidelines. It does not constitute certified legal, tax, or investment advice. Homeowners should consult licensed DC real estate attorneys and CPA advisors prior to executing rental agreements.';
  doc.text(disclaimer, margin, y, { maxWidth: contentWidth });

  // Trigger browser download
  const filename = 'DC-Airbnb-Decision-Report-' + data.neighborhood.split(',')[0].replace(/\s+/g, '-').toLowerCase() + '.pdf';
  doc.save(filename);
}
