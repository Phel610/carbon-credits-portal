export interface InvariantResult {
  name: string;
  description: string;
  pass: boolean;
  details?: string;
}

export function validateInvariants(data: any, inputs?: any): InvariantResult[] {
  const results: InvariantResult[] = [];

  // Revenue components add up
  if (data.incomeStatements) {
    for (let i = 0; i < data.incomeStatements.length; i++) {
      const is = data.incomeStatements[i];
      const expectedTotal = (is.spot_revenue || 0) + (is.pre_purchase_revenue || 0);
      const actualTotal = is.total_revenue || 0;
      const delta = Math.abs(expectedTotal - actualTotal);
      
      results.push({
        name: `Revenue Identity Year ${i + 1}`,
        description: 'Total Revenue = Spot Revenue + Pre-purchase Revenue',
        pass: delta < 0.01,
        details: delta >= 0.01 ? `Expected: ${expectedTotal}, Actual: ${actualTotal}, Delta: ${delta}` : undefined
      });
    }
  }

  // COGS calculation (if inputs provided)
  if (data.incomeStatements && inputs) {
    for (let i = 0; i < data.incomeStatements.length; i++) {
      const is = data.incomeStatements[i];
      const expectedCOGS = (inputs.cogs_rate || 0) * (is.total_revenue || 0);
      const actualCOGS = Math.abs(is.cogs || 0); // COGS is typically negative
      const delta = Math.abs(expectedCOGS - actualCOGS);
      
      results.push({
        name: `COGS Calculation Year ${i + 1}`,
        description: 'COGS = COGS Rate × Total Revenue',
        pass: delta < 0.01,
        details: delta >= 0.01 ? `Expected: ${expectedCOGS.toFixed(2)}, Actual: ${actualCOGS.toFixed(2)}, Delta: ${delta.toFixed(2)}` : undefined
      });
    }
  }

  // AR/AP working capital relationships
  if (data.incomeStatements && data.balanceSheets && inputs) {
    for (let i = 0; i < Math.min(data.incomeStatements.length, data.balanceSheets.length); i++) {
      const is = data.incomeStatements[i];
      const bs = data.balanceSheets[i];
      
      // Accounts Receivable = AR Rate × Total Revenue
      if (inputs.ar_rate) {
        const expectedAR = inputs.ar_rate * (is.total_revenue || 0);
        const actualAR = bs.accounts_receivable || 0;
        const arDelta = Math.abs(expectedAR - actualAR);
        
        results.push({
          name: `AR Calculation Year ${i + 1}`,
          description: 'AR = AR Rate × Total Revenue',
          pass: arDelta < 0.01,
          details: arDelta >= 0.01 ? `Expected: ${expectedAR.toFixed(2)}, Actual: ${actualAR.toFixed(2)}, Delta: ${arDelta.toFixed(2)}` : undefined
        });
      }
      
      // Accounts Payable = AP Rate × OPEX Total
      if (inputs.ap_rate) {
        const expectedAP = inputs.ap_rate * Math.abs(is.opex_total || 0);
        const actualAP = Math.abs(bs.accounts_payable || 0);
        const apDelta = Math.abs(expectedAP - actualAP);
        
        results.push({
          name: `AP Calculation Year ${i + 1}`,
          description: 'AP = AP Rate × |OPEX Total|',
          pass: apDelta < 0.01,
          details: apDelta >= 0.01 ? `Expected: ${expectedAP.toFixed(2)}, Actual: ${actualAP.toFixed(2)}, Delta: ${apDelta.toFixed(2)}` : undefined
        });
      }
    }
  }

  // Pre-purchase price consistency
  if (data.carbonStream) {
    const purchaseYears = data.carbonStream.filter((cs: any) => (cs.purchase_amount || 0) > 0);
    if (purchaseYears.length > 1) {
      const firstPrice = purchaseYears[0].implied_purchase_price;
      let priceConsistent = true;
      
      for (let i = 1; i < purchaseYears.length; i++) {
        if (Math.abs(purchaseYears[i].implied_purchase_price - firstPrice) > 0.01) {
          priceConsistent = false;
          break;
        }
      }
      
      results.push({
        name: 'Pre-purchase Price Consistency',
        description: 'Implied purchase price must be constant across all purchase years',
        pass: priceConsistent,
        details: !priceConsistent ? `Prices vary across years: ${purchaseYears.map((p: any) => p.implied_purchase_price).join(', ')}` : undefined
      });
    }
  }

  // OPEX total equals sum of components
  if (data.incomeStatements) {
    for (let i = 0; i < data.incomeStatements.length; i++) {
      const is = data.incomeStatements[i];
      const expectedOpex = (is.feasibility || 0) + (is.pdd || 0) + (is.mrv || 0) + (is.staff || 0);
      const actualOpex = is.opex_total || 0;
      const delta = Math.abs(expectedOpex - actualOpex);
      
      results.push({
        name: `OPEX Total Year ${i + 1}`,
        description: 'OPEX Total = Feasibility + PDD + MRV + Staff',
        pass: delta < 0.01,
        details: delta >= 0.01 ? `Expected: ${expectedOpex}, Actual: ${actualOpex}, Delta: ${delta}` : undefined
      });
    }
  }

  // Balance sheet balances
  if (data.balanceSheets) {
    for (let i = 0; i < data.balanceSheets.length; i++) {
      const bs = data.balanceSheets[i];
      const balanceCheck = Math.abs(bs.balance_check || 0);
      
      results.push({
        name: `Balance Sheet Balance Year ${i + 1}`,
        description: 'Balance sheet balances (balance_check ≈ 0)',
        pass: balanceCheck < 0.01,
        details: balanceCheck >= 0.01 ? `Balance check: ${balanceCheck}` : undefined
      });
    }
  }

  // Cash flow identity
  if (data.cashFlowStatements) {
    for (let i = 0; i < data.cashFlowStatements.length; i++) {
      const cf = data.cashFlowStatements[i];
      const expectedNetChange = (cf.operating_cash_flow || 0) + (cf.investing_cash_flow || 0) + (cf.financing_cash_flow || 0);
      const actualNetChange = cf.net_change_cash || 0;
      const delta = Math.abs(expectedNetChange - actualNetChange);
      
      results.push({
        name: `Cash Flow Identity Year ${i + 1}`,
        description: 'Net Change = Operating + Investing + Financing CF',
        pass: delta < 0.01,
        details: delta >= 0.01 ? `Expected: ${expectedNetChange}, Actual: ${actualNetChange}, Delta: ${delta}` : undefined
      });

      // Cash end = cash start + net change
      const expectedCashEnd = (cf.cash_start || 0) + (cf.net_change_cash || 0);
      const actualCashEnd = cf.cash_end || 0;
      const cashDelta = Math.abs(expectedCashEnd - actualCashEnd);
      
      results.push({
        name: `Cash End Identity Year ${i + 1}`,
        description: 'Cash End = Cash Start + Net Change',
        pass: cashDelta < 0.01,
        details: cashDelta >= 0.01 ? `Expected: ${expectedCashEnd}, Actual: ${actualCashEnd}, Delta: ${cashDelta}` : undefined
      });
    }
  }

  // Interest sign convention (IS interest = -schedule interest)
  if (data.incomeStatements && data.debtSchedule) {
    for (let i = 0; i < Math.min(data.incomeStatements.length, data.debtSchedule.length); i++) {
      const isInterest = data.incomeStatements[i].interest_expense || 0;
      const scheduleInterest = data.debtSchedule[i].interest_expense || 0;
      const delta = Math.abs(isInterest + scheduleInterest); // Should be opposite signs
      
      results.push({
        name: `Interest Sign Convention Year ${i + 1}`,
        description: 'IS Interest = -Schedule Interest',
        pass: delta < 0.01,
        details: delta >= 0.01 ? `IS: ${isInterest}, Schedule: ${scheduleInterest}, Delta: ${delta}` : undefined
      });
    }
  }

  // DSCR calculation
  if (data.debtSchedule && data.incomeStatements) {
    for (let i = 0; i < Math.min(data.debtSchedule.length, data.incomeStatements.length); i++) {
      const debt = data.debtSchedule[i];
      const is = data.incomeStatements[i];
      const debtService = Math.abs(debt.principal_payment || 0) + Math.abs(debt.interest_expense || 0);
      
      if (debtService > 0) {
        const expectedDSCR = (is.ebitda || 0) / debtService;
        const actualDSCR = debt.dscr || 0;
        const delta = Math.abs(expectedDSCR - actualDSCR);
        
        results.push({
          name: `DSCR Calculation Year ${i + 1}`,
          description: 'DSCR = EBITDA / (|Principal| + |Interest|)',
          pass: delta < 0.01,
          details: delta >= 0.01 ? `Expected: ${expectedDSCR.toFixed(2)}, Actual: ${actualDSCR.toFixed(2)}, Delta: ${delta.toFixed(3)}` : undefined
        });
      }
    }
  }

  return results;
}