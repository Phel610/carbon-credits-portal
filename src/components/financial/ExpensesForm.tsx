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
  feasibility_costs: number;  // Negative values per Excel
  pdd_costs: number;         // Negative values per Excel
  mrv_costs: number;         // Negative values per Excel
  staff_costs: number;       // Negative values per Excel
  capex: number;             // Negative values per Excel
  depreciation: number;      // Negative values per Excel
}

const ExpensesForm = ({ modelId, model }: ExpensesFormProps) => {
  // Cost of Goods Sold (rate)
  const [cogsRate, setCogsRate] = useState(0.15); // 15% as decimal

  // Working capital rates (NEW per Excel spec)
  const [arRate, setArRate] = useState(0.05); // 5% of revenue as A/R
  const [apRate, setApRate] = useState(0.10); // 10% of OPEX as A/P

  // Tax rate
  const [incomeTaxRate, setIncomeTaxRate] = useState(0.25); // 25% as decimal

  // Yearly expenses (all as negative numbers per Excel convention)
  const [yearlyExpenses, setYearlyExpenses] = useState<YearlyExpenses[]>(() => {
    const years = [];
    for (let year = model.start_year; year <= model.end_year; year++) {
      years.push({ 
        year, 
        feasibility_costs: year === model.start_year ? -50000 : 0, // One-time cost
        pdd_costs: year === model.start_year ? -75000 : 0,         // One-time cost
        mrv_costs: year === model.start_year ? -40000 : -15000,    // Initial + annual
        staff_costs: -100000,  // Annual cost
        capex: 0,              // Equipment/infrastructure
        depreciation: 0,       // Will be calculated
      });
    }
    return years;
  });

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const updateYearlyExpense = (year: number, field: keyof Omit<YearlyExpenses, 'year'>, value: number) => {
    // Validate that cost inputs are negative
    if (['feasibility_costs', 'pdd_costs', 'mrv_costs', 'staff_costs', 'capex', 'depreciation'].includes(field) && value > 0) {
      toast({
        title: "Invalid input",
        description: `${field.replace('_', ' ')} must be negative (e.g., -50000 for $50,000 expense)`,
        variant: "destructive",
      });
      return;
    }
    
    setYearlyExpenses(prev => 
      prev.map(expense => 
        expense.year === year 
          ? { ...expense, [field]: value }
          : expense
      )
    );
  };

  const saveExpenses = async () => {
    // Validate all cost inputs are negative
    const invalidInputs = [];
    for (const expense of yearlyExpenses) {
      if (expense.feasibility_costs > 0) invalidInputs.push('Feasibility costs must be negative');
      if (expense.pdd_costs > 0) invalidInputs.push('PDD costs must be negative');
      if (expense.mrv_costs > 0) invalidInputs.push('MRV costs must be negative');
      if (expense.staff_costs > 0) invalidInputs.push('Staff costs must be negative');
      if (expense.capex > 0) invalidInputs.push('CAPEX must be negative');
      if (expense.depreciation > 0) invalidInputs.push('Depreciation must be negative');
    }
    
    if (invalidInputs.length > 0) {
      toast({
        title: "Validation Error",
        description: `${invalidInputs[0]}. All cost values must be negative per Excel convention.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare all expense inputs with Excel sign conventions
      const expenseInputs = [
        // Rates (as decimals, not percentages)
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'cogs_rate',
          input_value: { value: cogsRate },
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'ar_rate',
          input_value: { value: arRate },
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'ap_rate',
          input_value: { value: apRate },
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'income_tax_rate',
          input_value: { value: incomeTaxRate },
        },
        // Notes
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'notes',
          input_value: { value: notes },
        },
      ];

      // Add yearly expense inputs (all as negative numbers)  
      const yearlyInputs = yearlyExpenses.flatMap(expense => [
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'feasibility_costs',
          input_value: { value: expense.feasibility_costs },
          year: expense.year,
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'pdd_costs',
          input_value: { value: expense.pdd_costs },
          year: expense.year,
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'mrv_costs',
          input_value: { value: expense.mrv_costs },
          year: expense.year,
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'staff_costs',
          input_value: { value: expense.staff_costs },
          year: expense.year,
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'capex',
          input_value: { value: expense.capex },
          year: expense.year,
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'depreciation',
          input_value: { value: expense.depreciation },
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
  const totalCapex = yearlyExpenses.reduce((sum, expense) => sum + Math.abs(expense.capex), 0);
  const totalFeasibility = Math.abs(yearlyExpenses.find(e => e.feasibility_costs < 0)?.feasibility_costs || 0);
  const totalPDD = Math.abs(yearlyExpenses.find(e => e.pdd_costs < 0)?.pdd_costs || 0);
  const totalInitialMRV = Math.abs(yearlyExpenses.find(e => e.year === model.start_year)?.mrv_costs || 0);
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
            <CardTitle className="text-2xl">{(cogsRate * 100).toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sign Convention Alert */}
      <Card className="border-warning bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Excel Sign Convention</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            All costs are entered as <strong>negative numbers</strong> to match Excel formulas. 
            Enter -50000 for a $50,000 expense.
          </p>
        </CardContent>
      </Card>

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
              <Label htmlFor="cogs">Cost of Goods Sold (Rate)</Label>
              <Input
                id="cogs"
                type="number"
                step="0.001"
                value={cogsRate}
                onChange={(e) => setCogsRate(Number(e.target.value))}
                placeholder="0.15"
                min="0"
                max="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Decimal (0.15 = 15% of revenue)
              </p>
            </div>
            
            <div>
              <Label htmlFor="ar_rate">Accounts Receivable Rate</Label>
              <Input
                id="ar_rate"
                type="number"
                step="0.001"
                value={arRate}
                onChange={(e) => setArRate(Number(e.target.value))}
                placeholder="0.05"
                min="0"
                max="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Decimal (0.05 = 5% of revenue as A/R)
              </p>
            </div>
            
            <div>
              <Label htmlFor="ap_rate">Accounts Payable Rate</Label>
              <Input
                id="ap_rate"
                type="number"
                step="0.001"
                value={apRate}
                onChange={(e) => setApRate(Number(e.target.value))}
                placeholder="0.10"
                min="0"
                max="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Decimal (0.10 = 10% of OPEX as A/P)
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
              <Label htmlFor="tax-rate">Income Tax Rate</Label>
              <Input
                id="tax-rate"
                type="number"
                step="0.001"
                value={incomeTaxRate}
                onChange={(e) => setIncomeTaxRate(Number(e.target.value))}
                placeholder="0.25"
                min="0"
                max="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Decimal (0.25 = 25% corporate tax rate)
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
            All expenses by year (enter as negative numbers per Excel convention)
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
                  <p className="text-xs text-muted-foreground">e.g., -50000</p>
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
                  <p className="text-xs text-muted-foreground">e.g., -75000</p>
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
                  <p className="text-xs text-muted-foreground">e.g., -15000</p>
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
                  <p className="text-xs text-muted-foreground">e.g., -100000</p>
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
                  <p className="text-xs text-muted-foreground">e.g., -200000</p>
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
                  <p className="text-xs text-muted-foreground">e.g., -20000</p>
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