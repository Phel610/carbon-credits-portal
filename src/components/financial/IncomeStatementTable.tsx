import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IncomeStatement } from '@/lib/financial/calculationEngine';

interface IncomeStatementTableProps {
  statements: IncomeStatement[];
}

const IncomeStatementTable = ({ statements }: IncomeStatementTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0.0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income Statement</CardTitle>
        <CardDescription>
          Revenue, expenses, and profitability projections by year
        </CardDescription>
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
                <TableCell className="pl-4">Spot Credit Sales</TableCell>
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
                <TableCell className="pl-4">Pre-Purchase Revenue</TableCell>
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
                <TableCell className="font-semibold">Total Revenue</TableCell>
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
              <TableRow>
                <TableCell className="font-semibold">Cost of Goods Sold</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.cogs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.cogs, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b-2">
                <TableCell className="font-semibold">Gross Profit</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold">
                    {formatCurrency(stmt.gross_profit)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.gross_profit, 0))}
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
                <TableCell className="pl-4">Feasibility Study</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.feasibility_costs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.feasibility_costs, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">PDD Development</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.pdd_costs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.pdd_costs, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">MRV Costs</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.mrv_costs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.mrv_costs, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Staff Costs</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.staff_costs)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.staff_costs, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b">
                <TableCell className="font-semibold">Total Operating Expenses</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-semibold">
                    {formatCurrency(stmt.total_opex)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.total_opex, 0))}
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
                    {formatCurrency(stmt.depreciation)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.depreciation, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">Interest Expense</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.interest_expense)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.interest_expense, 0))}
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
                    {formatCurrency(stmt.income_tax)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.income_tax, 0))}
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

              {/* Margin Analysis */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">MARGIN ANALYSIS</TableCell>
                {statements.map(() => (
                  <TableCell key="margin-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Gross Margin</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatPercentage(stmt.gross_profit, stmt.total_revenue)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatPercentage(
                    statements.reduce((sum, stmt) => sum + stmt.gross_profit, 0),
                    statements.reduce((sum, stmt) => sum + stmt.total_revenue, 0)
                  )}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">EBITDA Margin</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatPercentage(stmt.ebitda, stmt.total_revenue)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatPercentage(
                    statements.reduce((sum, stmt) => sum + stmt.ebitda, 0),
                    statements.reduce((sum, stmt) => sum + stmt.total_revenue, 0)
                  )}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Net Margin</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatPercentage(stmt.net_income, stmt.total_revenue)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatPercentage(
                    statements.reduce((sum, stmt) => sum + stmt.net_income, 0),
                    statements.reduce((sum, stmt) => sum + stmt.total_revenue, 0)
                  )}
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