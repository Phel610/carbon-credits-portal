// src/lib/financial/uiAdapter.ts
import type { ModelInputData } from './calculationEngine';

export function parseNumberLoose(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === 'number') return input;
  const cleaned = input.replace(/[,\\s$]/g, '');
  const n = Number(cleaned);
  if (Number.isNaN(n)) throw new Error(`Invalid number: \"${input}\"`);
  return n;
}

// Costs/outflows must be negative for the engine
export function normalizeOutflow(input: string | number): number {
  return -Math.abs(parseNumberLoose(input));
}

// Accepts 5, "5", "5%", 0.05 -> returns 0.05 (decimal)
// Validates final value is in [0,1]
export function normalizeRate(input: string | number): number {
  const raw = typeof input === 'string' && input.trim().endsWith('%')
    ? parseNumberLoose(input.slice(0, -1)) // drop %
    : parseNumberLoose(input);
  const asDecimal = raw > 1 ? raw / 100 : raw;
  if (asDecimal < 0 || asDecimal > 1) throw new Error('Rate must be between 0 and 1.');
  return asDecimal;
}

// Checkbox/boolean -> 0/1
export function normalizeFlag(input: boolean | number | string | null | undefined): 0 | 1 {
  if (typeof input === 'boolean') return input ? 1 : 0;
  if (input === 1 || input === '1' || `${input}`.toLowerCase() === 'true') return 1;
  return 0;
}

// Ensure array length equals L; throw if not
function mustLen<T>(arr: T[], name: string, L: number): T[] {
  if (!Array.isArray(arr) || arr.length !== L) {
    throw new Error(`Length of ${name} must equal years.length (${L}).`);
  }
  return arr;
}

// Map UI form state -> engine inputs (strict schema)
export function toEngineInputs(ui: any) {
  const L = ui.years.length;

  const issue = mustLen(ui.issue, 'issuance_flag', L).map(normalizeFlag);
  const credits_generated = mustLen(ui.credits_generated, 'credits_generated', L).map(parseNumberLoose);
  const price_per_credit  = mustLen(ui.price_per_credit,  'price_per_credit',  L).map(parseNumberLoose);

  const feasibility_costs = mustLen(ui.feasibility_costs, 'feasibility_costs', L).map(normalizeOutflow);
  const pdd_costs        = mustLen(ui.pdd_costs,        'pdd_costs',        L).map(normalizeOutflow);
  const mrv_costs        = mustLen(ui.mrv_costs,        'mrv_costs',        L).map(normalizeOutflow);
  const staff_costs      = mustLen(ui.staff_costs,      'staff_costs',      L).map(normalizeOutflow);
  const depreciation     = mustLen(ui.depreciation,     'depreciation',     L).map(normalizeOutflow);
  const capex            = mustLen(ui.capex,            'capex',            L).map(normalizeOutflow);

  const equity_injection = mustLen(ui.equity_injection, 'equity_injection', L).map(parseNumberLoose); // inflow: positive
  const debt_draw        = mustLen(ui.debt_draw,        'debt_draw',        L).map(parseNumberLoose); // inflow: positive
  const purchase_amount  = mustLen(ui.purchase_amount,  'purchase_amount',  L).map(parseNumberLoose); // inflow: positive

  return {
    years: ui.years,

    // operational
    issuance_flag: issue,
    credits_generated,
    price_per_credit,

    // expenses (engine needs negatives)
    feasibility_costs,
    pdd_costs,
    mrv_costs,
    staff_costs,
    depreciation,
    capex,

    // working capital & tax & cogs
    ar_rate:        normalizeRate(ui.ar_rate),
    ap_rate:        normalizeRate(ui.ap_rate),
    cogs_rate:      normalizeRate(ui.cogs_rate),
    income_tax_rate: normalizeRate(ui.income_tax_rate),

    // financing
    interest_rate:       normalizeRate(ui.interest_rate),
    debt_duration_years: Math.trunc(parseNumberLoose(ui.debt_duration_years)),
    equity_injection,
    debt_draw,

    // pre-purchase
    purchase_amount,
    purchase_share: normalizeRate(ui.purchase_share),

    // other
    opening_cash_y1: parseNumberLoose(ui.opening_cash_y1),
    discount_rate:   normalizeRate(ui.discount_rate),
    initial_equity_t0: parseNumberLoose(ui.initial_equity_t0),
    initial_ppe: parseNumberLoose(ui.initial_ppe),
  };
}

// Ensure array has correct length, fill with defaults if missing/wrong length
function ensureLen<T>(arr: T[] | undefined, L: number, fill: T): T[] {
  return arr && Array.isArray(arr) && arr.length === L ? arr : Array(L).fill(fill);
}


// Map engine inputs -> UI state (for editing existing scenarios)
// NOTE: No helper hints; expenses shown as positive in UI.
// Tolerates partial engine objects for category-specific form loading
export function fromEngineToUI(engine: Partial<ModelInputData> & { years: number[] }) {
  const L = engine.years.length;
  const asPositive = (n: number) => Math.abs(n);
  
  return {
    years: engine.years,

    issue: ensureLen(engine.issuance_flag, L, 0).map((f: number) => f === 1),
    credits_generated: ensureLen(engine.credits_generated, L, 0),
    price_per_credit:  ensureLen(engine.price_per_credit, L, 0),

    feasibility_costs: ensureLen(engine.feasibility_costs, L, 0).map(asPositive),
    pdd_costs:         ensureLen(engine.pdd_costs, L, 0).map(asPositive),
    mrv_costs:         ensureLen(engine.mrv_costs, L, 0).map(asPositive),
    staff_costs:       ensureLen(engine.staff_costs, L, 0).map(asPositive),
    depreciation:      ensureLen(engine.depreciation, L, 0).map(asPositive),
    capex:             ensureLen(engine.capex, L, 0).map(asPositive),

    ar_rate:         (typeof engine.ar_rate === "number" ? engine.ar_rate : 0) * 100,
    ap_rate:         (typeof engine.ap_rate === "number" ? engine.ap_rate : 0) * 100,
    cogs_rate:       (typeof engine.cogs_rate === "number" ? engine.cogs_rate : 0) * 100,
    income_tax_rate: (typeof engine.income_tax_rate === "number" ? engine.income_tax_rate : 0) * 100,

    interest_rate:       (typeof engine.interest_rate === "number" ? engine.interest_rate : 0) * 100,
    debt_duration_years: typeof engine.debt_duration_years === "number" ? engine.debt_duration_years : 0,

    equity_injection: ensureLen(engine.equity_injection, L, 0),
    debt_draw:        ensureLen(engine.debt_draw, L, 0),

    purchase_amount: ensureLen(engine.purchase_amount, L, 0),
    purchase_share:  (typeof engine.purchase_share === "number" ? engine.purchase_share : 0) * 100,

    opening_cash_y1: typeof engine.opening_cash_y1 === "number" ? engine.opening_cash_y1 : 0,
    discount_rate:   (typeof engine.discount_rate === "number" ? engine.discount_rate : 0) * 100,
    initial_equity_t0: typeof engine.initial_equity_t0 === "number" ? engine.initial_equity_t0 : 0,
    initial_ppe: typeof engine.initial_ppe === "number" ? engine.initial_ppe : 0,
  };
}
