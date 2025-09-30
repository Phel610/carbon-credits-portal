import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import type { YearlyFinancials, ComprehensiveMetrics } from "@/lib/financial/metricsTypes";
import { calculateComprehensiveMetrics } from "@/lib/financial/metricsCalculator";
import { useToast } from "@/hooks/use-toast";

export default function FinancialMetrics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [modelName, setModelName] = useState("");
  const [yearlyData, setYearlyData] = useState<YearlyFinancials[]>([]);
  const [metrics, setMetrics] = useState<ComprehensiveMetrics | null>(null);
  const [discountRate, setDiscountRate] = useState(15);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch model details
      const { data: model, error: modelError } = await supabase
        .from("financial_models")
        .select("*")
        .eq("id", id)
        .single();

      if (modelError) throw modelError;
      setModelName(model.name);

      // Fetch all financial statements
      const { data: statements, error: stmtError } = await supabase
        .from("financial_statements")
        .select("*")
        .eq("model_id", id)
        .order("year");

      if (stmtError) throw stmtError;

      // Fetch model inputs
      const { data: inputs, error: inputsError } = await supabase
        .from("model_inputs")
        .select("*")
        .eq("model_id", id);

      if (inputsError) throw inputsError;

      // Transform statements into yearly data structure
      const years = [...new Set(statements.map(s => s.year))].sort();
      const yearly: YearlyFinancials[] = years.map(year => {
        const getVal = (type: string, item: string) => {
          const stmt = statements.find(s => s.year === year && s.statement_type === type && s.line_item === item);
          return stmt ? Number(stmt.value || 0) : 0;
        };

        // Get input values
        const getInput = (key: string) => {
          const inp = inputs.find(i => i.input_key === key);
          return inp ? (inp.input_value as any) : 0;
        };

        return {
          year,
          // Income Statement
          spotRevenue: getVal("income_statement", "spot_revenue"),
          prepurchaseRevenue: getVal("income_statement", "prepurchase_revenue"),
          totalRevenue: getVal("income_statement", "total_revenue"),
          cogs: getVal("income_statement", "cogs"),
          feasibility: getVal("income_statement", "feasibility"),
          pdd: getVal("income_statement", "pdd"),
          mrv: getVal("income_statement", "mrv"),
          staff: getVal("income_statement", "staff"),
          opex: getVal("income_statement", "opex_total"),
          ebitda: getVal("income_statement", "ebitda"),
          depreciation: getVal("income_statement", "depreciation"),
          interest: getVal("income_statement", "interest_expense"),
          ebt: getVal("income_statement", "ebt"),
          incomeTax: getVal("income_statement", "income_tax"),
          netIncome: getVal("income_statement", "net_income"),
          grossProfit: 0, // calculated
          
          // Balance Sheet
          cash: getVal("balance_sheet", "cash"),
          accountsReceivable: getVal("balance_sheet", "accounts_receivable"),
          ppe: getVal("balance_sheet", "ppe_net"),
          totalAssets: getVal("balance_sheet", "total_assets"),
          accountsPayable: getVal("balance_sheet", "accounts_payable"),
          unearnedRevenue: getVal("balance_sheet", "unearned_revenue"),
          debt: getVal("balance_sheet", "debt"),
          totalLiabilities: getVal("balance_sheet", "total_liabilities"),
          equity: getVal("balance_sheet", "total_equity"),
          contributedCapital: getVal("balance_sheet", "contributed_capital"),
          retainedEarnings: getVal("balance_sheet", "retained_earnings"),
          
          // Cash Flow
          operatingCF: getVal("cash_flow", "operating_cash_flow"),
          investingCF: getVal("cash_flow", "investing_cash_flow"),
          financingCF: getVal("cash_flow", "financing_cash_flow"),
          netChangeCash: getVal("cash_flow", "net_change_cash"),
          cashEnd: getVal("cash_flow", "cash_end"),
          capex: getVal("cash_flow", "capex"),
          changeAR: getVal("cash_flow", "change_ar"),
          changeAP: getVal("cash_flow", "change_ap"),
          changeUnearned: getVal("cash_flow", "change_unearned"),
          
          // Debt Schedule
          debtBeginning: getVal("debt_schedule", "beginning_balance"),
          debtDraw: getVal("debt_schedule", "draw"),
          debtPrincipal: getVal("debt_schedule", "principal_payment"),
          debtEnding: getVal("debt_schedule", "ending_balance"),
          debtInterest: getVal("debt_schedule", "interest"),
          dscr: getVal("debt_schedule", "dscr"),
          
          // Carbon & Free Cash Flow
          creditsGenerated: getVal("carbon_stream", "credits_generated") || getInput("credits_generated"),
          creditsIssued: getVal("carbon_stream", "credits_issued"),
          purchasedCreditsDelivered: getVal("carbon_stream", "purchased_credits"),
          fcfe: getVal("free_cash_flow", "fcf_to_equity"),
        };
      });

      setYearlyData(yearly);

      // Get discount rate from inputs
      const discountInput = inputs.find(i => i.input_key === "discount_rate");
      const rate = discountInput ? Number((discountInput.input_value as any) || 15) : 15;
      setDiscountRate(rate);

      // Build inputs object for calculations
      const inputsObj = {
        discount_rate: rate,
        purchase_amount: Number(getInput("purchase_amount")),
        purchase_price: Number(getInput("purchase_price")),
        purchase_share: Number(getInput("purchase_share")),
      };

      function getInput(key: string) {
        const inp = inputs.find(i => i.input_key === key);
        return inp ? (inp.input_value as any) : 0;
      }

      // Calculate all metrics
      const comprehensiveMetrics = calculateComprehensiveMetrics(yearly, rate, inputsObj);
      setMetrics(comprehensiveMetrics);

    } catch (error: any) {
      console.error("Error fetching metrics data:", error);
      toast({
        title: "Error",
        description: "Failed to load financial metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "–";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number | null, decimals: number = 1) => {
    if (value === null || value === undefined) return "–";
    if (value === Infinity) return "∞";
    return `${value.toFixed(decimals)}%`;
  };

  const formatNumber = (value: number | null, decimals: number = 2) => {
    if (value === null || value === undefined) return "–";
    if (value === Infinity) return "∞";
    return value.toFixed(decimals);
  };

  const formatIRR = (irr: number | null) => {
    if (irr === null) return "n/a";
    return formatPercent(irr * 100, 1);
  };

  const formatPayback = (pb: number | null) => {
    if (pb === null) return "> horizon";
    return `${pb.toFixed(1)} years`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!metrics || yearlyData.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => navigate(`/financial/models/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Model
        </Button>
        <Card className="mt-4">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No financial data available. Please generate financial statements first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latest = yearlyData[yearlyData.length - 1];
  const latestLiquidity = metrics.liquidity.yearly[metrics.liquidity.yearly.length - 1];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(`/financial/models/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Model
          </Button>
          <h1 className="text-3xl font-bold mt-2">{modelName} – Financial Metrics</h1>
          <p className="text-muted-foreground">Comprehensive financial analysis and performance indicators</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Equity IRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIRR(metrics.returns.equity.irr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Return to equity holders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">NPV @ {discountRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.returns.equity.npv)}</div>
            <p className="text-xs text-muted-foreground mt-1">Net present value (equity)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Payback Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPayback(metrics.returns.equity.payback)}</div>
            <p className="text-xs text-muted-foreground mt-1">Time to recover investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.profitability.total.revenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across project lifetime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Min DSCR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.debt.minDSCR, 2)}x</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.debt.minDSCRYear && `In year ${metrics.debt.minDSCRYear}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(latest.cashEnd)}</div>
            <p className="text-xs text-muted-foreground mt-1">Latest year ending</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Badges */}
      {!metrics.compliance.overallPass && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="font-medium">Financial Identity Checks Failed</span>
              <Separator orientation="vertical" className="h-4" />
              {metrics.compliance.yearly.map(y => (
                <div key={y.year} className="flex gap-2">
                  {!y.balanceIdentity && <Badge variant="destructive">Balance {y.year}</Badge>}
                  {!y.cashTieOut && <Badge variant="destructive">Cash {y.year}</Badge>}
                  {!y.equityIdentity && <Badge variant="destructive">Equity {y.year}</Badge>}
                  {!y.liabilitySigns && <Badge variant="destructive">Liabilities {y.year}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="returns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="returns">Returns & NPV</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="unit">Unit Economics</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity & Debt</TabsTrigger>
          <TabsTrigger value="carbon">Carbon KPIs</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        {/* Returns Tab */}
        <TabsContent value="returns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Equity Returns (Levered)</CardTitle>
                <CardDescription>Returns to equity holders after debt service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IRR:</span>
                  <span className="font-mono font-bold">{formatIRR(metrics.returns.equity.irr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NPV @ {discountRate}%:</span>
                  <span className="font-mono">{formatCurrency(metrics.returns.equity.npv)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MIRR:</span>
                  <span className="font-mono">{formatIRR(metrics.returns.equity.mirr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payback:</span>
                  <span className="font-mono">{formatPayback(metrics.returns.equity.payback)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discounted Payback:</span>
                  <span className="font-mono">{formatPayback(metrics.returns.equity.discountedPayback)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Returns (Unlevered)</CardTitle>
                <CardDescription>Returns before financing considerations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IRR:</span>
                  <span className="font-mono font-bold">{formatIRR(metrics.returns.project.irr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NPV @ {discountRate}%:</span>
                  <span className="font-mono">{formatCurrency(metrics.returns.project.npv)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MIRR:</span>
                  <span className="font-mono">{formatIRR(metrics.returns.project.mirr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payback:</span>
                  <span className="font-mono">{formatPayback(metrics.returns.project.payback)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discounted Payback:</span>
                  <span className="font-mono">{formatPayback(metrics.returns.project.discountedPayback)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cumulative NPV Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cumulative NPV by Year</CardTitle>
              <CardDescription>Build-up of net present value over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.returns.equity.cumulativeNPV}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                  <YAxis label={{ value: "Cumulative NPV ($)", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="Equity NPV" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profitability Tab */}
        <TabsContent value="profitability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profitability & Margins</CardTitle>
              <CardDescription>Income statement metrics by year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Year</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">COGS</th>
                      <th className="text-right py-2">Gross Profit</th>
                      <th className="text-right py-2">OPEX</th>
                      <th className="text-right py-2">EBITDA</th>
                      <th className="text-right py-2">Net Income</th>
                      <th className="text-right py-2">Gross %</th>
                      <th className="text-right py-2">EBITDA %</th>
                      <th className="text-right py-2">Net %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.profitability.yearly.map(y => (
                      <tr key={y.year} className="border-b">
                        <td className="py-2 font-medium">{y.year}</td>
                        <td className="text-right font-mono">{formatCurrency(y.revenue)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.cogs)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.grossProfit)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.opex)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.ebitda)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.netIncome)}</td>
                        <td className="text-right font-mono">{formatPercent(y.grossMargin)}</td>
                        <td className="text-right font-mono">{formatPercent(y.ebitdaMargin)}</td>
                        <td className="text-right font-mono">{formatPercent(y.netMargin)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2">Total</td>
                      <td className="text-right font-mono">{formatCurrency(metrics.profitability.total.revenue)}</td>
                      <td className="text-right font-mono">{formatCurrency(metrics.profitability.total.cogs)}</td>
                      <td className="text-right font-mono">{formatCurrency(metrics.profitability.total.grossProfit)}</td>
                      <td className="text-right font-mono">{formatCurrency(metrics.profitability.total.opex)}</td>
                      <td className="text-right font-mono">{formatCurrency(metrics.profitability.total.ebitda)}</td>
                      <td className="text-right font-mono">{formatCurrency(metrics.profitability.total.netIncome)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unit Economics Tab */}
        <TabsContent value="unit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unit Economics (Per Credit)</CardTitle>
              <CardDescription>Cost and revenue per issued carbon credit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Year</th>
                      <th className="text-right py-2">Issued</th>
                      <th className="text-right py-2">WA Price</th>
                      <th className="text-right py-2">COGS/Credit</th>
                      <th className="text-right py-2">GP/Credit</th>
                      <th className="text-right py-2">OPEX/Credit</th>
                      <th className="text-right py-2">LCOC</th>
                      <th className="text-right py-2">All-in Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.unitEconomics.yearly.map(y => (
                      <tr key={y.year} className="border-b">
                        <td className="py-2 font-medium">{y.year}</td>
                        <td className="text-right font-mono">{formatNumber(y.issuedCredits, 0)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.waPrice)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.cogsPerCredit)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.gpPerCredit)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.opexPerCredit)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.lcoc)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.allInCostPerCredit)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2">Average</td>
                      <td className="text-right font-mono">{formatNumber(metrics.unitEconomics.total.totalIssued, 0)}</td>
                      <td className="text-right font-mono">{formatCurrency(metrics.unitEconomics.total.avgWaPrice)}</td>
                      <td className="text-right font-mono">{formatCurrency(metrics.unitEconomics.total.avgCogsPerCredit)}</td>
                      <td colSpan={2}></td>
                      <td className="text-right font-mono">{formatCurrency(metrics.unitEconomics.total.avgLcoc)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Break-even Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Break-even Analysis</CardTitle>
              <CardDescription>Price and volume thresholds for profitability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Year</th>
                      <th className="text-right py-2">BE Price (Oper)</th>
                      <th className="text-right py-2">Realized Price</th>
                      <th className="text-right py-2">Safety Spread</th>
                      <th className="text-right py-2">BE Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.breakEven.yearly.map(y => (
                      <tr key={y.year} className="border-b">
                        <td className="py-2 font-medium">{y.year}</td>
                        <td className="text-right font-mono">{formatCurrency(y.bePriceOper)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.realizedPrice)}</td>
                        <td className="text-right font-mono">
                          <span className={y.safetySpread && y.safetySpread > 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(y.safetySpread)}
                          </span>
                        </td>
                        <td className="text-right font-mono">{formatNumber(y.beVolumeOper, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liquidity & Debt Tab */}
        <TabsContent value="liquidity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liquidity Ratios</CardTitle>
              <CardDescription>Balance sheet health and solvency metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Year</th>
                      <th className="text-right py-2">Cash</th>
                      <th className="text-right py-2">Current Ratio</th>
                      <th className="text-right py-2">Cash Ratio</th>
                      <th className="text-right py-2">D/E</th>
                      <th className="text-right py-2">Net Debt/EBITDA</th>
                      <th className="text-right py-2">Int Coverage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.liquidity.yearly.map(y => (
                      <tr key={y.year} className="border-b">
                        <td className="py-2 font-medium">{y.year}</td>
                        <td className="text-right font-mono">{formatCurrency(y.cash)}</td>
                        <td className="text-right font-mono">{formatNumber(y.currentRatio)}</td>
                        <td className="text-right font-mono">{formatNumber(y.cashRatio)}</td>
                        <td className="text-right font-mono">{formatNumber(y.debtToEquity)}</td>
                        <td className="text-right font-mono">{formatNumber(y.netDebtToEbitda)}</td>
                        <td className="text-right font-mono">{formatNumber(y.interestCoverage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debt Service & Coverage</CardTitle>
              <CardDescription>Debt schedule and DSCR by year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Year</th>
                      <th className="text-right py-2">Beg Balance</th>
                      <th className="text-right py-2">Draw</th>
                      <th className="text-right py-2">Principal</th>
                      <th className="text-right py-2">End Balance</th>
                      <th className="text-right py-2">Interest</th>
                      <th className="text-right py-2">Debt Service</th>
                      <th className="text-right py-2">DSCR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.debt.yearly.map(y => (
                      <tr key={y.year} className="border-b">
                        <td className="py-2 font-medium">{y.year}</td>
                        <td className="text-right font-mono">{formatCurrency(y.beginning)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.draw)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.principal)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.ending)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.interest)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.debtService)}</td>
                        <td className="text-right font-mono">
                          <span className={y.dscr && y.dscr < 1.2 ? "text-red-600" : "text-green-600"}>
                            {formatNumber(y.dscr)}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carbon KPIs Tab */}
        <TabsContent value="carbon" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carbon Credit Metrics</CardTitle>
              <CardDescription>Generation, issuance, and pricing by year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Year</th>
                      <th className="text-right py-2">Generated</th>
                      <th className="text-right py-2">Issued</th>
                      <th className="text-right py-2">Issuance %</th>
                      <th className="text-right py-2">PP Delivered</th>
                      <th className="text-right py-2">PP Remaining</th>
                      <th className="text-right py-2">WA Price</th>
                      <th className="text-right py-2">Spot Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.carbonKPIs.yearly.map(y => (
                      <tr key={y.year} className="border-b">
                        <td className="py-2 font-medium">{y.year}</td>
                        <td className="text-right font-mono">{formatNumber(y.generated, 0)}</td>
                        <td className="text-right font-mono">{formatNumber(y.issued, 0)}</td>
                        <td className="text-right font-mono">{formatPercent(y.issuanceRatio, 0)}</td>
                        <td className="text-right font-mono">{formatNumber(y.purchasedDelivered, 0)}</td>
                        <td className="text-right font-mono">{formatNumber(y.remainingPurchased, 0)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.waPrice)}</td>
                        <td className="text-right font-mono">{formatCurrency(y.spotPrice)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2">Total</td>
                      <td className="text-right font-mono">{formatNumber(metrics.carbonKPIs.totalGenerated, 0)}</td>
                      <td className="text-right font-mono">{formatNumber(metrics.carbonKPIs.totalIssued, 0)}</td>
                      <td colSpan={5}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {metrics.carbonKPIs.impliedPPPrice !== null && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Implied Pre-purchase Price:</span>{" "}
                    <span className="font-mono">{formatCurrency(metrics.carbonKPIs.impliedPPPrice)}</span> per credit
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          {/* Revenue Split Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Source</CardTitle>
              <CardDescription>Spot vs pre-purchase revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="spotRevenue" name="Spot Revenue" fill="hsl(var(--chart-1))" stackId="a" />
                  <Bar dataKey="prepurchaseRevenue" name="Pre-purchase Revenue" fill="hsl(var(--chart-2))" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Profitability Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Profitability Trend</CardTitle>
              <CardDescription>EBITDA and Net Income over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.profitability.yearly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                  <Line type="monotone" dataKey="netIncome" name="Net Income" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cash Balance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Position</CardTitle>
              <CardDescription>Cash balance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="cashEnd" name="Cash Balance" fill="hsl(var(--chart-4))" stroke="hsl(var(--chart-4))" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* DSCR Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Debt Service Coverage Ratio</CardTitle>
              <CardDescription>DSCR by year with covenant threshold</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={metrics.debt.yearly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatNumber(value, 2)} />
                  <Legend />
                  <Bar dataKey="dscr" name="DSCR" fill="hsl(var(--chart-2))" />
                  <Line type="monotone" dataKey={() => 1.2} name="Covenant (1.20x)" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
