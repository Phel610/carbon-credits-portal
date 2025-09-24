// Financial Calculation Engine for Carbon Credit Projects

export interface ModelInputData {
  operational_metrics: {
    credits_generated: { [year: number]: number };
    price_per_credit: { [year: number]: number };
    credits_issued: { [year: number]: number };
  };
  expenses: {
    cogs_percentage: number;
    feasibility_study_cost: number;
    pdd_development_cost: number;
    initial_mrv_cost: number;
    annual_mrv_cost: number;
    staff_costs: number;
    capex: { [year: number]: number };
    depreciation_method: string;
    depreciation_years: number;
    income_tax_rate: number;
  };
  financing: {
    equity_investments: Array<{
      year: number;
      amount: number;
      investor_type: string;
    }>;
    debt_facilities: Array<{
      name: string;
      principal: number;
      interest_rate: number;
      term_years: number;
      drawdown_year: number;
    }>;
    pre_purchase_agreements: Array<{
      buyer: string;
      credits_quantity: number;
      price_per_credit: number;
      advance_payment: number;
      delivery_year: number;
    }>;
  };
  investor_assumptions: {
    discount_rate: number;
    target_irr: number;
  };
}

export interface IncomeStatement {
  year: number;
  spot_revenue: number;
  pre_purchase_revenue: number;
  total_revenue: number;
  cogs: number;
  gross_profit: number;
  feasibility_costs: number;
  pdd_costs: number;
  mrv_costs: number;
  staff_costs: number;
  total_operating_expenses: number;
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
  total_current_assets: number;
  ppe_gross: number;
  accumulated_depreciation: number;
  ppe_net: number;
  total_assets: number;
  // Liabilities
  accounts_payable: number;
  unearned_revenue: number;
  current_portion_debt: number;
  total_current_liabilities: number;
  long_term_debt: number;
  total_liabilities: number;
  // Equity
  retained_earnings: number;
  shareholder_equity: number;
  total_equity: number;
  total_liabilities_equity: number;
}

export interface CashFlowStatement {
  year: number;
  net_income: number;
  depreciation: number;
  change_accounts_receivable: number;
  change_accounts_payable: number;
  change_unearned_revenue: number;
  operating_cash_flow: number;
  capex: number;
  investing_cash_flow: number;
  equity_injection: number;
  debt_drawdown: number;
  debt_repayment: number;
  financing_cash_flow: number;
  net_change_cash: number;
  cash_beginning: number;
  cash_ending: number;
}

export interface FinancialMetrics {
  total_revenue: number;
  total_costs: number;
  total_ebitda: number;
  total_net_income: number;
  npv: number;
  irr: number;
  payback_period: number;
  ebitda_margin: number;
  net_margin: number;
  total_capex: number;
  peak_funding_required: number;
  dscr_minimum: number;
}

export class FinancialCalculationEngine {
  private inputs: ModelInputData;
  private startYear: number;
  private endYear: number;
  private years: number[];

  constructor(inputs: ModelInputData, startYear: number, endYear: number) {
    this.inputs = inputs;
    this.startYear = startYear;
    this.endYear = endYear;
    this.years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }

  // Main calculation method
  calculateFinancialStatements() {
    const incomeStatements = this.calculateIncomeStatements();
    const balanceSheets = this.calculateBalanceSheets(incomeStatements);
    const cashFlowStatements = this.calculateCashFlowStatements(incomeStatements, balanceSheets);
    const metrics = this.calculateFinancialMetrics(incomeStatements, cashFlowStatements);

    return {
      incomeStatements,
      balanceSheets,
      cashFlowStatements,
      metrics,
    };
  }

  private calculateIncomeStatements(): IncomeStatement[] {
    const statements: IncomeStatement[] = [];

    for (const year of this.years) {
      const credits_generated = this.inputs.operational_metrics.credits_generated[year] || 0;
      const price_per_credit = this.inputs.operational_metrics.price_per_credit[year] || 0;
      
      // Calculate revenue streams
      const spot_revenue = credits_generated * price_per_credit;
      
      // Pre-purchase revenue (delivered credits from previous agreements)
      const pre_purchase_revenue = this.calculatePrePurchaseRevenue(year);
      
      const total_revenue = spot_revenue + pre_purchase_revenue;
      
      // Calculate COGS
      const cogs = total_revenue * (this.inputs.expenses.cogs_percentage / 100);
      const gross_profit = total_revenue - cogs;
      
      // Calculate operating expenses
      const feasibility_costs = year === this.startYear ? this.inputs.expenses.feasibility_study_cost : 0;
      const pdd_costs = year === this.startYear ? this.inputs.expenses.pdd_development_cost : 0;
      const mrv_costs = year === this.startYear 
        ? this.inputs.expenses.initial_mrv_cost + this.inputs.expenses.annual_mrv_cost
        : this.inputs.expenses.annual_mrv_cost;
      
      const staff_costs = this.inputs.expenses.staff_costs;
      const total_operating_expenses = feasibility_costs + pdd_costs + mrv_costs + staff_costs;
      
      const ebitda = gross_profit - total_operating_expenses;
      
      // Calculate depreciation
      const depreciation = this.calculateDepreciation(year);
      
      // Calculate interest expense
      const interest_expense = this.calculateInterestExpense(year);
      
      const earnings_before_tax = ebitda - depreciation - interest_expense;
      const income_tax = Math.max(0, earnings_before_tax * (this.inputs.expenses.income_tax_rate / 100));
      const net_income = earnings_before_tax - income_tax;

      statements.push({
        year,
        spot_revenue,
        pre_purchase_revenue,
        total_revenue,
        cogs,
        gross_profit,
        feasibility_costs,
        pdd_costs,
        mrv_costs,
        staff_costs,
        total_operating_expenses,
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

  private calculateBalanceSheets(incomeStatements: IncomeStatement[]): BalanceSheet[] {
    const statements: BalanceSheet[] = [];
    let cumulativeDepreciation = 0;
    let cumulativeRetainedEarnings = 0;
    let cumulativePPE = 0;

    for (let i = 0; i < this.years.length; i++) {
      const year = this.years[i];
      const income = incomeStatements[i];
      
      // Calculate PPE
      const yearlyCapex = this.inputs.expenses.capex[year] || 0;
      cumulativePPE += yearlyCapex;
      cumulativeDepreciation += income.depreciation;
      
      const ppe_gross = cumulativePPE;
      const accumulated_depreciation = cumulativeDepreciation;
      const ppe_net = ppe_gross - accumulated_depreciation;
      
      // Calculate equity
      cumulativeRetainedEarnings += income.net_income;
      const equity_injections = this.calculateEquityInjections(year);
      const shareholder_equity = equity_injections + cumulativeRetainedEarnings;
      
      // Calculate debt
      const long_term_debt = this.calculateLongTermDebt(year);
      
      // Calculate unearned revenue (pre-purchase advances not yet delivered)
      const unearned_revenue = this.calculateUnearnedRevenue(year);
      
      // Simplified balance sheet (cash as balancing item)
      const total_liabilities = long_term_debt + unearned_revenue;
      const total_equity = shareholder_equity;
      const total_assets = ppe_net + total_liabilities + total_equity; // Simplified
      const cash = total_assets - ppe_net; // Cash as balancing item
      
      statements.push({
        year,
        cash,
        accounts_receivable: 0, // Simplified
        total_current_assets: cash,
        ppe_gross,
        accumulated_depreciation,
        ppe_net,
        total_assets,
        accounts_payable: 0, // Simplified
        unearned_revenue,
        current_portion_debt: 0, // Simplified
        total_current_liabilities: unearned_revenue,
        long_term_debt,
        total_liabilities,
        retained_earnings: cumulativeRetainedEarnings,
        shareholder_equity,
        total_equity,
        total_liabilities_equity: total_liabilities + total_equity,
      });
    }

    return statements;
  }

  private calculateCashFlowStatements(
    incomeStatements: IncomeStatement[], 
    balanceSheets: BalanceSheet[]
  ): CashFlowStatement[] {
    const statements: CashFlowStatement[] = [];

    for (let i = 0; i < this.years.length; i++) {
      const year = this.years[i];
      const income = incomeStatements[i];
      const balance = balanceSheets[i];
      const previousBalance = i > 0 ? balanceSheets[i - 1] : null;
      
      // Operating cash flow
      const net_income = income.net_income;
      const depreciation = income.depreciation;
      const change_accounts_receivable = 0; // Simplified
      const change_accounts_payable = 0; // Simplified
      const change_unearned_revenue = previousBalance 
        ? balance.unearned_revenue - previousBalance.unearned_revenue 
        : balance.unearned_revenue;
      
      const operating_cash_flow = net_income + depreciation + change_unearned_revenue;
      
      // Investing cash flow
      const capex = -(this.inputs.expenses.capex[year] || 0);
      const investing_cash_flow = capex;
      
      // Financing cash flow
      const equity_injection = this.calculateEquityInjections(year);
      const debt_drawdown = this.calculateDebtDrawdown(year);
      const debt_repayment = -this.calculateDebtRepayment(year);
      const financing_cash_flow = equity_injection + debt_drawdown + debt_repayment;
      
      // Net change in cash
      const net_change_cash = operating_cash_flow + investing_cash_flow + financing_cash_flow;
      const cash_beginning = previousBalance?.cash || 0;
      const cash_ending = cash_beginning + net_change_cash;
      
      statements.push({
        year,
        net_income,
        depreciation,
        change_accounts_receivable,
        change_accounts_payable,
        change_unearned_revenue,
        operating_cash_flow,
        capex,
        investing_cash_flow,
        equity_injection,
        debt_drawdown,
        debt_repayment,
        financing_cash_flow,
        net_change_cash,
        cash_beginning,
        cash_ending,
      });
    }

    return statements;
  }

  private calculateFinancialMetrics(
    incomeStatements: IncomeStatement[],
    cashFlowStatements: CashFlowStatement[]
  ): FinancialMetrics {
    const total_revenue = incomeStatements.reduce((sum, stmt) => sum + stmt.total_revenue, 0);
    const total_costs = incomeStatements.reduce((sum, stmt) => sum + stmt.cogs + stmt.total_operating_expenses, 0);
    const total_ebitda = incomeStatements.reduce((sum, stmt) => sum + stmt.ebitda, 0);
    const total_net_income = incomeStatements.reduce((sum, stmt) => sum + stmt.net_income, 0);
    const total_capex = Object.values(this.inputs.expenses.capex).reduce((sum, capex) => sum + capex, 0);
    
    // Calculate NPV
    const discountRate = this.inputs.investor_assumptions.discount_rate / 100;
    const npv = this.calculateNPV(cashFlowStatements, discountRate);
    
    // Calculate IRR (simplified)
    const irr = this.calculateIRR(cashFlowStatements);
    
    // Calculate payback period
    const payback_period = this.calculatePaybackPeriod(cashFlowStatements);
    
    // Calculate margins
    const ebitda_margin = total_revenue > 0 ? (total_ebitda / total_revenue) * 100 : 0;
    const net_margin = total_revenue > 0 ? (total_net_income / total_revenue) * 100 : 0;
    
    // Peak funding required
    const peak_funding_required = Math.min(...cashFlowStatements.map(stmt => stmt.cash_ending));
    
    // DSCR (simplified)
    const dscr_minimum = 1.0; // Placeholder - needs debt service calculation
    
    return {
      total_revenue,
      total_costs,
      total_ebitda,
      total_net_income,
      npv,
      irr,
      payback_period,
      ebitda_margin,
      net_margin,
      total_capex,
      peak_funding_required: Math.abs(peak_funding_required),
      dscr_minimum,
    };
  }

  // Helper methods
  private calculatePrePurchaseRevenue(year: number): number {
    let revenue = 0;
    for (const agreement of this.inputs.financing.pre_purchase_agreements) {
      if (agreement.delivery_year === year) {
        revenue += agreement.credits_quantity * agreement.price_per_credit;
      }
    }
    return revenue;
  }

  private calculateDepreciation(year: number): number {
    if (this.inputs.expenses.depreciation_method !== 'straight_line') {
      return 0; // Only straight line implemented for now
    }
    
    let totalDepreciation = 0;
    const depreciationYears = this.inputs.expenses.depreciation_years;
    
    // Calculate depreciation for each year's CAPEX
    for (const capexYear of this.years) {
      if (capexYear <= year && year < capexYear + depreciationYears) {
        const capex = this.inputs.expenses.capex[capexYear] || 0;
        totalDepreciation += capex / depreciationYears;
      }
    }
    
    return totalDepreciation;
  }

  private calculateInterestExpense(year: number): number {
    let totalInterest = 0;
    
    for (const facility of this.inputs.financing.debt_facilities) {
      if (year >= facility.drawdown_year && year < facility.drawdown_year + facility.term_years) {
        totalInterest += facility.principal * (facility.interest_rate / 100);
      }
    }
    
    return totalInterest;
  }

  private calculateEquityInjections(year: number): number {
    return this.inputs.financing.equity_investments
      .filter(inv => inv.year === year)
      .reduce((sum, inv) => sum + inv.amount, 0);
  }

  private calculateLongTermDebt(year: number): number {
    let totalDebt = 0;
    
    for (const facility of this.inputs.financing.debt_facilities) {
      if (year >= facility.drawdown_year && year < facility.drawdown_year + facility.term_years) {
        // Simplified: assume principal is outstanding for entire term
        totalDebt += facility.principal;
      }
    }
    
    return totalDebt;
  }

  private calculateUnearnedRevenue(year: number): number {
    let unearned = 0;
    
    for (const agreement of this.inputs.financing.pre_purchase_agreements) {
      if (year < agreement.delivery_year) {
        unearned += agreement.advance_payment;
      }
    }
    
    return unearned;
  }

  private calculateDebtDrawdown(year: number): number {
    return this.inputs.financing.debt_facilities
      .filter(facility => facility.drawdown_year === year)
      .reduce((sum, facility) => sum + facility.principal, 0);
  }

  private calculateDebtRepayment(year: number): number {
    // Simplified: assume bullet repayment at end of term
    let repayment = 0;
    
    for (const facility of this.inputs.financing.debt_facilities) {
      if (year === facility.drawdown_year + facility.term_years - 1) {
        repayment += facility.principal;
      }
    }
    
    return repayment;
  }

  private calculateNPV(cashFlows: CashFlowStatement[], discountRate: number): number {
    let npv = 0;
    
    for (let i = 0; i < cashFlows.length; i++) {
      const cashFlow = cashFlows[i].net_change_cash;
      const discountFactor = Math.pow(1 + discountRate, i + 1);
      npv += cashFlow / discountFactor;
    }
    
    return npv;
  }

  private calculateIRR(cashFlows: CashFlowStatement[]): number {
    // Simplified IRR calculation using iterative approximation
    let rate = 0.1; // Start with 10%
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let derivative = 0;
      
      for (let j = 0; j < cashFlows.length; j++) {
        const cashFlow = cashFlows[j].net_change_cash;
        const period = j + 1;
        const discountFactor = Math.pow(1 + rate, period);
        
        npv += cashFlow / discountFactor;
        derivative -= (period * cashFlow) / Math.pow(1 + rate, period + 1);
      }
      
      if (Math.abs(npv) < tolerance) {
        return rate * 100;
      }
      
      rate = rate - npv / derivative;
      
      if (rate < -0.99) rate = -0.99;
      if (rate > 10) rate = 10;
    }
    
    return rate * 100;
  }

  private calculatePaybackPeriod(cashFlows: CashFlowStatement[]): number {
    let cumulativeCashFlow = 0;
    
    for (let i = 0; i < cashFlows.length; i++) {
      cumulativeCashFlow += cashFlows[i].net_change_cash;
      
      if (cumulativeCashFlow >= 0) {
        return i + 1;
      }
    }
    
    return cashFlows.length; // If never positive, return full period
  }
}