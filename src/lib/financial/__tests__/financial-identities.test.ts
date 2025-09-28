import fs from "node:fs";
import path from "node:path";
import { FinancialCalculationEngine } from "@/lib/financial/calculationEngine";

/** small helper: pick the first existing prop name */
const pick = <T extends object>(o: T, names: string[]) =>
  names.reduce<any>((v, k) => (v ?? (o as any)[k]), undefined);

/** tolerant equality for money (to the cent) */
const closeToCents = (a: number, b: number) =>
  expect(Math.round((a - b) * 100)).toBe(0);

function loadInputs(scenario = "scenario_simple") {
  const base =
    process.env.PARITY_FIXTURES_DIR ??
    path.resolve(process.cwd(), "parity/fixtures");
  const file = path.join(base, scenario, "engine_inputs.json");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

describe("Financial Identity Guards", () => {
  it("equity identity per year: contributed_capital + retained_earnings = total_equity", () => {
    const inputs = loadInputs("scenario_simple");
    const engine = new FinancialCalculationEngine(inputs);
    const out = engine.calculateFinancialStatements();

    const bs = pick(out, ["balanceSheets", "balance_sheet"]);

    for (let i = 0; i < bs.length; i++) {
      const retainedEarnings = Number(pick(bs[i], ["retained_earnings"]) ?? 0);
      const contributedCapital = Number(pick(bs[i], ["contributed_capital"]) ?? 0);
      const totalEquity = Number(pick(bs[i], ["total_equity"]) ?? 0);
      
      closeToCents(contributedCapital + retainedEarnings, totalEquity);
    }
  });

  it("balance sheet identity per year: total_assets = total_liabilities + total_equity", () => {
    const inputs = loadInputs("scenario_simple");
    const engine = new FinancialCalculationEngine(inputs);
    const out = engine.calculateFinancialStatements();

    const bs = pick(out, ["balanceSheets", "balance_sheet"]);

    for (let i = 0; i < bs.length; i++) {
      const totalAssets = Number(pick(bs[i], ["total_assets"]) ?? 0);
      const totalLiabilities = Number(pick(bs[i], ["total_liabilities"]) ?? 0);
      const totalEquity = Number(pick(bs[i], ["total_equity"]) ?? 0);
      
      closeToCents(totalAssets, totalLiabilities + totalEquity);
    }
  });

  it("cash consistency: balance sheet cash = cash flow cash_end", () => {
    const inputs = loadInputs("scenario_simple");
    const engine = new FinancialCalculationEngine(inputs);
    const out = engine.calculateFinancialStatements();

    const bs = pick(out, ["balanceSheets", "balance_sheet"]);
    const cf = pick(out, ["cashFlows", "cash_flow", "cashFlow"]);

    for (let i = 0; i < bs.length; i++) {
      const bsCash = Number(pick(bs[i], ["cash"]) ?? 0);
      const cfCashEnd = Number(pick(cf[i], ["cash_end", "cashEnd"]) ?? 0);
      
      closeToCents(bsCash, cfCashEnd);
    }
  });

  it("liabilities are stored as positive balances", () => {
    const inputs = loadInputs("scenario_simple");
    const engine = new FinancialCalculationEngine(inputs);
    const out = engine.calculateFinancialStatements();

    const bs = pick(out, ["balanceSheets", "balance_sheet"]);

    for (let i = 0; i < bs.length; i++) {
      const accountsPayable = Number(pick(bs[i], ["accounts_payable"]) ?? 0);
      const unearnedRevenue = Number(pick(bs[i], ["unearned_revenue"]) ?? 0);
      const debtBalance = Number(pick(bs[i], ["debt_balance"]) ?? 0);
      
      // All liabilities should be positive or zero
      expect(accountsPayable).toBeGreaterThanOrEqual(0);
      expect(unearnedRevenue).toBeGreaterThanOrEqual(0);
      expect(debtBalance).toBeGreaterThanOrEqual(0);
    }
  });

  it("cash flow identity per year: Δcash === operating + investing + financing", () => {
    const inputs = loadInputs("scenario_simple");
    const engine = new FinancialCalculationEngine(inputs);
    const out = engine.calculateFinancialStatements();

    const cf = pick(out, ["cashFlows", "cash_flow", "cashFlow"]);
    for (let i = 0; i < cf.length; i++) {
      const ocf = Number(
        pick(cf[i], ["operating_cash_flow", "operatingCashFlow"]) ?? 0,
      );
      const icf = Number(
        pick(cf[i], ["investing_cash_flow", "investingCashFlow"]) ?? 0,
      );
      const fcf = Number(
        pick(cf[i], ["financing_cash_flow", "financingCashFlow"]) ?? 0,
      );

      const changeKnown = pick(cf[i], ["change_in_cash", "changeInCash", "net_change_cash"]);
      const cs = Number(pick(cf[i], ["cash_start", "cashStart"]) ?? NaN);
      const ce = Number(pick(cf[i], ["cash_end", "cashEnd"]) ?? NaN);

      const lhs = Number(changeKnown ?? (isFinite(cs) && isFinite(ce) ? ce - cs : 0));
      const rhs = ocf + icf + fcf;

      // if no cash_start/end are present, this will check change_in_cash directly
      closeToCents(lhs, rhs);
    }
  });
});