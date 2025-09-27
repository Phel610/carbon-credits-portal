import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CashFlowStatement } from '@/lib/financial/calculationEngine';

interface CashFlowStatementTableProps {
  statements: CashFlowStatement[];
}

const CashFlowStatementTable = ({ statements }: CashFlowStatementTableProps) => {
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
        <CardTitle>Cash Flow Statement</CardTitle>
        <CardDescription>
          Operating, investing, and financing cash flows by year
        </CardDescription>
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
              {/* OPERATING ACTIVITIES */}
              <TableRow className="bg-trust/10">
                <TableCell className="font-bold text-lg">OPERATING ACTIVITIES</TableCell>
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

              <TableRow className="bg-muted/50">
                <TableCell className="pl-4 font-medium">Adjustments for Non-Cash Items:</TableCell>
                {statements.map(() => (
                  <TableCell key="adjustments-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-8">Depreciation & Amortization</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.depreciation_addback)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.depreciation_addback, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="bg-muted/50">
                <TableCell className="pl-4 font-medium">Changes in Working Capital:</TableCell>
                {statements.map(() => (
                  <TableCell key="working-capital-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-8">(Increase) / Decrease in Accounts Receivable</TableCell>
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
                <TableCell className="pl-8">Increase / (Decrease) in Accounts Payable</TableCell>
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
                <TableCell className="pl-8">Unearned Revenue Flows</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.unearned_inflow + stmt.unearned_release)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.unearned_inflow + stmt.unearned_release, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b-2 bg-trust/5">
                <TableCell className="font-bold">Net Cash from Operating Activities</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold text-trust">
                    {formatCurrency(stmt.operating_cash_flow)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-trust">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.operating_cash_flow, 0))}
                </TableCell>
              </TableRow>

              {/* INVESTING ACTIVITIES */}
              <TableRow className="bg-trust/10">
                <TableCell className="font-bold text-lg">INVESTING ACTIVITIES</TableCell>
                {statements.map(() => (
                  <TableCell key="investing-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Capital Expenditures (CAPEX)</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.capex)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.capex, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b-2 bg-orange-50">
                <TableCell className="font-bold">Net Cash from Investing Activities</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold text-orange-700">
                    {formatCurrency(stmt.investing_cash_flow)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-orange-700">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.investing_cash_flow, 0))}
                </TableCell>
              </TableRow>

              {/* FINANCING ACTIVITIES */}
              <TableRow className="bg-trust/10">
                <TableCell className="font-bold text-lg">FINANCING ACTIVITIES</TableCell>
                {statements.map(() => (
                  <TableCell key="financing-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Equity Injections</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.equity_injection)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.equity_injection, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Debt Drawdowns</TableCell>
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
                <TableCell className="pl-4">Debt Repayments</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.debt_repayment)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.debt_repayment, 0))}
                </TableCell>
              </TableRow>

              <TableRow className="border-b-2 bg-blue-50">
                <TableCell className="font-bold">Net Cash from Financing Activities</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold text-blue-700">
                    {formatCurrency(stmt.financing_cash_flow)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-blue-700">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.financing_cash_flow, 0))}
                </TableCell>
              </TableRow>

              {/* NET CHANGE IN CASH */}
              <TableRow className="border-b-2 bg-muted/30">
                <TableCell className="font-bold text-lg">Net Change in Cash</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold text-lg">
                    {formatCurrency(stmt.net_change_cash)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.net_change_cash, 0))}
                </TableCell>
              </TableRow>

              {/* CASH RECONCILIATION */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">CASH RECONCILIATION</TableCell>
                {statements.map(() => (
                  <TableCell key="reconciliation-header"></TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Cash at Beginning of Period</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.cash_start)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements[0]?.cash_start || 0)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="pl-4">Net Change in Cash</TableCell>
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
                <TableCell className="font-bold text-lg">Cash at End of Period</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right font-bold text-lg">
                    {formatCurrency(stmt.cash_end)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrency(statements[statements.length - 1]?.cash_end || 0)}
                </TableCell>
              </TableRow>

              {/* Free Cash Flow Analysis */}
              <TableRow className="bg-success/10">
                <TableCell className="font-bold">Free Cash Flow to Equity</TableCell>
                {statements.map((stmt) => {
                  const freeCashFlow = stmt.operating_cash_flow + stmt.capex;
                  return (
                    <TableCell key={stmt.year} className="text-right font-bold text-success">
                      {formatCurrency(freeCashFlow)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-bold text-success">
                  {formatCurrency(
                    statements.reduce((sum, stmt) => sum + stmt.operating_cash_flow + stmt.capex, 0)
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

export default CashFlowStatementTable;