import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Calculator,
  Percent,
  Clock,
} from 'lucide-react';

interface FinancialMetricsGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FinancialMetricsGuide = ({ open, onOpenChange }: FinancialMetricsGuideProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Financial Metrics Guide</DialogTitle>
          <DialogDescription>
            Master comprehensive financial metrics from NPV and IRR to operational efficiency indicators
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="core">Core Metrics</TabsTrigger>
            <TabsTrigger value="operational">Operational</TabsTrigger>
            <TabsTrigger value="decisions">Using Metrics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  What Are Financial Metrics?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Financial metrics are quantitative measures that evaluate your project's performance, viability, 
                  and investment attractiveness. They transform raw financial statements into actionable insights 
                  for decision-making.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Investment Metrics:</strong> NPV, IRR, Payback Period, MIRR</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Profitability Metrics:</strong> Gross Margin, EBITDA Margin, Net Margin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Operational Metrics:</strong> Unit economics, LCOC, working capital efficiency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Debt Metrics:</strong> Min DSCR, leverage ratios, debt capacity</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  How Metrics Are Calculated
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Metrics are auto-calculated from your financial statements. The calculation flow is:
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">1</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Generate Statements</p>
                      <p className="text-xs text-muted-foreground">Income, Balance, Cash Flow, Debt, Carbon, FCFE</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">2</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Extract Yearly Data</p>
                      <p className="text-xs text-muted-foreground">Transform statements into year-by-year arrays</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">3</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Calculate Comprehensive Metrics</p>
                      <p className="text-xs text-muted-foreground">Returns, profitability, unit economics, working capital, debt</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">4</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Display & Visualize</p>
                      <p className="text-xs text-muted-foreground">Tables, charts, and KPI cards for analysis</p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Important:</strong> Metrics automatically recalculate when you regenerate statements. 
                    Always ensure statements are current before analyzing metrics.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Metrics Dashboard Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  The Financial Metrics page is organized into tabs for easy exploration:
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-2 bg-muted rounded">
                    <span className="font-semibold text-xs shrink-0 w-24">Profitability</span>
                    <span className="text-xs text-muted-foreground">
                      Revenue, margins, EBITDA, net income over time
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2 bg-muted rounded">
                    <span className="font-semibold text-xs shrink-0 w-24">Unit Economics</span>
                    <span className="text-xs text-muted-foreground">
                      Per-credit metrics: LCOC, COGS/credit, average price
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2 bg-muted rounded">
                    <span className="font-semibold text-xs shrink-0 w-24">Returns</span>
                    <span className="text-xs text-muted-foreground">
                      NPV, IRR, MIRR, payback for equity and project
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2 bg-muted rounded">
                    <span className="font-semibold text-xs shrink-0 w-24">Working Capital</span>
                    <span className="text-xs text-muted-foreground">
                      DSO, DPO, NWC as % of revenue, cash conversion
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2 bg-muted rounded">
                    <span className="font-semibold text-xs shrink-0 w-24">Debt & Liquidity</span>
                    <span className="text-xs text-muted-foreground">
                      DSCR, current ratio, quick ratio, leverage
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Export Feature:</strong> Click "Export Metrics" to download all metrics as CSV for 
                    external analysis or sharing with stakeholders.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Core Metrics Tab */}
          <TabsContent value="core" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  NPV (Net Present Value)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  NPV represents the present value of all future cash flows, discounted at your required rate of 
                  return (discount rate). It's the most fundamental value metric.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-muted rounded">
                    <p className="font-medium mb-2">Calculation</p>
                    <p className="text-muted-foreground font-mono text-[11px]">
                      NPV = Σ (FCFₜ / (1 + r)ᵗ) - Initial Investment
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Where FCF = Free Cash Flow, r = discount rate, t = time period
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold">Interpretation:</p>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span><strong>NPV &gt; 0:</strong> Project creates value. Go ahead!</span>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <span><strong>NPV &lt; 0:</strong> Project destroys value at this discount rate. Reconsider.</span>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                        <span><strong>NPV ≈ 0:</strong> Marginal project. Small changes can flip the decision.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Equity vs Project NPV:</strong> Equity NPV uses FCFE and equity discount rate. 
                    Project NPV uses unlevered cash flows. Equity NPV matters most for equity investors.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  IRR (Internal Rate of Return)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  IRR is the discount rate that makes NPV = 0. It represents the annualized return rate your project 
                  generates. Compare it to your hurdle rate (cost of capital).
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-muted rounded">
                    <p className="font-medium mb-2">Decision Rule</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p><strong>If IRR &gt; Discount Rate:</strong> Accept project (creates value)</p>
                      <p><strong>If IRR &lt; Discount Rate:</strong> Reject project (destroys value)</p>
                      <p><strong>If IRR = Discount Rate:</strong> Indifferent (break-even)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold">Typical IRR Targets for Carbon Projects:</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Conservative / Low-Risk Projects</span>
                        <span className="font-medium">12-18%</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Typical Carbon Projects</span>
                        <span className="font-medium">18-25%</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>High-Risk / Frontier Markets</span>
                        <span className="font-medium">25-35%+</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>IRR Limitation:</strong> IRR assumes you can reinvest cash flows at the IRR itself, 
                    which is often unrealistic. Use MIRR (Modified IRR) for more conservative estimates.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Payback Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  The time (in years) it takes for cumulative cash flows to equal the initial investment. Measures 
                  liquidity risk and capital efficiency.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-muted rounded">
                    <p className="font-medium mb-2">Calculation</p>
                    <p className="text-muted-foreground">
                      Count years until Σ(Cash Flows) ≥ Initial Equity Investment. Uses undiscounted cash flows.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold">Interpretation:</p>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span><strong>2-4 years:</strong> Excellent - fast capital recovery</span>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <span><strong>4-7 years:</strong> Good - typical for carbon projects</span>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                        <span><strong>7-10 years:</strong> Long - requires patient capital</span>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <span><strong>&gt;10 years or never:</strong> Red flag - review viability</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Investor Preference:</strong> Shorter payback = lower risk. Impact investors may accept 
                    longer paybacks, but commercial investors typically want &lt;7 years.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Min DSCR (Debt Service Coverage Ratio)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  The minimum DSCR across all years measures the project's ability to service debt in the tightest year. 
                  Critical for lenders and debt sustainability.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-muted rounded">
                    <p className="font-medium mb-2">Calculation</p>
                    <p className="text-muted-foreground font-mono text-[11px]">
                      DSCR = EBITDA ÷ (Principal Payment + Interest Expense)
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Min DSCR = Lowest DSCR value across all project years
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold">Lender Requirements:</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Comfortable Cushion</span>
                        <span className="font-medium">≥ 1.5x</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Acceptable</span>
                        <span className="font-medium">1.2x - 1.5x</span>
                      </div>
                      <div className="flex justify-between p-2 bg-destructive/10 rounded">
                        <span>Covenant Violation Risk</span>
                        <span className="font-medium text-destructive">&lt; 1.2x</span>
                      </div>
                      <div className="flex justify-between p-2 bg-destructive/20 rounded">
                        <span>Default Risk</span>
                        <span className="font-medium text-destructive">&lt; 1.0x</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Critical:</strong> If Min DSCR &lt; 1.0x, your project cannot cover debt payments in at 
                    least one year. Either reduce debt, increase revenue, or cut costs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operational Metrics Tab */}
          <TabsContent value="operational" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  Profitability Margins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Margin metrics show what percentage of revenue remains at each level of the income statement. 
                  They reveal operational efficiency and pricing power.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <p className="font-semibold mb-2">Gross Margin %</p>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-muted-foreground mb-1">
                        Formula: (Revenue - COGS) ÷ Revenue × 100
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Benchmark:</strong> Carbon projects typically 60-85%. Higher = better pricing or lower variable costs.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">EBITDA Margin %</p>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-muted-foreground mb-1">
                        Formula: EBITDA ÷ Revenue × 100
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Benchmark:</strong> Target 30-50% for sustainable projects. Measures operating efficiency.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Net Margin %</p>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-muted-foreground mb-1">
                        Formula: Net Income ÷ Revenue × 100
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Benchmark:</strong> 15-30% typical. Lower than EBITDA due to depreciation, interest, tax.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Trend Analysis:</strong> Margins should improve over time as projects scale and fixed 
                    costs get spread over more revenue. Declining margins signal inefficiency or pricing pressure.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Unit Economics (Per Credit)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Unit economics normalize financial data to a per-credit basis, enabling comparison across projects 
                  of different sizes and revealing the fundamental economics of credit production.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Weighted Average Price</p>
                    <p className="text-muted-foreground mt-1">
                      Total Revenue ÷ Credits Issued. Blends spot and pre-purchase pricing.
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">COGS Per Credit</p>
                    <p className="text-muted-foreground mt-1">
                      Total COGS ÷ Credits Issued. Direct variable cost to produce one credit.
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Gross Profit Per Credit</p>
                    <p className="text-muted-foreground mt-1">
                      (Revenue - COGS) ÷ Credits Issued. Margin before OPEX.
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">OPEX Per Credit</p>
                    <p className="text-muted-foreground mt-1">
                      Total OPEX ÷ Credits Issued. Fixed costs allocated per credit.
                    </p>
                  </div>

                  <div className="p-2 bg-primary/10 rounded border border-primary/20">
                    <p className="font-medium">LCOC (Levelized Cost of Carbon)</p>
                    <p className="text-muted-foreground mt-1">
                      (COGS + OPEX) ÷ Credits Issued. Total production cost per credit. Critical benchmark!
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Competitive Advantage:</strong> If your LCOC is significantly below market price, you have 
                    strong margins and can weather price volatility.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Working Capital Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Working capital metrics measure how efficiently you manage short-term assets and liabilities. 
                  Poor management ties up cash unnecessarily.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">DSO (Days Sales Outstanding)</p>
                    <p className="text-muted-foreground mt-1">
                      (Accounts Receivable ÷ Revenue) × 365. How long to collect payment after sale. Target: 18-36 days.
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">DPO (Days Payable Outstanding)</p>
                    <p className="text-muted-foreground mt-1">
                      (Accounts Payable ÷ COGS) × 365. How long before you pay suppliers. Target: 36-54 days.
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">NWC (Net Working Capital)</p>
                    <p className="text-muted-foreground mt-1">
                      AR - AP - Unearned Revenue. Positive NWC means cash tied up in operations.
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">NWC as % of Revenue</p>
                    <p className="text-muted-foreground mt-1">
                      NWC ÷ Revenue × 100. Target &lt;10%. High percentages indicate inefficiency.
                    </p>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Cash Conversion:</strong> Ideal scenario is DPO &gt; DSO (you collect faster than you pay). 
                    This creates positive cash float and improves liquidity.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Using Metrics Tab */}
          <TabsContent value="decisions" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Investment Decision Framework
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Use these metrics hierarchically to evaluate project viability:
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">1</Badge>
                    <div>
                      <p className="font-medium text-sm">NPV Check (Pass/Fail)</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        If NPV &lt; 0, stop here. Project destroys value at current assumptions.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">2</Badge>
                    <div>
                      <p className="font-medium text-sm">IRR vs Hurdle Rate</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Is IRR &gt; your required return? If yes, proceed. If marginal, run sensitivity analysis.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">3</Badge>
                    <div>
                      <p className="font-medium text-sm">Debt Sustainability</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Check Min DSCR ≥ 1.2x. If using debt, this is critical. Below 1.2x = refinancing risk.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">4</Badge>
                    <div>
                      <p className="font-medium text-sm">Payback Period</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Assess liquidity risk. &gt;10 years = very patient capital required.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">5</Badge>
                    <div>
                      <p className="font-medium text-sm">Operating Efficiency</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Review margins, LCOC, unit economics. Are they competitive vs benchmarks?
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Benchmarking Your Project
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  Compare your metrics against typical ranges for carbon projects:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">Equity IRR</p>
                      <p className="text-muted-foreground">Target: 18-25%</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">Project IRR</p>
                      <p className="text-muted-foreground">Target: 12-18%</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">Gross Margin</p>
                      <p className="text-muted-foreground">Target: 60-85%</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">EBITDA Margin</p>
                      <p className="text-muted-foreground">Target: 30-50%</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">Min DSCR</p>
                      <p className="text-muted-foreground">Target: ≥ 1.5x</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">Payback</p>
                      <p className="text-muted-foreground">Target: 4-7 years</p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Context Matters:</strong> These are general benchmarks. Adjust based on project type 
                    (tech removal vs nature-based), geography (developed vs frontier), and project stage.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Red Flags to Watch For
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  These metric patterns indicate serious issues:
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Negative NPV Despite Positive Net Income</p>
                      <p className="text-muted-foreground mt-0.5">
                        Discount rate too high for cash flow profile, or payback too long
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">LCOC Higher Than Market Price</p>
                      <p className="text-muted-foreground mt-0.5">
                        Fundamental economics don't work. Can't achieve profitability at scale.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Min DSCR Below 1.0x</p>
                      <p className="text-muted-foreground mt-0.5">
                        Debt default likely. Must restructure debt or increase EBITDA.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Declining Margins Over Time</p>
                      <p className="text-muted-foreground mt-0.5">
                        Costs growing faster than revenue. Operational inefficiency or pricing pressure.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Linking Metrics to Sensitivity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  After understanding your base case metrics, use Sensitivity & Scenarios to stress-test assumptions:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Key Question: What if metrics are wrong?</p>
                    <p className="text-muted-foreground mt-1">
                      Test: What credit price drop would make NPV negative? What COGS increase would violate DSCR?
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Identify Tipping Points</p>
                    <p className="text-muted-foreground mt-1">
                      Use sliders to find the input values where metrics cross critical thresholds (NPV = 0, DSCR = 1.2x)
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Build Scenarios</p>
                    <p className="text-muted-foreground mt-1">
                      Create "Conservative" (metrics worsen), "Base", and "Optimistic" (metrics improve) scenarios
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Next Step:</strong> Navigate to Sensitivity & Scenarios to test how changes in inputs 
                    affect these core metrics. This builds confidence in your investment thesis.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};