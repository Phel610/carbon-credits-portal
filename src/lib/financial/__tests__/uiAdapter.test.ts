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
  initial_equity_t0: 100000,
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
  expect(ui.initial_equity_t0).toBe(100000); // round-trip test
});

test('fromEngineToUI handles partial objects - expenses only', () => {
  const partialEngine = {
    years: [2025, 2026],
    feasibility_costs: [-5000, -2000],
    pdd_costs: [-1000, 0],
    cogs_rate: 0.15,
    ar_rate: 0.10,
  };
  
  const ui = fromEngineToUI(partialEngine);
  
  // Expenses should convert to positive
  expect(ui.feasibility_costs).toEqual([5000, 2000]);
  expect(ui.pdd_costs).toEqual([1000, 0]);
  
  // Rates should convert to percentages
  expect(ui.cogs_rate).toBe(15);
  expect(ui.ar_rate).toBe(10);
  
  // Missing arrays should default to zeros
  expect(ui.credits_generated).toEqual([0, 0]);
  expect(ui.equity_injection).toEqual([0, 0]);
  expect(ui.issue).toEqual([false, false]);
  
  // Missing scalars should default to 0
  expect(ui.discount_rate).toBe(0);
  expect(ui.initial_equity_t0).toBe(0);
});

test('fromEngineToUI handles partial objects - financing only', () => {
  const partialEngine = {
    years: [2025, 2026, 2027],
    interest_rate: 0.08,
    debt_duration_years: 3,
    equity_injection: [50000, 0, 0],
    debt_draw: [100000, 0, 0],
    purchase_share: 0.25,
    discount_rate: 0.12,
    initial_equity_t0: 200000,
  };
  
  const ui = fromEngineToUI(partialEngine);
  
  // Financing fields should convert properly
  expect(ui.interest_rate).toBe(8);
  expect(ui.debt_duration_years).toBe(3);
  expect(ui.equity_injection).toEqual([50000, 0, 0]);
  expect(ui.debt_draw).toEqual([100000, 0, 0]);
  expect(ui.purchase_share).toBe(25);
  expect(ui.discount_rate).toBe(12);
  expect(ui.initial_equity_t0).toBe(200000);
  
  // Missing arrays should default to zeros
  expect(ui.feasibility_costs).toEqual([0, 0, 0]);
  expect(ui.credits_generated).toEqual([0, 0, 0]);
  expect(ui.issue).toEqual([false, false, false]);
  
  // Missing rates should default to 0%
  expect(ui.cogs_rate).toBe(0);
  expect(ui.ar_rate).toBe(0);
});

test('fromEngineToUI handles partial objects - operational only', () => {
  const partialEngine = {
    years: [2025, 2026],
    issuance_flag: [1, 0],
    credits_generated: [1500, 800],
    price_per_credit: [12, 15],
  };
  
  const ui = fromEngineToUI(partialEngine);
  
  // Operational fields should convert properly
  expect(ui.issue).toEqual([true, false]);
  expect(ui.credits_generated).toEqual([1500, 800]);
  expect(ui.price_per_credit).toEqual([12, 15]);
  
  // Missing arrays should default to zeros
  expect(ui.feasibility_costs).toEqual([0, 0]);
  expect(ui.equity_injection).toEqual([0, 0]);
  
  // Missing rates should default to 0%
  expect(ui.interest_rate).toBe(0);
  expect(ui.purchase_share).toBe(0);
  
  // Missing scalars should default to 0
  expect(ui.debt_duration_years).toBe(0);
  expect(ui.initial_equity_t0).toBe(0);
});