// Financial Calculation Engine for Carbon Credit Projects
// Implements exact Excel formulas and logic as specified

import { z } from 'zod';
import { ComprehensiveMetricsCalculator } from './comprehensiveMetrics';

const ENGINE_SCHEMA_VERSION = "1.0.0";

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
  opening_cash_y1: z.number().default(0),
  initial_ppe: z.number().default(0),
});

export type ModelInputData = z.infer<typeof InputSchema>;

export interface IncomeStatement {
  year: number;
  credits_generated: number;
  credits_issued: number;
  price_per_credit: number;
  purchased_credits: number;
  implied_purchase_price: number;
  spot_revenue: number;
  pre_purchase_revenue: number;
  total_revenue: number;
  cogs: number;
  feasibility_costs: number;
  pdd_costs: number;
  mrv_costs: number;
  staff_costs: number;
  opex_total: number;
  ebitda: number;
  depreciation: number;
  interest_expense: number;
  earnings_before_tax: number;
  income_tax: number;
  net_income: number;
}

export interface BalanceSheet {
  year: number;
  cash: number;
  accounts_receivable: number;
  ppe_net: number;
  total_assets: number;
  accounts_payable: number;
  unearned_revenue: number;
  debt_balance: number;
  total_liabilities: number;
  retained_earnings: number;
  contributed_capital: number;
  total_equity: number;
  total_liabilities_equity: number;
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
  interest_rate?: number;
  debt_duration?: number;
}

export interface CarbonStream {
  year: number;
  purchase_amount: number;
  purchased_credits: number;
  implied_purchase_price: number;
  investor_cash_flow: number;
  purchase_share: number;
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
  // Revenue and profitability  
  total_revenue: number;
  total_ebitda: number;
  total_net_income: number;
  ebitda_margin: number;
  net_margin: number;
  
  // Investment metrics
  total_capex: number;
  total_development_costs_abs: number;
  total_costs: number;
  peak_funding_required: number;
  
  // Balance sheet
  total_equity: number;
  total_debt: number;
  ending_cash: number;
  prepurchase_advances: number;
  
  // Returns
  irr_equity: number | null;
  npv_equity: number;
  payback_period: number;
  
  // Risk metrics
  min_dscr: number;
  dscr_minimum: number;
  
  // Legacy naming compatibility
  irr: number | null;
  npv: number;
  discount_rate: number;
}

export class FinancialCalculationEngine {
  private inputs: ModelInputData;
  private years: number[];
  
  // Statement results - made public for comprehensive metrics access
  public incomeStatements: IncomeStatement[] = [];
  public balanceSheets: BalanceSheet[] = [];
  public cashFlows: CashFlowStatement[] = [];
  public debtSchedule: DebtSchedule[] = [];
  public carbonStream: CarbonStream[] = [];
  public freeCashFlow: FreeCashFlow[] = [];
  
  // Precomputed values for consistency
  private issuedCredits: number[];
  private purchasedCreditsDelivered: number[];
  private impliedPurchasePrice: number;
  private spotRevenue: number[];
  private prepRevenue: number[];

  constructor(inputs: ModelInputData) {
    console.log('=== FINANCIAL CALCULATION ENGINE DEBUG START ===');
    console.log('Raw inputs received:', JSON.stringify(inputs, null, 2));
    
    try {
      console.log('VALIDATION STEP 1: Parse inputs with Zod schema');
      // Validate inputs
      this.inputs = InputSchema.parse(inputs);
      console.log('Zod validation passed');
      
      console.log('VALIDATION STEP 2: Custom input validation');
      this.validateInputs();
      console.log('Custom validation passed');
      
      console.log('VALIDATION STEP 3: Array length validation');
      this.validateArrayLengths();
      console.log('Array length validation passed');
      
      console.log('VALIDATION STEP 4: Opening balance validation');
      this.validateOpeningBalance();
      console.log('Opening balance validation passed');
      
      this.years = inputs.years;
      console.log('Years set:', this.years);
      
      console.log('PRECOMPUTATION STEP 1: Calculate issued credits');
      // Precompute values once for consistency (Fix 9)
      this.issuedCredits = this.calculateIssuedCredits();
      console.log('Issued credits calculated:', this.issuedCredits);
      
      console.log('PRECOMPUTATION STEP 2: Calculate revenue data');
      const revenueData = this.calculateRevenue(this.issuedCredits);
      this.purchasedCreditsDelivered = revenueData.purchasedCreditsDelivered;
      this.impliedPurchasePrice = revenueData.impliedPurchasePrice;
      this.spotRevenue = revenueData.spotRev;
      this.prepRevenue = revenueData.prepRev;
      console.log('Revenue data calculated:', revenueData);
      
      console.log('=== FINANCIAL CALCULATION ENGINE CONSTRUCTOR SUCCESS ===');
    } catch (error) {
      console.error('=== FINANCIAL CALCULATION ENGINE CONSTRUCTOR ERROR ===');
      console.error('Error in constructor:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private validateInputs() {
    // Validate known input keys only
    const allowedKeys = new Set([
      'years', 'cogs_rate', 'income_tax_rate', 'ar_rate', 'ap_rate', 'interest_rate', 
      'debt_duration_years', 'purchase_share', 'discount_rate', 'initial_equity_t0', 
      'opening_cash_y1', 'credits_generated', 'price_per_credit', 'issuance_flag', 
      'feasibility_costs', 'pdd_costs', 'mrv_costs', 'staff_costs', 'depreciation', 
      'capex', 'equity_injection', 'debt_draw', 'purchase_amount', 'initial_ppe'
    ]);
    
    for (const key of Object.keys(this.inputs)) {
      if (!allowedKeys.has(key)) {
        throw new Error(`Unrecognized input key: ${key}.`);
      }
    }

    // Validate rates are in [0, 1] range
    const rates = ['cogs_rate', 'income_tax_rate', 'ar_rate', 'ap_rate', 'interest_rate'] as const;
    for (const rateKey of rates) {
      const rate = this.inputs[rateKey];
      if (rate < 0 || rate > 1) {
        throw new Error('Rate must be between 0 and 1.');
      }
    }

    // Validate purchase_share is in [0, 1] range
    if (this.inputs.purchase_share < 0 || this.inputs.purchase_share > 1) {
      throw new Error('Rate must be between 0 and 1.');
    }

    // Validate debt duration is positive integer
    if (this.inputs.debt_duration_years <= 0 || !Number.isInteger(this.inputs.debt_duration_years)) {
      throw new Error('Debt duration must be a positive integer.');
    }

    // Validate issuance flags are 0 or 1
    for (let i = 0; i < this.inputs.issuance_flag.length; i++) {
      const flag = this.inputs.issuance_flag[i];
      if (flag !== 0 && flag !== 1) {
        throw new Error('Issuance flag must be 0 or 1.');
      }
    }

    // Validate expense lines are negative
    const expenseArrays = ['feasibility_costs', 'pdd_costs', 'mrv_costs', 'staff_costs', 'depreciation', 'capex'] as const;
    for (const expenseKey of expenseArrays) {
      const expenses = this.inputs[expenseKey];
      for (let i = 0; i < expenses.length; i++) {
        if ((expenses[i] || 0) > 0) {
          throw new Error('This line must be negative per model convention.');
        }
      }
    }

    // Enforce single purchase year only
    const purchaseYears = this.inputs.purchase_amount.filter(amount => (amount || 0) > 0);
    if (purchaseYears.length > 1) {
      throw new Error('Only one year can have a purchase amount greater than 0. Excel logic uses only the first purchase year.');
    }

    // Block inconsistent pre-purchase inputs
    const hasPurchaseAmount = this.inputs.purchase_amount.some(amount => (amount || 0) > 0);
    if (this.inputs.purchase_share === 0 && hasPurchaseAmount) {
      throw new Error('purchase_share is 0 but purchase_amount provided; set share > 0 or zero out purchase_amount.');
    }
  }

  private validateArrayLengths() {
    const arrays = [
      "credits_generated","price_per_credit","issuance_flag",
      "feasibility_costs","pdd_costs","mrv_costs","staff_costs",
      "depreciation","capex","equity_injection","debt_draw","purchase_amount"
    ] as const;

    const L = this.inputs.years.length;
    for (const k of arrays) {
      if (!Array.isArray(this.inputs[k]) || this.inputs[k].length !== L) {
        throw new Error(`Length of ${k} must equal years.length (${L}).`);
      }
    }

    // Enforce single debt draw with current PPMT model
    const debtDrawYears = this.inputs.debt_draw.filter((draw, index) => (draw || 0) > 0);
    if (debtDrawYears.length > 1) {
      throw new Error('Only one debt draw year is supported with the current single-facility PPMT model.');
    }
  }

  private validateOpeningBalance() {
    // Calculate required opening cash to balance t₀
    const initial_liabilities = 0; // typically 0 at start
    const initial_ar = 0; // typically 0 at start
    const initial_ap = 0; // typically 0 at start
    const initial_ppe = this.inputs.initial_ppe || 0;
    
    const required_opening_cash = 
      this.inputs.initial_equity_t0 + 
      initial_liabilities - 
      initial_ppe - 
      initial_ar + 
      initial_ap;
    
    const cash_gap = this.inputs.opening_cash_y1 - required_opening_cash;
    
    if (Math.abs(cash_gap) > 1) { // Allow for rounding
      console.warn(`⚠️ Opening Balance Misalignment Detected:
        Initial Equity (t₀): ${this.inputs.initial_equity_t0?.toLocaleString()}
        Initial PPE (t₀): ${initial_ppe?.toLocaleString()}
        Required Opening Cash: ${required_opening_cash?.toLocaleString()}
        Actual Opening Cash: ${this.inputs.opening_cash_y1?.toLocaleString()}
        Gap: ${cash_gap?.toLocaleString()}
        
        This gap will propagate through all years as a Balance Check error.
        Consider setting opening_cash_y1 = ${required_opening_cash}`);
    }
  }

  calculateFinancialStatements() {
    console.log('=== CALCULATE FINANCIAL STATEMENTS DEBUG START ===');
    
    try {
      console.log('CALC STEP 1: Calculate debt schedule');
      // Calculate in order of dependencies
      const debtSchedule = this.calculateDebtSchedule();
      console.log('Debt schedule calculated:', debtSchedule);
      
      console.log('CALC STEP 2: Calculate income statements');
      const incomeStatements = this.calculateIncomeStatements(debtSchedule);
      console.log('Income statements calculated:', incomeStatements);
      
      console.log('CALC STEP 3: Update DSCR in debt schedule');
      // Update DSCR in debt schedule after income statements are calculated (Fix 7)
      this.updateDSCR(debtSchedule, incomeStatements);
      console.log('DSCR updated');
      
      console.log('CALC STEP 4: Calculate balance sheets');
      const balanceSheets = this.calculateBalanceSheets(incomeStatements, debtSchedule);
      console.log('Balance sheets calculated:', balanceSheets);
      
      console.log('CALC STEP 5: Calculate cash flow statements');
      const cashFlowStatements = this.calculateCashFlowStatements(incomeStatements, balanceSheets, debtSchedule);
      console.log('Cash flow statements calculated:', cashFlowStatements);
      
      console.log('CALC STEP 6: Calculate carbon stream');
      const carbonStream = this.calculateCarbonStream();
      console.log('Carbon stream calculated:', carbonStream);
      
      console.log('CALC STEP 7: Calculate free cash flow');
      const freeCashFlow = this.calculateFreeCashFlow(incomeStatements, balanceSheets, debtSchedule);
      console.log('Free cash flow calculated:', freeCashFlow);
      
      console.log('CALC STEP 8: Set instance variables');
      // Set instance variables before calculating metrics so comprehensive metrics can access them
      this.incomeStatements = incomeStatements;
      this.balanceSheets = balanceSheets;
      this.cashFlows = cashFlowStatements;
      this.debtSchedule = debtSchedule;
      this.carbonStream = carbonStream;
      this.freeCashFlow = freeCashFlow;
      
      console.log('CALC STEP 9: Calculate financial metrics');
      const calculatedMetrics = this.calculateFinancialMetrics();
      console.log('Financial metrics calculated:', calculatedMetrics);
      
      console.log('=== CALCULATE FINANCIAL STATEMENTS SUCCESS ===');
      
      return {
        schema_version: ENGINE_SCHEMA_VERSION,
        inputs: this.inputs,
        incomeStatements: this.incomeStatements,
        balanceSheets: this.balanceSheets,
        cashFlowStatements: this.cashFlows,
        debtSchedule: this.debtSchedule,
        carbonStream: this.carbonStream,
        freeCashFlow: this.freeCashFlow,
        metrics: calculatedMetrics,
      };
      
    } catch (error) {
      console.error('=== CALCULATE FINANCIAL STATEMENTS ERROR ===');
      console.error('Error in calculation step:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private calculateIncomeStatements(debtSchedule: DebtSchedule[]): IncomeStatement[] {
    const statements: IncomeStatement[] = [];

    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      
      const credits_generated = this.inputs.credits_generated[t] || 0;
      const credits_issued = this.issuedCredits[t];
      
      const spot_revenue = this.spotRevenue[t];
      const pre_purchase_revenue = this.prepRevenue[t];
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
      // CRITICAL FIX: Interest expense should be POSITIVE on Income Statement (it's an expense)
      const interest_expense = debtSchedule[t].interest_expense;
      
      const earnings_before_tax = ebitda - Math.abs(depreciation) - Math.abs(interest_expense);
      const income_tax = Math.max(0, earnings_before_tax * this.inputs.income_tax_rate);
      const net_income = earnings_before_tax - income_tax;

      statements.push({
        year,
        credits_generated,
        credits_issued,
        price_per_credit: this.inputs.price_per_credit[t] || 0,
        purchased_credits: this.purchasedCreditsDelivered[t],
        implied_purchase_price: this.impliedPurchasePrice,
        spot_revenue,
        pre_purchase_revenue,
        total_revenue,
        cogs,
        feasibility_costs,
        pdd_costs,
        mrv_costs,
        staff_costs,
        opex_total: total_opex,
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
      const remainingInventory = cumGenerated - cumIssuedPrev;
      const issuanceFlag = this.inputs.issuance_flag[t] || 0;
      
      let issuedAmount = remainingInventory * issuanceFlag;
      
      // Fix 10: Credits issued clamping
      issued[t] = Math.max(0, Math.min(issuedAmount, remainingInventory));
    }
    
    return issued;
  }

  private calculateRevenue(issued: number[]) {
    // 1) Identify first purchase year and total cash paid that year
    const firstIdx = this.inputs.purchase_amount.findIndex(a => (a || 0) > 0);
    const hasAnyPurchase = firstIdx >= 0;
    const firstPurchaseCash = hasAnyPurchase ? (this.inputs.purchase_amount[firstIdx] || 0) : 0;

    // 2) If no purchase, everything is spot
    if (!hasAnyPurchase || firstPurchaseCash <= 0 || (this.inputs.purchase_share || 0) <= 0) {
      const spotRev = issued.map((q, t) => q * (this.inputs.price_per_credit[t] || 0));
      const prepRev = issued.map(() => 0);
      return {
        spotRev,
        prepRev,
        purchasedCreditsDelivered: issued.map(() => 0),
        impliedPurchasePrice: 0
      };
    }

    // 3) Tentative purchased credits by share across the whole horizon
    const byShare = issued.map(q => q * this.inputs.purchase_share);

    // 4) Implied purchase price from the FIRST purchase year
    //    Note: denominator is total purchased credits by share across the horizon.
    const totalPurchasedByShare = byShare.reduce((s, v) => s + v, 0);
    const impliedPurchasePrice =
      totalPurchasedByShare > 0 ? firstPurchaseCash / totalPurchasedByShare : 0;

    // 5) Constrain deliveries to remaining purchased credits (carry-forward)
    let remaining = totalPurchasedByShare;
    const purchasedCreditsDelivered = byShare.map(qShare => {
      const deliver = Math.min(Math.max(qShare, 0), Math.max(remaining, 0));
      remaining -= deliver;
      return deliver;
    });

    // 6) Revenue split
    const spotRev = issued.map((q, t) =>
      (q - purchasedCreditsDelivered[t]) * (this.inputs.price_per_credit[t] || 0)
    );
    const prepRev = purchasedCreditsDelivered.map(q => q * impliedPurchasePrice);

    return { spotRev, prepRev, purchasedCreditsDelivered, impliedPurchasePrice };
  }

  private calculateDebtSchedule(): DebtSchedule[] {
    const schedule: DebtSchedule[] = [];
    
    console.log('=== DEBT SCHEDULE DEBUG ===');
    console.log('First debt draw:', this.inputs.debt_draw[0]);
    console.log('Interest rate:', this.inputs.interest_rate);
    console.log('Debt duration:', this.inputs.debt_duration_years);
    
    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      const begBalance = t === 0 ? 0 : schedule[t - 1].ending_balance;
      const draw = this.inputs.debt_draw[t] || 0;
      
      // Calculate principal payments using constant payment method
      const firstDraw = this.inputs.debt_draw[0] || 0;
      let principal_payment = 0;
      
      // Find which period we're in relative to the debt start
      const debtDrawYear = this.inputs.debt_draw.findIndex(draw => (draw || 0) > 0);
      const periodsSinceDrawStart = t - debtDrawYear;
      
      // Only calculate principal if: 1) there was debt drawn, 2) we're past draw year, 3) within loan term, 4) debt balance exists
      if (firstDraw > 0 && periodsSinceDrawStart > 0 && periodsSinceDrawStart <= this.inputs.debt_duration_years && begBalance > 0) {
        const constantPayment = this.calculateConstantPayment(firstDraw);
        const interest_expense = begBalance * this.inputs.interest_rate;
        principal_payment = -(constantPayment - interest_expense); // Negative because it's a payment
        
        // Ensure we don't pay more than the outstanding balance
        principal_payment = Math.max(principal_payment, -begBalance);
      }
      
      const ending_balance = Math.max(0, begBalance + draw + principal_payment); // Ensure debt doesn't go negative
      
      // Interest from beginning balance only
      const interest_expense = begBalance * this.inputs.interest_rate;
      
      console.log(`Year ${year}: Beg=${begBalance.toFixed(0)}, Draw=${draw.toFixed(0)}, Principal=${principal_payment.toFixed(0)}, End=${ending_balance.toFixed(0)}, Interest=${interest_expense.toFixed(0)}`);
      
      // DSCR placeholder - will be updated after income statements
      const dscr = 0;

      schedule.push({
        year,
        beginning_balance: begBalance,
        draw,
        principal_payment,
        ending_balance,
        interest_expense,
        dscr,
        interest_rate: this.inputs.interest_rate,
        debt_duration: this.inputs.debt_duration_years,
      });
    }
    
    return schedule;
  }
  
  private updateDSCR(debtSchedule: DebtSchedule[], incomeStatements: IncomeStatement[]): void {
    for (let t = 0; t < this.years.length; t++) {
      const ebitda = incomeStatements[t].ebitda;
      const principalAbs = Math.abs(debtSchedule[t].principal_payment);
      const interestPos = debtSchedule[t].interest_expense;
      const debtService = principalAbs + interestPos;
      
      debtSchedule[t].dscr = debtService > 0 ? ebitda / debtService : 0;
    }
  }

  private calculateBalanceSheets(incomeStatements: IncomeStatement[], debtSchedule: DebtSchedule[]): BalanceSheet[] {
    const sheets: BalanceSheet[] = [];
    let cumulativeRetainedEarnings = 0;
    let cumulativeUnearned = 0;
    let cumulativeContributedCapital = this.inputs.initial_equity_t0 || 0;

    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      const income = incomeStatements[t];
      
      // PPE roll exactly as Excel
      const capex = this.inputs.capex[t] || 0; // negative
      const depreciation = this.inputs.depreciation[t] || 0; // negative
      const prevPPE = t === 0 ? (this.inputs.initial_ppe || 0) : sheets[t - 1].ppe_net;
      const ppe_net = prevPPE - capex + depreciation; // capex and depreciation are negative
      
      // Working capital - store as positive balances
      const accounts_receivable = income.total_revenue * this.inputs.ar_rate;
      
      // AP based on total OPEX, stored as positive balance
      const total_opex = Math.abs(income.opex_total); // Make positive for AP calculation
      const accounts_payable = this.inputs.ap_rate * total_opex;
      
      // Unearned revenue balance - stored as positive
      const purchaseInflow = this.inputs.purchase_amount[t] || 0;
      const unearnedRelease = -this.purchasedCreditsDelivered[t] * this.impliedPurchasePrice;
      cumulativeUnearned += purchaseInflow + unearnedRelease;
      const unearned_revenue = Math.max(0, cumulativeUnearned);
      
      // Debt - store ending balance as positive (debt is liability)
      const debt_balance = Math.max(0, debtSchedule[t].ending_balance);
      
      // Equity - fix the equity formula
      cumulativeRetainedEarnings += income.net_income;
      const retained_earnings = cumulativeRetainedEarnings;
      
      // Add equity injection to contributed capital
      const equity_injection = this.inputs.equity_injection[t] || 0;
      cumulativeContributedCapital += equity_injection;
      const contributed_capital = cumulativeContributedCapital;
      
      const total_equity = retained_earnings + contributed_capital;
      
      // Assets and liabilities
      const total_liabilities = accounts_payable + unearned_revenue + debt_balance;
      
      // Cash balances the balance sheet - get from cash flow calculation
      const cash = t === 0 
        ? this.inputs.opening_cash_y1 
        : sheets[t - 1].cash; // Will be updated by cash flow later
      
      const total_assets = cash + accounts_receivable + ppe_net;
      const total_liabilities_equity = total_liabilities + total_equity;
      const balance_check = total_assets - total_liabilities_equity;

      sheets.push({
        year,
        cash,
        accounts_receivable,
        ppe_net,
        total_assets,
        accounts_payable,
        unearned_revenue,
        debt_balance,
        total_liabilities,
        retained_earnings,
        contributed_capital,
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

    console.log('=== CASH FLOW DEBUG ===');

    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      const income = incomeStatements[t];
      const balance = balanceSheets[t];
      const prevBalance = t > 0 ? balanceSheets[t - 1] : null;
      const debt = debtSchedule[t];
      
      // Operating cash flow - working capital changes including unearned revenue
      const net_income = income.net_income;
      const depreciation_addback = -income.depreciation; // Add back negative depreciation
      const change_ar = prevBalance ? balance.accounts_receivable - prevBalance.accounts_receivable : balance.accounts_receivable;
      const change_ap = prevBalance ? balance.accounts_payable - prevBalance.accounts_payable : balance.accounts_payable;
      const change_unearned = prevBalance ? balance.unearned_revenue - prevBalance.unearned_revenue : balance.unearned_revenue;
      const interest_addback = income.interest_expense; // Add back since cash interest is in Financing CF
      
      const operating_cash_flow = net_income + depreciation_addback + change_ap - change_ar + change_unearned + interest_addback;
      
      // Financing cash flow - build correctly with all components
      const debt_draw = debt.draw; // Cash inflow (positive)
      const debt_repayment = debt.principal_payment; // Already negative (cash outflow)  
      
      // CRITICAL FIX: Use exact same interest as debt schedule/income statement
      // Interest payment = negative of debt schedule interest_expense (cash outflow)
      const interest_payment = -debt.interest_expense; // Will be 0 when beg balance = 0
      
      const equity_injection = this.inputs.equity_injection[t] || 0; // Cash inflow (positive)
      
      // Unearned revenue flows (financing activities)
      const unearned_inflow = 0; // Pre-purchase treated as operating activity via change_unearned
      const unearned_release = 0; // No cash impact - just revenue recognition
      
      // Investing cash flow
      const capex = this.inputs.capex[t] || 0; // Already negative
      const investing_cash_flow = capex;
      
      // CRITICAL FIX: Ensure principal payment is negative (cash outflow)
      let corrected_principal = debt_repayment;
      if (corrected_principal > 0) {
        corrected_principal = -corrected_principal;
        console.log(`⚠️  Fixed principal payment sign: ${debt_repayment} → ${corrected_principal}`);
      }
      
      // Rebuild financing CF with corrected principal
      const corrected_financing_cf = debt_draw + corrected_principal + interest_payment + equity_injection + unearned_inflow + unearned_release;
      
      // Cash roll - CRITICAL FIX: Use previous cash_end for chain integrity  
      const cash_start = t === 0 ? (this.inputs.opening_cash_y1 || 0) : statements[t-1]?.cash_end || 0;
      const net_change_cash = operating_cash_flow + corrected_financing_cf + investing_cash_flow;
      const cash_end = cash_start + net_change_cash;

      // Update balance sheet with calculated cash and recalculate totals
      balanceSheets[t].cash = cash_end;
      balanceSheets[t].total_assets = cash_end + balanceSheets[t].accounts_receivable + balanceSheets[t].ppe_net;
      balanceSheets[t].total_liabilities_equity = balanceSheets[t].total_liabilities + balanceSheets[t].total_equity;
      balanceSheets[t].balance_check = balanceSheets[t].total_assets - balanceSheets[t].total_liabilities_equity;
      
      // USER'S EXACT DIAGNOSTIC FORMAT - this will show us the exact mismatch
      const cash_plug = balanceSheets[t].total_liabilities_equity - (balanceSheets[t].accounts_receivable + balanceSheets[t].ppe_net);
      const cash_gap = balanceSheets[t].cash - cash_plug;

      console.log(`Y${t+1}`, {
        begDebt: debt.beginning_balance?.toFixed(0),
        draw: debt.draw?.toFixed(0),
        princ: corrected_principal?.toFixed(0),
        intIS: income.interest_expense?.toFixed(0),
        intCF: (-debt.interest_expense)?.toFixed(0),
        ocf: operating_cash_flow?.toFixed(0),
        icf: investing_cash_flow?.toFixed(0),
        fcf: corrected_financing_cf?.toFixed(0),
        cash_gap: cash_gap.toFixed(0),
        balance_check: balanceSheets[t].balance_check.toFixed(0),
      });
      
      // Validation: Ensure balance sheet balances within $0.01
      if (Math.abs(balanceSheets[t].balance_check) > 0.01) {
        console.error(`⚠️  Balance sheet does not balance in year ${year}: ${balanceSheets[t].balance_check.toFixed(2)}`);
        console.error(`   Assets: ${balanceSheets[t].total_assets.toFixed(2)}, Liab+Equity: ${balanceSheets[t].total_liabilities_equity.toFixed(2)}`);
      } else {
        console.log(`✅ Balance sheet balances in year ${year}`);
      }

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
        debt_repayment: corrected_principal,
        equity_injection,
        financing_cash_flow: corrected_financing_cf,
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

    for (let t = 0; t < this.years.length; t++) {
      const year = this.years[t];
      const purchase_amount = this.inputs.purchase_amount[t] || 0;
      const purchased_credits = this.purchasedCreditsDelivered[t];
      const investor_cash_flow = -purchase_amount + purchased_credits * (this.inputs.price_per_credit[t] || 0);

      stream.push({
        year,
        purchase_amount,
        purchased_credits,
        implied_purchase_price: this.impliedPurchasePrice, // Fix 8: Single scalar
        investor_cash_flow,
        purchase_share: this.inputs.purchase_share,
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
      
      // Fix 7: FCF to equity uses net borrowing only (no equity or unearned in FCF)
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

  calculateFinancialMetrics(): FinancialMetrics {
    console.log('=== Starting Financial Metrics Calculation ===');
    
    // Calculate total metrics across the horizon
    const totalRevenue = this.incomeStatements.reduce((sum, is) => sum + is.total_revenue, 0);
    const totalEbitda = this.incomeStatements.reduce((sum, is) => sum + is.ebitda, 0);
    const totalNetIncome = this.incomeStatements.reduce((sum, is) => sum + is.net_income, 0);
    const totalCapex = this.inputs.capex.reduce((sum, capex) => sum + Math.abs(capex), 0);
    
    // Development costs (absolute values since they're typically stored as negative)
    const totalDevelopmentCosts = this.inputs.feasibility_costs.reduce((sum, cost) => sum + Math.abs(cost), 0) +
                                  this.inputs.pdd_costs.reduce((sum, cost) => sum + Math.abs(cost), 0) +
                                  this.inputs.mrv_costs.reduce((sum, cost) => sum + Math.abs(cost), 0) +
                                  this.inputs.staff_costs.reduce((sum, cost) => sum + Math.abs(cost), 0);
    
    // Calculate margins based on total revenue
    const ebitdaMargin = totalRevenue > 0 ? (totalEbitda / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;
    
    // Balance sheet totals (final year)
    const finalBS = this.balanceSheets[this.balanceSheets.length - 1];
    const totalEquity = finalBS.total_equity;
    const totalDebt = finalBS.debt_balance;
    const endingCash = finalBS.cash;
    const prepurchaseAdvances = finalBS.unearned_revenue;
    
    // Calculate IRR and NPV using FCF to Equity
    const equityCashFlows = this.freeCashFlow.map(fcf => fcf.fcf_to_equity);
    const irrEquity = this.calculateIRR(equityCashFlows);
    const npvEquity = this.calculateNPV(equityCashFlows, this.inputs.discount_rate, 0);
    const paybackPeriod = this.calculatePaybackPeriod(equityCashFlows);
    
    // Calculate minimum DSCR
    const validDSCRs = this.debtSchedule
      .map(ds => ds.dscr)
      .filter(dscr => dscr > 0 && isFinite(dscr));
    const minDscr = validDSCRs.length > 0 ? Math.min(...validDSCRs) : 0;
    
    // Peak funding calculation
    let cumulativeCash = this.inputs.opening_cash_y1;
    let minCash = cumulativeCash;
    
    this.cashFlows.forEach(cf => {
      cumulativeCash += cf.net_change_cash;
      minCash = Math.min(minCash, cumulativeCash);
    });
    
    const peakFundingRequired = Math.max(0, -minCash);
    
    // Total costs (CAPEX + Development Costs)
    const totalCosts = totalCapex + totalDevelopmentCosts;
    
    // Calculate comprehensive metrics
    let comprehensiveMetrics = null;
    try {
      const comprehensiveCalculator = new ComprehensiveMetricsCalculator(
        this.incomeStatements,
        this.balanceSheets,
        this.cashFlows,
        this.debtSchedule,
        this.carbonStream,
        this.freeCashFlow,
        this.inputs
      );
      
      comprehensiveMetrics = comprehensiveCalculator.calculate();
      console.log('Comprehensive metrics calculated successfully');
    } catch (error) {
      console.error('Failed to calculate comprehensive metrics:', error);
      // Continue with legacy metrics only
    }
    
    const metrics: FinancialMetrics = {
      // Revenue and profitability
      total_revenue: totalRevenue,
      total_ebitda: totalEbitda,
      total_net_income: totalNetIncome,
      ebitda_margin: ebitdaMargin,
      net_margin: netMargin,
      
      // Investment metrics
      total_capex: totalCapex,
      total_development_costs_abs: totalDevelopmentCosts,
      total_costs: totalCosts,
      peak_funding_required: peakFundingRequired,
      
      // Balance sheet
      total_equity: totalEquity,
      total_debt: totalDebt,
      ending_cash: endingCash,
      prepurchase_advances: prepurchaseAdvances,
      
      // Returns
      irr_equity: irrEquity || 0,
      npv_equity: npvEquity,
      payback_period: paybackPeriod,
      
      // Risk metrics
      min_dscr: minDscr,
      dscr_minimum: minDscr,
      
      // Additional calculated metrics
      irr: irrEquity || 0, // Keep legacy naming for compatibility
      npv: npvEquity, // Keep legacy naming for compatibility
      discount_rate: this.inputs.discount_rate * 100, // Store as percentage for display
    };
    
    // Store comprehensive metrics if available
    if (comprehensiveMetrics) {
      (metrics as any).comprehensive = comprehensiveMetrics;
    }
    
    console.log('Calculated Financial Metrics:', metrics);
    return metrics;
  }

  // Helper methods
  // Fix 1: Deleted old calculateInterestExpense helper - using debt schedule only

  private calculateConstantPayment(pv: number): number {
    // Calculate the constant payment amount (PMT) for the entire loan term
    const rate = this.inputs.interest_rate;
    const nper = this.inputs.debt_duration_years;
    
    if (rate === 0) {
      return pv / nper; // Simple division if no interest
    }
    
    const factor = Math.pow(1 + rate, nper);
    return (pv * rate * factor) / (factor - 1);
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
    
    // Handle edge cases where IRR cannot be calculated
    if (isNaN(rate) || !isFinite(rate)) {
      return null;
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