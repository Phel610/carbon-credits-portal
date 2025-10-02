import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ExpensesPanelProps {
  modelInputs: any;
  years: number[];
}

const ExpensesPanel = ({ modelInputs, years }: ExpensesPanelProps) => {
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTotalForArray = (arr: number[]) => {
    return arr.reduce((sum, val) => sum + Math.abs(val), 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses & Operating Assumptions</CardTitle>
        <CardDescription>
          Cost structure, tax rates, and working capital assumptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rate-based inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground mb-1">COGS Rate</p>
            <p className="text-lg font-semibold">{formatPercent(modelInputs.cogs_rate || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">AR Rate</p>
            <p className="text-lg font-semibold">{formatPercent(modelInputs.ar_rate || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">AP Rate</p>
            <p className="text-lg font-semibold">{formatPercent(modelInputs.ap_rate || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Income Tax Rate</p>
            <p className="text-lg font-semibold">{formatPercent(modelInputs.income_tax_rate || 0)}</p>
          </div>
        </div>

        {/* Yearly expenses table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] font-semibold">Expense Category</TableHead>
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
                <TableCell className="font-medium">Feasibility Costs</TableCell>
                {years.map((year, idx) => (
                  <TableCell key={year} className="text-right">
                    {formatCurrency(Math.abs(modelInputs.feasibility_costs?.[idx] || 0))}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(getTotalForArray(modelInputs.feasibility_costs || []))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">PDD Costs</TableCell>
                {years.map((year, idx) => (
                  <TableCell key={year} className="text-right">
                    {formatCurrency(Math.abs(modelInputs.pdd_costs?.[idx] || 0))}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(getTotalForArray(modelInputs.pdd_costs || []))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">MRV Costs</TableCell>
                {years.map((year, idx) => (
                  <TableCell key={year} className="text-right">
                    {formatCurrency(Math.abs(modelInputs.mrv_costs?.[idx] || 0))}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(getTotalForArray(modelInputs.mrv_costs || []))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Staff Costs</TableCell>
                {years.map((year, idx) => (
                  <TableCell key={year} className="text-right">
                    {formatCurrency(Math.abs(modelInputs.staff_costs?.[idx] || 0))}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(getTotalForArray(modelInputs.staff_costs || []))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">CAPEX</TableCell>
                {years.map((year, idx) => (
                  <TableCell key={year} className="text-right">
                    {formatCurrency(Math.abs(modelInputs.capex?.[idx] || 0))}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(getTotalForArray(modelInputs.capex || []))}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Depreciation</TableCell>
                {years.map((year, idx) => (
                  <TableCell key={year} className="text-right">
                    {formatCurrency(Math.abs(modelInputs.depreciation?.[idx] || 0))}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(getTotalForArray(modelInputs.depreciation || []))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpensesPanel;
