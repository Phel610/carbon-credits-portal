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
  it("equity identity per year: shareholder_equity + retained_earnings = total_equity", () => {
    const inputs = loadInputs("scenario_simple");
    const engine = new FinancialCalculationEngine(inputs);
    const out = engine.calculateFinancialStatements();

    const income = pick(out, ["incomeStatements", "income_statement"]);
    const bs = pick(out, ["balanceSheets", "balance_sheet"]);
    const equityInj: number[] =
      pick(out, ["inputs", "input", "engineInputs"])?.equity_injection ?? [];
    const initialEquity =
      pick(out, ["inputs", "input", "engineInputs"])?.initial_equity_t0 ?? 0;

    const netIncome: number[] = income.map((r: any) =>
      Number(pick(r, ["net_income", "netIncome"]) ?? 0),
    );
    const totalEquity: number[] = bs.map((r: any) =>
      Number(pick(r, ["total_equity", "totalEquity"]) ?? 0),
    );

    // cum helpers
    const cum = (arr: number[], i: number) =>
      arr.slice(0, i + 1).reduce((s, v) => s + (v ?? 0), 0);

    for (let i = 0; i < totalEquity.length; i++) {
      const retainedEarnings = cum(netIncome, i);
      const shareholderEquity = initialEquity + cum(equityInj, i);
      closeToCents(shareholderEquity + retainedEarnings, totalEquity[i]);
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