import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Scale, AlertTriangle, Target, DollarSign } from 'lucide-react';

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
  basePattern?: number[];
}

interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  adjustments: {
    revenue: number; // percentage adjustment (e.g., +20 or -20)
    costs: number;
    financing: number;
  };
}

interface ScenarioTemplatesProps {
  sensitivities: SensitivityVariable[];
  onApplyTemplate: (adjustments: Record<string, number>, templateName: string) => void;
}

const templates: ScenarioTemplate[] = [
  {
    id: 'optimistic',
    name: 'Optimistic Growth',
    description: 'Best-case scenario with higher revenues and lower costs',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'text-success',
    adjustments: {
      revenue: 20, // +20%
      costs: -10, // -10%
      financing: 0
    }
  },
  {
    id: 'pessimistic',
    name: 'Pessimistic Downturn',
    description: 'Worst-case scenario with lower revenues and higher costs',
    icon: <TrendingDown className="h-5 w-5" />,
    color: 'text-destructive',
    adjustments: {
      revenue: -20, // -20%
      costs: 15, // +15%
      financing: 0
    }
  },
  {
    id: 'conservative',
    name: 'Conservative Base',
    description: 'Moderate reduction in revenues and increase in costs',
    icon: <Scale className="h-5 w-5" />,
    color: 'text-muted-foreground',
    adjustments: {
      revenue: -10,
      costs: 10,
      financing: 0
    }
  },
  {
    id: 'market_stress',
    name: 'Market Stress',
    description: 'Lower credit prices and higher financing costs',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-warning',
    adjustments: {
      revenue: -25,
      costs: 5,
      financing: 25 // Higher interest rates
    }
  },
  {
    id: 'best_case',
    name: 'Best Case',
    description: 'Maximum revenue potential with optimal cost structure',
    icon: <Target className="h-5 w-5" />,
    color: 'text-primary',
    adjustments: {
      revenue: 30,
      costs: -15,
      financing: -20 // Lower interest rates
    }
  },
  {
    id: 'cost_overrun',
    name: 'Cost Overrun',
    description: 'Significant cost increases across all expense categories',
    icon: <DollarSign className="h-5 w-5" />,
    color: 'text-destructive',
    adjustments: {
      revenue: 0,
      costs: 30,
      financing: 10
    }
  }
];

const ScenarioTemplates = ({ sensitivities, onApplyTemplate }: ScenarioTemplatesProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScenarioTemplate | null>(null);
  const [scenarioName, setScenarioName] = useState('');
  const [customAdjustments, setCustomAdjustments] = useState({
    revenue: 0,
    costs: 0,
    financing: 0
  });

  const handleTemplateSelect = (template: ScenarioTemplate) => {
    setSelectedTemplate(template);
    setScenarioName(template.name);
    setCustomAdjustments(template.adjustments);
  };

  const applyTemplate = () => {
    if (!selectedTemplate) return;

    const adjustments: Record<string, number> = {};

    // Revenue variables
    const revenueKeys = ['credits_generated', 'price_per_credit'];
    revenueKeys.forEach(key => {
      const variable = sensitivities.find(s => s.key === key);
      if (variable) {
        const adjustment = 1 + (customAdjustments.revenue / 100);
        adjustments[key] = variable.baseValue * adjustment;
      }
    });

    // Cost variables
    const costKeys = [
      'cogs_rate', 'staff_costs', 'mrv_costs', 'pdd_costs', 
      'feasibility_costs', 'capex', 'depreciation'
    ];
    costKeys.forEach(key => {
      const variable = sensitivities.find(s => s.key === key);
      if (variable) {
        const adjustment = 1 + (customAdjustments.costs / 100);
        adjustments[key] = variable.baseValue * adjustment;
      }
    });

    // Financing variables
    const financingKeys = ['interest_rate', 'discount_rate'];
    financingKeys.forEach(key => {
      const variable = sensitivities.find(s => s.key === key);
      if (variable) {
        const adjustment = 1 + (customAdjustments.financing / 100);
        adjustments[key] = variable.baseValue * adjustment;
      }
    });

    onApplyTemplate(adjustments, scenarioName);
    setOpen(false);
    setSelectedTemplate(null);
    setScenarioName('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Target className="h-4 w-4 mr-2" />
          Create from Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Scenario from Template</DialogTitle>
          <DialogDescription>
            Select a pre-built scenario template and customize it to your needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection - Categorized */}
          <div className="space-y-6">
            {/* Three-Point Estimate */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Three-Point Estimate</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {templates.filter(t => ['optimistic', 'pessimistic', 'conservative'].includes(t.id)).map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className={template.color}>{template.icon}</span>
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={template.adjustments.revenue > 0 ? "default" : template.adjustments.revenue < 0 ? "destructive" : "outline"} className="text-xs">
                          Rev: {template.adjustments.revenue > 0 ? '+' : ''}{template.adjustments.revenue}%
                        </Badge>
                        <Badge variant={template.adjustments.costs > 0 ? "destructive" : template.adjustments.costs < 0 ? "default" : "outline"} className="text-xs">
                          Cost: {template.adjustments.costs > 0 ? '+' : ''}{template.adjustments.costs}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Market Conditions */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Market Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.filter(t => ['best_case', 'market_stress'].includes(t.id)).map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className={template.color}>{template.icon}</span>
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={template.adjustments.revenue > 0 ? "default" : template.adjustments.revenue < 0 ? "destructive" : "outline"} className="text-xs">
                          Rev: {template.adjustments.revenue > 0 ? '+' : ''}{template.adjustments.revenue}%
                        </Badge>
                        <Badge variant={template.adjustments.costs > 0 ? "destructive" : template.adjustments.costs < 0 ? "default" : "outline"} className="text-xs">
                          Cost: {template.adjustments.costs > 0 ? '+' : ''}{template.adjustments.costs}%
                        </Badge>
                        {template.adjustments.financing !== 0 && (
                          <Badge variant={template.adjustments.financing > 0 ? "destructive" : "default"} className="text-xs">
                            Fin: {template.adjustments.financing > 0 ? '+' : ''}{template.adjustments.financing}%
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Cost Scenarios */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Cost Scenarios</h3>
              <div className="grid grid-cols-1 gap-3">
                {templates.filter(t => t.id === 'cost_overrun').map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className={template.color}>{template.icon}</span>
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={template.adjustments.revenue > 0 ? "default" : template.adjustments.revenue < 0 ? "destructive" : "outline"} className="text-xs">
                          Rev: {template.adjustments.revenue > 0 ? '+' : ''}{template.adjustments.revenue}%
                        </Badge>
                        <Badge variant={template.adjustments.costs > 0 ? "destructive" : template.adjustments.costs < 0 ? "default" : "outline"} className="text-xs">
                          Cost: {template.adjustments.costs > 0 ? '+' : ''}{template.adjustments.costs}%
                        </Badge>
                        {template.adjustments.financing !== 0 && (
                          <Badge variant={template.adjustments.financing > 0 ? "destructive" : "default"} className="text-xs">
                            Fin: {template.adjustments.financing > 0 ? '+' : ''}{template.adjustments.financing}%
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Customization Section */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Customize Adjustments</CardTitle>
                <CardDescription>
                  Fine-tune the template adjustments before applying
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-name">Scenario Name</Label>
                  <Input
                    id="scenario-name"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="Enter scenario name..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="revenue-adj">Revenue Adjustment (%)</Label>
                    <Input
                      id="revenue-adj"
                      type="number"
                      value={customAdjustments.revenue}
                      onChange={(e) => setCustomAdjustments(prev => ({
                        ...prev,
                        revenue: Number(e.target.value)
                      }))}
                      step="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costs-adj">Costs Adjustment (%)</Label>
                    <Input
                      id="costs-adj"
                      type="number"
                      value={customAdjustments.costs}
                      onChange={(e) => setCustomAdjustments(prev => ({
                        ...prev,
                        costs: Number(e.target.value)
                      }))}
                      step="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="financing-adj">Financing Adjustment (%)</Label>
                    <Input
                      id="financing-adj"
                      type="number"
                      value={customAdjustments.financing}
                      onChange={(e) => setCustomAdjustments(prev => ({
                        ...prev,
                        financing: Number(e.target.value)
                      }))}
                      step="5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={applyTemplate} 
            disabled={!selectedTemplate || !scenarioName.trim()}
          >
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScenarioTemplates;
