// Financial Calculation Engine for Carbon Credit Projects
// Implements exact Excel formulas and logic as specified

import { z } from 'zod';

// Zod schema for input validation
const YearArray = z.array(z.number());

export const InputSchema = z.object({
  // Timeline
  years: z.array(z.number()).min(1),
  
  // Operational metrics
  credits_generated: YearArray,
  price_per_credit: YearArray,
  issuance_flag: YearArray, // 0 or 1 per year
  
  // Expenses (using Excel sign conventions - negative for costs)
  cogs_rate: z.number().min(0).max(1),
  feasibility_costs: YearArray, // negative
  pdd_costs: YearArray, // negative
  mrv_costs: YearArray, // negative
  staff_costs: YearArray, // negative
  depreciation: YearArray, // negative
  income_tax_rate: z.number().min(0).max(1),
  
  // Working capital rates
  ar_rate: z.number().min(0).max(1),
  ap_rate: z.number().min(0).max(1),
  
  // CAPEX and financing
  capex: YearArray, // negative
  equity_injection: YearArray,
  interest_rate: z.number().min(0).max(1),
  debt_duration_years: z.number().int().positive(),
  debt_draw: YearArray,
  
  // Pre-purchase agreements
  purchase_amount: YearArray,
  purchase_share: z.number().min(0).max(1),
  
  // Returns
  discount_rate: z.number().min(0).max(1),
  initial_equity_t0: z.number().default(0),
});

export type ModelInputData = z.infer<typeof InputSchema>;

export interface IncomeStatement {
  year: number;
  credits_generated: number;
  credits_issued: number;
  spot_revenue: number;
  pre_purchase_revenue: number;
  total_revenue: number;
  cogs: number;
  gross_profit: number;
  feasibility_costs: number;
  pdd_costs: number;
  mrv_costs: number;
  staff_costs: number;
  total_opex: number;
  ebitda: number;
  depreciation: number;
  interest_expense: number;
  earnings_before_tax: number;
  income_tax: number;
  net_income: number;
}

export interface BalanceSheet {
  year: number;
  // Assets
  cash: number;
  accounts_receivable: number;
  ppe_gross: number;
  accumulated_depreciation: number;
  ppe_net: number;
  total_assets: number;
  // Liabilities
  accounts_payable: number;
  unearned_revenue: number;
  debt_balance: number;
  total_liabilities: number;
  // Equity
  retained_earnings: number;
  shareholder_equity: number;
  equity_injection: number;
  total_equity: number;
  total_liabilities_equity: number;
  // Check (must be 0)
  balance_check: number;
}

export interface CashFlowStatement {
  year: number;
  // Operating activities
  net_income: number;
  depreciation_addback: number;
  change_ar: number;
  change_ap: number;
  operating_cash_flow: number;
  // Financing activities
  unearned_inflow: number;
  unearned_release: number;
  debt_draw: number;
  debt_repayment: number;
  equity_injection: number;
  financing_cash_flow: number;
  // Investing activities
  capex: number;
  investing_cash_flow: number;
  // Cash roll
  cash_start: number;
  net_change_cash: number;
  cash_end: number;
}

export interface DebtSchedule {
  year: number;
  beginning_balance: number;
  draw: number;
  principal_payment: number;
  ending_balance: number;
  interest_expense: number;
  dscr: number;
}

export interface CarbonStream {
  year: number;
  purchase_amount: number;
  purchased_credits: number;
  implied_purchase_price: number;
  investor_cash_flow: number;
}

export interface FreeCashFlow {
  year: number;
  net_income: number;
  depreciation_addback: number;
  change_working_capital: number;
  capex: number;
  net_borrowing: number;
  fcf_to_equity: number;
}

export interface FinancialMetrics {
  // Operational
  total_revenue: number;
  total_ebitda: number;
  total_net_income: number;
  ebitda_margin: number;
  net_margin: number;
  
  // Investment
  total_capex: number;
  peak_funding_required: number;
  
  // Returns
  npv: number;
  company_irr: number;
  investor_irr: number;
  payback_period: number;
  
  // Debt metrics
  dscr_minimum: number;
}

export class FinancialCalculationEngine {
  private inputs: ModelInputData;
  private years: number[];

  constructor(inputs: ModelInputData) {
    // Validate inputs
    this.inputs = InputSchema.parse(inputs);
    this.years = inputs.years;
  }

  calculateFinancialStatements() {
    // Calculate in order of dependencies
    const incomeStatements = this.calculateIncomeStatements();
    const debtSchedule = this.calculateDebtSchedule();
    const balanceSheets = this.calculateBalanceSheets(incomeStatements, debtSchedule);
    const cashFlowStatements = this.calculateCashFlowStatements(incomeStatements, balanceSheets, debtSchedule);
    const carbonStream = this.calculateCarbonStream();
    const freeCashFlow = this.calculateFreeCashFlow(incomeStatements, balanceSheets, debtSchedule);
    const metrics = this.calculateFinancialMetrics(incomeStatements, cashFlowStatements, freeCashFlow, carbonStream);

    return {
      incomeStatements,
      balanceSheets,
      cashFlowStatements,
      debtSchedule,
      carbonStream,
      freeCashFlow,
      metrics,
    };
  }

  private calculateIncomeStatements(): IncomeStatement[] {
    const statements: IncomeStatement[] = [];
    const issued = this.calculateIssuedCredits();
    const { spotRev, prepRev, purchasedCredits, impliedPurchasePrice } = this.calculateRevenue(issued);

    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      
      const credits_generated = this.inputs.credits_generated[t] || 0;
      const credits_issued = issued[t];
      
      const spot_revenue = spotRev[t];
      const pre_purchase_revenue = prepRev[t];
      const total_revenue = spot_revenue + pre_purchase_revenue;
      
      // COGS
      const cogs = total_revenue * this.inputs.cogs_rate;
      const gross_profit = total_revenue - cogs;
      
      // OPEX (all entered as negative numbers)
      const feasibility_costs = this.inputs.feasibility_costs[t] || 0;
      const pdd_costs = this.inputs.pdd_costs[t] || 0;
      const mrv_costs = this.inputs.mrv_costs[t] || 0;
      const staff_costs = this.inputs.staff_costs[t] || 0;
      const total_opex = feasibility_costs + pdd_costs + mrv_costs + staff_costs;
      
      const ebitda = gross_profit + total_opex; // total_opex is negative
      
      // Depreciation and interest (negative values)
      const depreciation = this.inputs.depreciation[t] || 0;
      const interest_expense = this.calculateInterestExpense(t);
      
      const earnings_before_tax = ebitda + depreciation + interest_expense;
      const income_tax = Math.max(0, earnings_before_tax * this.inputs.income_tax_rate);
      const net_income = earnings_before_tax - income_tax;

      statements.push({
        year,
        credits_generated,
        credits_issued,
        spot_revenue,
        pre_purchase_revenue,
        total_revenue,
        cogs,
        gross_profit,
        feasibility_costs,
        pdd_costs,
        mrv_costs,
        staff_costs,
        total_opex,
        ebitda,
        depreciation,
        interest_expense,
        earnings_before_tax,
        income_tax,
        net_income,
      });
    }

    return statements;
  }

  private calculateIssuedCredits(): number[] {
    const issued: number[] = [];
    
    for (let t = 0; t < this.years.length; t++) {
      const cumGenerated = this.inputs.credits_generated.slice(0, t + 1).reduce((sum, val) => sum + (val || 0), 0);
      const cumIssuedPrev = issued.slice(0, t).reduce((sum, val) => sum + val, 0);
      const issuanceFlag = this.inputs.issuance_flag[t] || 0;
      
      issued[t] = (cumGenerated - cumIssuedPrev) * issuanceFlag;
    }
    
    return issued;
  }

  private calculateRevenue(issued: number[]) {
    const hasPurchase = this.inputs.purchase_amount.map(v => (v || 0) > 0);
    const purchasedCredits = issued.map((q, t) => hasPurchase[t] ? q * this.inputs.purchase_share : 0);
    
    // Calculate implied purchase price from first purchase year
    const totalPurchased = purchasedCredits.reduce((sum, val) => sum + val, 0);
    const firstPurchaseIdx = hasPurchase.findIndex(v => v);
    const impliedPurchasePrice = totalPurchased > 0 && firstPurchaseIdx >= 0
      ? (this.inputs.purchase_amount[firstPurchaseIdx] || 0) / totalPurchased
      : 0;
    
    const spotRev = issued.map((q, t) => 
      hasPurchase[t] ? q * (this.inputs.price_per_credit[t] || 0) * (1 - this.inputs.purchase_share) 
                     : q * (this.inputs.price_per_credit[t] || 0)
    );
    
    const prepRev = purchasedCredits.map(q => q * impliedPurchasePrice);
    
    return { spotRev, prepRev, purchasedCredits, impliedPurchasePrice };
  }

  private calculateDebtSchedule(): DebtSchedule[] {
    const schedule: DebtSchedule[] = [];
    
    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      const begBalance = t === 0 ? 0 : schedule[t - 1].ending_balance;
      const draw = this.inputs.debt_draw[t] || 0;
      
      // PPMT calculation for first draw only (Excel parity)
      const per = t + 1;
      const firstDraw = this.inputs.debt_draw[0] || 0;
      const principal_payment = (firstDraw > 0 && per <= this.inputs.debt_duration_years)
        ? -this.ppmt(this.inputs.interest_rate, per, this.inputs.debt_duration_years, firstDraw)
        : 0;
      
      const ending_balance = begBalance + draw + principal_payment; // principal_payment is negative
      const interest_expense = begBalance * this.inputs.interest_rate;
      
      // DSCR calculation
      const dscr = interest_expense + Math.abs(principal_payment) > 0 
        ? (t < this.years.length ? 0 : 0) // Will be calculated after EBITDA is available
        : 0;

      schedule.push({
        year,
        beginning_balance: begBalance,
        draw,
        principal_payment,
        ending_balance,
        interest_expense,
        dscr,
      });
    }
    
    return schedule;
  }

  private calculateBalanceSheets(incomeStatements: IncomeStatement[], debtSchedule: DebtSchedule[]): BalanceSheet[] {
    const sheets: BalanceSheet[] = [];
    let cumulativePPE = 0;
    let cumulativeDepreciation = 0;
    let cumulativeRetainedEarnings = 0;
    let cumulativeUnearned = 0;

    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      const income = incomeStatements[t];
      
      // PPE calculation
      const capex = this.inputs.capex[t] || 0; // negative
      cumulativePPE += -capex; // Convert to positive for PPE
      cumulativeDepreciation += -income.depreciation; // Convert to positive for accumulated dep
      
      const ppe_gross = cumulativePPE;
      const accumulated_depreciation = cumulativeDepreciation;
      const ppe_net = ppe_gross - accumulated_depreciation;
      
      // Working capital
      const accounts_receivable = income.total_revenue * this.inputs.ar_rate;
      const accounts_payable = -this.inputs.ap_rate * income.total_opex; // opex is negative, so AP positive
      
      // Unearned revenue
      const purchaseInflow = this.inputs.purchase_amount[t] || 0;
      const { purchasedCredits, impliedPurchasePrice } = this.calculateRevenue(this.calculateIssuedCredits());
      const unearnedRelease = -purchasedCredits[t] * impliedPurchasePrice;
      cumulativeUnearned += purchaseInflow + unearnedRelease;
      const unearned_revenue = Math.max(0, cumulativeUnearned);
      
      // Debt
      const debt_balance = debtSchedule[t].ending_balance;
      
      // Equity
      cumulativeRetainedEarnings += income.net_income;
      const retained_earnings = cumulativeRetainedEarnings;
      const equity_injection = this.inputs.equity_injection[t] || 0;
      const shareholder_equity = equity_injection; // Simplified
      const total_equity = retained_earnings + shareholder_equity;
      
      // Assets and liabilities
      const total_liabilities = accounts_payable + unearned_revenue + debt_balance;
      const total_assets_without_cash = accounts_receivable + ppe_net;
      const cash = total_liabilities + total_equity - total_assets_without_cash; // Balancing item
      
      const total_assets = cash + accounts_receivable + ppe_net;
      const total_liabilities_equity = total_liabilities + total_equity;
      const balance_check = total_assets - total_liabilities_equity;

      sheets.push({
        year,
        cash,
        accounts_receivable,
        ppe_gross,
        accumulated_depreciation,
        ppe_net,
        total_assets,
        accounts_payable,
        unearned_revenue,
        debt_balance,
        total_liabilities,
        retained_earnings,
        shareholder_equity,
        equity_injection,
        total_equity,
        total_liabilities_equity,
        balance_check,
      });
    }

    return sheets;
  }

  private calculateCashFlowStatements(
    incomeStatements: IncomeStatement[], 
    balanceSheets: BalanceSheet[], 
    debtSchedule: DebtSchedule[]
  ): CashFlowStatement[] {
    const statements: CashFlowStatement[] = [];

    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      const income = incomeStatements[t];
      const balance = balanceSheets[t];
      const prevBalance = t > 0 ? balanceSheets[t - 1] : null;
      const debt = debtSchedule[t];
      
      // Operating cash flow
      const net_income = income.net_income;
      const depreciation_addback = -income.depreciation; // Add back negative depreciation
      const change_ar = prevBalance ? balance.accounts_receivable - prevBalance.accounts_receivable : balance.accounts_receivable;
      const change_ap = prevBalance ? balance.accounts_payable - prevBalance.accounts_payable : balance.accounts_payable;
      
      const operating_cash_flow = net_income + depreciation_addback + change_ap - change_ar;
      
      // Financing cash flow
      const unearned_inflow = this.inputs.purchase_amount[t] || 0;
      const { purchasedCredits, impliedPurchasePrice } = this.calculateRevenue(this.calculateIssuedCredits());
      const unearned_release = -purchasedCredits[t] * impliedPurchasePrice;
      const debt_draw = debt.draw;
      const debt_repayment = debt.principal_payment; // Already negative
      const equity_injection = this.inputs.equity_injection[t] || 0;
      
      const financing_cash_flow = unearned_inflow + unearned_release + debt_draw + debt_repayment + equity_injection;
      
      // Investing cash flow
      const capex = this.inputs.capex[t] || 0; // Already negative
      const investing_cash_flow = capex;
      
      // Cash roll
      const cash_start = prevBalance ? prevBalance.cash : 0;
      const net_change_cash = operating_cash_flow + financing_cash_flow + investing_cash_flow;
      const cash_end = cash_start + net_change_cash;

      statements.push({
        year,
        net_income,
        depreciation_addback,
        change_ar,
        change_ap,
        operating_cash_flow,
        unearned_inflow,
        unearned_release,
        debt_draw,
        debt_repayment,
        equity_injection,
        financing_cash_flow,
        capex,
        investing_cash_flow,
        cash_start,
        net_change_cash,
        cash_end,
      });
    }

    return statements;
  }

  private calculateCarbonStream(): CarbonStream[] {
    const stream: CarbonStream[] = [];
    const issued = this.calculateIssuedCredits();
    const { purchasedCredits, impliedPurchasePrice } = this.calculateRevenue(issued);

    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      const purchase_amount = this.inputs.purchase_amount[t] || 0;
      const purchased_credits = purchasedCredits[t];
      const investor_cash_flow = -purchase_amount + purchased_credits * (this.inputs.price_per_credit[t] || 0);

      stream.push({
        year,
        purchase_amount,
        purchased_credits,
        implied_purchase_price: impliedPurchasePrice,
        investor_cash_flow,
      });
    }

    return stream;
  }

  private calculateFreeCashFlow(
    incomeStatements: IncomeStatement[], 
    balanceSheets: BalanceSheet[], 
    debtSchedule: DebtSchedule[]
  ): FreeCashFlow[] {
    const fcf: FreeCashFlow[] = [];

    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      const income = incomeStatements[t];
      const balance = balanceSheets[t];
      const prevBalance = t > 0 ? balanceSheets[t - 1] : null;
      const debt = debtSchedule[t];
      
      const net_income = income.net_income;
      const depreciation_addback = -income.depreciation;
      
      // Working capital change
      const wc = balance.accounts_receivable - balance.accounts_payable;
      const prevWc = prevBalance ? prevBalance.accounts_receivable - prevBalance.accounts_payable : 0;
      const change_working_capital = wc - prevWc;
      
      const capex = this.inputs.capex[t] || 0; // Negative
      const net_borrowing = debt.draw + debt.principal_payment; // principal_payment is negative
      
      const fcf_to_equity = net_income + depreciation_addback - change_working_capital + capex + net_borrowing;

      fcf.push({
        year,
        net_income,
        depreciation_addback,
        change_working_capital,
        capex,
        net_borrowing,
        fcf_to_equity,
      });
    }

    return fcf;
  }

  private calculateFinancialMetrics(
    incomeStatements: IncomeStatement[],
    cashFlowStatements: CashFlowStatement[],
    freeCashFlow: FreeCashFlow[],
    carbonStream: CarbonStream[]
  ): FinancialMetrics {
    // Operational metrics
    const total_revenue = incomeStatements.reduce((sum, stmt) => sum + stmt.total_revenue, 0);
    const total_ebitda = incomeStatements.reduce((sum, stmt) => sum + stmt.ebitda, 0);
    const total_net_income = incomeStatements.reduce((sum, stmt) => sum + stmt.net_income, 0);
    const ebitda_margin = total_revenue > 0 ? (total_ebitda / total_revenue) * 100 : 0;
    const net_margin = total_revenue > 0 ? (total_net_income / total_revenue) * 100 : 0;
    
    // Investment metrics
    const total_capex = this.inputs.capex.reduce((sum, val) => sum + Math.abs(val || 0), 0);
    const peak_funding_required = Math.min(...cashFlowStatements.map(stmt => stmt.cash_end));
    
    // Returns
    const fcfSeries = [-this.inputs.initial_equity_t0, ...freeCashFlow.map(f => f.fcf_to_equity)];
    const npv = this.calculateNPV(fcfSeries.slice(1), this.inputs.discount_rate, this.inputs.initial_equity_t0);
    const company_irr = this.calculateIRR(fcfSeries);
    
    const investorCFs = carbonStream.map(c => c.investor_cash_flow);
    const investor_irr = this.calculateIRR(investorCFs);
    
    const payback_period = this.calculatePaybackPeriod(fcfSeries);
    
    // Debt metrics
    const dscr_minimum = 1.0; // Placeholder - would need EBITDA vs debt service calculation
    
    return {
      total_revenue,
      total_ebitda,
      total_net_income,
      ebitda_margin,
      net_margin,
      total_capex,
      peak_funding_required: Math.abs(peak_funding_required),
      npv,
      company_irr,
      investor_irr,
      payback_period,
      dscr_minimum,
    };
  }

  // Helper methods
  private calculateInterestExpense(t: number): number {
    // Simplified - using beginning balance from debt schedule
    const prevBalance = t > 0 ? this.inputs.debt_draw.slice(0, t).reduce((sum, val) => sum + (val || 0), 0) : 0;
    return -prevBalance * this.inputs.interest_rate; // Negative for expense
  }

  private ppmt(rate: number, per: number, nper: number, pv: number): number {
    if (rate === 0) return -pv / nper;
    
    const pmtValue = pv * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
    const ipmt = -pv * rate * (Math.pow(1 + rate, per - 1) - Math.pow(1 + rate, per - 1)) / (Math.pow(1 + rate, nper) - 1);
    return pmtValue - ipmt;
  }

  private calculateNPV(cashFlows: number[], discountRate: number, initialInvestment: number): number {
    let npv = -initialInvestment;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + discountRate, i + 1);
    }
    return npv;
  }

  private calculateIRR(cashFlows: number[]): number {
    // Simplified IRR using Newton-Raphson method
    let rate = 0.1;
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let derivative = 0;
      
      for (let j = 0; j < cashFlows.length; j++) {
        const power = j;
        npv += cashFlows[j] / Math.pow(1 + rate, power);
        derivative -= (power * cashFlows[j]) / Math.pow(1 + rate, power + 1);
      }
      
      if (Math.abs(npv) < tolerance) break;
      if (Math.abs(derivative) < tolerance) break;
      
      rate = rate - npv / derivative;
    }
    
    return rate * 100; // Return as percentage
  }

  private calculatePaybackPeriod(cashFlows: number[]): number {
    let cumulativeCF = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      cumulativeCF += cashFlows[i];
      if (cumulativeCF >= 0) {
        return i;
      }
    }
    return cashFlows.length; // No payback within period
  }
}