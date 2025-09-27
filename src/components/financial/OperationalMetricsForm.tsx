import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  issuance_flag: number; // 0/1 flag for when credits are issued (not boolean)
}

const OperationalMetricsForm = ({ modelId, model }: OperationalMetricsFormProps) => {
  const [yearlyMetrics, setYearlyMetrics] = useState<YearlyMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  // Initialize years based on model projection period
  useEffect(() => {
    const years = [];
    for (let year = model.start_year; year <= model.end_year; year++) {
      years.push({
        year,
        credits_generated: 0,
        price_per_credit: 10, // Default $10 per credit
        issuance_flag: year > model.start_year ? 1 : 0, // Default: issue starting year 2 (0/1)
      });
    }
    setYearlyMetrics(years);
  }, [model]);

  const updateYearlyMetric = (year: number, field: keyof YearlyMetrics, value: number) => {
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
      // Prepare inputs with Excel-compatible structure
      const yearlyInputs = yearlyMetrics.flatMap(metric => [
        {
          model_id: modelId,
          category: 'operational_metrics',
          input_key: 'credits_generated',
          input_value: { value: metric.credits_generated },
          year: metric.year,
        },
        {
          model_id: modelId,
          category: 'operational_metrics',
          input_key: 'price_per_credit',
          input_value: { value: metric.price_per_credit },
          year: metric.year,
        },
        {
          model_id: modelId,
          category: 'operational_metrics',
          input_key: 'issuance_flag',
          input_value: { value: metric.issuance_flag },
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

  // Calculate cumulative issued credits using Excel logic
  const calculateIssuedCredits = () => {
    const issued: number[] = [];
    for (let i = 0; i < yearlyMetrics.length; i++) {
      const cumGenerated = yearlyMetrics.slice(0, i + 1).reduce((sum, m) => sum + m.credits_generated, 0);
      const cumIssuedPrev = issued.reduce((sum, val) => sum + val, 0);
      const issuanceFlag = yearlyMetrics[i].issuance_flag;
      issued[i] = (cumGenerated - cumIssuedPrev) * issuanceFlag;
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
  const hasGenerationBeforeIssuance = yearlyMetrics.some((metric, i) => 
    metric.issuance_flag === 1 && metric.credits_generated === 0 && i === 0
  );
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

      {/* Validation Alert */}
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
            Configure credit generation, pricing, and when credits will be officially issued by the registry
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
                    <Label htmlFor={`issuance-${metric.year}`}>Issue Credits (0/1)</Label>
                    <Input
                      id={`issuance-${metric.year}`}
                      type="number"
                      value={metric.issuance_flag}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value === 0 || value === 1) {
                          updateYearlyMetric(metric.year, 'issuance_flag', value);
                        }
                      }}
                      placeholder="0"
                      min="0"
                      max="1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter 0 or 1 (0 = no issuance, 1 = issue credits)
                    </p>
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
            <h4 className="font-medium mb-2">Issuance Logic (Excel Formula)</h4>
            <p className="text-sm text-muted-foreground">
              Credits Issued = (Cumulative Generated - Cumulative Previously Issued) × Issuance Flag (0/1)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This matches the Excel formula: <code>=(SUM($F5:G5)-SUM($F9:F9))*G8</code> where G8 is 0 or 1
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