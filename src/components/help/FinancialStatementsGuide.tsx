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
  FileText,
  Activity,
  DollarSign,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Download,
} from 'lucide-react';

interface FinancialStatementsGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FinancialStatementsGuide = ({ open, onOpenChange }: FinancialStatementsGuideProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Financial Statements Guide</DialogTitle>
          <DialogDescription>
            Understand the six auto-calculated financial statements that power your analysis
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="core">Core Statements</TabsTrigger>
            <TabsTrigger value="specialized">Specialized</TabsTrigger>
            <TabsTrigger value="reading">Interpreting</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  What Are Financial Statements?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Financial statements are structured reports showing your project's financial performance and position 
                  over time. They automatically calculate from your Model Inputs, providing a complete picture of 
                  revenue, expenses, assets, liabilities, and cash flows.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Income Statement:</strong> Revenue, costs, and profitability (EBITDA, Net Income)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Balance Sheet:</strong> Assets, liabilities, and equity at each year-end</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Cash Flow Statement:</strong> Operating, investing, and financing cash movements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Debt Schedule:</strong> Loan draws, payments, interest, and DSCR covenant tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Carbon Stream:</strong> Credits generated, issued, and sold (spot vs pre-purchase)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Free Cash Flow:</strong> FCFE calculation showing cash available to equity holders</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  How Statements Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  When you click "Generate Statements" or "Recalculate", our financial engine processes all your 
                  inputs through a rigorous calculation sequence:
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs">1</Badge>
                    <div>
                      <p className="font-medium text-sm">Revenue Recognition</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Credits generated → Issued (per schedule) → Sold (spot + pre-purchase) → Revenue
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs">2</Badge>
                    <div>
                      <p className="font-medium text-sm">Expense Matching</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        COGS (variable), OPEX (fixed), Depreciation (non-cash), Interest (debt)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs">3</Badge>
                    <div>
                      <p className="font-medium text-sm">Working Capital Adjustments</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        AR/AP calculations based on revenue and COGS rates
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs">4</Badge>
                    <div>
                      <p className="font-medium text-sm">Cash Flow Reconciliation</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Operating + Investing + Financing = Net Change in Cash
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs">5</Badge>
                    <div>
                      <p className="font-medium text-sm">Balance Sheet Balancing</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Assets = Liabilities + Equity (accounting identity enforced)
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Auto-Recalculation:</strong> Any change to Model Inputs requires clicking "Recalculate" 
                    to update statements. This ensures all statements remain consistent.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-600" />
                  Using Statements Effectively
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="font-semibold">Best Practices:</p>
                  <ul className="space-y-1.5 text-muted-foreground pl-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Always review all 6 statement types for a complete picture</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Check that Net Income flows into Retained Earnings on Balance Sheet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Verify Cash on Balance Sheet matches Cash Flow Statement ending cash</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Export to CSV for deeper analysis or sharing with stakeholders</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="font-semibold">When to Recalculate:</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-2 p-2 bg-muted rounded">
                      <span className="text-primary shrink-0">•</span>
                      <span>After changing any Model Input values (revenue, costs, financing)</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-muted rounded">
                      <span className="text-primary shrink-0">•</span>
                      <span>Before generating Financial Metrics (metrics depend on current statements)</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-muted rounded">
                      <span className="text-primary shrink-0">•</span>
                      <span>Before creating Sensitivity Scenarios (base case must be current)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Core Statements Tab */}
          <TabsContent value="core" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Income Statement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  The Income Statement (also called Profit & Loss or P&L) shows profitability over a period. 
                  It follows a waterfall structure from revenue down to net income.
                </p>

                <div className="space-y-2">
                  <p className="font-semibold text-sm">Key Line Items:</p>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">Spot Revenue + Pre-Purchase Revenue = Total Revenue</p>
                      <p className="text-muted-foreground mt-1">
                        Credits sold at market price + credits delivered under pre-purchase agreements
                      </p>
                    </div>
                    
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">Total Revenue - COGS = Gross Profit</p>
                      <p className="text-muted-foreground mt-1">
                        COGS = Cost of Goods Sold (variable costs that scale with production)
                      </p>
                    </div>
                    
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">Gross Profit - OPEX = EBITDA</p>
                      <p className="text-muted-foreground mt-1">
                        OPEX = Operating Expenses (staff, MRV, PDD, feasibility). EBITDA = operating profitability
                      </p>
                    </div>
                    
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">EBITDA - Depreciation - Interest = EBT</p>
                      <p className="text-muted-foreground mt-1">
                        EBT = Earnings Before Tax (pre-tax profit)
                      </p>
                    </div>
                    
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">EBT - Income Tax = Net Income</p>
                      <p className="text-muted-foreground mt-1">
                        The bottom line - profit available to equity holders
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Key Ratio:</strong> Gross Margin % = (Gross Profit / Revenue). Healthy carbon projects 
                    typically show 60-85% gross margins.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Balance Sheet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  The Balance Sheet is a snapshot of what the project owns (Assets), owes (Liabilities), and the 
                  residual value to owners (Equity) at a specific point in time (year-end).
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <p className="font-semibold text-sm">Assets</p>
                    <div className="space-y-1.5 pl-3 mt-2">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span><strong>Cash:</strong> Bank balances</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span><strong>Accounts Receivable (AR):</strong> Credits sold but payment not yet received</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span><strong>PPE (Net):</strong> Property, Plant & Equipment less accumulated depreciation</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-semibold text-sm">Liabilities</p>
                    <div className="space-y-1.5 pl-3 mt-2">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span><strong>Accounts Payable (AP):</strong> Expenses incurred but not yet paid</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span><strong>Unearned Revenue:</strong> Pre-purchase cash received but credits not yet delivered</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span><strong>Debt:</strong> Outstanding loan balances</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-semibold text-sm">Equity</p>
                    <div className="space-y-1.5 pl-3 mt-2">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span><strong>Contributed Capital:</strong> All equity injections from investors</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span><strong>Retained Earnings:</strong> Cumulative net income since project start</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Accounting Identity:</strong> Total Assets MUST equal Total Liabilities + Total Equity. 
                    If not, there's a calculation error.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Cash Flow Statement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  The Cash Flow Statement explains how cash moved in and out of the business. It reconciles Net Income 
                  (accrual-based) with actual cash changes.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Operating Cash Flow</p>
                    <p className="text-muted-foreground mt-1">
                      Cash from core business: Net Income + Depreciation - Δ AR - Δ Unearned + Δ AP. 
                      This is the cash the project generates from operations.
                    </p>
                  </div>
                  
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Investing Cash Flow</p>
                    <p className="text-muted-foreground mt-1">
                      Cash spent on CAPEX (equipment, vehicles, infrastructure). Almost always negative.
                    </p>
                  </div>
                  
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Financing Cash Flow</p>
                    <p className="text-muted-foreground mt-1">
                      Cash from/to capital providers: Equity injections + Debt draws + Pre-purchase cash - Debt principal. 
                      Positive when raising capital, negative when repaying debt.
                    </p>
                  </div>
                  
                  <div className="p-2 bg-primary/10 rounded border border-primary/20">
                    <p className="font-medium">Net Change in Cash</p>
                    <p className="text-muted-foreground mt-1">
                      Operating + Investing + Financing = Net Change. This plus Beginning Cash = Ending Cash (which becomes next year's beginning).
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Red Flag:</strong> If Operating Cash Flow is consistently negative while Net Income is 
                    positive, investigate working capital build-up (AR/AP issues).
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Specialized Statements Tab */}
          <TabsContent value="specialized" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Debt Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  The Debt Schedule tracks all loan activity: new draws, principal repayments, interest charges, 
                  and the critical DSCR (Debt Service Coverage Ratio) covenant.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Beginning Balance</p>
                    <p className="text-muted-foreground mt-1">Outstanding debt at start of year (last year's ending balance)</p>
                  </div>
                  
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Draw</p>
                    <p className="text-muted-foreground mt-1">New borrowing during the year (from your Financing inputs)</p>
                  </div>
                  
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Principal Payment</p>
                    <p className="text-muted-foreground mt-1">Debt repayment calculated based on loan duration. Amortizes over loan term.</p>
                  </div>
                  
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Interest Expense</p>
                    <p className="text-muted-foreground mt-1">Interest rate × Average debt balance. This flows to Income Statement.</p>
                  </div>
                  
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Ending Balance</p>
                    <p className="text-muted-foreground mt-1">Beginning + Draw - Principal = Ending (becomes next year's beginning)</p>
                  </div>
                  
                  <div className="p-2 bg-primary/10 rounded border border-primary/20">
                    <p className="font-medium">DSCR (Debt Service Coverage Ratio)</p>
                    <p className="text-muted-foreground mt-1">
                      EBITDA ÷ (Principal + Interest). Measures ability to service debt. Lenders require ≥ 1.2x.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Covenant Violation:</strong> If DSCR drops below 1.0x, the project cannot cover its debt 
                    obligations. Below 1.2x triggers lender concerns. Monitor this closely!
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Carbon Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  The Carbon Stream statement tracks the physical flow of carbon credits through the project lifecycle, 
                  separate from the revenue accounting.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Credits Generated</p>
                    <p className="text-muted-foreground mt-1">
                      Credits produced this year based on project activity (trees grown, stoves distributed, etc.)
                    </p>
                  </div>
                  
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Credits Issued</p>
                    <p className="text-muted-foreground mt-1">
                      Credits verified and registered this year (can lag generation by 1-2 years). Only issued credits 
                      can be sold.
                    </p>
                  </div>
                  
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Purchased Credits Delivered</p>
                    <p className="text-muted-foreground mt-1">
                      Credits allocated to pre-purchase agreements (= Issued × Purchase Share %)
                    </p>
                  </div>
                  
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Spot Credits Sold</p>
                    <p className="text-muted-foreground mt-1">
                      Credits sold at market price (= Issued - Purchased Credits)
                    </p>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Key Insight:</strong> The gap between Generated and Issued credits represents "inventory" 
                    waiting for verification. Large gaps may indicate verification bottlenecks.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Free Cash Flow to Equity (FCFE)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  FCFE shows the cash available to equity holders after all operating expenses, taxes, debt service, 
                  and capital investments. This is what equity investors can take as distributions.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Calculation Flow</p>
                    <div className="text-muted-foreground mt-2 space-y-1 pl-2">
                      <p>Net Income (from Income Statement)</p>
                      <p>+ Depreciation (non-cash expense)</p>
                      <p>- CAPEX (cash outflow for equipment)</p>
                      <p>- Change in NWC (working capital build)</p>
                      <p>+ Net Debt Draw (new borrowing - repayments)</p>
                      <p>= <strong>Free Cash Flow to Equity</strong></p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Equity IRR Calculation:</strong> Equity IRR is calculated using all equity injections 
                    (cash out) and all FCFE values (cash in). Positive FCFE in later years drives returns.
                  </p>
                </div>

                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Investment Decision:</strong> If cumulative FCFE &lt; cumulative equity invested, the 
                    project has not yet paid back investors. Payback period measures when FCFE turns positive cumulatively.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reading & Interpreting Tab */}
          <TabsContent value="reading" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Healthy Project Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  Look for these positive signals when reviewing statements:
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-green-800 dark:text-green-300">Positive & Growing EBITDA</p>
                      <p className="text-green-700 dark:text-green-400 mt-0.5">
                        Operating profitability improves over time as project scales
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-green-800 dark:text-green-300">DSCR Above 1.5x</p>
                      <p className="text-green-700 dark:text-green-400 mt-0.5">
                        Strong debt coverage provides cushion for downside scenarios
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-green-800 dark:text-green-300">Increasing Cash Balance</p>
                      <p className="text-green-700 dark:text-green-400 mt-0.5">
                        Cash grows as project generates positive operating cash flow
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-green-800 dark:text-green-300">Positive FCFE in Later Years</p>
                      <p className="text-green-700 dark:text-green-400 mt-0.5">
                        After initial investment period, cash flows to equity holders
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Warning Signs & Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  These signals indicate potential issues requiring immediate attention:
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Negative or Declining Cash Balance</p>
                      <p className="text-muted-foreground mt-0.5">
                        Project burning through cash, may need additional equity injection or debt draw
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">DSCR Below 1.2x (or worse, below 1.0x)</p>
                      <p className="text-muted-foreground mt-0.5">
                        Covenant violation risk. Lenders may restrict operations or demand repayment
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Persistent Negative Net Income</p>
                      <p className="text-muted-foreground mt-0.5">
                        Project not profitable even on accrual basis. Review pricing or cost structure
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Assets ≠ Liabilities + Equity</p>
                      <p className="text-muted-foreground mt-0.5">
                        Accounting identity violation indicates calculation error. Recalculate statements.
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
                  Statement Interdependencies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  Understanding how statements connect helps you spot inconsistencies:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Income Statement → Balance Sheet</p>
                    <p className="text-muted-foreground mt-1">
                      Net Income flows into Retained Earnings (cumulative profit)
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Balance Sheet → Cash Flow Statement</p>
                    <p className="text-muted-foreground mt-1">
                      Change in Cash (Balance Sheet) = Net Change in Cash (Cash Flow Statement)
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Debt Schedule → Balance Sheet & Income Statement</p>
                    <p className="text-muted-foreground mt-1">
                      Ending Debt Balance → Balance Sheet Debt line. Interest Expense → Income Statement.
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Carbon Stream → Income Statement</p>
                    <p className="text-muted-foreground mt-1">
                      Credits Issued × Prices = Revenue components (spot + pre-purchase)
                    </p>
                  </div>
                </div>

                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Quality Check:</strong> Before presenting to investors, verify all statement 
                    interdependencies match. Any mismatch indicates a calculation issue.
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