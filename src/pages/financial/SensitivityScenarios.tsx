import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  DollarSign,
  Percent,
  Calculator,
  Copy,
  Trash2,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FinancialCalculationEngine, ModelInputData } from '@/lib/financial/calculationEngine';

interface SensitivityVariable {
  key: string;
  name: string;
  baseValue: number;
  currentValue: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  format: 'currency' | 'percentage' | 'number';
}

interface Scenario {
  id: string;
  name: string;
  isBaseCase: boolean;
  variables: Record<string, number>;
  metrics?: {
    npv: number;
    irr: number;
    paybackPeriod: number;
    peakFunding: number;
  };
}

const SensitivityScenarios = () => {
  const { id: modelId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [modelName, setModelName] = useState('');
  const [activeTab, setActiveTab] = useState('sensitivity');
  
  // Sensitivity Analysis State
  const [sensitivities, setSensitivities] = useState<SensitivityVariable[]>([]);
  const [baseMetrics, setBaseMetrics] = useState<any>(null);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  
  // Scenario Management State
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [newScenarioName, setNewScenarioName] = useState('');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparedScenarios, setComparedScenarios] = useState<string[]>([]);

  useEffect(() => {
    if (modelId) {
      fetchModelData();
    }
  }, [modelId]);

  const fetchModelData = async () => {
    try {
      setLoading(true);

      // Fetch model details
      const { data: model, error: modelError } = await supabase
        .from('financial_models')
        .select('*')
        .eq('id', modelId)
        .maybeSingle();

      if (modelError) throw modelError;
      if (!model) {
        toast({
          title: "Model not found",
          description: "The financial model could not be found.",
          variant: "destructive",
        });
        return;
      }

      setModelName(model.name);

      // Fetch model inputs to determine base values
      await fetchBaseValues();
      
      // Fetch existing scenarios
      await fetchScenarios();

    } catch (error) {
      console.error('Error fetching model data:', error);
      toast({
        title: "Error",
        description: "Failed to load model data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseValues = async () => {
    try {
      const { data: inputs, error } = await supabase
        .from('model_inputs')
        .select('*')
        .eq('model_id', modelId);

      if (error) throw error;

      // Transform inputs to sensitivity variables
      const sensitivityVars: SensitivityVariable[] = [
        {
          key: 'carbonCreditPrice',
          name: 'Carbon Credit Price',
          baseValue: getInputValue(inputs, 'operational_metrics', 'carbon_credit_price') || 15,
          currentValue: getInputValue(inputs, 'operational_metrics', 'carbon_credit_price') || 15,
          unit: '$/tCO2e',
          min: 5,
          max: 50,
          step: 0.5,
          format: 'currency'
        },
        {
          key: 'creditsVolume',
          name: 'Volume of Credits Generated',
          baseValue: getInputValue(inputs, 'operational_metrics', 'annual_credits_generated') || 10000,
          currentValue: getInputValue(inputs, 'operational_metrics', 'annual_credits_generated') || 10000,
          unit: 'tCO2e/year',
          min: 1000,
          max: 100000,
          step: 500,
          format: 'number'
        },
        {
          key: 'cogsPercentage',
          name: 'COGS Percentage',
          baseValue: 35,
          currentValue: 35,
          unit: '%',
          min: 10,
          max: 80,
          step: 1,
          format: 'percentage'
        },
        {
          key: 'capexAmount',
          name: 'CAPEX Amount',
          baseValue: getInputValue(inputs, 'expenses', 'capital_expenditure') || 500000,
          currentValue: getInputValue(inputs, 'expenses', 'capital_expenditure') || 500000,
          unit: '$',
          min: 100000,
          max: 5000000,
          step: 25000,
          format: 'currency'
        },
        {
          key: 'taxRate',
          name: 'Tax Rate',
          baseValue: getInputValue(inputs, 'investor_assumptions', 'tax_rate') || 25,
          currentValue: getInputValue(inputs, 'investor_assumptions', 'tax_rate') || 25,
          unit: '%',
          min: 0,
          max: 50,
          step: 0.5,
          format: 'percentage'
        },
        {
          key: 'discountRate',
          name: 'Discount Rate (WACC)',
          baseValue: getInputValue(inputs, 'investor_assumptions', 'discount_rate') || 12,
          currentValue: getInputValue(inputs, 'investor_assumptions', 'discount_rate') || 12,
          unit: '%',
          min: 5,
          max: 25,
          step: 0.25,
          format: 'percentage'
        }
      ];

      setSensitivities(sensitivityVars);
      
      // Calculate base case metrics
      await calculateMetrics(sensitivityVars);

    } catch (error) {
      console.error('Error fetching base values:', error);
    }
  };

  const getInputValue = (inputs: any[], category: string, key: string): number | null => {
    const input = inputs.find(i => i.category === category && i.input_key === key);
    return input?.input_value || null;
  };

  const calculateMetrics = async (variables: SensitivityVariable[]) => {
    try {
      setCalculating(true);
      
      // This is a simplified calculation - in a real implementation,
      // you would apply the sensitivity changes and recalculate the full model
      const mockMetrics = {
        npv: Math.random() * 1000000 + 500000,
        irr: Math.random() * 20 + 10,
        paybackPeriod: Math.random() * 5 + 2,
        peakFunding: Math.random() * 2000000 + 500000,
      };

      if (!baseMetrics) {
        setBaseMetrics(mockMetrics);
      }
      setCurrentMetrics(mockMetrics);

    } catch (error) {
      console.error('Error calculating metrics:', error);
    } finally {
      setCalculating(false);
    }
  };

  const fetchScenarios = async () => {
    try {
      const { data: scenarios, error } = await supabase
        .from('model_scenarios')
        .select('*')
        .eq('model_id', modelId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedScenarios: Scenario[] = scenarios.map(s => {
        const scenarioData = s.scenario_data as any;
        return {
          id: s.id,
          name: s.scenario_name,
          isBaseCase: s.is_base_case,
          variables: scenarioData?.variables || {},
          metrics: scenarioData?.metrics
        };
      });

      // Ensure there's always a base case
      if (!formattedScenarios.some(s => s.isBaseCase)) {
        const baseCase: Scenario = {
          id: 'base-case',
          name: 'Base Case',
          isBaseCase: true,
          variables: {},
          metrics: baseMetrics
        };
        formattedScenarios.unshift(baseCase);
      }

      setScenarios(formattedScenarios);
      
      // Set default selection to base case
      const baseCase = formattedScenarios.find(s => s.isBaseCase);
      if (baseCase) {
        setSelectedScenario(baseCase.id);
      }

    } catch (error) {
      console.error('Error fetching scenarios:', error);
    }
  };

  const handleSensitivityChange = async (key: string, value: number[]) => {
    const updatedSensitivities = sensitivities.map(s => 
      s.key === key ? { ...s, currentValue: value[0] } : s
    );
    setSensitivities(updatedSensitivities);
    
    // Recalculate metrics with debouncing
    await calculateMetrics(updatedSensitivities);
  };

  const resetSensitivities = () => {
    const resetSensitivities = sensitivities.map(s => ({
      ...s,
      currentValue: s.baseValue
    }));
    setSensitivities(resetSensitivities);
    calculateMetrics(resetSensitivities);
  };

  const saveScenario = async () => {
    if (!newScenarioName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a scenario name",
        variant: "destructive",
      });
      return;
    }

    try {
      const scenarioData = {
        variables: sensitivities.reduce((acc, s) => ({
          ...acc,
          [s.key]: s.currentValue
        }), {}),
        metrics: currentMetrics
      };

      const { error } = await supabase
        .from('model_scenarios')
        .insert({
          model_id: modelId,
          scenario_name: newScenarioName,
          scenario_data: scenarioData,
          is_base_case: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Scenario saved successfully",
      });

      setNewScenarioName('');
      await fetchScenarios();

    } catch (error) {
      console.error('Error saving scenario:', error);
      toast({
        title: "Error",
        description: "Failed to save scenario",
        variant: "destructive",
      });
    }
  };

  const loadScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const updatedSensitivities = sensitivities.map(s => ({
      ...s,
      currentValue: scenario.variables[s.key] ?? s.baseValue
    }));

    setSensitivities(updatedSensitivities);
    setSelectedScenario(scenarioId);
    
    if (scenario.metrics) {
      setCurrentMetrics(scenario.metrics);
    } else {
      calculateMetrics(updatedSensitivities);
    }
  };

  const deleteScenario = async (scenarioId: string) => {
    if (scenarioId === 'base-case') return; // Can't delete base case

    try {
      const { error } = await supabase
        .from('model_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      });

      await fetchScenarios();

    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast({
        title: "Error",
        description: "Failed to delete scenario",
        variant: "destructive",
      });
    }
  };

  const formatValue = (value: number, format: 'currency' | 'percentage' | 'number', unit: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'number':
        return `${value.toLocaleString()} ${unit.replace(/(.*?)\/(.*?)/, '$1')}`;
      default:
        return `${value} ${unit}`;
    }
  };

  const getMetricChange = (current: number, base: number) => {
    if (!base || base === 0) return 0;
    return ((current - base) / base) * 100;
  };

  const getMetricChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </FinancialPlatformLayout>
    );
  }

  return (
    <FinancialPlatformLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(`/financial/models/${modelId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Model
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Sensitivity & Scenarios</h1>
          <p className="text-muted-foreground">{modelName}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="sensitivity" className="space-y-6">
          {/* Current Metrics Dashboard */}
          {currentMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { key: 'npv', label: 'NPV', value: currentMetrics.npv, format: 'currency', icon: DollarSign },
                { key: 'irr', label: 'IRR', value: currentMetrics.irr, format: 'percentage', icon: Percent },
                { key: 'paybackPeriod', label: 'Payback Period', value: currentMetrics.paybackPeriod, format: 'years', icon: Target },
                { key: 'peakFunding', label: 'Peak Funding', value: currentMetrics.peakFunding, format: 'currency', icon: BarChart3 },
              ].map(({ key, label, value, format, icon: Icon }) => {
                const baseValue = baseMetrics?.[key] || 0;
                const change = getMetricChange(value, baseValue);
                return (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getMetricChangeIcon(change)}
                          {Math.abs(change) > 0.1 && (
                            <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">
                          {format === 'currency' 
                            ? `$${(value / 1000000).toFixed(1)}M`
                            : format === 'percentage'
                            ? `${value.toFixed(1)}%`
                            : `${value.toFixed(1)} years`
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Sensitivity Sliders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sensitivity Variables</CardTitle>
                <Button variant="outline" size="sm" onClick={resetSensitivities}>
                  Reset to Base Case
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {sensitivities.map((variable) => {
                const changePercent = ((variable.currentValue - variable.baseValue) / variable.baseValue) * 100;
                return (
                  <div key={variable.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{variable.name}</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          Base: {formatValue(variable.baseValue, variable.format, variable.unit)}
                        </span>
                        {Math.abs(changePercent) > 0.1 && (
                          <Badge variant={changePercent > 0 ? "default" : "secondary"}>
                            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Slider
                        value={[variable.currentValue]}
                        onValueChange={(value) => handleSensitivityChange(variable.key, value)}
                        min={variable.min}
                        max={variable.max}
                        step={variable.step}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatValue(variable.min, variable.format, variable.unit)}</span>
                        <span className="font-medium">
                          Current: {formatValue(variable.currentValue, variable.format, variable.unit)}
                        </span>
                        <span>{formatValue(variable.max, variable.format, variable.unit)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Save Current as Scenario */}
          <Card>
            <CardHeader>
              <CardTitle>Save Current Settings as Scenario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter scenario name..."
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                />
                <Button onClick={saveScenario} disabled={calculating}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          {/* Scenario List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Saved Scenarios</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComparisonMode(!comparisonMode)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {comparisonMode ? 'Exit Comparison' : 'Compare Scenarios'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {comparisonMode ? (
                        <input
                          type="checkbox"
                          checked={comparedScenarios.includes(scenario.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setComparedScenarios([...comparedScenarios, scenario.id]);
                            } else {
                              setComparedScenarios(comparedScenarios.filter(id => id !== scenario.id));
                            }
                          }}
                        />
                      ) : (
                        <Button
                          variant={selectedScenario === scenario.id ? "default" : "ghost"}
                          size="sm"
                          onClick={() => loadScenario(scenario.id)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Load
                        </Button>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{scenario.name}</span>
                          {scenario.isBaseCase && <Badge variant="secondary">Base Case</Badge>}
                        </div>
                        {scenario.metrics && (
                          <div className="text-sm text-muted-foreground">
                            NPV: ${(scenario.metrics.npv / 1000000).toFixed(1)}M | 
                            IRR: {scenario.metrics.irr.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!scenario.isBaseCase && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newName = prompt('Enter new scenario name:', scenario.name);
                              if (newName && newName !== scenario.name) {
                                // Handle rename logic here
                              }
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this scenario?')) {
                                deleteScenario(scenario.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scenario Comparison */}
          {comparisonMode && comparedScenarios.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Scenario Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Metric</th>
                        {comparedScenarios.map(scenarioId => {
                          const scenario = scenarios.find(s => s.id === scenarioId);
                          return (
                            <th key={scenarioId} className="text-center p-3">
                              {scenario?.name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {['npv', 'irr', 'paybackPeriod', 'peakFunding'].map(metric => (
                        <tr key={metric} className="border-b">
                          <td className="p-3 font-medium capitalize">
                            {metric === 'npv' ? 'NPV' : 
                             metric === 'irr' ? 'IRR' : 
                             metric === 'paybackPeriod' ? 'Payback Period' : 
                             'Peak Funding'}
                          </td>
                          {comparedScenarios.map(scenarioId => {
                            const scenario = scenarios.find(s => s.id === scenarioId);
                            const value = scenario?.metrics?.[metric] || 0;
                            return (
                              <td key={scenarioId} className="p-3 text-center">
                                {metric === 'npv' || metric === 'peakFunding' 
                                  ? `$${(value / 1000000).toFixed(1)}M`
                                  : metric === 'irr'
                                  ? `${value.toFixed(1)}%`
                                  : `${value.toFixed(1)} years`
                                }
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Scenario Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Scenario Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Conservative Case', desc: 'Lower prices, higher costs', multipliers: { carbonCreditPrice: 0.8, creditsVolume: 0.9, cogsPercentage: 1.2 } },
                  { name: 'Optimistic Case', desc: 'Higher prices, lower costs', multipliers: { carbonCreditPrice: 1.3, creditsVolume: 1.1, cogsPercentage: 0.8 } },
                  { name: 'High Volume Case', desc: 'Focus on scale advantages', multipliers: { creditsVolume: 1.5, cogsPercentage: 0.9, capexAmount: 1.2 } },
                ].map((template) => (
                  <Card key={template.name} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    // Apply template multipliers to sensitivities
                    const updatedSensitivities = sensitivities.map(s => {
                      const multiplier = template.multipliers[s.key] || 1;
                      return {
                        ...s,
                        currentValue: s.baseValue * multiplier
                      };
                    });
                    setSensitivities(updatedSensitivities);
                    calculateMetrics(updatedSensitivities);
                    setActiveTab('sensitivity');
                  }}>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t mt-6">
        <Button variant="outline" onClick={() => navigate(`/financial/models/${modelId}/metrics`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Metrics
        </Button>
        <Button 
          className="bg-trust hover:bg-trust/90"
          onClick={() => navigate(`/financial/models/${modelId}/reports`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Generate Reports
        </Button>
      </div>
    </div>
    </FinancialPlatformLayout>
  );
};

export default SensitivityScenarios;