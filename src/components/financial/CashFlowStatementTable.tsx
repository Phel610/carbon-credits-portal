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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Statement</CardTitle>
        <CardDescription>
          Cash flow from operating, investing, and financing activities by year
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
              {/* Operating Activities */}
              <TableRow>
                <TableCell className="font-semibold">Operating Cash Flow</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.operating_cash_flow)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.operating_cash_flow, 0))}
                </TableCell>
              </TableRow>

              {/* Investing Activities */}
              <TableRow>
                <TableCell className="font-semibold">Investing Cash Flow</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.investing_cash_flow)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.investing_cash_flow, 0))}
                </TableCell>
              </TableRow>

              {/* Financing Activities */}
              <TableRow>
                <TableCell className="font-semibold">Financing Cash Flow</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.financing_cash_flow)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
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