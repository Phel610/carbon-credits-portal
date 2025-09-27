import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CarbonStream } from '@/lib/financial/calculationEngine';

interface CarbonStreamTableProps {
  statements: CarbonStream[];
  investorIRR: number;
}

const CarbonStreamTable = ({ statements, investorIRR }: CarbonStreamTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCredits = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalPurchaseAmount = statements.reduce((sum, stmt) => sum + stmt.purchase_amount, 0);
  const totalCredits = statements.reduce((sum, stmt) => sum + stmt.purchased_credits, 0);
  const totalCashFlow = statements.reduce((sum, stmt) => sum + stmt.investor_cash_flow, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carbon Stream Investor Analysis</CardTitle>
        <CardDescription>
          Pre-purchase agreements, credit delivery, and investor returns
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
                <TableCell className="font-medium">Purchase Amount</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-purchase`} className="text-right">
                    {formatCurrency(stmt.purchase_amount)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  {formatCurrency(totalPurchaseAmount)}
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Credits Purchased</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-credits`} className="text-right">
                    {formatCredits(stmt.purchased_credits)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  {formatCredits(totalCredits)}
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-muted/30">
                <TableCell className="font-semibold">Implied Purchase Price</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-price`} className="text-right">
                    {formatCurrency(stmt.implied_purchase_price)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  {totalCredits > 0 ? formatCurrency(totalPurchaseAmount / totalCredits) : 'N/A'}
                </TableCell>
              </TableRow>
              
              <TableRow className="border-t-2">
                <TableCell className="font-semibold">Investor Cash Flow</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={`${stmt.year}-cf`} className="text-right">
                    {formatCurrency(stmt.investor_cash_flow)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  {formatCurrency(totalCashFlow)}
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-trust/10">
                <TableCell className="font-semibold">Investor IRR</TableCell>
                <TableCell colSpan={statements.length + 1} className="text-right font-semibold">
                  {formatPercentage(investorIRR)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarbonStreamTable;