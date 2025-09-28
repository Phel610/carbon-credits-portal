import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Calendar, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toEngineInputs, fromEngineToUI } from '@/lib/financial/uiAdapter';

interface OperationalMetricsFormProps {
  modelId: string;
  model: {
    id: string;
    name: string;
    start_year: number;
    end_year: number;
  };
}

interface YearlyMetrics {
  year: number;
  credits_generated: number;
  price_per_credit: number;
  issue: boolean; // checkbox for when credits are issued
}

const OperationalMetricsForm = ({ modelId, model }: OperationalMetricsFormProps) => {
  const [yearlyMetrics, setYearlyMetrics] = useState<YearlyMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  // Load existing data and initialize
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load existing data
        const { data: existingInputs } = await supabase
          .from('model_inputs')
          .select('*')
          .eq('model_id', modelId)
          .eq('category', 'operational_metrics');

        if (existingInputs && existingInputs.length > 0) {
          // Load existing data using adapter
          const engineData = {
            years: [],
            issuance_flag: [],
            credits_generated: [],
            price_per_credit: [],
          };

          // Reconstruct engine format from database
          const years = [...new Set(existingInputs.filter(i => i.year).map(i => i.year))].sort();
          engineData.years = years;

          years.forEach(year => {
            const creditsInput = existingInputs.find(i => i.year === year && i.input_key === 'credits_generated');
            const priceInput = existingInputs.find(i => i.year === year && i.input_key === 'price_per_credit');
            const issuanceInput = existingInputs.find(i => i.year === year && i.input_key === 'issuance_flag');

            const creditsValue = creditsInput?.input_value && typeof creditsInput.input_value === 'object' && 'value' in creditsInput.input_value ? Number(creditsInput.input_value.value) : 0;
            const priceValue = priceInput?.input_value && typeof priceInput.input_value === 'object' && 'value' in priceInput.input_value ? Number(priceInput.input_value.value) : 10;
            const issuanceValue = issuanceInput?.input_value && typeof issuanceInput.input_value === 'object' && 'value' in issuanceInput.input_value ? Number(issuanceInput.input_value.value) : 0;

            engineData.credits_generated.push(creditsValue);
            engineData.price_per_credit.push(priceValue);
            engineData.issuance_flag.push(issuanceValue);
          });

          // Convert to UI format using adapter
          const uiData = fromEngineToUI(engineData);
          
          // Set form state
          const metrics = years.map((year, index) => ({
            year,
            credits_generated: uiData.credits_generated[index],
            price_per_credit: uiData.price_per_credit[index],
            issue: uiData.issue[index],
          }));
          
          setYearlyMetrics(metrics);
          
          // Load notes
          const notesInput = existingInputs.find(i => i.input_key === 'notes');
          if (notesInput && notesInput.input_value && typeof notesInput.input_value === 'object' && 'value' in notesInput.input_value) {
            setNotes(String(notesInput.input_value.value) || '');
          }
        } else {
          // Initialize with defaults
          const years = [];
          for (let year = model.start_year; year <= model.end_year; year++) {
            years.push({
              year,
              credits_generated: 0,
              price_per_credit: 10,
              issue: year > model.start_year,
            });
          }
          setYearlyMetrics(years);
        }
      } catch (error) {
        console.error('Error loading operational metrics:', error);
        // Fall back to defaults
        const years = [];
        for (let year = model.start_year; year <= model.end_year; year++) {
          years.push({
            year,
            credits_generated: 0,
            price_per_credit: 10,
            issue: year > model.start_year,
          });
        }
        setYearlyMetrics(years);
      }
    };

    loadData();
  }, [model, modelId]);

  const updateYearlyMetric = (year: number, field: keyof YearlyMetrics, value: number | boolean) => {
    setYearlyMetrics(prev => 
      prev.map(metric => 
        metric.year === year 
          ? { ...metric, [field]: value }
          : metric
      )
    );
  };

  const saveOperationalMetrics = async () => {
    setLoading(true);
    try {
      // Build UI payload for adapter  
      const uiPayload = {
        years: yearlyMetrics.map(m => m.year),
        issue: yearlyMetrics.map(m => m.issue),
        credits_generated: yearlyMetrics.map(m => m.credits_generated),
        price_per_credit: yearlyMetrics.map(m => m.price_per_credit),
        
        // Required fields for adapter - use minimal placeholders
        feasibility_costs: yearlyMetrics.map(() => 0),
        pdd_costs: yearlyMetrics.map(() => 0),
        mrv_costs: yearlyMetrics.map(() => 0),
        staff_costs: yearlyMetrics.map(() => 0),
        depreciation: yearlyMetrics.map(() => 0),
        capex: yearlyMetrics.map(() => 0),
        ar_rate: 5,
        ap_rate: 10,
        cogs_rate: 15,
        income_tax_rate: 25,
        interest_rate: 8,
        debt_duration_years: 5,
        equity_injection: yearlyMetrics.map(() => 0),
        debt_draw: yearlyMetrics.map(() => 0),
        purchase_amount: yearlyMetrics.map(() => 0),
        purchase_share: 30,
        opening_cash_y1: 0,
        discount_rate: 12,
      };

      // Normalize using adapter
      const engineInputs = toEngineInputs(uiPayload);

      // Save only the fields owned by this form
      const yearlyInputs = yearlyMetrics.flatMap((metric, index) => [
        {
          model_id: modelId,
          category: 'operational_metrics',
          input_key: 'credits_generated',
          input_value: { value: engineInputs.credits_generated[index] },
          year: metric.year,
        },
        {
          model_id: modelId,
          category: 'operational_metrics',
          input_key: 'price_per_credit',
          input_value: { value: engineInputs.price_per_credit[index] },
          year: metric.year,
        },
        {
          model_id: modelId,
          category: 'operational_metrics',
          input_key: 'issuance_flag',
          input_value: { value: engineInputs.issuance_flag[index] },
          year: metric.year,
        }
      ]);

      // Save notes
      const notesInput = {
        model_id: modelId,
        category: 'operational_metrics',
        input_key: 'notes',
        input_value: { value: notes },
      };

      const allInputs = [...yearlyInputs, notesInput];

      // Delete existing operational metrics inputs
      const { error: deleteError } = await supabase
        .from('model_inputs')
        .delete()
        .eq('model_id', modelId)
        .eq('category', 'operational_metrics');

      if (deleteError) throw deleteError;

      // Insert new inputs
      const { error: insertError } = await supabase
        .from('model_inputs')
        .insert(allInputs);

      if (insertError) throw insertError;

      toast({
        title: "Operational metrics saved",
        description: "Your operational metrics have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving operational metrics:', error);
      toast({
        title: "Error saving metrics",
        description: "Failed to save operational metrics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate cumulative issued credits using engine logic
  const calculateIssuedCredits = () => {
    const issued: number[] = [];
    for (let i = 0; i < yearlyMetrics.length; i++) {
      const cumGenerated = yearlyMetrics.slice(0, i + 1).reduce((sum, m) => sum + m.credits_generated, 0);
      const cumIssuedPrev = issued.reduce((sum, val) => sum + val, 0);
      const issuanceFlag = yearlyMetrics[i].issue;
      issued[i] = issuanceFlag ? (cumGenerated - cumIssuedPrev) : 0;
    }
    return issued;
  };

  const issuedCredits = calculateIssuedCredits();
  const totalCredits = yearlyMetrics.reduce((sum, metric) => sum + metric.credits_generated, 0);
  const totalIssuance = issuedCredits.reduce((sum, val) => sum + val, 0);
  const averagePrice = yearlyMetrics.length > 0 
    ? yearlyMetrics.reduce((sum, metric) => sum + metric.price_per_credit, 0) / yearlyMetrics.length 
    : 0;

  // Validation checks
  const hasValidIssuanceSchedule = totalIssuance <= totalCredits;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Credits Generated</CardDescription>
            <CardTitle className="text-2xl">{totalCredits.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Credits Issued</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {totalIssuance.toLocaleString()}
              {hasValidIssuanceSchedule ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Price/Credit</CardDescription>
            <CardTitle className="text-2xl">${averagePrice.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Validation Alerts */}
      {!hasValidIssuanceSchedule && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Validation Error: Cannot issue more credits than generated</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total issued credits ({totalIssuance.toLocaleString()}) exceeds total generated credits ({totalCredits.toLocaleString()})
            </p>
          </CardContent>
        </Card>
      )}

      {/* Credits Generated by Year */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Credits Generated, Pricing & Issuance Schedule
          </CardTitle>
          <CardDescription>
            Configure credit generation, pricing, and when credits will be issued
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {yearlyMetrics.map((metric, index) => {
              const projectedIssued = issuedCredits[index];
              return (
                <div key={metric.year} className="grid gap-4 md:grid-cols-5 p-4 border rounded-lg">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Year {metric.year}
                    </Label>
                    <Badge variant="outline" className="mt-1">
                      Project Year {index + 1}
                    </Badge>
                  </div>
                  
                  <div>
                    <Label htmlFor={`credits-${metric.year}`}>Credits Generated</Label>
                    <Input
                      id={`credits-${metric.year}`}
                      type="number"
                      value={metric.credits_generated}
                      onChange={(e) => updateYearlyMetric(metric.year, 'credits_generated', Number(e.target.value))}
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Credits earned from project activities
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor={`price-${metric.year}`}>Price per Credit (USD)</Label>
                    <Input
                      id={`price-${metric.year}`}
                      type="number"
                      step="0.01"
                      value={metric.price_per_credit}
                      onChange={(e) => updateYearlyMetric(metric.year, 'price_per_credit', Number(e.target.value))}
                      placeholder="10.00"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected market price
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor={`issuance-${metric.year}`}>Issue credits this year</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id={`issuance-${metric.year}`}
                        checked={metric.issue}
                        onCheckedChange={(checked) => updateYearlyMetric(metric.year, 'issue', Boolean(checked))}
                      />
                      <Label htmlFor={`issuance-${metric.year}`} className="text-sm">
                        Issue credits
                      </Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Credits Issued</Label>
                    <div className="text-lg font-semibold">
                      {projectedIssued.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Calculated from cumulative logic
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Issuance Logic</h4>
            <p className="text-sm text-muted-foreground">
              Credits Issued = (Cumulative Generated - Cumulative Previously Issued) × Issuance Flag
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any additional assumptions or details about your operational metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Price escalation assumptions, seasonal variations, registry-specific requirements, verification timeline..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveOperationalMetrics} 
          disabled={loading || !hasValidIssuanceSchedule}
          className="bg-trust hover:bg-trust/90"
        >
          {loading ? 'Saving...' : 'Save Operational Metrics'}
        </Button>
      </div>
    </div>
  );
};

export default OperationalMetricsForm;