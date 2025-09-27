import { FinancialCalculationEngine } from '../calculationEngine';

describe('FinancialCalculationEngine', () => {
  describe('ChatGPT 3-Year Acceptance Test', () => {
    const testInputs = {
      years: [2025, 2026, 2027],
      credits_generated: [1000, 0, 0],          // Row 5
      price_per_credit: [10, 10, 10],           // Row 6
      issuance_flag: [0, 1, 0],                 // Row 8 (strict 0/1)

      cogs_rate: 0.10,                          // C21
      income_tax_rate: 0.20,                    // C37
      ar_rate: 0.05,                            // C45
      ap_rate: 0.10,                            // C54

      feasibility_costs: [-5000, 0, 0],         // Row 25 (neg)
      pdd_costs: [-2000, 0, 0],                 // Row 26 (neg)
      mrv_costs: [0, -1000, 0],                 // Row 27 (neg)
      staff_costs: [-10000, -10000, -10000],    // Row 28 (neg)
      depreciation: [-3000, -3000, -3000],      // Row 33 (neg)
      capex: [-20000, 0, 0],                    // Row 90 (neg)

      interest_rate: 0.10,                      // C109
      debt_duration_years: 2,                   // C110
      debt_draw: [10000, 0, 0],                 // Row 113
      equity_injection: [0, 0, 0],              // Row 106
      initial_equity_t0: 5000,
      opening_cash_y1: 0,                       // G93

      purchase_amount: [0, 2000, 0],            // Row 123
      purchase_share: 0.20,                     // C124

      discount_rate: 0.12                       // C149
    };

    let results: any;

    beforeAll(() => {
      const engine = new FinancialCalculationEngine(testInputs);
      results = engine.calculateFinancialStatements();
    });

    it('should calculate credits issued correctly', () => {
      const creditsIssued = results.incomeStatements.map((stmt: any) => stmt.credits_issued);
      expect(creditsIssued[0]).toBeCloseTo(0.00, 2);
      expect(creditsIssued[1]).toBeCloseTo(1000.00, 2);
      expect(creditsIssued[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate purchased credits correctly', () => {
      const purchasedCredits = results.carbonStream.map((stmt: any) => stmt.purchased_credits);
      expect(purchasedCredits[0]).toBeCloseTo(0.00, 2);
      expect(purchasedCredits[1]).toBeCloseTo(200.00, 2);
      expect(purchasedCredits[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate implied purchase price correctly', () => {
      const impliedPurchasePrice = results.carbonStream[0].implied_purchase_price;
      expect(impliedPurchasePrice).toBeCloseTo(10.00, 2);
    });

    it('should calculate revenue streams correctly', () => {
      const spotRevenue = results.incomeStatements.map((stmt: any) => stmt.spot_revenue);
      const prepRevenue = results.incomeStatements.map((stmt: any) => stmt.pre_purchase_revenue);
      const totalRevenue = results.incomeStatements.map((stmt: any) => stmt.total_revenue);

      // Spot revenue
      expect(spotRevenue[0]).toBeCloseTo(0.00, 2);
      expect(spotRevenue[1]).toBeCloseTo(8000.00, 2);
      expect(spotRevenue[2]).toBeCloseTo(0.00, 2);

      // Pre-purchase revenue
      expect(prepRevenue[0]).toBeCloseTo(0.00, 2);
      expect(prepRevenue[1]).toBeCloseTo(2000.00, 2);
      expect(prepRevenue[2]).toBeCloseTo(0.00, 2);

      // Total revenue
      expect(totalRevenue[0]).toBeCloseTo(0.00, 2);
      expect(totalRevenue[1]).toBeCloseTo(10000.00, 2);
      expect(totalRevenue[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate COGS correctly as % of total revenue', () => {
      const cogs = results.incomeStatements.map((stmt: any) => stmt.cogs);
      expect(cogs[0]).toBeCloseTo(0.00, 2);
      expect(cogs[1]).toBeCloseTo(1000.00, 2); // 10% of 10,000
      expect(cogs[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate gross profit correctly', () => {
      const grossProfit = results.incomeStatements.map((stmt: any) => stmt.gross_profit);
      expect(grossProfit[0]).toBeCloseTo(0.00, 2);
      expect(grossProfit[1]).toBeCloseTo(9000.00, 2);
      expect(grossProfit[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate EBITDA correctly', () => {
      const ebitda = results.incomeStatements.map((stmt: any) => stmt.ebitda);
      expect(ebitda[0]).toBeCloseTo(-17000.00, 2);
      expect(ebitda[1]).toBeCloseTo(-2000.00, 2);
      expect(ebitda[2]).toBeCloseTo(-10000.00, 2);
    });

    it('should calculate depreciation correctly', () => {
      const depreciation = results.incomeStatements.map((stmt: any) => stmt.depreciation);
      expect(depreciation[0]).toBeCloseTo(-3000.00, 2);
      expect(depreciation[1]).toBeCloseTo(-3000.00, 2);
      expect(depreciation[2]).toBeCloseTo(-3000.00, 2);
    });

    it('should calculate interest expense correctly on income statement', () => {
      const interestExpense = results.incomeStatements.map((stmt: any) => stmt.interest_expense);
      expect(interestExpense[0]).toBeCloseTo(0.00, 2);
      expect(interestExpense[1]).toBeCloseTo(-523.81, 2); // negative on IS
      expect(interestExpense[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate earnings before tax correctly', () => {
      const ebt = results.incomeStatements.map((stmt: any) => stmt.earnings_before_tax);
      expect(ebt[0]).toBeCloseTo(-20000.00, 2);
      expect(ebt[1]).toBeCloseTo(-5523.81, 2);
      expect(ebt[2]).toBeCloseTo(-13000.00, 2);
    });

    it('should calculate tax correctly (no tax on losses)', () => {
      const tax = results.incomeStatements.map((stmt: any) => stmt.income_tax);
      expect(tax[0]).toBeCloseTo(0.00, 2);
      expect(tax[1]).toBeCloseTo(0.00, 2);
      expect(tax[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate net income correctly', () => {
      const netIncome = results.incomeStatements.map((stmt: any) => stmt.net_income);
      expect(netIncome[0]).toBeCloseTo(-20000.00, 2);
      expect(netIncome[1]).toBeCloseTo(-5523.81, 2);
      expect(netIncome[2]).toBeCloseTo(-13000.00, 2);
    });

    it('should calculate accounts receivable correctly', () => {
      const accountsReceivable = results.balanceSheets.map((stmt: any) => stmt.accounts_receivable);
      expect(accountsReceivable[0]).toBeCloseTo(0.00, 2);
      expect(accountsReceivable[1]).toBeCloseTo(500.00, 2);
      expect(accountsReceivable[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate accounts payable correctly as -rate*OPEX', () => {
      const accountsPayable = results.balanceSheets.map((stmt: any) => stmt.accounts_payable);
      expect(accountsPayable[0]).toBeCloseTo(1700.00, 2);
      expect(accountsPayable[1]).toBeCloseTo(1100.00, 2);
      expect(accountsPayable[2]).toBeCloseTo(1000.00, 2);
    });

    it('should calculate unearned revenue correctly', () => {
      const unearnedRevenue = results.balanceSheets.map((stmt: any) => stmt.unearned_revenue);
      expect(unearnedRevenue[0]).toBeCloseTo(0.00, 2);
      expect(unearnedRevenue[1]).toBeCloseTo(0.00, 2); // inflow 2000, release 2000
      expect(unearnedRevenue[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate PPE correctly', () => {
      const ppeNet = results.balanceSheets.map((stmt: any) => stmt.ppe_net);
      expect(ppeNet[0]).toBeCloseTo(17000.00, 2); // prev - capex + dep
      expect(ppeNet[1]).toBeCloseTo(14000.00, 2);
      expect(ppeNet[2]).toBeCloseTo(11000.00, 2);
    });

    it('should calculate debt schedule correctly with PPMT', () => {
      const principalPayments = results.debtSchedule.map((stmt: any) => stmt.principal_payment);
      const endingBalances = results.debtSchedule.map((stmt: any) => stmt.ending_balance);

      expect(principalPayments[0]).toBeCloseTo(-4761.90, 2);
      expect(principalPayments[1]).toBeCloseTo(-5238.10, 2);
      expect(principalPayments[2]).toBeCloseTo(0.00, 2);

      expect(endingBalances[0]).toBeCloseTo(5238.10, 2);
      expect(endingBalances[1]).toBeCloseTo(0.00, 2);
      expect(endingBalances[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate operating cash flow correctly', () => {
      const ocf = results.cashFlowStatements.map((stmt: any) => stmt.operating_cash_flow);
      expect(ocf[0]).toBeCloseTo(-15300.00, 2);
      expect(ocf[1]).toBeCloseTo(-3623.81, 2);
      expect(ocf[2]).toBeCloseTo(-9600.00, 2);
    });

    it('should calculate financing cash flow correctly', () => {
      const fcf = results.cashFlowStatements.map((stmt: any) => stmt.financing_cash_flow);
      expect(fcf[0]).toBeCloseTo(5238.10, 2);
      expect(fcf[1]).toBeCloseTo(-5238.10, 2);
      expect(fcf[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate investing cash flow correctly', () => {
      const icf = results.cashFlowStatements.map((stmt: any) => stmt.investing_cash_flow);
      expect(icf[0]).toBeCloseTo(-20000.00, 2);
      expect(icf[1]).toBeCloseTo(0.00, 2);
      expect(icf[2]).toBeCloseTo(0.00, 2);
    });

    it('should calculate cash positions correctly', () => {
      const cashStart = results.cashFlowStatements.map((stmt: any) => stmt.cash_start);
      const cashChange = results.cashFlowStatements.map((stmt: any) => stmt.net_change_cash);
      const cashEnd = results.cashFlowStatements.map((stmt: any) => stmt.cash_end);

      expect(cashStart[0]).toBeCloseTo(0.00, 2);
      expect(cashStart[1]).toBeCloseTo(-30061.90, 2);
      expect(cashStart[2]).toBeCloseTo(-38923.81, 2);

      expect(cashChange[0]).toBeCloseTo(-30061.90, 2);
      expect(cashChange[1]).toBeCloseTo(-8861.90, 2);
      expect(cashChange[2]).toBeCloseTo(-9600.00, 2);

      expect(cashEnd[0]).toBeCloseTo(-30061.90, 2);
      expect(cashEnd[1]).toBeCloseTo(-38923.81, 2);
      expect(cashEnd[2]).toBeCloseTo(-48523.81, 2);
    });

    it('should calculate free cash flow to equity correctly', () => {
      const fcfToEquity = results.freeCashFlow.map((stmt: any) => stmt.fcf_to_equity);
      expect(fcfToEquity[0]).toBeCloseTo(-30061.90, 2);
      expect(fcfToEquity[1]).toBeCloseTo(-8861.90, 2);
      expect(fcfToEquity[2]).toBeCloseTo(-9600.00, 2);
    });

    it('should pass balance sheet check (Assets = Liabilities + Equity)', () => {
      results.balanceSheets.forEach((sheet: any) => {
        expect(Math.abs(sheet.balance_check)).toBeLessThan(0.01); // Within 1 cent
      });
    });
  });

  describe('Additional Required Tests', () => {
    const testInputs = {
      years: [2025, 2026, 2027],
      credits_generated: [1000, 0, 0],
      price_per_credit: [10, 10, 10],
      issuance_flag: [0, 1, 0],
      cogs_rate: 0.10,
      income_tax_rate: 0.20,
      ar_rate: 0.05,
      ap_rate: 0.10,
      feasibility_costs: [-5000, 0, 0],
      pdd_costs: [-2000, 0, 0],
      mrv_costs: [0, -1000, 0],
      staff_costs: [-10000, -10000, -10000],
      depreciation: [-3000, -3000, -3000],
      capex: [-20000, 0, 0],
      interest_rate: 0.10,
      debt_duration_years: 2,
      debt_draw: [10000, 0, 0],
      equity_injection: [0, 0, 0],
      initial_equity_t0: 5000,
      opening_cash_y1: 0,
      purchase_amount: [0, 2000, 0],
      purchase_share: 0.20,
      discount_rate: 0.12
    };

    let results: any;

    beforeAll(() => {
      const engine = new FinancialCalculationEngine(testInputs);
      results = engine.calculateFinancialStatements();
    });

    it('DSCR computes from EBITDA / (abs(principal) + interest)', () => {
      const t = 1; // 2026 in your 3-year case
      const ebitda = results.incomeStatements[t].ebitda;
      const principalAbs = -results.debtSchedule[t].principal_payment; // principal is negative
      const interestPos = results.debtSchedule[t].interest_expense;    // positive cash interest
      const dscr = ebitda / (principalAbs + interestPos);
      expect(Number(results.debtSchedule[t].dscr.toFixed(4))).toBeCloseTo(Number(dscr.toFixed(4)), 4);
    });

    it('Unearned revenue carries if purchase and delivery in different years', () => {
      const inputs = {
        years: [2025, 2026, 2027],
        credits_generated: [1000, 1000, 0],
        price_per_credit: [10,10,10],
        issuance_flag: [0, 0, 1],
        cogs_rate: 0, income_tax_rate: 0, ar_rate: 0, ap_rate: 0,
        feasibility_costs:[0,0,0], pdd_costs:[0,0,0], mrv_costs:[0,0,0], staff_costs:[0,0,0],
        depreciation:[0,0,0], capex:[0,0,0],
        interest_rate:0, debt_duration_years:1, debt_draw:[0,0,0], equity_injection:[0,0,0],
        initial_equity_t0:0, opening_cash_y1:0,
        purchase_amount:[2000,0,0], purchase_share:0.2,
        discount_rate:0.1
      };
      const e = new FinancialCalculationEngine(inputs).calculateFinancialStatements();
      const unearned = e.balanceSheets.map(s => s.unearned_revenue);
      // Year 1 inflow 2000, no delivery -> balance 2000
      expect(unearned[0]).toBeCloseTo(2000, 2);
      // Year 3 delivers 200 credits at implied 10 -> release -2000, balance back to 0
      expect(unearned[2]).toBeCloseTo(0, 2);
    });

    it('Accounts payable is -ap_rate * OPEX total', () => {
      const t = 0;
      const opexTotal = -5000 + -2000 + 0 + -10000; // from the 3-year case Y1
      const expectedAP = -0.10 * opexTotal;
      expect(results.balanceSheets[t].accounts_payable).toBeCloseTo(expectedAP, 2);
    });

    it('DSCR computes from EBITDA / (abs(principal) + interest)', () => {
      const t = 1; // 2026 in your 3-year case
      const ebitda = results.incomeStatements[t].ebitda;
      const principalAbs = -results.debtSchedule[t].principal_payment; // principal is negative
      const interestPos = results.debtSchedule[t].interest_expense;    // positive cash interest
      const dscr = ebitda / (principalAbs + interestPos);
      expect(Number(results.debtSchedule[t].dscr.toFixed(4))).toBeCloseTo(Number(dscr.toFixed(4)), 4);
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle zero purchase amount correctly', () => {
      const inputs = {
        years: [2025, 2026],
        credits_generated: [1000, 0],
        price_per_credit: [10, 10],
        issuance_flag: [0, 1],
        cogs_rate: 0.10,
        income_tax_rate: 0.20,
        ar_rate: 0.05,
        ap_rate: 0.10,
        feasibility_costs: [0, 0],
        pdd_costs: [0, 0],
        mrv_costs: [0, 0],
        staff_costs: [0, 0],
        depreciation: [0, 0],
        capex: [0, 0],
        equity_injection: [0, 0],
        debt_draw: [0, 0],
        interest_rate: 0.10,
        debt_duration_years: 2,
        purchase_amount: [0, 0], // All zeros
        purchase_share: 0.20,
        discount_rate: 0.12,
        initial_equity_t0: 0,
        opening_cash_y1: 0,
      };

      const engine = new FinancialCalculationEngine(inputs);
      const results = engine.calculateFinancialStatements();

      // When purchase_amount is all zeros, prep_revenue should be zero
      const prepRevenue = results.incomeStatements.map((stmt: any) => stmt.pre_purchase_revenue);
      expect(prepRevenue.every((rev: number) => rev === 0)).toBe(true);

      // Revenue should equal issued × price
      const totalRevenue = results.incomeStatements[1].total_revenue;
      const expectedRevenue = 1000 * 10; // issued credits × price
      expect(totalRevenue).toBeCloseTo(expectedRevenue, 2);
    });

    it('should handle zero purchase share correctly', () => {
      const inputs = {
        years: [2025, 2026],
        credits_generated: [1000, 0],
        price_per_credit: [10, 10],
        issuance_flag: [0, 1],
        cogs_rate: 0.10,
        income_tax_rate: 0.20,
        ar_rate: 0.05,
        ap_rate: 0.10,
        feasibility_costs: [0, 0],
        pdd_costs: [0, 0],
        mrv_costs: [0, 0],
        staff_costs: [0, 0],
        depreciation: [0, 0],
        capex: [0, 0],
        equity_injection: [0, 0],
        debt_draw: [0, 0],
        interest_rate: 0.10,
        debt_duration_years: 2,
        purchase_amount: [0, 2000], // Non-zero purchase amount
        purchase_share: 0, // Zero purchase share
        discount_rate: 0.12,
        initial_equity_t0: 0,
        opening_cash_y1: 0,
      };

      const engine = new FinancialCalculationEngine(inputs);
      const results = engine.calculateFinancialStatements();

      // When purchase_share = 0, pre-purchase paths should be zero
      const prepRevenue = results.incomeStatements.map((stmt: any) => stmt.pre_purchase_revenue);
      expect(prepRevenue.every((rev: number) => rev === 0)).toBe(true);

      const purchasedCredits = results.carbonStream.map((stmt: any) => stmt.purchased_credits);
      expect(purchasedCredits.every((credits: number) => credits === 0)).toBe(true);
    });

    it('should handle issuance flag = 0 correctly', () => {
      const inputs = {
        years: [2025, 2026],
        credits_generated: [1000, 500],
        price_per_credit: [10, 10],
        issuance_flag: [0, 0], // No issuance
        cogs_rate: 0.10,
        income_tax_rate: 0.20,
        ar_rate: 0.05,
        ap_rate: 0.10,
        feasibility_costs: [0, 0],
        pdd_costs: [0, 0],
        mrv_costs: [0, 0],
        staff_costs: [0, 0],
        depreciation: [0, 0],
        capex: [0, 0],
        equity_injection: [0, 0],
        debt_draw: [0, 0],
        interest_rate: 0.10,
        debt_duration_years: 2,
        purchase_amount: [0, 0],
        purchase_share: 0.20,
        discount_rate: 0.12,
        initial_equity_t0: 0,
        opening_cash_y1: 0,
      };

      const engine = new FinancialCalculationEngine(inputs);
      const results = engine.calculateFinancialStatements();

      // When issuance_flag = 0, credits_issued should be 0
      const creditsIssued = results.incomeStatements.map((stmt: any) => stmt.credits_issued);
      expect(creditsIssued.every((credits: number) => credits === 0)).toBe(true);
    });
  });

});