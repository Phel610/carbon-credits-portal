export const HEADERS = {
  incomeStatement: [
    "year","spot_revenue","pre_purchase_revenue","total",
    "cogs","gross_profit","feasibility_study_costs","pdd_development_costs","mrv_costs","staff_costs","opex_total",
    "ebitda","depreciation","interest_payments","earnings_before_tax","income_tax","net_income"
  ],
  balanceSheet: [
    "year","cash","accounts_receivable","ppe_net","total_assets",
    "accounts_payable","unearned_revenue","debt_balance","total_liabilities",
    "retained_earnings","contributed_capital","total_equity","total_liabilities_equity","balance_check"
  ],
  cashFlow: [
    "year","net_income","depreciation","decrease_in_ar","increase_in_ap","operating_cash_flow",
    "capex","investing_cash_flow","debt_financing","debt_repayments","change_unearned_revenue","equity_injection","financing_cash_flow",
    "cash_start","net_change_cash","cash_end"
  ],
  debtSchedule: [
    "year","beginning_balance","draw","principal_payment","ending_balance","interest_expense","dscr"
  ],
  carbonStream: [
    "year","percentage_credits_purchased","number_of_credits","purchase_amount","purchased_credits","implied_purchase_price"
  ],
  freeCashFlow: [
    "year","net_income","depreciation_addback","change_net_working_capital","capex","net_borrowing","fcf_to_equity"
  ]
};

// Helper function to add calculated fields to export data
function addCalculatedFields(data: any[], metadata?: any): any[] {
  if (!data || data.length === 0) return data;

  const incomeStatements = metadata?.incomeStatements || [];
  const equityInjections = metadata?.inputs?.equity_injection || [];
  const initialEquity = metadata?.inputs?.initial_equity_t0 || 0;

  return data.map((row, index) => {
    // Calculate cumulative sums
    const cumulativeSum = (arr: number[], i: number): number => {
      let sum = 0;
      for (let k = 0; k <= i; k++) {
        sum += arr[k] || 0;
      }
      return sum;
    };

    // Calculate derived fields
    const derivedFields: any = {};

    // Income statement derived fields
    if (row.total_revenue !== undefined && row.cogs !== undefined) {
      derivedFields.gross_profit = row.total_revenue - row.cogs;
    }

    // Balance sheet equity breakdown - now handled by engine
    if (row.retained_earnings === undefined && incomeStatements.length > 0) {
      derivedFields.retained_earnings = cumulativeSum(
        incomeStatements.map(is => is.net_income || 0), 
        index
      );
    }
    if (row.contributed_capital === undefined) {
      derivedFields.contributed_capital = initialEquity + cumulativeSum(equityInjections, index);
    }

    // Cash flow working capital changes and depreciation
    if (row.depreciation !== undefined) {
      derivedFields.depreciation_addback = Math.abs(row.depreciation);
    }
    if (row.change_ar !== undefined) {
      derivedFields.decrease_in_ar = -row.change_ar;
    }
    if (row.change_ap !== undefined) {
      derivedFields.increase_in_ap = row.change_ap;
    }

    // Debt financing fields
    if (row.debt_draw !== undefined) {
      derivedFields.debt_financing = row.debt_draw;
    }
    if (row.debt_repayment !== undefined) {
      derivedFields.debt_repayments = -Math.abs(row.debt_repayment);
    }

    // Unearned revenue change
    if (row.unearned_inflow !== undefined && row.unearned_release !== undefined) {
      derivedFields.change_unearned_revenue = row.unearned_inflow - row.unearned_release;
    }

    return { ...row, ...derivedFields };
  });
}

export function exportToCSV(data: any[], headers: string[], filename: string, metadata?: any) {
  if (!data || data.length === 0) return;
  
  const enrichedData = addCalculatedFields(data, metadata);
  
  const csvContent = [
    headers.join(','),
    ...enrichedData.map(row => 
      headers.map(header => {
        let value = row[header];
        
        // Handle calculated fields
        if (header === 'gross_profit' && row.total_revenue && row.cogs) {
          value = row.total_revenue - row.cogs;
        } else if (header === 'retained_earnings' && row.retained_earnings !== undefined) {
          value = row.retained_earnings;
        } else if (header === 'contributed_capital' && row.contributed_capital !== undefined) {
          value = row.contributed_capital;
        } else if (header === 'decrease_in_ar' && row.change_ar !== undefined) {
          value = -row.change_ar;
        } else if (header === 'increase_in_ap' && row.change_ap !== undefined) {
          value = row.change_ap;
        } else if (header === 'change_unearned_revenue') {
          value = row.change_unearned_revenue || 0;
        } else if (header === 'debt_financing') {
          value = row.debt_financing || 0;
        } else if (header === 'debt_repayments') {
          value = row.debt_repayments || 0;
        } else if (header === 'depreciation' && row.depreciation !== undefined) {
          value = Math.abs(row.depreciation); // Positive for cash flow addback
        }
        
        return typeof value === 'number' ? value.toFixed(2) : `"${(value || '').toString().replace(/"/g, '""')}"`
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

export function exportToExcel(data: any[], headers: string[], filename: string, metadata?: any) {
  // For now, use CSV format. Can be enhanced with a proper Excel library later
  const enrichedData = addCalculatedFields(data, metadata);
  
  let csvContent = '';
  
  // Add metadata if provided
  if (metadata) {
    csvContent += `Schema Version,${metadata.schema_version}\n`;
    csvContent += `Export Date,${new Date().toISOString()}\n`;
    csvContent += `Inputs JSON,"${JSON.stringify(metadata.inputs).replace(/"/g, '""')}"\n`;
    csvContent += '\n';
  }
  
  csvContent += [
    headers.join(','),
    ...enrichedData.map(row =>
      headers.map(header => {
        let value = row[header];
        
        // Handle calculated fields
        if (header === 'gross_profit' && row.total_revenue && row.cogs) {
          value = row.total_revenue - row.cogs;
        } else if (header === 'retained_earnings' && row.retained_earnings !== undefined) {
          value = row.retained_earnings;
        } else if (header === 'contributed_capital' && row.contributed_capital !== undefined) {
          value = row.contributed_capital;
        } else if (header === 'decrease_in_ar' && row.change_ar !== undefined) {
          value = -row.change_ar;
        } else if (header === 'increase_in_ap' && row.change_ap !== undefined) {
          value = row.change_ap;
        } else if (header === 'change_unearned_revenue') {
          value = row.change_unearned_revenue || 0;
        } else if (header === 'debt_financing') {
          value = row.debt_financing || 0;
        } else if (header === 'debt_repayments') {
          value = row.debt_repayments || 0;
        } else if (header === 'depreciation' && row.depreciation !== undefined) {
          value = Math.abs(row.depreciation); // Positive for cash flow addback
        }
        
        return typeof value === 'number' ? value.toFixed(2) : `"${(value || '').toString().replace(/"/g, '""')}"`
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}