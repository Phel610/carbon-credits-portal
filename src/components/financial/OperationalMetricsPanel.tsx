import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OperationalMetricsPanelProps {
  statements: any[];
}

const OperationalMetricsPanel = ({ statements }: OperationalMetricsPanelProps) => {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

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
        <CardTitle>Operational Metrics</CardTitle>
        <CardDescription>
          Core operational inputs and credit generation assumptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] font-semibold">Metric</TableHead>
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
                <TableCell className="font-medium">Number of credits generated</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatNumber(stmt.credits_generated)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatNumber(statements.reduce((sum, stmt) => sum + stmt.credits_generated, 0))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Price per credit</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatCurrency(stmt.price_per_credit)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  -
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Issuance years</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {stmt.issuance_flag || 0}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  -
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Number of credits issued</TableCell>
                {statements.map((stmt) => (
                  <TableCell key={stmt.year} className="text-right">
                    {formatNumber(stmt.credits_issued)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatNumber(statements.reduce((sum, stmt) => sum + stmt.credits_issued, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationalMetricsPanel;