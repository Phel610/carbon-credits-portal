import { toEngineInputs, fromEngineToUI } from '@/lib/financial/uiAdapter';

const baseUI = {
  years: [2025, 2026],
  issue: [true, false],
  credits_generated: [1000, 0],
  price_per_credit: [10, 10],

  feasibility_costs: [5000, 0],
  pdd_costs: [2000, 0],
  mrv_costs: [0, 1000],
  staff_costs: [10000, 10000],
  depreciation: [3000, 3000],
  capex: [20000, 0],

  ar_rate: '5%',
  ap_rate: '10%',
  cogs_rate: '10',
  income_tax_rate: 0.2,

  interest_rate: '10%',
  debt_duration_years: 2,
  equity_injection: [0, 0],
  debt_draw: [10000, 0],

  purchase_amount: [0, 2000],
  purchase_share: '20%',

  opening_cash_y1: 0,
  discount_rate: '12%',
};

test('issuance checkbox -> 0/1 flags', () => {
  const e = toEngineInputs(baseUI);
  expect(e.issuance_flag).toEqual([1, 0]);
});

test('expenses become negative outflows', () => {
  const e = toEngineInputs(baseUI);
  expect(e.feasibility_costs[0]).toBe(-5000);
  expect(e.capex[0]).toBe(-20000);
  expect(e.depreciation[0]).toBe(-3000);
});

test('rates normalize to decimals in [0,1]', () => {
  const e = toEngineInputs(baseUI);
  expect(e.ar_rate).toBeCloseTo(0.05, 6);
  expect(e.cogs_rate).toBeCloseTo(0.10, 6);
  expect(e.interest_rate).toBeCloseTo(0.10, 6);
  expect(e.purchase_share).toBeCloseTo(0.20, 6);
});

test('fromEngineToUI makes expenses positive and rates percents', () => {
  const e = toEngineInputs(baseUI);
  const ui = fromEngineToUI(e);
  expect(ui.feasibility_costs[0]).toBe(5000);
  expect(ui.capex[0]).toBe(20000);
  expect(ui.depreciation[0]).toBe(3000);
  expect(ui.cogs_rate).toBeCloseTo(10, 6); // percent
});