import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sliders,
  Save,
  BarChart3,
  Star,
  GitCompare,
  TrendingUp,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface SensitivityTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SensitivityTutorial = ({ open, onOpenChange }: SensitivityTutorialProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Sensitivity & Scenario Analysis Guide</DialogTitle>
          <DialogDescription>
            Master the art of testing assumptions and comparing financial outcomes
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  What is Sensitivity & Scenario Analysis?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Sensitivity and scenario analysis helps you understand how changes in key assumptions 
                  affect your project's financial outcomes. This is critical for:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Risk Assessment:</strong> Identify which variables have the biggest impact on success</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Decision Making:</strong> Compare different strategies and choose the best path forward</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Stakeholder Communication:</strong> Present multiple scenarios to investors and partners</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Planning:</strong> Prepare for best-case, realistic, and worst-case outcomes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Quick Start Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Badge className="h-6 w-6 rounded-full flex items-center justify-center">1</Badge>
                    <div>
                      <p className="font-medium text-sm">Start with Sensitivity Analysis</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Adjust sliders to see real-time impact on key metrics like NPV, IRR, and revenue
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Badge className="h-6 w-6 rounded-full flex items-center justify-center">2</Badge>
                    <div>
                      <p className="font-medium text-sm">Save Interesting Scenarios</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        When you find a combination worth exploring, give it a descriptive name and save it
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Badge className="h-6 w-6 rounded-full flex items-center justify-center">3</Badge>
                    <div>
                      <p className="font-medium text-sm">Create Multiple Scenarios</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Build 3-5 scenarios representing different futures (e.g., Conservative, Realistic, Optimistic)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Badge className="h-6 w-6 rounded-full flex items-center justify-center">4</Badge>
                    <div>
                      <p className="font-medium text-sm">Compare & Analyze</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Switch to Scenario Manager to compare outcomes side-by-side with charts and tables
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sensitivity Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-primary" />
                  Using Sensitivity Sliders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <p className="leading-relaxed">
                    Each slider represents a key input variable in your financial model. Variables are organized 
                    into categories for easy navigation:
                  </p>
                  
                  <div className="space-y-2 pl-4">
                    <div>
                      <p className="font-semibold">Revenue Variables</p>
                      <p className="text-muted-foreground text-xs">
                        Credit volumes, prices, growth rates - directly impact top-line revenue
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Cost Variables</p>
                      <p className="text-muted-foreground text-xs">
                        COGS rates, staff costs, operational expenses - affect profit margins
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">One-Time Costs</p>
                      <p className="text-muted-foreground text-xs">
                        CAPEX, PDD, feasibility studies - upfront investments
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Financing</p>
                      <p className="text-muted-foreground text-xs">
                        Discount rates, debt terms, equity - capital structure variables
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="font-medium text-sm">How Sliders Work:</p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>The center position represents your base case (original input values)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Move left to decrease the value, right to increase it</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>The percentage change badge shows how far you've moved from base</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Metrics recalculate automatically after you stop adjusting (within 500ms)</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Understanding Key Impacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  The "Key Impacts" section shows you which metrics changed the most as you adjust variables:
                </p>
                <div className="space-y-2 pl-4">
                  <div>
                    <p className="font-semibold">NPV (Net Present Value)</p>
                    <p className="text-muted-foreground text-xs">
                      The total value of future cash flows discounted to today. Higher is better. 
                      Negative NPV means the project destroys value at the given discount rate.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">IRR (Internal Rate of Return)</p>
                    <p className="text-muted-foreground text-xs">
                      The annualized rate of return. Compare to your cost of capital. 
                      If IRR &gt; discount rate, the project creates value.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Revenue</p>
                    <p className="text-muted-foreground text-xs">
                      Total top-line sales over the project lifetime. Shows revenue sensitivity to price and volume changes.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Pro Tip:</strong> Watch for "tipping points" - small changes that cause large metric swings. 
                    These are your high-risk/high-opportunity variables.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5 text-primary" />
                  Creating & Saving Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  A scenario is a saved snapshot of all your variable adjustments plus the calculated financial outcomes.
                </p>
                
                <div className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <p className="font-semibold">Naming Best Practices:</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Descriptive:</strong> "High Credit Price + Low Costs" instead of "Scenario 1"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Categorized:</strong> Use prefixes like "Conservative:", "Optimistic:", "Stress Test:"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Specific:</strong> Reference the key change - "2025 Price Drop", "Double Volume Growth"</span>
                      </li>
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="font-semibold">Common Scenario Sets:</p>
                    <div className="space-y-2 pl-4">
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs font-medium">Three-Point Estimate</p>
                        <p className="text-xs text-muted-foreground">Base Case, Optimistic (+20%), Pessimistic (-20%)</p>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs font-medium">Market Scenarios</p>
                        <p className="text-xs text-muted-foreground">Bull Market, Bear Market, Stable Market</p>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs font-medium">Strategic Options</p>
                        <p className="text-xs text-muted-foreground">Fast Growth, Slow Growth, Profitability Focus</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  What is a Base Case?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  The <strong>Base Case</strong> is your reference point - the scenario you consider most realistic 
                  or most likely. All other scenarios show metrics changes relative to the base case.
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> Your first saved scenario is automatically set as the base case. 
                    You can change this anytime by clicking "Set as Base" on a different scenario.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold">When to Change Base Case:</p>
                  <ul className="space-y-1 text-muted-foreground pl-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>New information makes a different scenario more realistic</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>You want to compare all scenarios against a "worst case" instead of "realistic case"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Your organization's strategy has shifted</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5 text-primary" />
                  Comparing Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  The Scenario Manager tab provides powerful comparison tools:
                </p>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold">Scenario Cards</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Each card shows the scenario name, which variables were changed, and the top 3 metric impacts 
                      compared to base case. Use checkboxes to select which scenarios to compare.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold">Visual Charts</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Bar charts compare key metrics across selected scenarios. Quickly see which scenario 
                      has the highest NPV, IRR, or revenue.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold">Detailed Comparison Table</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Side-by-side table shows exact values for each metric. Percentage changes from base 
                      case are highlighted with color-coded badges.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-2 bg-green-50 dark:bg-green-950 p-3 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-300">
                    <strong>Best Practice:</strong> Select 2-4 scenarios at a time for comparison. 
                    Too many scenarios make the charts cluttered and harder to interpret.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Probability Weighting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Assign probability weights to scenarios to calculate expected value outcomes. 
                  This helps answer: "Given the likelihood of each scenario, what should we expect on average?"
                </p>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold">How It Works:</p>
                    <ol className="space-y-1.5 text-muted-foreground pl-4 mt-2">
                      <li className="flex items-start gap-2">
                        <span className="font-medium">1.</span>
                        <span>Select the scenarios you want to include in weighted analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">2.</span>
                        <span>Enter probability percentages for each (must sum to 100%)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">3.</span>
                        <span>Click "Calculate Weighted Metrics" to see probability-adjusted outcomes</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-muted p-3 rounded-md text-xs">
                    <p className="font-semibold mb-2">Example:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Conservative Scenario: 30% probability</li>
                      <li>• Base Case: 50% probability</li>
                      <li>• Optimistic Scenario: 20% probability</li>
                    </ul>
                    <p className="mt-2">
                      Expected NPV = (0.30 × Conservative NPV) + (0.50 × Base NPV) + (0.20 × Optimistic NPV)
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 p-3 rounded-md">
                  <p className="text-xs text-purple-800 dark:text-purple-200">
                    <strong>When to Use:</strong> Probability weighting is ideal for decision-making under uncertainty, 
                    risk assessment, and presenting expected outcomes to investors.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Scenario Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  Use pre-built templates to quickly generate common scenario types. Templates apply 
                  coordinated changes across multiple variables based on proven modeling patterns.
                </p>

                <div className="space-y-2">
                  <p className="font-semibold">Available Templates:</p>
                  <div className="space-y-2">
                    <div className="bg-green-50 dark:bg-green-950 p-2 rounded border border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200">Optimistic Growth</p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        +20% revenue variables, -10% costs - models favorable market conditions
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Conservative</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        -15% revenue, +10% costs - tests downside scenarios
                      </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">High Volume Low Price</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        +30% volumes, -20% prices - explores market share strategy
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  After applying a template, you can fine-tune individual variables before saving the scenario.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Tips & Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span><strong>Document Your Assumptions:</strong> Use the notes field to explain why each scenario matters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span><strong>Test Extremes:</strong> Create stress test scenarios with multiple variables at their limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span><strong>Focus on Drivers:</strong> Identify which 2-3 variables have the biggest impact and vary those most</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span><strong>Regular Updates:</strong> Revisit scenarios quarterly as new information emerges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span><strong>Export for Sharing:</strong> Use the export button to download scenarios as JSON for team review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span><strong>Duplicate & Modify:</strong> Start from an existing scenario and make small changes to explore variations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
