import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, Target } from 'lucide-react';
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
}

interface IssuanceSchedule {
  year: number;
  credits_issued: number;
}

const OperationalMetricsForm = ({ modelId, model }: OperationalMetricsFormProps) => {
  const [yearlyMetrics, setYearlyMetrics] = useState<YearlyMetrics[]>([]);
  const [issuanceSchedule, setIssuanceSchedule] = useState<IssuanceSchedule[]>([]);
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
      });
    }
    setYearlyMetrics(years);

    // Initialize issuance schedule (typically starts 1-2 years after project start)
    const issuanceYears = [];
    for (let year = model.start_year + 1; year <= model.end_year; year++) {
      issuanceYears.push({
        year,
        credits_issued: 0,
      });
    }
    setIssuanceSchedule(issuanceYears);
  }, [model]);

  const updateYearlyMetric = (year: number, field: keyof Omit<YearlyMetrics, 'year'>, value: number) => {
    setYearlyMetrics(prev => 
      prev.map(metric => 
        metric.year === year 
          ? { ...metric, [field]: value }
          : metric
      )
    );
  };

  const updateIssuanceSchedule = (year: number, credits: number) => {
    setIssuanceSchedule(prev => 
      prev.map(issuance => 
        issuance.year === year 
          ? { ...issuance, credits_issued: credits }
          : issuance
      )
    );
  };

  const saveOperationalMetrics = async () => {
    setLoading(true);
    try {
      // Save yearly metrics
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
        }
      ]);

      // Save issuance schedule
      const issuanceInputs = issuanceSchedule.map(issuance => ({
        model_id: modelId,
        category: 'operational_metrics',
        input_key: 'credits_issued',
        input_value: { value: issuance.credits_issued },
        year: issuance.year,
      }));

      // Save notes
      const notesInput = {
        model_id: modelId,
        category: 'operational_metrics',
        input_key: 'notes',
        input_value: { value: notes },
      };

      const allInputs = [...yearlyInputs, ...issuanceInputs, notesInput];

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

  const totalCredits = yearlyMetrics.reduce((sum, metric) => sum + metric.credits_generated, 0);
  const totalIssuance = issuanceSchedule.reduce((sum, issuance) => sum + issuance.credits_issued, 0);
  const averagePrice = yearlyMetrics.length > 0 
    ? yearlyMetrics.reduce((sum, metric) => sum + metric.price_per_credit, 0) / yearlyMetrics.length 
    : 0;

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
            <CardTitle className="text-2xl">{totalIssuance.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Price/Credit</CardDescription>
            <CardTitle className="text-2xl">${averagePrice.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Credits Generated by Year */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Credits Generated & Pricing by Year
          </CardTitle>
          <CardDescription>
            Specify how many credits your project will generate each year and expected pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {yearlyMetrics.map((metric, index) => (
              <div key={metric.year} className="grid gap-4 md:grid-cols-3 p-4 border rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Year {metric.year}
                  </Label>
                  <Badge variant="outline" className="mt-1">
                    Year {index + 1} of project
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Issuance Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Credit Issuance Schedule
          </CardTitle>
          <CardDescription>
            When will credits be officially issued by the registry? (typically 1-2 years after generation)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issuanceSchedule.map((issuance) => (
              <div key={issuance.year} className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg">
                <div>
                  <Label>Issuance Year {issuance.year}</Label>
                  <Badge variant="outline" className="mt-1">
                    Registry verification & issuance
                  </Badge>
                </div>
                <div>
                  <Label htmlFor={`issued-${issuance.year}`}>Credits Issued</Label>
                  <Input
                    id={`issued-${issuance.year}`}
                    type="number"
                    value={issuance.credits_issued}
                    onChange={(e) => updateIssuanceSchedule(issuance.year, Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
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
            Any additional assumptions or details about your operational metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Price escalation assumptions, seasonal variations, registry-specific requirements..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveOperationalMetrics} 
          disabled={loading}
          className="bg-trust hover:bg-trust/90"
        >
          {loading ? 'Saving...' : 'Save Operational Metrics'}
        </Button>
      </div>
    </div>
  );
};

export default OperationalMetricsForm;