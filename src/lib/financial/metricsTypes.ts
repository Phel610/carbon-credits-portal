// TypeScript interfaces for comprehensive financial metrics

export interface YearlyFinancials {
  year: number;
  
  // Income Statement
  spotRevenue: number;
  prepurchaseRevenue: number;
  totalRevenue: number;
  cogs: number;
  grossProfit: number;
  feasibility: number;
  pdd: number;
  mrv: number;
  staff: number;
  opex: number;
  ebitda: number;
  depreciation: number;
  interest: number;
  ebt: number;
  incomeTax: number;
  netIncome: number;
  
  // Balance Sheet
  cash: number;
  accountsReceivable: number;
  ppe: number;
  totalAssets: number;
  accountsPayable: number;
  unearnedRevenue: number;
  debt: number;
  totalLiabilities: number;
  equity: number;
  contributedCapital: number;
  retainedEarnings: number;
  
  // Cash Flow
  operatingCF: number;
  investingCF: number;
  financingCF: number;
  netChangeCash: number;
  cashEnd: number;
  capex: number;
  changeAR: number;
  changeAP: number;
  changeUnearned: number;
  
  // Debt Schedule
  debtBeginning: number;
  debtDraw: number;
  debtPrincipal: number;
  debtEnding: number;
  debtInterest: number;
  dscr: number;
  
  // Carbon metrics
  creditsGenerated: number;
  creditsIssued: number;
  purchasedCreditsDelivered: number;
  
  // Free Cash Flow
  fcfe: number;
}

export interface ProfitabilityMetrics {
  yearly: Array<{
    year: number;
    revenue: number;
    cogs: number;
    grossProfit: number;
    opex: number;
    ebitda: number;
    depreciation: number;
    interest: number;
    ebt: number;
    tax: number;
    netIncome: number;
    grossMargin: number | null;
    ebitdaMargin: number | null;
    netMargin: number | null;
  }>;
  total: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    opex: number;
    ebitda: number;
    netIncome: number;
  };
}

export interface UnitEconomicsMetrics {
  yearly: Array<{
    year: number;
    issuedCredits: number;
    waPrice: number | null;
    cogsPerCredit: number | null;
    gpPerCredit: number | null;
    opexPerCredit: number | null;
    lcoc: number | null;
    allInCostPerCredit: number | null;
  }>;
  total: {
    totalIssued: number;
    avgWaPrice: number | null;
    avgCogsPerCredit: number | null;
    avgLcoc: number | null;
  };
}

export interface WorkingCapitalMetrics {
  yearly: Array<{
    year: number;
    ar: number;
    ap: number;
    nwc: number;
    revenue: number;
    dso: number | null;
    dpo: number | null;
    nwcPct: number | null;
  }>;
}

export interface LiquidityMetrics {
  yearly: Array<{
    year: number;
    cash: number;
    currentAssets: number;
    currentLiabilities: number;
    debt: number;
    equity: number;
    currentRatio: number | null;
    cashRatio: number | null;
    debtToEquity: number | null;
    netDebt: number;
    netDebtToEbitda: number | null;
    interestCoverage: number | null;
  }>;
}

export interface DebtMetrics {
  yearly: Array<{
    year: number;
    beginning: number;
    draw: number;
    principal: number;
    ending: number;
    interest: number;
    debtService: number;
    dscr: number | null;
  }>;
  minDSCR: number | null;
  minDSCRYear: number | null;
  debtAmortizesBy: number | null;
}

export interface CashHealthMetrics {
  yearly: Array<{
    year: number;
    ocf: number;
    icf: number;
    fcf: number;
    netChange: number;
    cashEnd: number;
    runway: number | null;
  }>;
  minCashEnd: number;
  minCashYear: number;
  peakFunding: number;
}

export interface ReturnsMetrics {
  equity: {
    irr: number | null;
    npv: number;
    payback: number | null;
    discountedPayback: number | null;
    mirr: number | null;
    cumulativeNPV: Array<{ year: number; value: number }>;
  };
  project: {
    irr: number | null;
    npv: number;
    payback: number | null;
    discountedPayback: number | null;
    mirr: number | null;
    cumulativeNPV: Array<{ year: number; value: number }>;
  };
  investor: {
    irr: number | null;
    npv: number;
  };
}

export interface CarbonKPIMetrics {
  yearly: Array<{
    year: number;
    generated: number;
    issued: number;
    issuanceRatio: number | null;
    purchasedDelivered: number;
    remainingPurchased: number;
    waPrice: number | null;
    spotPrice: number | null;
  }>;
  impliedPPPrice: number | null;
  totalGenerated: number;
  totalIssued: number;
}

export interface BreakEvenMetrics {
  yearly: Array<{
    year: number;
    bePriceOper: number | null;
    beVolumeOper: number | null;
    realizedPrice: number | null;
    safetySpread: number | null;
  }>;
}

export interface ComplianceMetrics {
  yearly: Array<{
    year: number;
    balanceIdentity: boolean;
    cashTieOut: boolean;
    equityIdentity: boolean;
    liabilitySigns: boolean;
  }>;
  overallPass: boolean;
}

export interface ComprehensiveMetrics {
  profitability: ProfitabilityMetrics;
  unitEconomics: UnitEconomicsMetrics;
  workingCapital: WorkingCapitalMetrics;
  liquidity: LiquidityMetrics;
  debt: DebtMetrics;
  cashHealth: CashHealthMetrics;
  returns: ReturnsMetrics;
  carbonKPIs: CarbonKPIMetrics;
  breakEven: BreakEvenMetrics;
  compliance: ComplianceMetrics;
}
