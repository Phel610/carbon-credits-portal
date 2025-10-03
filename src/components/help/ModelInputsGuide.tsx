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
  Database,
  TrendingUp,
  DollarSign,
  Briefcase,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Calculator,
} from 'lucide-react';

interface ModelInputsGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ModelInputsGuide = ({ open, onOpenChange }: ModelInputsGuideProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Model Inputs Guide</DialogTitle>
          <DialogDescription>
            Master financial model inputs from operational metrics to financing strategy
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="operational">Operational</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="financing">Financing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  What Are Model Inputs?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Model inputs are the foundation of your financial projections. They represent the key assumptions 
                  about your carbon credit project's operations, costs, and funding. Quality inputs lead to accurate 
                  financial statements and reliable metrics.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Operational Metrics:</strong> Credit generation, pricing, and issuance timing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Expenses:</strong> Variable costs, staff, MRV, CAPEX, taxes, and working capital</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Financing:</strong> Equity, debt, pre-purchase agreements, and discount rates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                  How Inputs Flow Through the System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">1</Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Model Inputs</p>
                    <p className="text-xs text-muted-foreground">You enter assumptions year-by-year</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">2</Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Financial Statements</p>
                    <p className="text-xs text-muted-foreground">Auto-calculated Income Statement, Balance Sheet, Cash Flow</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">3</Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Financial Metrics</p>
                    <p className="text-xs text-muted-foreground">NPV, IRR, DSCR, margins, and returns</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">4</Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Sensitivity & Scenarios</p>
                    <p className="text-xs text-muted-foreground">Test assumptions and compare outcomes</p>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Pro Tip:</strong> Start with conservative estimates. It's better to under-promise and 
                    over-deliver to investors than the reverse.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  Input Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <p className="font-semibold">Before You Start:</p>
                    <ul className="space-y-1.5 text-muted-foreground pl-4">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Gather historical data from similar projects or industry benchmarks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Document your assumptions and their sources for transparency</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Review with technical experts (MRV specialists, agronomists, etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Start conservative - you can test optimistic scenarios later</span>
                      </li>
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="font-semibold">Common Mistakes to Avoid:</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs p-2 bg-destructive/10 rounded">
                        <AlertCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                        <span><strong>Overly optimistic credit prices:</strong> Check spot prices for your project type and region</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs p-2 bg-destructive/10 rounded">
                        <AlertCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                        <span><strong>Ignoring issuance delays:</strong> Credits generated ≠ credits issued. Factor in verification timing</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs p-2 bg-destructive/10 rounded">
                        <AlertCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                        <span><strong>Underestimating working capital:</strong> Set realistic AR/AP rates (typically 5-10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operational Metrics Tab */}
          <TabsContent value="operational" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Operational Metrics Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Operational metrics drive your revenue model. They define how many carbon credits your project 
                  generates, when they become saleable, and what price they fetch in the market.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Credits Generated (Year-by-Year)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  The number of verified carbon credits your project produces each year, measured in tonnes CO2e.
                </p>
                
                <div className="space-y-2">
                  <p className="font-semibold">How to Estimate:</p>
                  <ul className="space-y-1 text-muted-foreground pl-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Use methodology calculations (e.g., ACR, Verra, Gold Standard)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Factor in project ramp-up (early years typically lower)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Account for degradation or reversal risks (buffer pools)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Consider seasonal variations for nature-based projects</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Typical Ranges:</strong> Reforestation 5-15 tCO2e/ha/year; Cookstove 1-3 tCO2e/stove/year; 
                    Renewable Energy 500-5,000 tCO2e/MW/year
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Price Per Credit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  The selling price ($/tCO2e) for each credit. Can vary by year based on market expectations.
                </p>
                
                <div className="space-y-2">
                  <p className="font-semibold">Pricing Factors:</p>
                  <ul className="space-y-1 text-muted-foreground pl-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Project Type:</strong> Tech removal ($100-200) vs. nature-based ($5-30)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Co-benefits:</strong> SDG contributions, biodiversity, community impact</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Certification:</strong> Verra, Gold Standard, ACR standards command premium</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Vintage:</strong> Older credits may trade at discount</span>
                    </li>
                  </ul>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Use spot market prices, not forward prices. Check Ecosystem Marketplace or registries for recent transactions.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issuance Schedule (Binary Flag)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  Indicates which years credits are issued (1 = issued, 0 = not issued). This reflects verification 
                  timing, which often lags credit generation.
                </p>
                
                <div className="space-y-2">
                  <p className="font-semibold">Key Concepts:</p>
                  <div className="space-y-2 pl-4">
                    <div className="p-2 bg-muted rounded text-xs">
                      <p className="font-medium">Generation vs. Issuance</p>
                      <p className="text-muted-foreground mt-1">
                        Year 1: Generate 10,000 credits → Year 2: Verify & issue → Year 2 shows issuance flag = 1
                      </p>
                    </div>
                    <div className="p-2 bg-muted rounded text-xs">
                      <p className="font-medium">Batch Issuance</p>
                      <p className="text-muted-foreground mt-1">
                        Some projects verify every 2-3 years to save costs. Flag would be 0, 0, 1, 0, 0, 1...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Critical:</strong> Revenue is only recognized when credits are issued, not generated. 
                    This affects cash flow timing significantly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Understanding Cost Structures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Expenses fall into three categories: variable costs (scale with revenue), fixed operating costs 
                  (recurring), and one-time investments (CAPEX, PDD, feasibility).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">COGS Rate (% of Revenue)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  Cost of Goods Sold as a percentage of revenue. Includes direct costs that vary with credit production 
                  (field operations, monitoring, community payments).
                </p>
                
                <div className="space-y-2">
                  <p className="font-semibold">Typical Ranges by Project Type:</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Reforestation/Afforestation</span>
                      <span className="font-medium">15-25%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Improved Cookstoves</span>
                      <span className="font-medium">30-40%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Renewable Energy</span>
                      <span className="font-medium">10-20%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>REDD+ (avoided deforestation)</span>
                      <span className="font-medium">20-30%</span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Lower COGS = higher gross margins. This is a key competitive advantage.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Staff Costs, MRV, PDD</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Staff Costs (Annual)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Salaries, benefits, and contractors. Include project manager, field staff, administrative support. 
                      Typical: $50K-150K/year for small projects, $200K-500K+ for large projects.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="font-semibold">MRV Costs (Monitoring, Reporting, Verification)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Third-party verification, monitoring equipment, reporting software. Typically $10K-50K per 
                      verification event (every 1-3 years).
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="font-semibold">PDD Costs (Project Design Document)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      One-time cost to develop methodology documentation. Typical: $25K-100K depending on complexity 
                      and standard (Verra, Gold Standard, etc.).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">CAPEX, Depreciation & Taxes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">CAPEX (Capital Expenditures)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Equipment, infrastructure, vehicles. Enter year-by-year. Example: Year 1 = $500K for trucks 
                      and monitoring equipment.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">Depreciation</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Non-cash expense spreading CAPEX cost over asset life. Example: $500K equipment depreciated 
                      over 5 years = $100K/year depreciation.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">Income Tax Rate</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Corporate tax rate in project country. Typical: 15-30%. Check local regulations for carbon 
                      projects (some countries offer tax incentives).
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">AR/AP Rates (Working Capital)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      <strong>AR Rate:</strong> Accounts Receivable as % of revenue (5-10% typical).<br/>
                      <strong>AP Rate:</strong> Accounts Payable as % of COGS (10-15% typical).<br/>
                      These affect cash flow timing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financing Tab */}
          <TabsContent value="financing" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Capital Structure & Financing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Financing inputs define how your project is funded - equity from investors, debt from lenders, 
                  and pre-purchase agreements from carbon buyers. Getting this right is crucial for project viability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Equity Injections & Initial Capital</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Equity Injection (Year-by-Year)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Capital contributed by equity holders each year. Example: Year 1 = $500K, Year 2 = $200K. 
                      Used to fund operations and CAPEX before project generates revenue.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">Initial Equity (T0)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Equity contributed at time zero (before Year 1). This is the "seed capital" used for feasibility 
                      studies, PDD development, and early planning.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">Opening Cash (Y1)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Cash on hand at start of Year 1. Often equals Initial Equity minus feasibility/PDD costs 
                      spent in Year 0.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Equity IRR:</strong> The return to equity holders is calculated based on all equity 
                    injections and the final cash flows. Target: 15-25%+ for carbon projects.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Debt Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Debt Draw (Year-by-Year)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Amount borrowed from lenders each year. Example: Year 1 = $1M, Year 2 = $500K. Total debt 
                      accumulates across years.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">Interest Rate (%)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Annual interest rate on outstanding debt. Typical: 6-12% for carbon projects. Higher risk 
                      projects or developing countries pay higher rates.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">Debt Duration (Years)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Loan term length. Typical: 5-10 years. Longer terms = lower annual payments but more total interest.
                    </p>
                  </div>
                </div>

                <Alert>
                  <Calculator className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>DSCR (Debt Service Coverage Ratio):</strong> Lenders typically require DSCR ≥ 1.2x. 
                    This means your operating cash flow must be 1.2x your debt payments.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pre-Purchase Agreements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  Forward contracts where buyers (corporates, brokers) pay upfront for future credits at a discounted price.
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Purchase Amount (Year-by-Year)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Upfront cash received from pre-purchase buyers. Example: Year 1 = $200K for 50,000 future credits.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">Purchase Share (%)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Percentage of issued credits allocated to pre-purchase agreements. Example: 30% means if you 
                      issue 100,000 credits, 30,000 go to pre-purchase, 70,000 sold at spot price.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Trade-off:</strong> Pre-purchase provides early cash but at discounted prices (typically 30-50% 
                    discount). Balance liquidity needs vs. revenue optimization.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Discount Rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  The rate used to discount future cash flows to present value. Reflects the time value of money 
                  and project risk.
                </p>

                <div className="space-y-2">
                  <p className="font-semibold">How to Set Discount Rate:</p>
                  <ul className="space-y-1 text-muted-foreground pl-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Low Risk (8-12%):</strong> Established project type, strong buyer, developed country</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Medium Risk (12-18%):</strong> Typical carbon projects, moderate country risk</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>High Risk (18-25%+):</strong> New methodology, frontier market, execution uncertainty</span>
                    </li>
                  </ul>
                </div>

                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Investors compare your project IRR to the discount rate. If IRR &gt; discount rate, the project 
                    creates value. If IRR &lt; discount rate, it destroys value.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};