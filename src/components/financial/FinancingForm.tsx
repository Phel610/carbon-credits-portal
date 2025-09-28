import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building, CreditCard, Handshake, Plus, Trash2, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toEngineInputs } from '@/lib/financial/uiAdapter';

interface FinancingFormProps {
  modelId: string;
  model: {
    id: string;
    name: string;
    start_year: number;
    end_year: number;
  };
}

interface YearlyFinancing {
  year: number;
  equity_injection: number;
  debt_draw: number;
  purchase_amount: number; // Pre-purchase advance payments
}

const FinancingForm = ({ modelId, model }: FinancingFormProps) => {
  // Debt parameters (single facility for simplicity, matching Excel)
  const [interestRate, setInterestRate] = useState(8); // 8% for UI
  const [debtDurationYears, setDebtDurationYears] = useState(5);
  
  // Pre-purchase parameters
  const [purchaseShare, setPurchaseShare] = useState(30); // 30% for UI
  
  // Returns parameters
  const [discountRate, setDiscountRate] = useState(12); // 12% for UI
  const [initialEquityT0, setInitialEquityT0] = useState(100000); // Initial founder equity
  const [openingCashY1, setOpeningCashY1] = useState(0); // Opening cash at start of Year 1
  
  // Yearly financing schedule
  const [yearlyFinancing, setYearlyFinancing] = useState<YearlyFinancing[]>(() => {
    const years = [];
    for (let year = model.start_year; year <= model.end_year; year++) {
      years.push({
        year,
        equity_injection: year === model.start_year ? 100000 : 0, // Initial equity
        debt_draw: year === model.start_year ? 500000 : 0,        // Initial debt draw
        purchase_amount: 0, // Pre-purchase advances
      });
    }
    return years;
  });

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const updateYearlyFinancing = (year: number, field: keyof Omit<YearlyFinancing, 'year'>, value: number) => {
    setYearlyFinancing(prev => 
      prev.map(financing => 
        financing.year === year 
          ? { ...financing, [field]: value }
          : financing
      )
    );
  };

  const saveFinancingStrategy = async () => {
    setLoading(true);
    try {
      // Build UI payload for adapter
      const uiPayload = {
        years: yearlyFinancing.map(f => f.year),
        issue: yearlyFinancing.map(() => false), // Placeholder - set by operational form
        credits_generated: yearlyFinancing.map(() => 0),
        price_per_credit: yearlyFinancing.map(() => 10),
        
        // Placeholder expense values
        feasibility_costs: yearlyFinancing.map(() => 0),
        pdd_costs: yearlyFinancing.map(() => 0),
        mrv_costs: yearlyFinancing.map(() => 0),
        staff_costs: yearlyFinancing.map(() => 0),
        depreciation: yearlyFinancing.map(() => 0),
        capex: yearlyFinancing.map(() => 0),
        
        // Placeholder rates
        ar_rate: 5,
        ap_rate: 10,
        cogs_rate: 15,
        income_tax_rate: 25,
        
        // Financing rates as UI percentages
        interest_rate: interestRate,
        debt_duration_years: debtDurationYears,
        equity_injection: yearlyFinancing.map(f => f.equity_injection),
        debt_draw: yearlyFinancing.map(f => f.debt_draw),
        
        purchase_amount: yearlyFinancing.map(f => f.purchase_amount),
        purchase_share: purchaseShare,
        
        opening_cash_y1: openingCashY1,
        discount_rate: discountRate,
      };

      // Normalize using adapter
      const engineInputs = toEngineInputs(uiPayload);

      const financingInputs = [
        // Debt parameters (normalized by adapter)
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'interest_rate',
          input_value: { value: engineInputs.interest_rate },
        },
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'debt_duration_years',
          input_value: { value: engineInputs.debt_duration_years },
        },
        // Pre-purchase parameters (normalized by adapter)
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'purchase_share',
          input_value: { value: engineInputs.purchase_share },
        },
        // Returns parameters (normalized by adapter)
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'discount_rate',
          input_value: { value: engineInputs.discount_rate },
        },
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'initial_equity_t0',
          input_value: { value: initialEquityT0 },
        },
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'opening_cash_y1',
          input_value: { value: engineInputs.opening_cash_y1 },
        },
        // Notes
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'notes',
          input_value: { value: notes },
        },
      ];

      // Add yearly financing inputs
      const yearlyInputs = yearlyFinancing.flatMap((financing, index) => [
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'equity_injection',
          input_value: { value: engineInputs.equity_injection[index] },
          year: financing.year,
        },
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'debt_draw',
          input_value: { value: engineInputs.debt_draw[index] },
          year: financing.year,
        },
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'purchase_amount',
          input_value: { value: engineInputs.purchase_amount[index] },
          year: financing.year,
        },
      ]);

      const allInputs = [...financingInputs, ...yearlyInputs];

      // Delete existing financing inputs
      const { error: deleteError } = await supabase
        .from('model_inputs')
        .delete()
        .eq('model_id', modelId)
        .eq('category', 'financing');

      if (deleteError) throw deleteError;

      // Insert new inputs
      const { error: insertError } = await supabase
        .from('model_inputs')
        .insert(allInputs);

      if (insertError) throw insertError;

      toast({
        title: "Financing strategy saved",
        description: "Your financing strategy has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving financing strategy:', error);
      toast({
        title: "Error saving financing",
        description: "Failed to save financing data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalEquity = yearlyFinancing.reduce((sum, financing) => sum + financing.equity_injection, 0);
  const totalDebt = yearlyFinancing.reduce((sum, financing) => sum + financing.debt_draw, 0);
  const totalPurchaseAdvances = yearlyFinancing.reduce((sum, financing) => sum + financing.purchase_amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Equity</CardDescription>
            <CardTitle className="text-2xl">${totalEquity.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Debt</CardDescription>
            <CardTitle className="text-2xl">${totalDebt.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pre-Purchase Advances</CardDescription>
            <CardTitle className="text-2xl">${totalPurchaseAdvances.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pre-Purchase Share</CardDescription>
            <CardTitle className="text-2xl">{purchaseShare.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Financing Parameters */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Debt Facility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Debt Facility Parameters
            </CardTitle>
            <CardDescription>
              Single debt facility with PPMT amortization (Excel compatible)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="interest-rate">Interest Rate (%)</Label>
              <Input
                id="interest-rate"
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                placeholder="8"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Annual rate
              </p>
            </div>
            
            <div>
              <Label htmlFor="debt-duration">Debt Duration (Years)</Label>
              <Input
                id="debt-duration"
                type="number"
                value={debtDurationYears}
                onChange={(e) => setDebtDurationYears(Number(e.target.value))}
                placeholder="5"
                min="1"
                max="30"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Amortization period for principal payments
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pre-Purchase Agreement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Pre-Purchase Agreement
            </CardTitle>
            <CardDescription>
              Forward sales with advance payments (Excel carbon stream logic)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="purchase-share">Purchase Share (%)</Label>
              <Input
                id="purchase-share"
                type="number"
                step="0.1"
                value={purchaseShare}
                onChange={(e) => setPurchaseShare(Number(e.target.value))}
                placeholder="30"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                % of credits pre-purchased
              </p>
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Pre-purchase Logic</h4>
              <p className="text-sm text-muted-foreground">
                Pre-purchase uses a single implied purchase price computed from the first year with a purchase. 
                Unearned revenue increases with purchase cash and decreases when purchased credits are delivered.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Returns Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Returns Calculation Parameters
          </CardTitle>
          <CardDescription>
            Parameters for NPV, IRR, and payback period calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="discount-rate">Discount Rate (%)</Label>
              <Input
                id="discount-rate"
                type="number"
                step="0.1"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                placeholder="12"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                WACC for NPV calculation
              </p>
            </div>
            
            <div>
              <Label htmlFor="initial-equity">Initial Equity (t=0)</Label>
              <Input
                id="initial-equity"
                type="number"
                value={initialEquityT0}
                onChange={(e) => setInitialEquityT0(Number(e.target.value))}
                placeholder="100000"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Initial founder investment for IRR calculation
              </p>
            </div>
            
            <div>
              <Label htmlFor="opening-cash">Opening Cash Y1</Label>
              <Input
                id="opening-cash"
                type="number"
                value={openingCashY1}
                onChange={(e) => setOpeningCashY1(Number(e.target.value))}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cash at start of Year 1
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Financing Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Yearly Financing Schedule
          </CardTitle>
          <CardDescription>
            Equity injections, debt drawdowns, and pre-purchase advance payments by year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {yearlyFinancing.map((financing, index) => (
              <div key={financing.year} className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg">
                <div>
                  <Label>Year {financing.year}</Label>
                  <Badge variant="outline" className="mt-1">
                    Project Year {index + 1}
                  </Badge>
                </div>
                
                <div>
                  <Label htmlFor={`equity-${financing.year}`}>Equity Injection</Label>
                  <Input
                    id={`equity-${financing.year}`}
                    type="number"
                    value={financing.equity_injection}
                    onChange={(e) => updateYearlyFinancing(financing.year, 'equity_injection', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">New equity investment</p>
                </div>
                
                <div>
                  <Label htmlFor={`debt-${financing.year}`}>Debt Draw</Label>
                  <Input
                    id={`debt-${financing.year}`}
                    type="number"
                    value={financing.debt_draw}
                    onChange={(e) => updateYearlyFinancing(financing.year, 'debt_draw', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">New debt drawdown</p>
                </div>
                
                <div>
                  <Label htmlFor={`purchase-${financing.year}`}>Purchase Amount</Label>
                  <Input
                    id={`purchase-${financing.year}`}
                    type="number"
                    value={financing.purchase_amount}
                    onChange={(e) => updateYearlyFinancing(financing.year, 'purchase_amount', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">Pre-purchase advance</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Implementation Notes</h4>
            <p className="text-sm text-muted-foreground">
              • Debt Schedule: Uses PPMT function for principal payments
            </p>
            <p className="text-sm text-muted-foreground">
              • Pre-purchase: Single implied price from first purchase year
            </p>
            <p className="text-sm text-muted-foreground">
              • FCF to Equity: NI + Depreciation - ΔWC + CAPEX + Net Borrowing
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any additional assumptions about financing strategy and terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Credit covenants, collateral requirements, equity dilution assumptions, buyer creditworthiness..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveFinancingStrategy} 
          disabled={loading}
          className="bg-trust hover:bg-trust/90"
        >
          {loading ? 'Saving...' : 'Save Financing Strategy'}
        </Button>
      </div>
    </div>
  );
};

export default FinancingForm;