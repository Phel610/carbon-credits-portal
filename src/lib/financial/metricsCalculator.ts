// Comprehensive financial metrics calculator
// Implements exact formulas from specification

import type { YearlyFinancials, ComprehensiveMetrics } from './metricsTypes';

// ============================================================================
// CORE FINANCIAL CALCULATION HELPERS
// ============================================================================

export function npv(rate: number, cfs: number[]): number {
  let v = 0;
  for (let t = 0; t < cfs.length; t++) {
    v += cfs[t] / Math.pow(1 + rate, t);
  }
  return v;
}

export function irr(cfs: number[], tol = 1e-7, maxIter = 200): number | null {
  const f = (r: number) => npv(r, cfs);
  
  // Check for sign change
  let lo = -0.9999, hi = 10;
  let fLo = f(lo), fHi = f(hi);
  if (fLo * fHi > 0) return null; // no sign change → no IRR

  // Bisection method
  for (let i = 0; i < maxIter; i++) {
    const mid = (lo + hi) / 2;
    const fMid = f(mid);
    if (Math.abs(fMid) < tol) return mid;
    if (fLo * fMid <= 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return null;
}

export function mirr(cfs: number[], financeRate: number, reinvestRate: number): number | null {
  const n = cfs.length - 1;
  if (n < 1) return null;
  
  let pvNeg = 0, fvPos = 0;
  for (let t = 0; t <= n; t++) {
    const cf = cfs[t];
    if (cf < 0) pvNeg += cf / Math.pow(1 + financeRate, t);
    else if (cf > 0) fvPos += cf * Math.pow(1 + reinvestRate, n - t);
  }
  
  if (pvNeg >= 0 || fvPos <= 0) return null;
  return Math.pow(fvPos / -pvNeg, 1 / n) - 1;
}

export function payback(cfs: number[]): number | null {
  let cum = 0;
  for (let t = 0; t < cfs.length; t++) {
    const prev = cum;
    cum += cfs[t];
    if (prev < 0 && cum >= 0) {
      const needed = -prev;
      const within = cfs[t];
      return t - (within === 0 ? 0 : needed / within);
    }
  }
  return null; // never pays back within horizon
}

export function discountedPayback(cfs: number[], r: number): number | null {
  let cum = 0;
  for (let t = 0; t < cfs.length; t++) {
    const disc = cfs[t] / Math.pow(1 + r, t);
    const prev = cum;
    cum += disc;
    if (prev < 0 && cum >= 0) {
      const needed = -prev;
      return t - (disc === 0 ? 0 : needed / disc);
    }
  }
  return null;
}

export function cumulativeNPV(cfs: number[], r: number): Array<{ year: number; value: number }> {
  let cum = 0;
  return cfs.map((cf, t) => {
    cum += cf / Math.pow(1 + r, t);
    return { year: t, value: cum };
  });
}

// ============================================================================
// PROFITABILITY & MARGINS
// ============================================================================

export function calculateProfitabilityMetrics(yearlyData: YearlyFinancials[]) {
  const yearly = yearlyData.map(y => {
    const revenue = y.totalRevenue;
    const cogs = Math.abs(y.cogs);
    const grossProfit = y.grossProfit; // Use already calculated value
    // Use already calculated opex from engine instead of reconstructing
    const opex = Math.abs(y.opex);
    const ebitda = y.ebitda; // Use already calculated value
    const depreciation = Math.abs(y.depreciation);
    const interest = Math.abs(y.interest);
    const ebt = y.ebt; // Use already calculated value
    const tax = Math.abs(y.incomeTax);
    const netIncome = y.netIncome;
    
    return {
      year: y.year,
      revenue,
      cogs,
      grossProfit,
      opex,
      ebitda,
      depreciation,
      interest,
      ebt,
      tax,
      netIncome,
      grossMargin: revenue !== 0 ? (grossProfit / revenue) * 100 : null,
      ebitdaMargin: revenue !== 0 ? (ebitda / revenue) * 100 : null,
      netMargin: revenue !== 0 ? (netIncome / revenue) * 100 : null,
    };
  });
  
  const total = {
    revenue: yearly.reduce((sum, y) => sum + y.revenue, 0),
    cogs: yearly.reduce((sum, y) => sum + y.cogs, 0),
    grossProfit: yearly.reduce((sum, y) => sum + y.grossProfit, 0),
    opex: yearly.reduce((sum, y) => sum + y.opex, 0),
    ebitda: yearly.reduce((sum, y) => sum + y.ebitda, 0),
    netIncome: yearly.reduce((sum, y) => sum + y.netIncome, 0),
  };
  
  return { yearly, total };
}

// ============================================================================
// UNIT ECONOMICS
// ============================================================================

export function calculateUnitEconomics(yearlyData: YearlyFinancials[]) {
  const yearly = yearlyData.map(y => {
    const issued = y.creditsIssued;
    const revenue = y.totalRevenue;
    const cogs = Math.abs(y.cogs);
    // Use already calculated opex from engine instead of reconstructing
    const opex = Math.abs(y.opex);
    const depreciation = Math.abs(y.depreciation);
    
    return {
      year: y.year,
      issuedCredits: issued,
      waPrice: issued !== 0 ? revenue / issued : null,
      cogsPerCredit: issued !== 0 ? cogs / issued : null,
      gpPerCredit: issued !== 0 ? (revenue - cogs) / issued : null,
      opexPerCredit: issued !== 0 ? opex / issued : null,
      lcoc: issued !== 0 ? (cogs + opex) / issued : null,
      allInCostPerCredit: issued !== 0 ? (cogs + opex + depreciation) / issued : null,
    };
  });
  
  const totalIssued = yearly.reduce((sum, y) => sum + y.issuedCredits, 0);
  const totalRevenue = yearlyData.reduce((sum, y) => sum + y.totalRevenue, 0);
  const totalCogs = yearlyData.reduce((sum, y) => sum + Math.abs(y.cogs), 0);
  // Use already calculated opex from engine
  const totalOpex = yearlyData.reduce((sum, y) => sum + Math.abs(y.opex), 0);
  
  return {
    yearly,
    total: {
      totalIssued,
      avgWaPrice: totalIssued !== 0 ? totalRevenue / totalIssued : null,
      avgCogsPerCredit: totalIssued !== 0 ? totalCogs / totalIssued : null,
      avgLcoc: totalIssued !== 0 ? (totalCogs + totalOpex) / totalIssued : null,
    },
  };
}

// ============================================================================
// WORKING CAPITAL
// ============================================================================

export function calculateWorkingCapitalMetrics(yearlyData: YearlyFinancials[]) {
  return {
    yearly: yearlyData.map(y => {
      const ar = y.accountsReceivable;
      const ap = y.accountsPayable;
      const nwc = ar - ap;
      const revenue = y.totalRevenue;
      // Use already calculated opex from engine
      const opex = Math.abs(y.opex);
      
      return {
        year: y.year,
        ar,
        ap,
        nwc,
        revenue,
        dso: revenue !== 0 ? (365 * ar) / revenue : null,
        dpo: opex !== 0 ? (365 * ap) / opex : null,
        nwcPct: revenue !== 0 ? (nwc / revenue) * 100 : null,
      };
    }),
  };
}

// ============================================================================
// LIQUIDITY & SOLVENCY
// ============================================================================

export function calculateLiquidityMetrics(yearlyData: YearlyFinancials[]) {
  return {
    yearly: yearlyData.map(y => {
      const cash = y.cash;
      const ar = y.accountsReceivable;
      const currentAssets = cash + ar;
      const ap = y.accountsPayable;
      const unearned = y.unearnedRevenue;
      const currentLiabilities = ap + unearned;
      const debt = y.debt;
      const equity = y.equity;
      const ebitda = y.ebitda;
      const interest = Math.abs(y.interest);
      const netDebt = Math.max(debt - cash, 0);
      
      return {
        year: y.year,
        cash,
        currentAssets,
        currentLiabilities,
        debt,
        equity,
        currentRatio: currentLiabilities !== 0 ? currentAssets / currentLiabilities : null,
        cashRatio: currentLiabilities !== 0 ? cash / currentLiabilities : null,
        debtToEquity: equity > 0 ? debt / equity : null,
        netDebt,
        netDebtToEbitda: ebitda > 0 ? netDebt / ebitda : null,
        interestCoverage: interest !== 0 ? ebitda / interest : (ebitda > 0 ? Infinity : null),
      };
    }),
  };
}

// ============================================================================
// DEBT & COVERAGE
// ============================================================================

export function calculateDebtMetrics(yearlyData: YearlyFinancials[]) {
  const yearly = yearlyData.map(y => {
    const principal = Math.abs(y.debtPrincipal);
    const interest = Math.abs(y.debtInterest);
    const debtService = principal + interest;
    const ebitda = y.ebitda;
    const capex = Math.abs(y.capex);
    
    return {
      year: y.year,
      beginning: y.debtBeginning,
      draw: y.debtDraw,
      principal,
      ending: y.debtEnding,
      interest,
      debtService,
      dscr: debtService !== 0 ? (ebitda - capex) / debtService : (ebitda > capex ? Infinity : null),
    };
  });
  
  const dscrValues = yearly.map(y => y.dscr).filter(d => d !== null && d !== Infinity) as number[];
  const minDSCR = dscrValues.length > 0 ? Math.min(...dscrValues) : null;
  const minDSCRYear = minDSCR !== null ? yearly.find(y => y.dscr === minDSCR)?.year || null : null;
  
  const lastDebtYear = yearly.reverse().find(y => y.ending > 0);
  const debtAmortizesBy = lastDebtYear ? lastDebtYear.year : yearly[yearly.length - 1]?.year || null;
  yearly.reverse(); // restore order
  
  return {
    yearly,
    minDSCR,
    minDSCRYear,
    debtAmortizesBy,
  };
}

// ============================================================================
// CASH HEALTH & RUNWAY
// ============================================================================

export function calculateCashHealthMetrics(yearlyData: YearlyFinancials[]) {
  const yearly = yearlyData.map((y, idx) => {
    const ocf = y.operatingCF;
    const icf = y.investingCF;
    const fcf = y.financingCF;
    const coreBurn = -Math.min(ocf + icf, 0);
    
    return {
      year: y.year,
      ocf,
      icf,
      fcf,
      netChange: y.netChangeCash,
      cashEnd: y.cashEnd,
      runway: coreBurn > 0 ? (12 * y.cashEnd) / coreBurn : null,
    };
  });
  
  const minCashEnd = Math.min(...yearly.map(y => y.cashEnd));
  const minCashYear = yearly.find(y => y.cashEnd === minCashEnd)?.year || 0;
  
  // Peak funding: max negative cumulative cash before financing
  let cumCash = 0;
  let peakFunding = 0;
  for (const y of yearly) {
    cumCash += y.ocf + y.icf;
    if (cumCash < peakFunding) peakFunding = cumCash;
  }
  peakFunding = Math.abs(peakFunding);
  
  return {
    yearly,
    minCashEnd,
    minCashYear,
    peakFunding,
  };
}

// ============================================================================
// RETURNS (NPV/IRR/PAYBACK)
// ============================================================================

export function calculateReturnsMetrics(yearlyData: YearlyFinancials[], discountRate: number) {
  const r = discountRate / 100;
  
  // Equity returns (using FCFE)
  const fcfe = yearlyData.map(y => y.fcfe);
  const equityIRR = irr(fcfe);
  const equityNPV = npv(r, fcfe);
  const equityPayback = payback(fcfe);
  const equityDPB = discountedPayback(fcfe, r);
  const equityMIRR = mirr(fcfe, r, r);
  const equityCumNPV = cumulativeNPV(fcfe, r);
  
  // Project returns (unlevered: OCF + ICF)
  const ufcf = yearlyData.map(y => y.operatingCF + y.investingCF);
  const projectIRR = irr(ufcf);
  const projectNPV = npv(r, ufcf);
  const projectPayback = payback(ufcf);
  const projectDPB = discountedPayback(ufcf, r);
  const projectMIRR = mirr(ufcf, r, r);
  const projectCumNPV = cumulativeNPV(ufcf, r);
  
  // Investor returns (simplified: assume first prepurchase is at t=0, then spot revenues)
  const investorCF = yearlyData.map((y, idx) => {
    if (idx === 0 && y.prepurchaseRevenue > 0) {
      return -y.prepurchaseRevenue; // initial investment
    }
    return y.prepurchaseRevenue > 0 ? y.spotRevenue : 0;
  });
  const investorIRR = irr(investorCF);
  const investorNPV = npv(r, investorCF);
  
  return {
    equity: {
      irr: equityIRR,
      npv: equityNPV,
      payback: equityPayback,
      discountedPayback: equityDPB,
      mirr: equityMIRR,
      cumulativeNPV: equityCumNPV,
    },
    project: {
      irr: projectIRR,
      npv: projectNPV,
      payback: projectPayback,
      discountedPayback: projectDPB,
      mirr: projectMIRR,
      cumulativeNPV: projectCumNPV,
    },
    investor: {
      irr: investorIRR,
      npv: investorNPV,
    },
  };
}

// ============================================================================
// CARBON-COMMERCIAL KPIs
// ============================================================================

export function calculateCarbonKPIs(yearlyData: YearlyFinancials[], inputs: any) {
  let remainingPurchased = 0;
  
  const yearly = yearlyData.map((y, idx) => {
    const generated = y.creditsGenerated;
    const issued = y.creditsIssued;
    const purchasedDelivered = y.purchasedCreditsDelivered;
    
    if (idx === 0) {
      const totalPurchased = inputs.purchase_amount ? 
        inputs.purchase_amount / (inputs.purchase_price || 1) : 0;
      remainingPurchased = totalPurchased - purchasedDelivered;
    } else {
      remainingPurchased -= purchasedDelivered;
    }
    
    const spotIssued = issued - purchasedDelivered;
    
    return {
      year: y.year,
      generated,
      issued,
      issuanceRatio: generated !== 0 ? Math.min((issued / generated) * 100, 100) : null,
      purchasedDelivered,
      remainingPurchased: Math.max(remainingPurchased, 0),
      waPrice: issued !== 0 ? y.totalRevenue / issued : null,
      spotPrice: spotIssued > 0 ? y.spotRevenue / spotIssued : null,
    };
  });
  
  const totalPurchaseAmount = inputs.purchase_amount || 0;
  const totalPurchasedCredits = inputs.purchase_amount && inputs.purchase_price ? 
    inputs.purchase_amount / inputs.purchase_price : 0;
  const impliedPPPrice = totalPurchasedCredits !== 0 ? totalPurchaseAmount / totalPurchasedCredits : null;
  
  return {
    yearly,
    impliedPPPrice,
    totalGenerated: yearly.reduce((sum, y) => sum + y.generated, 0),
    totalIssued: yearly.reduce((sum, y) => sum + y.issued, 0),
  };
}

// ============================================================================
// BREAK-EVEN ANALYSIS
// ============================================================================

export function calculateBreakEvenMetrics(yearlyData: YearlyFinancials[]) {
  return {
    yearly: yearlyData.map(y => {
      const issued = y.creditsIssued;
      const cogs = Math.abs(y.cogs);
      const opex = Math.abs(y.feasibility) + Math.abs(y.pdd) + Math.abs(y.mrv) + Math.abs(y.staff);
      const waPrice = issued !== 0 ? y.totalRevenue / issued : null;
      const bePriceOper = issued !== 0 ? (cogs + opex) / issued : null;
      const safetySpread = waPrice !== null && bePriceOper !== null ? waPrice - bePriceOper : null;
      const beVolumeOper = waPrice && waPrice > 0 ? (cogs + opex) / waPrice : null;
      
      return {
        year: y.year,
        bePriceOper,
        beVolumeOper,
        realizedPrice: waPrice,
        safetySpread,
      };
    }),
  };
}

// ============================================================================
// COMPLIANCE & IDENTITY GUARDS
// ============================================================================

export function validateFinancialIdentities(yearlyData: YearlyFinancials[]) {
  const yearly = yearlyData.map(y => {
    const balanceIdentity = Math.abs(y.totalAssets - (y.totalLiabilities + y.equity)) < 0.01;
    const cashTieOut = Math.abs(y.cash - y.cashEnd) < 0.01;
    const equityIdentity = Math.abs(y.equity - (y.contributedCapital + y.retainedEarnings)) < 0.01;
    const liabilitySigns = y.accountsPayable >= 0 && y.unearnedRevenue >= 0 && y.debt >= 0;
    
    // Debt schedule consistency checks
    const debtBalance = Math.abs(y.debtBeginning + y.debtDraw + y.debtPrincipal - y.debtEnding) < 0.01;
    // Note: Interest validation would need debt interest rate from inputs, skipping for now as we lack that data in YearlyFinancials
    
    return {
      year: y.year,
      balanceIdentity,
      cashTieOut,
      equityIdentity,
      liabilitySigns,
      debtBalance,
    };
  });
  
  const overallPass = yearly.every(y => 
    y.balanceIdentity && y.cashTieOut && y.equityIdentity && y.liabilitySigns && y.debtBalance
  );
  
  return { yearly, overallPass };
}

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

export function calculateComprehensiveMetrics(
  yearlyData: YearlyFinancials[],
  discountRate: number,
  inputs: any
): ComprehensiveMetrics {
  return {
    profitability: calculateProfitabilityMetrics(yearlyData),
    unitEconomics: calculateUnitEconomics(yearlyData),
    workingCapital: calculateWorkingCapitalMetrics(yearlyData),
    liquidity: calculateLiquidityMetrics(yearlyData),
    debt: calculateDebtMetrics(yearlyData),
    cashHealth: calculateCashHealthMetrics(yearlyData),
    returns: calculateReturnsMetrics(yearlyData, discountRate),
    carbonKPIs: calculateCarbonKPIs(yearlyData, inputs),
    breakEven: calculateBreakEvenMetrics(yearlyData),
    compliance: validateFinancialIdentities(yearlyData),
  };
}
