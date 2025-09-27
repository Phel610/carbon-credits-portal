import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DebtSchedule } from '@/lib/financial/calculationEngine';

interface DebtScheduleTableProps {
  statements: DebtSchedule[];
}

const DebtScheduleTable = ({ statements }: DebtScheduleTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRatio = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return 'N/A';
    return value.toFixed(2) + 'x';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debt Schedule</CardTitle>
        <CardDescription>
          Debt balances, principal payments, interest expense, and debt service coverage
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
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Beginning Balance</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-beginning`} className="text-right">
                    {formatCurrency(stmt.beginning_balance)}
                  </TableCell>
                ))}
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Draw</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-draw`} className="text-right">
                    {formatCurrency(stmt.draw)}
                  </TableCell>
                ))}
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Principal Payment</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-principal`} className="text-right">
                    {formatCurrency(stmt.principal_payment)}
                  </TableCell>
                ))}
              </TableRow>
              
              <TableRow className="bg-muted/30">
                <TableCell className="font-semibold">Ending Balance</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-ending`} className="text-right font-semibold">
                    {formatCurrency(stmt.ending_balance)}
                  </TableCell>
                ))}
              </TableRow>
              
              <TableRow className="border-t-2">
                <TableCell className="font-medium">Interest Expense</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-interest`} className="text-right">
                    {formatCurrency(stmt.interest_expense)}
                  </TableCell>
                ))}
              </TableRow>
              
              <TableRow className="bg-trust/10">
                <TableCell className="font-semibold">DSCR</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-dscr`} className="text-right font-semibold">
                    {formatRatio(stmt.dscr)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebtScheduleTable;