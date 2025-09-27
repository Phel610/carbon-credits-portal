import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { BalanceSheet } from '@/lib/financial/calculationEngine';
import { exportToCSV, exportToExcel, HEADERS } from '@/lib/utils/exportUtils';

interface BalanceSheetTableProps {
  statements: BalanceSheet[];
  metadata?: any;
}

const BalanceSheetTable = ({ statements, metadata }: BalanceSheetTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleExportCSV = () => {
    exportToCSV(statements, HEADERS.balanceSheet, 'balance-sheet');
  };

  const handleExportExcel = () => {
    exportToExcel(statements, HEADERS.balanceSheet, 'balance-sheet', metadata);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Balance Sheet</CardTitle>
          <CardDescription>
            Assets, liabilities, and equity position by year-end
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
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

              <TableRow>
                <TableCell className="pl-4">Cash</TableCell>
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

              <TableRow>
                <TableCell className="pl-4">Property, Plant & Equipment, Net</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
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
                <TableCell className="pl-4">Debt Balance</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.debt_balance)}
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
                  const difference = stmt.balance_check;
                  const isBalanced = Math.abs(difference) < 0.01;
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