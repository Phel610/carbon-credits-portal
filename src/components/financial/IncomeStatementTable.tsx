import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { IncomeStatement } from '@/lib/financial/calculationEngine';
import { exportToCSV, exportToExcel, HEADERS } from '@/lib/utils/exportUtils';

interface IncomeStatementTableProps {
  statements: IncomeStatement[];
  metadata?: any;
}

const IncomeStatementTable = ({ statements, metadata }: IncomeStatementTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatExpense = (amount: number) => {
    if (amount === 0) return '$0.00';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    return amount > 0 ? formatted : `(${formatted})`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleExportCSV = () => {
    exportToCSV(statements, HEADERS.incomeStatement, 'income-statement', metadata);
  };

  const handleExportExcel = () => {
    exportToExcel(statements, HEADERS.incomeStatement, 'income-statement', metadata);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Income Statement</CardTitle>
          <CardDescription>
            Revenue, expenses, and profitability projections by year
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
                <TableHead className="w-[200px] font-semibold">Line Item</TableHead>
                {statements.map((stmt) => (
                  <TableHead key={stmt.year} className="text-right font-semibold">
                    {stmt.year}
                  </TableHead>
                ))}
                <TableHead className="text-right font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>

              {/* Revenue Section */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">REVENUE</TableCell>
                {statements.map(() => (
                  <TableCell key="revenue-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-4">Carbon credit revenue – spot market</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.spot_revenue)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.spot_revenue, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Carbon credit revenue – pre-purchase</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.pre_purchase_revenue)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.pre_purchase_revenue, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b-2">
                <TableCell className="font-semibold">Total</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold">
                    {formatCurrency(stmt.total_revenue)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.total_revenue, 0))}
                </TableCell>
              </TableRow>

              {/* COGS Section */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">Cost of goods sold</TableCell>
                {statements.map(() => (
                  <TableCell key="cogs-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-4">COGS</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatExpense(stmt.cogs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatExpense(statements.reduce((sum, stmt) => sum + stmt.cogs, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b-2">
                <TableCell className="font-semibold">Gross Profit</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold text-trust">
                    {formatCurrency(stmt.total_revenue - stmt.cogs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-trust">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + (stmt.total_revenue - stmt.cogs), 0))}
                </TableCell>
              </TableRow>

              {/* Operating Expenses Section */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">OPERATING EXPENSES</TableCell>
                {statements.map(() => (
                  <TableCell key="opex-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Feasibility study costs</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatExpense(stmt.feasibility_costs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatExpense(statements.reduce((sum, stmt) => sum + stmt.feasibility_costs, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">PDD development costs</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatExpense(stmt.pdd_costs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatExpense(statements.reduce((sum, stmt) => sum + stmt.pdd_costs, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Monitoring, Reporting, and Verification (MRV) costs</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatExpense(stmt.mrv_costs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatExpense(statements.reduce((sum, stmt) => sum + stmt.mrv_costs, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Staff costs</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatExpense(stmt.staff_costs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatExpense(statements.reduce((sum, stmt) => sum + stmt.staff_costs, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b">
                <TableCell className="font-semibold">Total Operational cost</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold">
                    {formatExpense(stmt.opex_total)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">
                  {formatExpense(statements.reduce((sum, stmt) => sum + stmt.opex_total, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b-2">
                <TableCell className="font-semibold">EBITDA</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold text-trust">
                    {formatCurrency(stmt.ebitda)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-trust">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.ebitda, 0))}
                </TableCell>
              </TableRow>

              {/* Below EBITDA */}
              <TableRow>
                <TableCell className="font-semibold">Depreciation</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatExpense(stmt.depreciation)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatExpense(statements.reduce((sum, stmt) => sum + stmt.depreciation, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">EBIT</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold text-trust">
                    {formatCurrency(stmt.ebitda - Math.abs(stmt.depreciation))}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-trust">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + (stmt.ebitda - Math.abs(stmt.depreciation)), 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">Interest payments</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatExpense(stmt.interest_expense)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatExpense(statements.reduce((sum, stmt) => sum + stmt.interest_expense, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">Earnings Before Tax</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold">
                    {formatCurrency(stmt.earnings_before_tax)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.earnings_before_tax, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">Income Tax</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatExpense(stmt.income_tax)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatExpense(statements.reduce((sum, stmt) => sum + stmt.income_tax, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b-2 bg-muted/30">
                <TableCell className="font-bold">Net Income</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold text-lg">
                    {formatCurrency(stmt.net_income)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.net_income, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeStatementTable;