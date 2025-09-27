import Ajv from "ajv";
import { FinancialCalculationEngine } from "../calculationEngine";

// Inline schema for now - can be extracted to separate file later
const schema = {
  type: "object",
  required: ["schema_version", "inputs", "incomeStatements", "balanceSheets", "cashFlowStatements", "debtSchedule", "carbonStream", "freeCashFlow", "metrics"],
  properties: {
    schema_version: { type: "string" },
    inputs: { type: "object" },
    incomeStatements: { type: "array" },
    balanceSheets: { type: "array" },
    cashFlowStatements: { type: "array" },
    debtSchedule: { type: "array" },
    carbonStream: { type: "array" },
    freeCashFlow: { type: "array" },
    metrics: { type: "object" }
  }
};

const ajv = new Ajv({ allErrors: true, strict: true });

const base: any = {
  years: [2025, 2026, 2027],
  credits_generated: [1000, 1000, 0],
  price_per_credit: [10, 10, 10],
  issuance_flag: [0, 1, 1],
  cogs_rate: 0.1,
  income_tax_rate: 0.2,
  ar_rate: 0.05,
  ap_rate: 0.1,
  feasibility_costs: [-5000, 0, 0],
  pdd_costs: [-2000, 0, 0],
  mrv_costs: [0, -1000, 0],
  staff_costs: [-10000, -10000, -10000],
  depreciation: [-3000, -3000, -3000],
  capex: [-20000, 0, 0],
  interest_rate: 0.1,
  debt_duration_years: 2,
  debt_draw: [10000, 0, 0],
  equity_injection: [0, 0, 0],
  initial_equity_t0: 5000,
  opening_cash_y1: 0,
  purchase_amount: [2000, 0, 0],
  purchase_share: 0.2,
  discount_rate: 0.12
};

function run(inputs = base) {
  const engine = new FinancialCalculationEngine(inputs);
  return engine.calculateFinancialStatements();
}

test("response matches JSON schema", () => {
  const r = run();
  const validate = ajv.compile(schema);
  const ok = validate(r);
  if (!ok) {
    console.log("Schema validation errors:", validate.errors);
  }
  expect(ok).toBe(true);
});

test("IS interest equals negative of schedule interest", () => {
  const r = run();
  for (let t = 0; t < r.inputs.years.length; t++) {
    expect(r.incomeStatements[t].interest_expense)
      .toBeCloseTo(-r.debtSchedule[t].interest_expense, 6);
  }
});

test("Revenue components add up", () => {
  const r = run();
  r.incomeStatements.forEach((y: any) => {
    expect(y.total_revenue).toBeCloseTo(y.spot_revenue + y.pre_purchase_revenue, 6);
  });
});

test("COGS equals rate * total revenue", () => {
  const r = run();
  r.incomeStatements.forEach((y: any) => {
    expect(y.cogs).toBeCloseTo(r.inputs.cogs_rate * y.total_revenue, 6);
  });
});

test("OPEX total equals sum of lines", () => {
  const r = run();
  r.incomeStatements.forEach((y: any) => {
    expect(y.opex_total).toBeCloseTo(
      y.feasibility_costs + y.pdd_costs + y.mrv_costs + y.staff_costs, 6);
  });
});

test("Balance sheet balances every year", () => {
  const r = run();
  r.balanceSheets.forEach((y: any) => {
    expect(Math.abs(y.balance_check)).toBeLessThan(0.01);
    expect(y.total_assets).toBeCloseTo(y.total_liabilities_equity, 2);
  });
});

test("Cash flow identities hold", () => {
  const r = run();
  r.cashFlowStatements.forEach((y: any, idx: number) => {
    expect(y.net_change_cash).toBeCloseTo(
      y.operating_cash_flow + y.investing_cash_flow + y.financing_cash_flow, 6);
    if (idx === 0) {
      expect(y.cash_start).toBeCloseTo(r.inputs.opening_cash_y1, 6);
    } else {
      expect(y.cash_start).toBeCloseTo(r.cashFlowStatements[idx - 1].cash_end, 6);
    }
    expect(y.cash_end).toBeCloseTo(y.cash_start + y.net_change_cash, 6);
  });
});

test("DSCR equals EBITDA / (abs(principal) + interest) when debt service > 0", () => {
  const r = run();
  r.debtSchedule.forEach((d: any, t: number) => {
    const denom = Math.abs(d.principal_payment) + d.interest_expense;
    const ebitda = r.incomeStatements[t].ebitda;
    if (denom > 0) {
      expect(d.dscr).toBeCloseTo(ebitda / denom, 6);
    } else {
      expect(d.dscr).toBeCloseTo(0, 6);
    }
  });
});

test("Unearned revenue carry and release is consistent", () => {
  const r = run();
  // Compute expected unearned movement from carbon stream and purchases
  const impliedPrice = r.carbonStream[0].implied_purchase_price;
  let balance = 0;
  for (let t = 0; t < r.inputs.years.length; t++) {
    balance += r.carbonStream[t].purchase_amount; // cash in
    balance -= r.carbonStream[t].purchased_credits * impliedPrice; // release
    expect(r.balanceSheets[t].unearned_revenue).toBeCloseTo(balance, 6);
  }
});