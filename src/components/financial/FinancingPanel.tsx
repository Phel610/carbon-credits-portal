import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FinancingPanelProps {
  modelInputs: any;
  years: number[];
}

const FinancingPanel = ({ modelInputs, years }: FinancingPanelProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTotalForArray = (arr: number[]) => {
    return arr.reduce((sum, val) => sum + val, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financing Strategy</CardTitle>
        <CardDescription>
          Capital structure, cost of capital, and funding sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Financing parameters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Discount Rate</p>
            <p className="text-lg font-semibold">{formatPercent(modelInputs.discount_rate || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Interest Rate</p>
            <p className="text-lg font-semibold">{formatPercent(modelInputs.interest_rate || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Debt Duration</p>
            <p className="text-lg font-semibold">{modelInputs.debt_duration_years || 0} years</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Pre-purchase Share</p>
            <p className="text-lg font-semibold">{formatPercent(modelInputs.purchase_share || 0)}</p>
          </div>
        </div>

        {/* Initial conditions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Initial Equity (T0)</p>
            <p className="text-lg font-semibold">{formatCurrency(modelInputs.initial_equity_t0 || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Opening Cash (Y1)</p>
            <p className="text-lg font-semibold">{formatCurrency(modelInputs.opening_cash_y1 || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Initial PPE</p>
            <p className="text-lg font-semibold">{formatCurrency(modelInputs.initial_ppe || 0)}</p>
          </div>
        </div>

        {/* Yearly financing flows table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] font-semibold">Financing Flow</TableHead>
                {years.map((year) => (
                  <TableHead key={year} className="text-right font-semibold">
                    {year}
                  </TableHead>
                ))}
                <TableHead className="text-right font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Equity Injections</TableCell>
                {years.map((year, idx) => (
                  <TableCell key={year} className="text-right">
                    {formatCurrency(modelInputs.equity_injection?.[idx] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(getTotalForArray(modelInputs.equity_injection || []))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Debt Draws</TableCell>
                {years.map((year, idx) => (
                  <TableCell key={year} className="text-right">
                    {formatCurrency(modelInputs.debt_draw?.[idx] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(getTotalForArray(modelInputs.debt_draw || []))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Pre-purchase Advances</TableCell>
                {years.map((year, idx) => (
                  <TableCell key={year} className="text-right">
                    {formatCurrency(modelInputs.purchase_amount?.[idx] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(getTotalForArray(modelInputs.purchase_amount || []))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancingPanel;
