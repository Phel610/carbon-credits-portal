export const HEADERS = {
  incomeStatement: [
    "year","credits_generated","credits_issued","price_per_credit","purchased_credits",
    "implied_purchase_price","spot_revenue","pre_purchase_revenue","total_revenue",
    "cogs","gross_profit","feasibility_costs","pdd_costs","mrv_costs","staff_costs","opex_total",
    "ebitda","depreciation","ebit","interest_expense","earnings_before_tax","income_tax","net_income"
  ],
  balanceSheet: [
    "year","cash","accounts_receivable","ppe_net","total_assets",
    "accounts_payable","unearned_revenue","debt_balance","total_liabilities",
    "total_equity","total_liabilities_equity","balance_check"
  ],
  cashFlow: [
    "year","operating_cash_flow","investing_cash_flow","financing_cash_flow",
    "cash_start","net_change_cash","cash_end"
  ],
  debtSchedule: [
    "year","beginning_balance","draw","principal_payment","ending_balance","interest_expense","dscr"
  ],
  carbonStream: [
    "year","purchase_amount","purchased_credits","implied_purchase_price"
  ],
  freeCashFlow: [
    "year","net_income","depreciation_addback","change_working_capital","capex","net_borrowing","fcf_to_equity"
  ]
};

export function exportToCSV(data: any[], headers: string[], filename: string) {
  if (!data || data.length === 0) return;
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
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
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
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