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
  Bot,
  Download,
  Users,
  Target,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface ReportsGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportsGuide = ({ open, onOpenChange }: ReportsGuideProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Reports Guide</DialogTitle>
          <DialogDescription>
            Generate professional PDF reports for investors, boards, and stakeholders
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="standard">Standard Reports</TabsTrigger>
            <TabsTrigger value="ai">AI Reports</TabsTrigger>
            <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Why Generate Reports?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  PDF reports transform your financial model into polished, investor-ready documents. They consolidate 
                  inputs, statements, metrics, and scenarios into a comprehensive narrative that stakeholders can 
                  review, share, and archive.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Investment Pitches:</strong> Professional reports for equity investors and lenders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Board Meetings:</strong> Quarterly financial updates with KPIs and trends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Grant Applications:</strong> Detailed financial projections for funders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Due Diligence:</strong> Comprehensive documentation for M&A or partnerships</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Historical Tracking:</strong> Archive snapshots of financial projections over time</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Two Report Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Standard PDF Report</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Classic financial model output with comprehensive data tables, charts, and projections.
                    </p>
                    <div className="space-y-1 text-xs">
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>All 6 financial statements</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>Complete metrics dashboard</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>Scenario comparison tables</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>Professional charts & visuals</span>
                      </p>
                    </div>
                    <Badge variant="outline" className="mt-3">Best for: Internal analysis</Badge>
                  </div>

                  <div className="p-4 border rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">AI-Assisted Report</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Everything in Standard Report PLUS AI-generated insights, commentary, and strategic recommendations.
                    </p>
                    <div className="space-y-1 text-xs">
                      <p className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-yellow-600" />
                        <span>Executive summary (plain English)</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-yellow-600" />
                        <span>Risk assessment & red flags</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-yellow-600" />
                        <span>Scenario narrative & insights</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-yellow-600" />
                        <span>Investment highlights</span>
                      </p>
                    </div>
                    <Badge className="mt-3 bg-primary">Best for: External stakeholders</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-600" />
                  Report Generation Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">1</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Select Model</p>
                      <p className="text-xs text-muted-foreground">Choose which financial model to report on</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">2</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Choose Report Type</p>
                      <p className="text-xs text-muted-foreground">Standard (fast) or AI-Assisted (comprehensive)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">3</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">System Generates PDF</p>
                      <p className="text-xs text-muted-foreground">Takes 10-30 seconds for standard, 30-60s for AI</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">4</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Download & Share</p>
                      <p className="text-xs text-muted-foreground">PDF automatically downloads to your device</p>
                    </div>
                  </div>
                </div>

                <Alert className="mt-4">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Pro Tip:</strong> Ensure your financial statements are current before generating reports. 
                    Click "Recalculate" in Statements if you've changed inputs recently.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Standard Reports Tab */}
          <TabsContent value="standard" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Standard PDF Report Contents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Standard reports provide a comprehensive, data-rich view of your financial model. Perfect for 
                  internal review, technical due diligence, and compliance documentation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Report Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-2">Section 1: Executive Summary</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li>• Project name, country, timeline</li>
                      <li>• Key metrics at-a-glance (NPV, IRR, Payback, DSCR)</li>
                      <li>• Total revenue and profitability</li>
                      <li>• Investment highlights</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-2">Section 2: Input Assumptions</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li>• Operational metrics (credits, prices, issuance)</li>
                      <li>• Expense assumptions (COGS, OPEX, CAPEX)</li>
                      <li>• Financing structure (equity, debt, pre-purchase)</li>
                      <li>• Key rates (discount rate, tax rate, working capital)</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-2">Section 3: Financial Statements</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li>• Income Statement (10+ years, all line items)</li>
                      <li>• Balance Sheet (assets, liabilities, equity)</li>
                      <li>• Cash Flow Statement (operating, investing, financing)</li>
                      <li>• Debt Schedule (draws, payments, DSCR)</li>
                      <li>• Carbon Stream (generation, issuance, sales)</li>
                      <li>• Free Cash Flow to Equity</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-2">Section 4: Financial Metrics</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li>• Investment returns (NPV, IRR, MIRR, Payback)</li>
                      <li>• Profitability metrics (margins, EBITDA, net income)</li>
                      <li>• Unit economics (LCOC, per-credit costs)</li>
                      <li>• Working capital efficiency (DSO, DPO, NWC)</li>
                      <li>• Debt & liquidity metrics</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-2">Section 5: Scenario Analysis</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li>• Comparison of saved scenarios (if any)</li>
                      <li>• Key metric changes vs. base case</li>
                      <li>• Sensitivity charts showing input impacts</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-2">Section 6: Charts & Visualizations</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li>• Revenue and expense trend lines</li>
                      <li>• Cash flow waterfall chart</li>
                      <li>• Credit generation vs. issuance</li>
                      <li>• Profitability margins over time</li>
                      <li>• DSCR covenant tracking</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">When to Use Standard Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-green-800 dark:text-green-300">Internal Financial Review</p>
                      <p className="text-green-700 dark:text-green-400 mt-0.5">
                        Team members who understand financial modeling and need raw data
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-green-800 dark:text-green-300">Technical Due Diligence</p>
                      <p className="text-green-700 dark:text-green-400 mt-0.5">
                        Financial analysts and consultants who need detailed statement breakdowns
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-green-800 dark:text-green-300">Compliance & Audit</p>
                      <p className="text-green-700 dark:text-green-400 mt-0.5">
                        Regulators or auditors who need comprehensive calculation documentation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-green-800 dark:text-green-300">Quick Generation Needed</p>
                      <p className="text-green-700 dark:text-green-400 mt-0.5">
                        When speed matters and narrative commentary is not required
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Reports Tab */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI-Assisted Report Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  AI-Assisted reports build on Standard reports by adding intelligent narrative, insights, and 
                  recommendations. The AI analyzes your financial data and generates plain-English explanations 
                  that non-financial stakeholders can understand.
                </p>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Everything from Standard Report</strong> is included, plus the AI enhancements below.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI-Generated Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-primary/5 rounded border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-yellow-600" />
                      <p className="font-semibold">Executive Summary Narrative</p>
                    </div>
                    <p className="text-muted-foreground">
                      AI translates financial metrics into plain English: "This project generates a strong 25% IRR 
                      with solid debt coverage (1.8x DSCR). The 4.5-year payback period is attractive for investors 
                      seeking medium-term returns..."
                    </p>
                  </div>

                  <div className="p-3 bg-primary/5 rounded border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-yellow-600" />
                      <p className="font-semibold">Risk Assessment & Red Flags</p>
                    </div>
                    <p className="text-muted-foreground">
                      AI identifies potential issues: "Warning: DSCR drops to 1.15x in Year 3, close to covenant 
                      threshold. Consider equity injection or revenue acceleration to maintain buffer..."
                    </p>
                  </div>

                  <div className="p-3 bg-primary/5 rounded border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-yellow-600" />
                      <p className="font-semibold">Scenario Commentary</p>
                    </div>
                    <p className="text-muted-foreground">
                      If you have scenarios, AI explains their implications: "The Conservative scenario shows IRR 
                      dropping to 18%, still above hurdle rate but with less margin for error. Prioritize cost controls 
                      if market conditions worsen..."
                    </p>
                  </div>

                  <div className="p-3 bg-primary/5 rounded border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-yellow-600" />
                      <p className="font-semibold">Investor-Focused Highlights</p>
                    </div>
                    <p className="text-muted-foreground">
                      AI pulls out key selling points: "This project offers superior unit economics with LCOC of $8/credit 
                      vs. market price of $15/credit, providing 88% gross margins and insulation from price volatility..."
                    </p>
                  </div>

                  <div className="p-3 bg-primary/5 rounded border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-yellow-600" />
                      <p className="font-semibold">Strategic Recommendations</p>
                    </div>
                    <p className="text-muted-foreground">
                      AI suggests optimizations: "Consider reducing pre-purchase share from 30% to 20% to capture 
                      more spot market upside. Modeling shows this increases equity NPV by $250K with acceptable 
                      cash flow impact..."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">How AI Analyzes Your Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  The AI review process examines multiple dimensions of your financial model:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-3 p-2 bg-muted rounded">
                    <Badge className="shrink-0 text-xs">1</Badge>
                    <div>
                      <p className="font-medium">Metric Benchmarking</p>
                      <p className="text-muted-foreground">Compares your NPV, IRR, margins vs typical carbon projects</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2 bg-muted rounded">
                    <Badge className="shrink-0 text-xs">2</Badge>
                    <div>
                      <p className="font-medium">Trend Analysis</p>
                      <p className="text-muted-foreground">Identifies improving or declining patterns in margins, cash flow</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2 bg-muted rounded">
                    <Badge className="shrink-0 text-xs">3</Badge>
                    <div>
                      <p className="font-medium">Risk Identification</p>
                      <p className="text-muted-foreground">Flags covenant violations, negative cash, high leverage</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2 bg-muted rounded">
                    <Badge className="shrink-0 text-xs">4</Badge>
                    <div>
                      <p className="font-medium">Scenario Comparison</p>
                      <p className="text-muted-foreground">Explains differences between base, optimistic, conservative cases</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2 bg-muted rounded">
                    <Badge className="shrink-0 text-xs">5</Badge>
                    <div>
                      <p className="font-medium">Strategic Insights</p>
                      <p className="text-muted-foreground">Suggests capital structure, pricing, or operational optimizations</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">When to Use AI-Assisted Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800 dark:text-blue-300">Investor Presentations</p>
                      <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                        Equity investors and lenders who need narrative context, not just data tables
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800 dark:text-blue-300">Board Meetings</p>
                      <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                        Non-financial board members who need plain-English explanations of financial performance
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800 dark:text-blue-300">Grant Applications</p>
                      <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                        Foundations and development banks that value strategic narrative alongside numbers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800 dark:text-blue-300">Strategic Planning</p>
                      <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                        When you want AI to surface insights you might have missed in the data
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Best Practices Tab */}
          <TabsContent value="best-practices" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Report Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Follow these guidelines to create effective reports that drive decision-making:
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timing & Regeneration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Before Major Presentations</p>
                      <p className="text-muted-foreground mt-0.5">
                        Generate fresh reports 24-48 hours before investor meetings to ensure latest data
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">After Input Changes</p>
                      <p className="text-muted-foreground mt-0.5">
                        Regenerate reports whenever you update model inputs, especially material changes to pricing or costs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">With New Scenarios</p>
                      <p className="text-muted-foreground mt-0.5">
                        After creating scenario analysis, generate AI report to get narrative on scenario implications
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Quarterly Snapshots</p>
                      <p className="text-muted-foreground mt-0.5">
                        Archive reports quarterly to track how projections evolve over time
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tailoring Reports to Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-2">For Equity Investors:</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li>• Use <strong>AI-Assisted Reports</strong> - investors want narrative</li>
                      <li>• Highlight Equity IRR, NPV, and Payback Period</li>
                      <li>• Include scenario analysis showing upside/downside</li>
                      <li>• Emphasize risk mitigations and exit strategy</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-2">For Debt Lenders:</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li>• Either report type works (lenders comfortable with data)</li>
                      <li>• Emphasize Min DSCR and debt schedule</li>
                      <li>• Show stress scenarios where DSCR remains &gt;1.2x</li>
                      <li>• Highlight asset collateral and covenants</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-2">For Board Members:</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li>• Use <strong>AI-Assisted Reports</strong> for non-financial boards</li>
                      <li>• Focus on KPIs: revenue growth, margins, cash position</li>
                      <li>• Include YoY comparisons if available</li>
                      <li>• Highlight strategic decisions and their financial impact</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold mb-2">For Grant Funders:</p>
                    <ul className="space-y-1 text-muted-foreground pl-4">
                      <li>• Use <strong>AI-Assisted Reports</strong> for narrative clarity</li>
                      <li>• Emphasize sustainability and long-term viability</li>
                      <li>• Show how grant fits into broader capital stack</li>
                      <li>• Link financial metrics to impact metrics (SDGs, etc.)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Presentation Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800 dark:text-blue-300">Print Key Pages</p>
                      <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                        For in-person meetings, print executive summary and key charts. Leave full report for follow-up.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800 dark:text-blue-300">Annotate with Context</p>
                      <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                        Add a cover memo explaining recent changes, assumptions, or specific areas to review.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800 dark:text-blue-300">Combine with Sensitivity</p>
                      <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                        Run scenarios BEFORE generating AI report. AI commentary on scenarios is particularly valuable.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800 dark:text-blue-300">Version Control</p>
                      <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                        Save reports with date stamps: "AmazonReforestation_FinancialModel_2024-10-15.pdf"
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Archiving & Historical Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-relaxed">
                  Maintain a library of historical reports to track how your projections evolve:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Initial Fundraise</p>
                    <p className="text-muted-foreground mt-1">
                      Archive the report you used to secure initial capital. Baseline for future comparisons.
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Quarterly Updates</p>
                    <p className="text-muted-foreground mt-1">
                      Generate and save reports each quarter, even if not presenting. Tracks assumption drift.
                    </p>
                  </div>

                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Major Milestones</p>
                    <p className="text-muted-foreground mt-1">
                      After first credit issuance, major funding round, or strategic pivot, archive a snapshot.
                    </p>
                  </div>
                </div>

                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Learning Tool:</strong> Comparing projections vs actuals over time improves forecasting. 
                    Identify which assumptions were too optimistic or conservative.
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