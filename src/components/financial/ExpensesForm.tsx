import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calculator, Building, Receipt, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ExpensesFormProps {
  modelId: string;
  model: {
    id: string;
    name: string;
    start_year: number;
    end_year: number;
  };
}

interface YearlyExpenses {
  year: number;
  feasibility_costs: number;
  pdd_costs: number;
  mrv_costs: number;
  staff_costs: number;
  capex: number;
  depreciation: number;
}

const ExpensesForm = ({ modelId, model }: ExpensesFormProps) => {
  // Cost of Goods Sold (rate)
  const [cogsRate, setCogsRate] = useState(15); // 15% for UI

  // Working capital rates
  const [arRate, setArRate] = useState(5); // 5% for UI
  const [apRate, setApRate] = useState(10); // 10% for UI

  // Tax rate
  const [incomeTaxRate, setIncomeTaxRate] = useState(25); // 25% for UI

  // Yearly expenses (as positive numbers for UI)
  const [yearlyExpenses, setYearlyExpenses] = useState<YearlyExpenses[]>(() => {
    const years = [];
    for (let year = model.start_year; year <= model.end_year; year++) {
      years.push({ 
        year, 
        feasibility_costs: year === model.start_year ? 50000 : 0, // One-time cost
        pdd_costs: year === model.start_year ? 75000 : 0,         // One-time cost
        mrv_costs: year === model.start_year ? 40000 : 15000,     // Initial + annual
        staff_costs: 100000,  // Annual cost
        capex: 0,             // Equipment/infrastructure
        depreciation: 0,      // Will be calculated
      });
    }
    return years;
  });

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const updateYearlyExpense = (year: number, field: keyof Omit<YearlyExpenses, 'year'>, value: number) => {
    setYearlyExpenses(prev => 
      prev.map(expense => 
        expense.year === year 
          ? { ...expense, [field]: value }
          : expense
      )
    );
  };

  const saveExpenses = async () => {
    setLoading(true);
    try {
      // Prepare all expense inputs with normalized values
      const expenseInputs = [
        // Rates (normalized to decimals)
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'cogs_rate',
          input_value: { value: cogsRate / 100 },
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'ar_rate',
          input_value: { value: arRate / 100 },
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'ap_rate',
          input_value: { value: apRate / 100 },
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'income_tax_rate',
          input_value: { value: incomeTaxRate / 100 },
        },
        // Notes
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'notes',
          input_value: { value: notes },
        },
      ];

      // Add yearly expense inputs (converted to negative for engine)
      const yearlyInputs = yearlyExpenses.flatMap(expense => [
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'feasibility_costs',
          input_value: { value: -expense.feasibility_costs },
          year: expense.year,
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'pdd_costs',
          input_value: { value: -expense.pdd_costs },
          year: expense.year,
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'mrv_costs',
          input_value: { value: -expense.mrv_costs },
          year: expense.year,
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'staff_costs',
          input_value: { value: -expense.staff_costs },
          year: expense.year,
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'capex',
          input_value: { value: -expense.capex },
          year: expense.year,
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'depreciation',
          input_value: { value: -expense.depreciation },
          year: expense.year,
        },
      ]);

      const allInputs = [...expenseInputs, ...yearlyInputs];

      // Delete existing expense inputs
      const { error: deleteError } = await supabase
        .from('model_inputs')
        .delete()
        .eq('model_id', modelId)
        .eq('category', 'expenses');

      if (deleteError) throw deleteError;

      // Insert new inputs
      const { error: insertError } = await supabase
        .from('model_inputs')
        .insert(allInputs);

      if (insertError) throw insertError;

      toast({
        title: "Expenses saved",
        description: "Your expense assumptions have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving expenses:', error);
      toast({
        title: "Error saving expenses",
        description: "Failed to save expense data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalCapex = yearlyExpenses.reduce((sum, expense) => sum + expense.capex, 0);
  const totalFeasibility = yearlyExpenses.find(e => e.feasibility_costs > 0)?.feasibility_costs || 0;
  const totalPDD = yearlyExpenses.find(e => e.pdd_costs > 0)?.pdd_costs || 0;
  const totalInitialMRV = yearlyExpenses.find(e => e.year === model.start_year)?.mrv_costs || 0;
  const totalDevelopmentCosts = totalFeasibility + totalPDD + totalInitialMRV;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Development Costs</CardDescription>
            <CardTitle className="text-2xl">${totalDevelopmentCosts.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total CAPEX</CardDescription>
            <CardTitle className="text-2xl">${totalCapex.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>COGS Rate</CardDescription>
            <CardTitle className="text-2xl">{cogsRate.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>


      {/* Cost Structure */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Variable Costs & Working Capital */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Variable Costs & Working Capital
            </CardTitle>
            <CardDescription>
              Costs that vary with revenue and working capital assumptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cogs">Cost of Goods Sold (%)</Label>
              <Input
                id="cogs"
                type="number"
                step="0.1"
                value={cogsRate}
                onChange={(e) => setCogsRate(Number(e.target.value))}
                placeholder="15"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                % of total revenue
              </p>
            </div>
            
            <div>
              <Label htmlFor="ar_rate">Accounts Receivable (%)</Label>
              <Input
                id="ar_rate"
                type="number"
                step="0.1"
                value={arRate}
                onChange={(e) => setArRate(Number(e.target.value))}
                placeholder="5"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                % of revenue as A/R
              </p>
            </div>
            
            <div>
              <Label htmlFor="ap_rate">Accounts Payable (%)</Label>
              <Input
                id="ap_rate"
                type="number"
                step="0.1"
                value={apRate}
                onChange={(e) => setApRate(Number(e.target.value))}
                placeholder="10"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                % of OPEX as A/P
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Tax Settings
            </CardTitle>
            <CardDescription>
              Corporate tax settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tax-rate">Income Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                step="0.1"
                value={incomeTaxRate}
                onChange={(e) => setIncomeTaxRate(Number(e.target.value))}
                placeholder="25"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Corporate tax rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Expense Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Yearly Expense Schedule
          </CardTitle>
          <CardDescription>
            All expenses by year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {yearlyExpenses.map((expense, index) => (
              <div key={expense.year} className="grid gap-4 md:grid-cols-7 p-4 border rounded-lg">
                <div>
                  <Label>Year {expense.year}</Label>
                  <Badge variant="outline" className="mt-1">
                    Project Year {index + 1}
                  </Badge>
                </div>
                
                <div>
                  <Label htmlFor={`feasibility-${expense.year}`}>Feasibility Study</Label>
                  <Input
                    id={`feasibility-${expense.year}`}
                    type="number"
                    value={expense.feasibility_costs}
                    onChange={(e) => updateYearlyExpense(expense.year, 'feasibility_costs', Number(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">e.g., 50000</p>
                </div>
                
                <div>
                  <Label htmlFor={`pdd-${expense.year}`}>PDD Development</Label>
                  <Input
                    id={`pdd-${expense.year}`}
                    type="number"
                    value={expense.pdd_costs}
                    onChange={(e) => updateYearlyExpense(expense.year, 'pdd_costs', Number(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">e.g., 75000</p>
                </div>
                
                <div>
                  <Label htmlFor={`mrv-${expense.year}`}>MRV Costs</Label>
                  <Input
                    id={`mrv-${expense.year}`}
                    type="number"
                    value={expense.mrv_costs}
                    onChange={(e) => updateYearlyExpense(expense.year, 'mrv_costs', Number(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">e.g., 15000</p>
                </div>
                
                <div>
                  <Label htmlFor={`staff-${expense.year}`}>Staff Costs</Label>
                  <Input
                    id={`staff-${expense.year}`}
                    type="number"
                    value={expense.staff_costs}
                    onChange={(e) => updateYearlyExpense(expense.year, 'staff_costs', Number(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">e.g., 100000</p>
                </div>
                
                <div>
                  <Label htmlFor={`capex-${expense.year}`}>CAPEX</Label>
                  <Input
                    id={`capex-${expense.year}`}
                    type="number"
                    value={expense.capex}
                    onChange={(e) => updateYearlyExpense(expense.year, 'capex', Number(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">e.g., 200000</p>
                </div>
                
                <div>
                  <Label htmlFor={`depreciation-${expense.year}`}>Depreciation</Label>
                  <Input
                    id={`depreciation-${expense.year}`}
                    type="number"
                    value={expense.depreciation}
                    onChange={(e) => updateYearlyExpense(expense.year, 'depreciation', Number(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">e.g., 20000</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any additional assumptions about expenses and cost structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Cost escalation assumptions, regional cost factors, seasonal variations..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveExpenses} 
          disabled={loading}
          className="bg-trust hover:bg-trust/90"
        >
          {loading ? 'Saving...' : 'Save Expense Assumptions'}
        </Button>
      </div>
    </div>
  );
};

export default ExpensesForm;