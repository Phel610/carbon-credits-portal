import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { CashFlowStatement } from '@/lib/financial/calculationEngine';
import { exportToCSV, exportToExcel, HEADERS } from '@/lib/utils/exportUtils';

interface CashFlowStatementTableProps {
  statements: CashFlowStatement[];
  metadata?: any;
}

const CashFlowStatementTable = ({ statements, metadata }: CashFlowStatementTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleExportCSV = () => {
    exportToCSV(statements, HEADERS.cashFlow, 'cash-flow-statement');
  };

  const handleExportExcel = () => {
    exportToExcel(statements, HEADERS.cashFlow, 'cash-flow-statement', metadata);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cash Flow Statement</CardTitle>
          <CardDescription>
            Cash flow from operating, investing, and financing activities by year
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
                <TableHead className="w-[200px] font-semibold">Cash Flow Items</TableHead>
                {statements.map((stmt) => (
                  <TableHead key={stmt.year} className="text-right font-semibold">
                    {stmt.year}
                  </TableHead>
                ))}
                <TableHead className="text-right font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Operating Activities Section */}
              <TableRow className="bg-trust/10">
                <TableCell className="font-bold">OPERATING ACTIVITIES</TableCell>
                {statements.map(() => (
                  <TableCell key="operating-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Net Income</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.net_income)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.net_income, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Depreciation</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.depreciation_addback)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.depreciation_addback, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Decrease in accounts receivable</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(-stmt.change_ar)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + (-stmt.change_ar), 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Increase in accounts payable</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.change_ap)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.change_ap, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Change in unearned revenue (prepurchase) account</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.unearned_inflow - stmt.unearned_release)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + (stmt.unearned_inflow - stmt.unearned_release), 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b">
                <TableCell className="font-semibold">Operating Cash Flow</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold">
                    {formatCurrency(stmt.operating_cash_flow)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.operating_cash_flow, 0))}
                </TableCell>
              </TableRow>

              {/* Investing Activities Section */}
              <TableRow className="bg-trust/10">
                <TableCell className="font-bold">INVESTING ACTIVITIES</TableCell>
                {statements.map(() => (
                  <TableCell key="investing-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">CAPEX</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(-stmt.capex)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + (-stmt.capex), 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b">
                <TableCell className="font-semibold">Investing Cash Flow</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold">
                    {formatCurrency(stmt.investing_cash_flow)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.investing_cash_flow, 0))}
                </TableCell>
              </TableRow>

              {/* Financing Activities Section */}
              <TableRow className="bg-trust/10">
                <TableCell className="font-bold">FINANCING ACTIVITIES</TableCell>
                {statements.map(() => (
                  <TableCell key="financing-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Debt financing</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.debt_draw)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.debt_draw, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Debt repayments</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(-stmt.debt_repayment)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + (-stmt.debt_repayment), 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Equity injection</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.equity_injection || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + (stmt.equity_injection || 0), 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b">
                <TableCell className="font-semibold">Financing Cash Flow</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold">
                    {formatCurrency(stmt.financing_cash_flow)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.financing_cash_flow, 0))}
                </TableCell>
              </TableRow>

              {/* Cash Position */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">CASH POSITION</TableCell>
                {statements.map(() => (
                  <TableCell key="cash-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Cash Start</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.cash_start)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  -
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Net Change Cash</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.net_change_cash)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.net_change_cash, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b-2 bg-muted/30">
                <TableCell className="font-bold">Cash End</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold text-lg">
                    {formatCurrency(stmt.cash_end)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-lg">
                  -
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashFlowStatementTable;