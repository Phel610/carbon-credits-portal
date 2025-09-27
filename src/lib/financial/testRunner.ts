// Quick test runner to verify calculations
import { FinancialCalculationEngine } from './calculationEngine';

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

console.log('=== RUNNING FINANCIAL CALCULATION TEST ===');
console.log('Input data:', JSON.stringify(testInputs, null, 2));

try {
  const engine = new FinancialCalculationEngine(testInputs);
  const results = engine.calculateFinancialStatements();
  
  console.log('\n=== INCOME STATEMENTS ===');
  results.incomeStatements.forEach((stmt, i) => {
    console.log(`Year ${stmt.year}:`);
    console.log(`  Credits Generated: ${stmt.credits_generated}`);
    console.log(`  Credits Issued: ${stmt.credits_issued.toFixed(2)}`);
    console.log(`  Spot Revenue: ${stmt.spot_revenue.toFixed(2)}`);
    console.log(`  Pre-Purchase Revenue: ${stmt.pre_purchase_revenue.toFixed(2)}`);
    console.log(`  Total Revenue: ${stmt.total_revenue.toFixed(2)}`);
    console.log(`  COGS: ${stmt.cogs.toFixed(2)}`);
    console.log(`  Gross Profit: ${stmt.gross_profit.toFixed(2)}`);
    console.log(`  EBITDA: ${stmt.ebitda.toFixed(2)}`);
    console.log(`  Depreciation: ${stmt.depreciation.toFixed(2)}`);
    console.log(`  Interest Expense: ${stmt.interest_expense.toFixed(2)}`);
    console.log(`  EBT: ${stmt.earnings_before_tax.toFixed(2)}`);
    console.log(`  Tax: ${stmt.income_tax.toFixed(2)}`);
    console.log(`  Net Income: ${stmt.net_income.toFixed(2)}`);
    console.log('');
  });

  console.log('\n=== DEBT SCHEDULE ===');
  results.debtSchedule.forEach((stmt) => {
    console.log(`Year ${stmt.year}:`);
    console.log(`  Beginning Balance: ${stmt.beginning_balance.toFixed(2)}`);
    console.log(`  Draw: ${stmt.draw.toFixed(2)}`);
    console.log(`  Principal Payment: ${stmt.principal_payment.toFixed(2)}`);
    console.log(`  Ending Balance: ${stmt.ending_balance.toFixed(2)}`);
    console.log(`  Interest Expense: ${stmt.interest_expense.toFixed(2)}`);
    console.log('');
  });

  console.log('\n=== BALANCE SHEETS ===');
  results.balanceSheets.forEach((stmt) => {
    console.log(`Year ${stmt.year}:`);
    console.log(`  Cash: ${stmt.cash.toFixed(2)}`);
    console.log(`  Accounts Receivable: ${stmt.accounts_receivable.toFixed(2)}`);
    console.log(`  PPE Net: ${stmt.ppe_net.toFixed(2)}`);
    console.log(`  Total Assets: ${stmt.total_assets.toFixed(2)}`);
    console.log(`  Accounts Payable: ${stmt.accounts_payable.toFixed(2)}`);
    console.log(`  Unearned Revenue: ${stmt.unearned_revenue.toFixed(2)}`);
    console.log(`  Debt Balance: ${stmt.debt_balance.toFixed(2)}`);
    console.log(`  Total Liabilities: ${stmt.total_liabilities.toFixed(2)}`);
    console.log(`  Total Equity: ${stmt.total_equity.toFixed(2)}`);
    console.log(`  Balance Check: ${stmt.balance_check.toFixed(2)}`);
    console.log('');
  });

  console.log('\n=== CASH FLOW STATEMENTS ===');
  results.cashFlowStatements.forEach((stmt) => {
    console.log(`Year ${stmt.year}:`);
    console.log(`  Operating Cash Flow: ${stmt.operating_cash_flow.toFixed(2)}`);
    console.log(`  Financing Cash Flow: ${stmt.financing_cash_flow.toFixed(2)}`);
    console.log(`  Investing Cash Flow: ${stmt.investing_cash_flow.toFixed(2)}`);
    console.log(`  Cash Start: ${stmt.cash_start.toFixed(2)}`);
    console.log(`  Net Change Cash: ${stmt.net_change_cash.toFixed(2)}`);
    console.log(`  Cash End: ${stmt.cash_end.toFixed(2)}`);
    console.log('');
  });

  console.log('\n=== CARBON STREAM ===');
  results.carbonStream.forEach((stmt) => {
    console.log(`Year ${stmt.year}:`);
    console.log(`  Purchase Amount: ${stmt.purchase_amount.toFixed(2)}`);
    console.log(`  Purchased Credits: ${stmt.purchased_credits.toFixed(2)}`);
    console.log(`  Implied Purchase Price: ${stmt.implied_purchase_price.toFixed(2)}`);
    console.log(`  Investor Cash Flow: ${stmt.investor_cash_flow.toFixed(2)}`);
    console.log('');
  });

  console.log('\n=== FREE CASH FLOW ===');
  results.freeCashFlow.forEach((stmt) => {
    console.log(`Year ${stmt.year}:`);
    console.log(`  FCF to Equity: ${stmt.fcf_to_equity.toFixed(2)}`);
    console.log('');
  });

  console.log('\n=== EXPECTED vs ACTUAL COMPARISON ===');
  
  // Expected values from ChatGPT
  const expected = {
    credits_issued: [0.00, 1000.00, 0.00],
    purchased_credits: [0.00, 200.00, 0.00],
    implied_purchase_price: 10.00,
    spot_revenue: [0.00, 8000.00, 0.00],
    prep_revenue: [0.00, 2000.00, 0.00],
    revenue: [0.00, 10000.00, 0.00],
    cogs: [0.00, 1000.00, 0.00],
    gross_profit: [0.00, 9000.00, 0.00],
    ebitda: [-17000.00, -2000.00, -10000.00],
    depreciation: [-3000.00, -3000.00, -3000.00],
    interest_expense_is: [0.00, -523.81, 0.00],
    ebt: [-20000.00, -5523.81, -13000.00],
    tax: [0.00, 0.00, 0.00],
    net_income: [-20000.00, -5523.81, -13000.00],
    accounts_receivable: [0.00, 500.00, 0.00],
    accounts_payable: [1700.00, 1100.00, 1000.00],
    unearned_revenue: [0.00, 0.00, 0.00],
    ppe: [17000.00, 14000.00, 11000.00],
    principal_payment: [-4761.90, -5238.10, 0.00],
    debt_ending: [5238.10, 0.00, 0.00],
    ocf: [-15300.00, -3623.81, -9600.00],
    fin_cf: [5238.10, -5238.10, 0.00],
    inv_cf: [-20000.00, 0.00, 0.00],
    cash_start: [0.00, -30061.90, -38923.81],
    cash_change: [-30061.90, -8861.90, -9600.00],
    cash_end: [-30061.90, -38923.81, -48523.81],
    fcf_to_equity: [-30061.90, -8861.90, -9600.00]
  };

  // Compare key values
  const actualCreditsIssued = results.incomeStatements.map(s => s.credits_issued);
  const actualPurchasedCredits = results.carbonStream.map(s => s.purchased_credits);
  const actualImpliedPrice = results.carbonStream[0].implied_purchase_price;
  
  console.log('Credits Issued:');
  console.log('  Expected:', expected.credits_issued);
  console.log('  Actual:  ', actualCreditsIssued.map(v => Number(v.toFixed(2))));
  
  console.log('Purchased Credits:');
  console.log('  Expected:', expected.purchased_credits);
  console.log('  Actual:  ', actualPurchasedCredits.map(v => Number(v.toFixed(2))));
  
  console.log('Implied Purchase Price:');
  console.log('  Expected:', expected.implied_purchase_price);
  console.log('  Actual:  ', Number(actualImpliedPrice.toFixed(2)));

} catch (error) {
  console.error('Calculation failed:', error);
}