import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FreeCashFlow } from '@/lib/financial/calculationEngine';

interface FreeCashFlowTableProps {
  statements: FreeCashFlow[];
}

const FreeCashFlowTable = ({ statements }: FreeCashFlowTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalFCF = statements.reduce((sum, stmt) => sum + stmt.fcf_to_equity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Free Cash Flow to Equity</CardTitle>
        <CardDescription>
          Detailed breakdown of cash flows available to equity holders
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
              <TableRow>
                <TableCell className="font-medium">Net Income</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-ni`} className="text-right">
                    {formatCurrency(stmt.net_income)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.net_income, 0))}
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">+ Depreciation</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-dep`} className="text-right">
                    {formatCurrency(stmt.depreciation_addback)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.depreciation_addback, 0))}
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">- Change in Working Capital</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-wc`} className="text-right">
                    {formatCurrency(-stmt.change_working_capital)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {formatCurrency(-statements.reduce((sum, stmt) => sum + stmt.change_working_capital, 0))}
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">- CAPEX</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-capex`} className="text-right">
                    {formatCurrency(-stmt.capex)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {formatCurrency(-statements.reduce((sum, stmt) => sum + stmt.capex, 0))}
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">+ Net Borrowing</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-borrowing`} className="text-right">
                    {formatCurrency(stmt.net_borrowing)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.net_borrowing, 0))}
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-trust/10 border-t-2">
                <TableCell className="font-semibold">FCF to Equity</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-fcf`} className="text-right font-semibold">
                    {formatCurrency(stmt.fcf_to_equity)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  {formatCurrency(totalFCF)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default FreeCashFlowTable;