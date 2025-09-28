import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AssumptionsPanelProps {
  discountRate: number;
  initialEquity: number;
  interestRate?: number;
  debtDuration?: number;
}

const AssumptionsPanel = ({ 
  discountRate, 
  initialEquity, 
  interestRate, 
  debtDuration 
}: AssumptionsPanelProps) => {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

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
        <CardTitle>Key Assumptions</CardTitle>
        <CardDescription>
          Core financial and operational assumptions used in the model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Discount rate</div>
            <Badge variant="outline" className="text-base font-semibold">
              {formatPercentage(discountRate)}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Initial founder investment (year 0)</div>
            <Badge variant="outline" className="text-base font-semibold">
              {formatCurrency(initialEquity)}
            </Badge>
          </div>

          {interestRate !== undefined && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Interest rate</div>
              <Badge variant="outline" className="text-base font-semibold">
                {formatPercentage(interestRate)}
              </Badge>
            </div>
          )}

          {debtDuration !== undefined && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Debt duration</div>
              <Badge variant="outline" className="text-base font-semibold">
                {debtDuration} years
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssumptionsPanel;