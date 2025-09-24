import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BalanceSheet } from '@/lib/financial/calculationEngine';

interface BalanceSheetTableProps {
  statements: BalanceSheet[];
}

const BalanceSheetTable = ({ statements }: BalanceSheetTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Sheet</CardTitle>
        <CardDescription>
          Assets, liabilities, and equity position by year-end
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] font-semibold">Balance Sheet Items</TableHead>
                {statements.map((stmt) => (
                  <TableHead key={stmt.year} className="text-right font-semibold">
                    {stmt.year}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* ASSETS SECTION */}
              <TableRow className="bg-trust/10">
                <TableCell className="font-bold text-lg">ASSETS</TableCell>
                {statements.map(() => (
                  <TableCell key="assets-header"></TableCell>
                ))}
              </TableRow>

              {/* Current Assets */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">Current Assets</TableCell>
                {statements.map(() => (
                  <TableCell key="current-assets-header"></TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Cash and Cash Equivalents</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.cash)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Accounts Receivable</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.accounts_receivable)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="border-b">
                <TableCell className="font-semibold">Total Current Assets</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold">
                    {formatCurrency(stmt.total_current_assets)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Non-Current Assets */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">Non-Current Assets</TableCell>
                {statements.map(() => (
                  <TableCell key="non-current-assets-header"></TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Property, Plant & Equipment (Gross)</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.ppe_gross)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Less: Accumulated Depreciation</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    ({formatCurrency(stmt.accumulated_depreciation)})
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="border-b">
                <TableCell className="pl-4 font-medium">PP&E, Net</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-medium">
                    {formatCurrency(stmt.ppe_net)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="border-b-2 bg-muted/30">
                <TableCell className="font-bold text-lg">TOTAL ASSETS</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold text-lg">
                    {formatCurrency(stmt.total_assets)}
                  </TableCell>
                ))}
              </TableRow>

              {/* LIABILITIES SECTION */}
              <TableRow className="bg-trust/10">
                <TableCell className="font-bold text-lg">LIABILITIES</TableCell>
                {statements.map(() => (
                  <TableCell key="liabilities-header"></TableCell>
                ))}
              </TableRow>

              {/* Current Liabilities */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">Current Liabilities</TableCell>
                {statements.map(() => (
                  <TableCell key="current-liabilities-header"></TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Accounts Payable</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.accounts_payable)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Unearned Revenue</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.unearned_revenue)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Current Portion of Long-Term Debt</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.current_portion_debt)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="border-b">
                <TableCell className="font-semibold">Total Current Liabilities</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold">
                    {formatCurrency(stmt.total_current_liabilities)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Long-Term Liabilities */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">Long-Term Liabilities</TableCell>
                {statements.map(() => (
                  <TableCell key="long-term-liabilities-header"></TableCell>
                ))}
              </TableRow>

              <TableRow className="border-b">
                <TableCell className="pl-4">Long-Term Debt</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.long_term_debt)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="border-b-2">
                <TableCell className="font-bold">TOTAL LIABILITIES</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold">
                    {formatCurrency(stmt.total_liabilities)}
                  </TableCell>
                ))}
              </TableRow>

              {/* EQUITY SECTION */}
              <TableRow className="bg-trust/10">
                <TableCell className="font-bold text-lg">EQUITY</TableCell>
                {statements.map(() => (
                  <TableCell key="equity-header"></TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Retained Earnings</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.retained_earnings)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Shareholder Equity</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.shareholder_equity)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="border-b-2">
                <TableCell className="font-bold">TOTAL EQUITY</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold">
                    {formatCurrency(stmt.total_equity)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="border-b-2 bg-muted/30">
                <TableCell className="font-bold text-lg">TOTAL LIABILITIES & EQUITY</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold text-lg">
                    {formatCurrency(stmt.total_liabilities_equity)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Balance Check */}
              <TableRow className="bg-success/10">
                <TableCell className="font-semibold text-sm">Balance Check (Assets - Liab & Equity)</TableCell>
                {statements.map((stmt) => {
                  const difference = stmt.total_assets - stmt.total_liabilities_equity;
                  const isBalanced = Math.abs(difference) < 1;
                  return (
                    <TableCell 
                      key={stmt.year} 
                      className={`text-right text-sm ${isBalanced ? 'text-success' : 'text-destructive'}`}
                    >
                      {isBalanced ? '✓ Balanced' : formatCurrency(difference)}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceSheetTable;