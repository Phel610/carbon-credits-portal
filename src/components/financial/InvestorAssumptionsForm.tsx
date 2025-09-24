import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, TrendingUp, Target, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InvestorAssumptionsFormProps {
  modelId: string;
  model: {
    id: string;
    name: string;
    start_year: number;
    end_year: number;
  };
}

const InvestorAssumptionsForm = ({ modelId, model }: InvestorAssumptionsFormProps) => {
  // Purchase Parameters
  const [purchaseAmount, setPurchaseAmount] = useState(1000000); // $1M default
  const [percentageOfCredits, setPercentageOfCredits] = useState(50); // 50% default
  
  // Return Requirements
  const [discountRate, setDiscountRate] = useState(15); // 15% default
  const [targetIRR, setTargetIRR] = useState(20); // 20% target IRR
  const [paybackPeriod, setPaybackPeriod] = useState(5); // 5 years
  
  // Investment Timeline
  const [investmentYear, setInvestmentYear] = useState(model.start_year);
  const [exitYear, setExitYear] = useState(model.end_year);
  
  // Risk Factors
  const [creditPriceRisk, setCreditPriceRisk] = useState(20); // 20% volatility
  const [volumeRisk, setVolumeRisk] = useState(15); // 15% volume risk
  const [regulatoryRisk, setRegulatoryRisk] = useState(10); // 10% reg risk
  
  // Founder Investment
  const [founderInvestment, setFounderInvestment] = useState(100000); // $100k default
  const [founderEquityPercentage, setFounderEquityPercentage] = useState(25); // 25% founder equity
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const saveInvestorAssumptions = async () => {
    setLoading(true);
    try {
      const investorInputs = [
        // Purchase parameters
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'purchase_amount',
          input_value: { value: purchaseAmount },
        },
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'percentage_of_credits',
          input_value: { value: percentageOfCredits },
        },
        // Return requirements
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'discount_rate',
          input_value: { value: discountRate },
        },
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'target_irr',
          input_value: { value: targetIRR },
        },
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'payback_period',
          input_value: { value: paybackPeriod },
        },
        // Investment timeline
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'investment_year',
          input_value: { value: investmentYear },
        },
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'exit_year',
          input_value: { value: exitYear },
        },
        // Risk factors
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'credit_price_risk',
          input_value: { value: creditPriceRisk },
        },
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'volume_risk',
          input_value: { value: volumeRisk },
        },
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'regulatory_risk',
          input_value: { value: regulatoryRisk },
        },
        // Founder investment
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'founder_investment',
          input_value: { value: founderInvestment },
        },
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'founder_equity_percentage',
          input_value: { value: founderEquityPercentage },
        },
        // Notes
        {
          model_id: modelId,
          category: 'investor_assumptions',
          input_key: 'notes',
          input_value: { value: notes },
        },
      ];

      // Delete existing investor assumption inputs
      const { error: deleteError } = await supabase
        .from('model_inputs')
        .delete()
        .eq('model_id', modelId)
        .eq('category', 'investor_assumptions');

      if (deleteError) throw deleteError;

      // Insert new inputs
      const { error: insertError } = await supabase
        .from('model_inputs')
        .insert(investorInputs);

      if (insertError) throw insertError;

      toast({
        title: "Investor assumptions saved",
        description: "Your investor assumptions have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving investor assumptions:', error);
      toast({
        title: "Error saving assumptions",
        description: "Failed to save investor assumptions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalInvestment = purchaseAmount + founderInvestment;
  const expectedReturn = (purchaseAmount * targetIRR) / 100;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Investment</CardDescription>
            <CardTitle className="text-2xl">${totalInvestment.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Target IRR</CardDescription>
            <CardTitle className="text-2xl">{targetIRR}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Discount Rate</CardDescription>
            <CardTitle className="text-2xl">{discountRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Credits Purchase</CardDescription>
            <CardTitle className="text-2xl">{percentageOfCredits}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Investment Parameters */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Purchase Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Investment Parameters
            </CardTitle>
            <CardDescription>
              How much will investors purchase and when
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="purchase-amount">Investment Amount (USD)</Label>
              <Input
                id="purchase-amount"
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                placeholder="1000000"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total amount investors will invest in the project
              </p>
            </div>
            <div>
              <Label htmlFor="credits-percentage">Percentage of Credits Purchased (%)</Label>
              <Input
                id="credits-percentage"
                type="number"
                step="0.1"
                value={percentageOfCredits}
                onChange={(e) => setPercentageOfCredits(Number(e.target.value))}
                placeholder="50"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                What percentage of total credits will investors purchase
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="investment-year">Investment Year</Label>
                <Input
                  id="investment-year"
                  type="number"
                  value={investmentYear}
                  onChange={(e) => setInvestmentYear(Number(e.target.value))}
                  min={model.start_year}
                  max={model.end_year}
                />
              </div>
              <div>
                <Label htmlFor="exit-year">Exit Year</Label>
                <Input
                  id="exit-year"
                  type="number"
                  value={exitYear}
                  onChange={(e) => setExitYear(Number(e.target.value))}
                  min={model.start_year}
                  max={model.end_year}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Return Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Return Requirements
            </CardTitle>
            <CardDescription>
              Expected returns and hurdle rates for investors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="discount-rate">Discount Rate (%)</Label>
              <Input
                id="discount-rate"
                type="number"
                step="0.1"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                placeholder="15.0"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for NPV calculations and valuation
              </p>
            </div>
            <div>
              <Label htmlFor="target-irr">Target IRR (%)</Label>
              <Input
                id="target-irr"
                type="number"
                step="0.1"
                value={targetIRR}
                onChange={(e) => setTargetIRR(Number(e.target.value))}
                placeholder="20.0"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Internal Rate of Return target for investors
              </p>
            </div>
            <div>
              <Label htmlFor="payback-period">Target Payback Period (Years)</Label>
              <Input
                id="payback-period"
                type="number"
                value={paybackPeriod}
                onChange={(e) => setPaybackPeriod(Number(e.target.value))}
                placeholder="5"
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How quickly investors want to recover their investment
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
          <CardDescription>
            Key risk factors that could impact investor returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="price-risk">Carbon Credit Price Risk (%)</Label>
              <Input
                id="price-risk"
                type="number"
                step="0.1"
                value={creditPriceRisk}
                onChange={(e) => setCreditPriceRisk(Number(e.target.value))}
                placeholder="20.0"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Expected price volatility (standard deviation)
              </p>
            </div>
            <div>
              <Label htmlFor="volume-risk">Credit Volume Risk (%)</Label>
              <Input
                id="volume-risk"
                type="number"
                step="0.1"
                value={volumeRisk}
                onChange={(e) => setVolumeRisk(Number(e.target.value))}
                placeholder="15.0"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Risk that actual credits generated differ from projections
              </p>
            </div>
            <div>
              <Label htmlFor="regulatory-risk">Regulatory Risk (%)</Label>
              <Input
                id="regulatory-risk"
                type="number"
                step="0.1"
                value={regulatoryRisk}
                onChange={(e) => setRegulatoryRisk(Number(e.target.value))}
                placeholder="10.0"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Risk from changes in regulations or standards
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Founder Investment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Founder Investment
          </CardTitle>
          <CardDescription>
            Initial investment and equity allocation for project founders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="founder-investment">Initial Founder Investment (USD)</Label>
              <Input
                id="founder-investment"
                type="number"
                value={founderInvestment}
                onChange={(e) => setFounderInvestment(Number(e.target.value))}
                placeholder="100000"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Founder's initial capital contribution to the project
              </p>
            </div>
            <div>
              <Label htmlFor="founder-equity">Founder Equity Percentage (%)</Label>
              <Input
                id="founder-equity"
                type="number"
                step="0.1"
                value={founderEquityPercentage}
                onChange={(e) => setFounderEquityPercentage(Number(e.target.value))}
                placeholder="25.0"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of project equity retained by founders
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Summary</CardTitle>
          <CardDescription>
            Key metrics and expectations based on your assumptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <Label className="text-sm text-muted-foreground">Total Capital</Label>
              <p className="text-lg font-semibold">${totalInvestment.toLocaleString()}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Label className="text-sm text-muted-foreground">Expected Annual Return</Label>
              <p className="text-lg font-semibold">${expectedReturn.toLocaleString()}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Label className="text-sm text-muted-foreground">Investment Period</Label>
              <p className="text-lg font-semibold">{exitYear - investmentYear} years</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Label className="text-sm text-muted-foreground">Risk-Adjusted Rate</Label>
              <p className="text-lg font-semibold">{(discountRate + (creditPriceRisk + volumeRisk) / 2).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any additional investor requirements or assumptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Investor type preferences, governance rights, liquidity requirements, ESG criteria..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveInvestorAssumptions} 
          disabled={loading}
          className="bg-trust hover:bg-trust/90"
        >
          {loading ? 'Saving...' : 'Save Investor Assumptions'}
        </Button>
      </div>
    </div>
  );
};

export default InvestorAssumptionsForm;