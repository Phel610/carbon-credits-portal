import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Calculator, Building, Receipt } from 'lucide-react';
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
  capex: number;
}

const ExpensesForm = ({ modelId, model }: ExpensesFormProps) => {
  // Cost of Goods Sold
  const [cogsPercentage, setCogsPercentage] = useState(15); // Default 15%

  // Development Costs (one-time)
  const [feasibilityStudyCost, setFeasibilityStudyCost] = useState(50000);
  const [pddDevelopmentCost, setPddDevelopmentCost] = useState(75000);
  const [initialMrvCost, setInitialMrvCost] = useState(25000);

  // Ongoing Costs (annual)
  const [annualMrvCost, setAnnualMrvCost] = useState(15000);
  const [staffCosts, setStaffCosts] = useState(100000);

  // CAPEX by year
  const [yearlyCapex, setYearlyCapex] = useState<YearlyExpenses[]>(() => {
    const years = [];
    for (let year = model.start_year; year <= model.end_year; year++) {
      years.push({ year, capex: 0 });
    }
    return years;
  });

  // Depreciation
  const [depreciationMethod, setDepreciationMethod] = useState('straight_line');
  const [depreciationYears, setDepreciationYears] = useState(10);

  // Tax
  const [incomeTaxRate, setIncomeTaxRate] = useState(25); // Default 25%

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const updateYearlyCapex = (year: number, capex: number) => {
    setYearlyCapex(prev => 
      prev.map(expense => 
        expense.year === year 
          ? { ...expense, capex }
          : expense
      )
    );
  };

  const saveExpenses = async () => {
    setLoading(true);
    try {
      // Prepare all expense inputs
      const expenseInputs = [
        // COGS
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'cogs_percentage',
          input_value: { value: cogsPercentage },
        },
        // Development costs
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'feasibility_study_cost',
          input_value: { value: feasibilityStudyCost },
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'pdd_development_cost',
          input_value: { value: pddDevelopmentCost },
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'initial_mrv_cost',
          input_value: { value: initialMrvCost },
        },
        // Ongoing costs
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'annual_mrv_cost',
          input_value: { value: annualMrvCost },
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'staff_costs',
          input_value: { value: staffCosts },
        },
        // Depreciation
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'depreciation_method',
          input_value: { value: depreciationMethod },
        },
        {
          model_id: modelId,
          category: 'expenses',
          input_key: 'depreciation_years',
          input_value: { value: depreciationYears },
        },
        // Tax
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

      // Add yearly CAPEX inputs
      const capexInputs = yearlyCapex.map(expense => ({
        model_id: modelId,
        category: 'expenses',
        input_key: 'capex',
        input_value: { value: expense.capex },
        year: expense.year,
      }));

      const allInputs = [...expenseInputs, ...capexInputs];

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

  const totalCapex = yearlyCapex.reduce((sum, expense) => sum + expense.capex, 0);
  const totalDevelopmentCosts = feasibilityStudyCost + pddDevelopmentCost + initialMrvCost;

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
            <CardTitle className="text-2xl">{cogsPercentage}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Cost Structure */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Variable Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Variable Costs
            </CardTitle>
            <CardDescription>
              Costs that vary with revenue or credit volumes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cogs">Cost of Goods Sold (%)</Label>
              <Input
                id="cogs"
                type="number"
                step="0.1"
                value={cogsPercentage}
                onChange={(e) => setCogsPercentage(Number(e.target.value))}
                placeholder="15.0"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of revenue (typically 10-20% for carbon projects)
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
              Corporate income tax rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="tax-rate">Income Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                step="0.1"
                value={incomeTaxRate}
                onChange={(e) => setIncomeTaxRate(Number(e.target.value))}
                placeholder="25.0"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Corporate tax rate in project country
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            One-time Development Costs
          </CardTitle>
          <CardDescription>
            Upfront costs for project development and validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="feasibility">Feasibility Study Cost</Label>
              <Input
                id="feasibility"
                type="number"
                value={feasibilityStudyCost}
                onChange={(e) => setFeasibilityStudyCost(Number(e.target.value))}
                placeholder="50000"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Initial project assessment and design
              </p>
            </div>
            <div>
              <Label htmlFor="pdd">PDD Development Cost</Label>
              <Input
                id="pdd"
                type="number"
                value={pddDevelopmentCost}
                onChange={(e) => setPddDevelopmentCost(Number(e.target.value))}
                placeholder="75000"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Project Design Document preparation
              </p>
            </div>
            <div>
              <Label htmlFor="initial-mrv">Initial MRV Setup</Label>
              <Input
                id="initial-mrv"
                type="number"
                value={initialMrvCost}
                onChange={(e) => setInitialMrvCost(Number(e.target.value))}
                placeholder="25000"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Monitoring, Reporting & Verification setup
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Annual Operating Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Annual Operating Costs</CardTitle>
          <CardDescription>
            Recurring annual expenses for project operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="annual-mrv">Annual MRV Cost</Label>
              <Input
                id="annual-mrv"
                type="number"
                value={annualMrvCost}
                onChange={(e) => setAnnualMrvCost(Number(e.target.value))}
                placeholder="15000"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Yearly monitoring and verification
              </p>
            </div>
            <div>
              <Label htmlFor="staff">Annual Staff Costs</Label>
              <Input
                id="staff"
                type="number"
                value={staffCosts}
                onChange={(e) => setStaffCosts(Number(e.target.value))}
                placeholder="100000"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Project management and operations team
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CAPEX Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Capital Expenditure (CAPEX) Schedule
          </CardTitle>
          <CardDescription>
            Major equipment, infrastructure, and capital investments by year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {yearlyCapex.map((expense, index) => (
              <div key={expense.year} className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg">
                <div>
                  <Label>Year {expense.year}</Label>
                  <p className="text-sm text-muted-foreground">
                    Project Year {index + 1}
                  </p>
                </div>
                <div>
                  <Label htmlFor={`capex-${expense.year}`}>CAPEX Investment</Label>
                  <Input
                    id={`capex-${expense.year}`}
                    type="number"
                    value={expense.capex}
                    onChange={(e) => updateYearlyCapex(expense.year, Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Depreciation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Depreciation Schedule</CardTitle>
          <CardDescription>
            How CAPEX will be depreciated for accounting purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="depreciation-method">Depreciation Method</Label>
              <Select value={depreciationMethod} onValueChange={setDepreciationMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight_line">Straight Line</SelectItem>
                  <SelectItem value="declining_balance">Declining Balance</SelectItem>
                  <SelectItem value="units_of_production">Units of Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="depreciation-years">Depreciation Period (Years)</Label>
              <Input
                id="depreciation-years"
                type="number"
                value={depreciationYears}
                onChange={(e) => setDepreciationYears(Number(e.target.value))}
                placeholder="10"
                min="1"
                max="50"
              />
            </div>
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