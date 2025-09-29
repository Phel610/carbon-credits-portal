// Comprehensive Financial Metrics Calculator
// Implements all 12 metric categories as specified by ChatGPT

import { IncomeStatement, BalanceSheet, CashFlowStatement, DebtSchedule, CarbonStream, FreeCashFlow, ModelInputData } from './calculationEngine';

export interface ComprehensiveMetrics {
  // 1) Profitability & Margins (per year + totals)
  profitability: {
    [year: number]: {
      total_revenue: number;
      cogs: number;
      gross_profit: number;
      opex: number;
      ebitda: number;
      depreciation: number;
      interest_expense: number;
      ebt: number;
      income_tax: number;
      net_income: number;
      gross_margin: number | string; // % or "–"
      ebitda_margin: number | string; // % or "–"
      net_margin: number | string; // % or "–"
    };
  };
  
  // 2) Unit Economics (per credit)
  unitEconomics: {
    [year: number]: {
      issued_credits: number;
      wa_realized_price: number | string; // per issued credit or "–"
      cogs_per_credit: number | string;
      gross_profit_per_credit: number | string;
      opex_per_credit: number | string;
      lcoc_operational: number | string; // levelized cost of credit
      all_in_cost_per_credit: number | string;
    };
  };
  
  // 3) Working Capital & Cash Conversion
  workingCapital: {
    [year: number]: {
      ar_balance: number;
      ap_balance: number;
      dso: number | string; // days sales outstanding or "–"
      dpo: number | string; // days payables outstanding or "–"
      nwc: number; // net working capital
      nwc_pct_revenue: number | string; // % or "–"
    };
  };
  
  // 4) Liquidity & Solvency
  liquidity: {
    [year: number]: {
      cash: number;
      current_assets: number;
      current_liabilities: number;
      debt: number;
      current_ratio: number | string;
      cash_ratio: number | string;
      net_debt: number;
      net_debt_ebitda: number | string;
      interest_coverage: number | string;
      leverage_ratio: number | string; // debt/equity
    };
  };
  
  // 5) Debt & Coverage
  debtCoverage: {
    [year: number]: {
      beginning_balance: number;
      ending_balance: number;
      principal_paid: number;
      interest_expense: number;
      total_debt_service: number;
      dscr_conservative: number | string; // (EBITDA - CAPEX) / debt service
    };
    min_dscr: number;
    min_dscr_year: number;
    debt_maturity_year: number | null;
  };
  
  // 6) Cash Health & Runway
  cashHealth: {
    [year: number]: {
      ocf: number;
      icf: number;
      fcf: number;
      net_change_cash: number;
      cash_end: number;
      core_burn: number; // monthly burn rate
      runway_months: number | string; // months or "not burning"
    };
    min_cash_end: number;
    peak_additional_equity_required: number;
  };
  
  // 7) Returns (Project & Equity)
  returns: {
    equity: {
      irr: number | string;
      npv: number;
      payback_period: number | string; // years or "> horizon"
    };
    project: {
      irr: number | string;
      npv: number;
      payback_period: number | string;
    };
  };
  
  // 8) Carbon-Commercial KPIs
  carbonKPIs: {
    [year: number]: {
      generated_credits: number;
      issued_credits: number;
      issuance_ratio: number; // % (capped at 100%)
      purchased_credits_delivered: number;
      remaining_purchased_credits: number;
      wa_realized_price_all: number | string; // all credits
      wa_spot_price: number | string; // spot-only credits
    };
    implied_purchase_price: number;
    total_purchased_credits: number;
  };
  
  // 9) Break-even & Price Safety
  breakeven: {
    [year: number]: {
      breakeven_price_operating: number | string; // per issued credit
      safety_spread: number | string; // realized price - breakeven
      breakeven_volume_operating: number | string; // at realized price
    };
  };
  
  // 10) Compliance & Identity Guards
  compliance: {
    [year: number]: {
      balance_identity: boolean;
      cash_tieout: boolean;
      equity_identity: boolean;
      liability_signs: boolean;
      debt_schedule_consistency: boolean;
    };
  };
  
  // Summary metrics for quick access
  summary: {
    total_revenue: number;
    total_ebitda: number;
    total_net_income: number;
    total_issued_credits: number;
    wa_price_total_horizon: number;
    min_dscr: number;
    equity_irr: number | string;
    project_irr: number | string;
    latest_year_cash: number;
    latest_year_current_ratio: number | string;
    latest_year_net_debt: number;
  };
}

export class ComprehensiveMetricsCalculator {
  private incomeStatements: IncomeStatement[];
  private balanceSheets: BalanceSheet[];
  private cashFlows: CashFlowStatement[];
  private debtSchedule: DebtSchedule[];
  private carbonStream: CarbonStream[];
  private freeCashFlow: FreeCashFlow[];
  private inputs: ModelInputData;
  
  constructor(
    incomeStatements: IncomeStatement[],
    balanceSheets: BalanceSheet[],
    cashFlows: CashFlowStatement[],
    debtSchedule: DebtSchedule[],
    carbonStream: CarbonStream[],
    freeCashFlow: FreeCashFlow[],
    inputs: ModelInputData
  ) {
    this.incomeStatements = incomeStatements;
    this.balanceSheets = balanceSheets;
    this.cashFlows = cashFlows;
    this.debtSchedule = debtSchedule;
    this.carbonStream = carbonStream;
    this.freeCashFlow = freeCashFlow;
    this.inputs = inputs;
  }
  
  calculate(): ComprehensiveMetrics {
    const metrics: ComprehensiveMetrics = {
      profitability: {},
      unitEconomics: {},
      workingCapital: {},
      liquidity: {},
      debtCoverage: {
        min_dscr: 0,
        min_dscr_year: 0,
        debt_maturity_year: null
      },
      cashHealth: {
        min_cash_end: 0,
        peak_additional_equity_required: 0
      },
      returns: {
        equity: { irr: 0, npv: 0, payback_period: 0 },
        project: { irr: 0, npv: 0, payback_period: 0 }
      },
      carbonKPIs: {
        implied_purchase_price: 0,
        total_purchased_credits: 0
      },
      breakeven: {},
      compliance: {},
      summary: {
        total_revenue: 0,
        total_ebitda: 0,
        total_net_income: 0,
        total_issued_credits: 0,
        wa_price_total_horizon: 0,
        min_dscr: 0,
        equity_irr: 0,
        project_irr: 0,
        latest_year_cash: 0,
        latest_year_current_ratio: 0,
        latest_year_net_debt: 0
      }
    };
    
    // Calculate by year for most metrics
    this.incomeStatements.forEach((is, index) => {
      const year = is.year;
      const bs = this.balanceSheets[index];
      const cf = this.cashFlows[index];
      const debt = this.debtSchedule[index];
      const carbon = this.carbonStream[index];
      
      // 1) Profitability & Margins
      const revenue = is.total_revenue;
      const cogs = Math.abs(is.cogs);
      const opex = Math.abs(is.feasibility_costs) + Math.abs(is.pdd_costs) + 
                   Math.abs(is.mrv_costs) + Math.abs(is.staff_costs);
      const gross_profit = revenue - cogs;
      const ebitda = is.ebitda;
      const depreciation = Math.abs(is.depreciation);
      const interest_expense = is.interest_expense;
      const ebt = is.earnings_before_tax;
      const income_tax = is.income_tax;
      const net_income = is.net_income;
      
      metrics.profitability[year] = {
        total_revenue: revenue,
        cogs,
        gross_profit,
        opex,
        ebitda,
        depreciation,
        interest_expense,
        ebt,
        income_tax,
        net_income,
        gross_margin: revenue === 0 ? "–" : ((gross_profit / revenue) * 100),
        ebitda_margin: revenue === 0 ? "–" : ((ebitda / revenue) * 100),
        net_margin: revenue === 0 ? "–" : ((net_income / revenue) * 100)
      };
      
      // 2) Unit Economics
      const issued_credits = is.credits_issued;
      metrics.unitEconomics[year] = {
        issued_credits,
        wa_realized_price: issued_credits === 0 ? "–" : (revenue / issued_credits),
        cogs_per_credit: issued_credits === 0 ? "–" : (cogs / issued_credits),
        gross_profit_per_credit: issued_credits === 0 ? "–" : (gross_profit / issued_credits),
        opex_per_credit: issued_credits === 0 ? "–" : (opex / issued_credits),
        lcoc_operational: issued_credits === 0 ? "–" : ((cogs + opex) / issued_credits),
        all_in_cost_per_credit: issued_credits === 0 ? "–" : ((cogs + opex + depreciation) / issued_credits)
      };
      
      // 3) Working Capital
      const ar_balance = bs.accounts_receivable;
      const ap_balance = bs.accounts_payable;
      const opex_cash = opex; // proxy since expenses as incurred
      
      metrics.workingCapital[year] = {
        ar_balance,
        ap_balance,
        dso: revenue === 0 ? "–" : (365 * ar_balance / revenue),
        dpo: opex_cash === 0 ? "–" : (365 * ap_balance / opex_cash),
        nwc: ar_balance - ap_balance,
        nwc_pct_revenue: revenue === 0 ? "–" : (((ar_balance - ap_balance) / revenue) * 100)
      };
      
      // 4) Liquidity & Solvency
      const cash = bs.cash;
      const current_assets = cash + ar_balance;
      const current_liabilities = ap_balance + bs.unearned_revenue;
      const debt_balance = bs.debt_balance;
      const equity = bs.total_equity;
      const net_debt = Math.max(debt_balance - cash, 0);
      
      metrics.liquidity[year] = {
        cash,
        current_assets,
        current_liabilities,
        debt: debt_balance,
        current_ratio: current_liabilities === 0 ? "–" : (current_assets / current_liabilities),
        cash_ratio: current_liabilities === 0 ? "–" : (cash / current_liabilities),
        net_debt,
        net_debt_ebitda: ebitda <= 0 ? "n.m." : (net_debt / ebitda),
        interest_coverage: interest_expense === 0 ? (ebitda > 0 ? "∞" : "–") : (ebitda / interest_expense),
        leverage_ratio: equity <= 0 ? "n.m." : (debt_balance / equity)
      };
      
      // 5) Debt Coverage
      const capex = Math.abs(cf.capex || 0);
      const principal_paid = Math.abs(debt.principal_payment);
      const total_debt_service = principal_paid + interest_expense;
      const dscr_conservative = total_debt_service === 0 ? 
        (ebitda - capex > 0 ? "∞" : "–") : 
        ((ebitda - capex) / total_debt_service);
      
      metrics.debtCoverage[year] = {
        beginning_balance: debt.beginning_balance,
        ending_balance: debt.ending_balance,
        principal_paid,
        interest_expense,
        total_debt_service,
        dscr_conservative
      };
      
      // 6) Cash Health
      const ocf = cf.operating_cash_flow;
      const icf = cf.investing_cash_flow;
      const fcf_val = cf.financing_cash_flow;
      const net_change_cash = cf.net_change_cash;
      const cash_end = cf.cash_end;
      const core_burn = -Math.min(ocf + icf, 0);
      
      metrics.cashHealth[year] = {
        ocf,
        icf,
        fcf: fcf_val,
        net_change_cash,
        cash_end,
        core_burn,
        runway_months: core_burn === 0 ? "not burning" : (12 * cash_end / core_burn)
      };
      
      // 8) Carbon KPIs
      const generated_credits = is.credits_generated;
      const purchased_credits_delivered = carbon.purchased_credits || 0;
      const spot_issued = issued_credits - purchased_credits_delivered;
      const spot_revenue = is.spot_revenue;
      
      // Calculate remaining purchased credits (carry-forward)
      let remaining_purchased_credits = 0;
      if (index === 0) {
        const total_purchased = this.inputs.purchase_amount.reduce((sum, amt, i) => 
          sum + (amt > 0 ? amt / (carbon.implied_purchase_price || 1) : 0), 0);
        remaining_purchased_credits = total_purchased - purchased_credits_delivered;
      } else {
        const prevRemaining = metrics.carbonKPIs[this.incomeStatements[index-1].year]?.remaining_purchased_credits || 0;
        remaining_purchased_credits = prevRemaining - purchased_credits_delivered;
      }
      
      metrics.carbonKPIs[year] = {
        generated_credits,
        issued_credits,
        issuance_ratio: Math.min((issued_credits / Math.max(generated_credits, 1)) * 100, 100),
        purchased_credits_delivered,
        remaining_purchased_credits,
        wa_realized_price_all: issued_credits === 0 ? "–" : (revenue / issued_credits),
        wa_spot_price: spot_issued === 0 ? "–" : (spot_revenue / spot_issued)
      };
      
      // 9) Break-even Analysis
      const breakeven_price_op = issued_credits === 0 ? "–" : ((cogs + opex) / issued_credits);
      const wa_price = typeof metrics.unitEconomics[year].wa_realized_price === 'number' ? 
        metrics.unitEconomics[year].wa_realized_price as number : 0;
      const safety_spread = (typeof breakeven_price_op === 'number' && wa_price > 0) ? 
        (wa_price - breakeven_price_op) : "–";
      const breakeven_volume = wa_price > 0 ? ((cogs + opex) / wa_price) : "–";
      
      metrics.breakeven[year] = {
        breakeven_price_operating: breakeven_price_op,
        safety_spread,
        breakeven_volume_operating: breakeven_volume
      };
      
      // 10) Compliance Checks
      const balance_identity = Math.abs(bs.total_assets - (bs.total_liabilities + bs.total_equity)) < 0.01;
      const cash_tieout = Math.abs(bs.cash - cf.cash_end) < 0.01;
      const equity_identity = Math.abs(bs.total_equity - (bs.contributed_capital + bs.retained_earnings)) < 0.01;
      const liability_signs = ap_balance >= 0 && bs.unearned_revenue >= 0 && debt_balance >= 0;
      const debt_consistency = Math.abs(debt.beginning_balance + debt.draw + debt.principal_payment - debt.ending_balance) < 0.01;
      
      metrics.compliance[year] = {
        balance_identity,
        cash_tieout,
        equity_identity,
        liability_signs,
        debt_schedule_consistency: debt_consistency
      };
    });
    
    // Calculate aggregated metrics
    this.calculateAggregatedMetrics(metrics);
    
    return metrics;
  }
  
  private calculateAggregatedMetrics(metrics: ComprehensiveMetrics) {
    const years = this.incomeStatements.map(is => is.year);
    
    // Summary totals
    metrics.summary.total_revenue = Object.values(metrics.profitability)
      .reduce((sum, p) => sum + p.total_revenue, 0);
    metrics.summary.total_ebitda = Object.values(metrics.profitability)
      .reduce((sum, p) => sum + p.ebitda, 0);
    metrics.summary.total_net_income = Object.values(metrics.profitability)
      .reduce((sum, p) => sum + p.net_income, 0);
    metrics.summary.total_issued_credits = Object.values(metrics.unitEconomics)
      .reduce((sum, u) => sum + u.issued_credits, 0);
    
    // WA price across horizon
    metrics.summary.wa_price_total_horizon = metrics.summary.total_issued_credits === 0 ? 0 :
      (metrics.summary.total_revenue / metrics.summary.total_issued_credits);
    
    // Min DSCR
    const validDSCRs = Object.entries(metrics.debtCoverage)
      .filter(([key]) => !isNaN(Number(key)))
      .map(([_, coverage]) => coverage as any)
      .filter(coverage => coverage && typeof coverage.dscr_conservative === 'number')
      .map(coverage => coverage.dscr_conservative as number)
      .filter((dscr): dscr is number => dscr > 0);
    
    if (validDSCRs.length > 0) {
      metrics.summary.min_dscr = Math.min(...validDSCRs);
      metrics.debtCoverage.min_dscr = metrics.summary.min_dscr;
      
      // Find min DSCR year
      const minDSCREntry = Object.entries(metrics.debtCoverage)
        .filter(([key]) => !isNaN(Number(key)))
        .find(([_, coverage]) => (coverage as any).dscr_conservative === metrics.summary.min_dscr);
      if (minDSCREntry) {
        metrics.debtCoverage.min_dscr_year = Number(minDSCREntry[0]);
      }
    }
    
    // 7) Returns calculation
    this.calculateReturns(metrics);
    
    // Latest year metrics for summary
    const latestYear = Math.max(...years);
    metrics.summary.latest_year_cash = metrics.liquidity[latestYear]?.cash || 0;
    metrics.summary.latest_year_current_ratio = metrics.liquidity[latestYear]?.current_ratio || 0;
    metrics.summary.latest_year_net_debt = metrics.liquidity[latestYear]?.net_debt || 0;
    
    // Cash health aggregates
    const allCashEnds = Object.values(metrics.cashHealth)
      .filter((ch): ch is any => typeof ch === 'object' && 'cash_end' in ch)
      .map(ch => ch.cash_end);
    if (allCashEnds.length > 0) {
      metrics.cashHealth.min_cash_end = Math.min(...allCashEnds);
    }
    
    // Carbon KPIs totals
    const totalPurchaseAmount = this.inputs.purchase_amount.reduce((sum, amt) => sum + amt, 0);
    if (totalPurchaseAmount > 0 && this.carbonStream.length > 0) {
      metrics.carbonKPIs.implied_purchase_price = totalPurchaseAmount / 
        this.carbonStream.reduce((sum, cs) => sum + (cs.purchased_credits || 0), 0);
      metrics.carbonKPIs.total_purchased_credits = 
        this.carbonStream.reduce((sum, cs) => sum + (cs.purchased_credits || 0), 0);
    }
  }
  
  private calculateReturns(metrics: ComprehensiveMetrics) {
    const discountRate = this.inputs.discount_rate;
    
    // Equity returns using Free Cash Flow to Equity
    const equityCashFlows = this.freeCashFlow.map(fcf => fcf.fcf_to_equity);
    metrics.returns.equity.irr = this.calculateIRR(equityCashFlows);
    metrics.returns.equity.npv = this.calculateNPV(equityCashFlows, discountRate);
    metrics.returns.equity.payback_period = this.calculatePaybackPeriod(equityCashFlows);
    
    // Project returns (unlevered) = OCF + ICF
    const projectCashFlows = this.cashFlows.map(cf => cf.operating_cash_flow + cf.investing_cash_flow);
    metrics.returns.project.irr = this.calculateIRR(projectCashFlows);
    metrics.returns.project.npv = this.calculateNPV(projectCashFlows, discountRate);
    metrics.returns.project.payback_period = this.calculatePaybackPeriod(projectCashFlows);
    
    // Update summary
    metrics.summary.equity_irr = metrics.returns.equity.irr;
    metrics.summary.project_irr = metrics.returns.project.irr;
  }
  
  private calculateIRR(cashFlows: number[]): number | string {
    // Simple IRR calculation using Newton-Raphson method
    if (cashFlows.length < 2) return "n/a";
    
    let rate = 0.1; // Initial guess
    const precision = 1e-6;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;
      
      for (let t = 0; t < cashFlows.length; t++) {
        const factor = Math.pow(1 + rate, t);
        npv += cashFlows[t] / factor;
        dnpv -= t * cashFlows[t] / (factor * (1 + rate));
      }
      
      if (Math.abs(npv) < precision) {
        return rate * 100; // Return as percentage
      }
      
      if (Math.abs(dnpv) < precision) {
        return "n/a"; // Derivative too small
      }
      
      rate -= npv / dnpv;
      
      if (rate < -0.99 || rate > 10) {
        return "n/a"; // Unrealistic rate
      }
    }
    
    return "n/a"; // Failed to converge
  }
  
  private calculateNPV(cashFlows: number[], discountRate: number): number {
    return cashFlows.reduce((npv, cf, t) => {
      return npv + cf / Math.pow(1 + discountRate, t);
    }, 0);
  }
  
  private calculatePaybackPeriod(cashFlows: number[]): number | string {
    let cumulative = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      cumulative += cashFlows[t];
      if (cumulative >= 0) {
        return t;
      }
    }
    return "> horizon";
  }
}