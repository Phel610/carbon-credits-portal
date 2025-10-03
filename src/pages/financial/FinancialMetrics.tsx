import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, CheckCircle2, XCircle, Calculator, BarChart3 } from "lucide-react";
import FinancialPlatformLayout from "@/components/layout/FinancialPlatformLayout";
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
import { TransposedTable } from "@/components/ui/transposed-table";
import { FinancialMetricsGuide } from "@/components/help/FinancialMetricsGuide";
import { HelpCircle } from "lucide-react";

export default function FinancialMetrics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [modelName, setModelName] = useState("");
  const [yearlyData, setYearlyData] = useState<YearlyFinancials[]>([]);
  const [metrics, setMetrics] = useState<ComprehensiveMetrics | null>(null);
  const [discountRate, setDiscountRate] = useState(15);
  const [scenariosExist, setScenariosExist] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

      // Check if scenarios exist
      const { data: scenarios } = await supabase
        .from('model_scenarios')
        .select('id')
        .eq('model_id', id)
        .limit(1);
      setScenariosExist(scenarios && scenarios.length > 0);

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
          return inp ? ((inp.input_value as any)?.value || 0) : 0;
        };

        return {
          year,
          // Income Statement - use exact field names from engine output
          spotRevenue: getVal("income_statement", "spot_revenue"),
          prepurchaseRevenue: getVal("income_statement", "pre_purchase_revenue"),
          totalRevenue: getVal("income_statement", "total_revenue"),
          cogs: getVal("income_statement", "cogs"),
          feasibility: getVal("income_statement", "feasibility_costs"),
          pdd: getVal("income_statement", "pdd_costs"),
          mrv: getVal("income_statement", "mrv_costs"),
          staff: getVal("income_statement", "staff_costs"),
          opex: getVal("income_statement", "opex_total"),
          ebitda: getVal("income_statement", "ebitda"),
          depreciation: getVal("income_statement", "depreciation"),
          interest: getVal("income_statement", "interest_expense"),
          ebt: getVal("income_statement", "earnings_before_tax"),
          incomeTax: getVal("income_statement", "income_tax"),
          netIncome: getVal("income_statement", "net_income"),
          grossProfit: getVal("income_statement", "total_revenue") - Math.abs(getVal("income_statement", "cogs")),
          
          // Balance Sheet - use exact field names from engine output
          cash: getVal("balance_sheet", "cash"),
          accountsReceivable: getVal("balance_sheet", "accounts_receivable"),
          ppe: getVal("balance_sheet", "ppe_net"),
          totalAssets: getVal("balance_sheet", "total_assets"),
          accountsPayable: getVal("balance_sheet", "accounts_payable"),
          unearnedRevenue: getVal("balance_sheet", "unearned_revenue"),
          debt: getVal("balance_sheet", "debt_balance"),
          totalLiabilities: getVal("balance_sheet", "total_liabilities"),
          equity: getVal("balance_sheet", "total_equity"),
          contributedCapital: getVal("balance_sheet", "contributed_capital"),
          retainedEarnings: getVal("balance_sheet", "retained_earnings"),
          
          // Cash Flow - use exact field names from engine output
          operatingCF: getVal("cashflow_statement", "operating_cash_flow"),
          investingCF: getVal("cashflow_statement", "investing_cash_flow"),
          financingCF: getVal("cashflow_statement", "financing_cash_flow"),
          netChangeCash: getVal("cashflow_statement", "net_change_cash"),
          cashEnd: getVal("cashflow_statement", "cash_end"),
          capex: getVal("cashflow_statement", "capex"),
          changeAR: getVal("cashflow_statement", "change_ar"),
          changeAP: getVal("cashflow_statement", "change_ap"),
          changeUnearned: 0, // Not directly in cash flow statement
          
          // Debt Schedule - use exact field names from engine output
          debtBeginning: getVal("debt_schedule", "beginning_balance"),
          debtDraw: getVal("debt_schedule", "draw"),
          debtPrincipal: getVal("debt_schedule", "principal_payment"),
          debtEnding: getVal("debt_schedule", "ending_balance"),
          debtInterest: getVal("debt_schedule", "interest_expense"),
          dscr: getVal("debt_schedule", "dscr"),
          
          // Carbon & Free Cash Flow - use exact field names from engine output
          creditsGenerated: getVal("income_statement", "credits_generated"),
          creditsIssued: getVal("income_statement", "credits_issued"),
          purchasedCreditsDelivered: getVal("income_statement", "purchased_credits"),
          fcfe: getVal("free_cash_flow", "fcf_to_equity"),
        };
      });

      // Validate statement types exist
      const validation = {
        hasDebtSchedule: statements.some(s => s.statement_type === 'debt_schedule'),
        hasFreeCashFlow: statements.some(s => s.statement_type === 'free_cash_flow'),
        hasCarbonStream: statements.some(s => s.statement_type === 'carbon_stream'),
      };

      if (!validation.hasDebtSchedule || !validation.hasFreeCashFlow || !validation.hasCarbonStream) {
        const missingTypes = [];
        if (!validation.hasDebtSchedule) missingTypes.push('Debt Schedule');
        if (!validation.hasFreeCashFlow) missingTypes.push('Free Cash Flow');
        if (!validation.hasCarbonStream) missingTypes.push('Carbon Stream');
        
        console.warn('⚠️ Model missing statement types:', missingTypes.join(', '));
        toast({
          title: "Incomplete Financial Data",
          description: `Missing: ${missingTypes.join(', ')}. Click "Recalculate" in Statements to generate complete metrics.`,
          variant: "destructive",
          duration: 10000,
        });
      }

      setYearlyData(yearly);

      // Get discount rate from inputs
      const discountInput = inputs.find(i => i.input_key === "discount_rate");
      const rate = discountInput ? Number((discountInput.input_value as any)?.value || 15) : 15;
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
        return inp ? ((inp.input_value as any)?.value || 0) : 0;
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
    if (typeof value !== 'number' || isNaN(value)) return "–";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number | null, decimals: number = 1) => {
    if (value === null || value === undefined) return "–";
    if (typeof value !== 'number' || isNaN(value)) return "–";
    if (value === Infinity) return "∞";
    return `${value.toFixed(decimals)}%`;
  };

  const formatNumber = (value: number | null, decimals: number = 2) => {
    if (value === null || value === undefined) return "–";
    if (typeof value !== 'number' || isNaN(value)) return "–";
    if (value === Infinity) return "∞";
    return value.toFixed(decimals);
  };

  const formatIRR = (irr: number | null) => {
    if (irr === null || typeof irr !== 'number' || isNaN(irr)) return "n/a";
    return formatPercent(irr * 100, 1);
  };

  const formatPayback = (pb: number | null) => {
    if (pb === null || typeof pb !== 'number' || isNaN(pb)) return "> horizon";
    return `${pb.toFixed(1)} years`;
  };

  const handleExport = () => {
    if (!metrics || !yearlyData.length) return;

    // Generate CSV export
    const csvContent = generateCSVExport();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${modelName}_financial_metrics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Financial metrics exported to CSV",
    });
  };

  const generateCSVExport = () => {
    let csv = `Financial Metrics Report - ${modelName}\n`;
    csv += `Generated: ${new Date().toISOString()}\n\n`;

    // Executive Summary
    csv += "EXECUTIVE SUMMARY\n";
    csv += `Equity IRR,${metrics?.returns.equity.irr ? (metrics.returns.equity.irr * 100).toFixed(1) + '%' : 'n/a'}\n`;
    csv += `Equity NPV @ ${discountRate}%,${formatCurrency(metrics?.returns.equity.npv)}\n`;
    csv += `Payback Period,${formatPayback(metrics?.returns.equity.payback)}\n`;
    csv += `Total Revenue,${formatCurrency(metrics?.profitability.total.revenue)}\n`;
    csv += `Min DSCR,${formatNumber(metrics?.debt.minDSCR)}x\n\n`;

    // Profitability Table
    csv += "PROFITABILITY & MARGINS\n";
    csv += "Year,Revenue,COGS,Gross Profit,OPEX,EBITDA,Depreciation,Interest,EBT,Tax,Net Income,Gross %,EBITDA %,Net %\n";
    metrics?.profitability.yearly.forEach(y => {
      csv += `${y.year},${y.revenue},${y.cogs},${y.grossProfit},${y.opex},${y.ebitda},${y.depreciation},${y.interest},${y.ebt},${y.tax},${y.netIncome},${y.grossMargin?.toFixed(1) || ''},${y.ebitdaMargin?.toFixed(1) || ''},${y.netMargin?.toFixed(1) || ''}\n`;
    });
    csv += "\n";

    // Unit Economics
    csv += "UNIT ECONOMICS (PER CREDIT)\n";
    csv += "Year,Issued,WA Price,COGS/Credit,GP/Credit,OPEX/Credit,LCOC,All-in Cost\n";
    metrics?.unitEconomics.yearly.forEach(y => {
      csv += `${y.year},${y.issuedCredits},${y.waPrice || ''},${y.cogsPerCredit || ''},${y.gpPerCredit || ''},${y.opexPerCredit || ''},${y.lcoc || ''},${y.allInCostPerCredit || ''}\n`;
    });
    csv += "\n";

    // Working Capital
    csv += "WORKING CAPITAL\n";
    csv += "Year,AR,AP,NWC,Revenue,DSO,DPO,NWC % Rev\n";
    metrics?.workingCapital.yearly.forEach(y => {
      csv += `${y.year},${y.ar},${y.ap},${y.nwc},${y.revenue},${y.dso?.toFixed(0) || ''},${y.dpo?.toFixed(0) || ''},${y.nwcPct?.toFixed(1) || ''}\n`;
    });
    csv += "\n";

    // Returns
    csv += "RETURNS\n";
    csv += "Metric,Equity (Levered),Project (Unlevered)\n";
    csv += `IRR,${metrics?.returns.equity.irr ? (metrics.returns.equity.irr * 100).toFixed(1) + '%' : 'n/a'},${metrics?.returns.project.irr ? (metrics.returns.project.irr * 100).toFixed(1) + '%' : 'n/a'}\n`;
    csv += `NPV @ ${discountRate}%,${formatCurrency(metrics?.returns.equity.npv)},${formatCurrency(metrics?.returns.project.npv)}\n`;
    csv += `MIRR,${metrics?.returns.equity.mirr ? (metrics.returns.equity.mirr * 100).toFixed(1) + '%' : 'n/a'},${metrics?.returns.project.mirr ? (metrics.returns.project.mirr * 100).toFixed(1) + '%' : 'n/a'}\n`;
    csv += `Payback,${formatPayback(metrics?.returns.equity.payback)},${formatPayback(metrics?.returns.project.payback)}\n`;

    return csv;
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
    <FinancialPlatformLayout>
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
        <Button variant="outline" size="sm" onClick={() => setShowGuide(true)}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Help Guide
        </Button>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium">EBITDA (Latest)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(latest.ebitda)}</div>
            <p className="text-xs text-muted-foreground mt-1">Year {latest.year} operating performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Net Income (Latest)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(latest.netIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">Year {latest.year} bottom line</p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Project IRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIRR(metrics.returns.project.irr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Unlevered project return</p>
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
                  {!(y as any).debtBalance && <Badge variant="destructive">Debt Sched {y.year}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="returns" className="space-y-4">
        <TabsList className="w-full grid grid-cols-7">
          <TabsTrigger value="returns">Returns & NPV</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="unit">Unit Economics</TabsTrigger>
          <TabsTrigger value="working-capital">Working Capital</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity & Debt</TabsTrigger>
          <TabsTrigger value="carbon">Carbon KPIs</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        {/* Returns Tab */}
        <TabsContent value="returns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Equity Returns (Levered)</CardTitle>
                <CardDescription>Returns to equity holders after debt service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">IRR:</span>
                  <span className="font-mono text-lg">{formatIRR(metrics.returns.equity.irr)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">NPV @ {(discountRate * 100).toFixed(1)}%:</span>
                  <span className="font-mono text-base">{formatCurrency(metrics.returns.equity.npv)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">MIRR:</span>
                  <span className="font-mono text-base">{formatIRR(metrics.returns.equity.mirr)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">Payback:</span>
                  <span className="font-mono text-base">{formatPayback(metrics.returns.equity.payback)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">Discounted Payback:</span>
                  <span className="font-mono text-base">{formatPayback(metrics.returns.equity.discountedPayback)}</span>
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
                  <span className="font-mono">{formatIRR(metrics.returns.project.irr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NPV @ {(discountRate * 100).toFixed(1)}%:</span>
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

            <Card>
              <CardHeader>
                <CardTitle>Investor Returns (Pre-purchase)</CardTitle>
                <CardDescription>Returns to carbon stream investor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">IRR:</span>
                  <span className="font-mono text-lg">{formatIRR(metrics.returns.investor.irr)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">NPV @ {(discountRate * 100).toFixed(1)}%:</span>
                  <span className="font-mono text-base">{formatCurrency(metrics.returns.investor.npv)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        {/* Profitability Tab */}
        <TabsContent value="profitability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profitability & Margins</CardTitle>
              <CardDescription>Income statement metrics by year</CardDescription>
            </CardHeader>
            <CardContent>
              <TransposedTable
                years={metrics.profitability.yearly.map(y => y.year)}
                showTotal
                rows={[
                  {
                    metric: 'Revenue',
                    values: metrics.profitability.yearly.map(y => formatCurrency(y.revenue)),
                    total: formatCurrency(metrics.profitability.total.revenue)
                  },
                  {
                    metric: 'COGS',
                    values: metrics.profitability.yearly.map(y => formatCurrency(y.cogs)),
                    total: formatCurrency(metrics.profitability.total.cogs)
                  },
                  {
                    metric: 'Gross Profit',
                    values: metrics.profitability.yearly.map(y => formatCurrency(y.grossProfit)),
                    total: formatCurrency(metrics.profitability.total.grossProfit)
                  },
                  {
                    metric: 'OPEX',
                    values: metrics.profitability.yearly.map(y => formatCurrency(y.opex)),
                    total: formatCurrency(metrics.profitability.total.opex)
                  },
                  {
                    metric: 'EBITDA',
                    values: metrics.profitability.yearly.map(y => formatCurrency(y.ebitda)),
                    total: formatCurrency(metrics.profitability.total.ebitda)
                  },
                  {
                    metric: 'Depreciation',
                    values: metrics.profitability.yearly.map(y => formatCurrency(y.depreciation)),
                  },
                  {
                    metric: 'Interest',
                    values: metrics.profitability.yearly.map(y => formatCurrency(y.interest)),
                  },
                  {
                    metric: 'EBT',
                    values: metrics.profitability.yearly.map(y => formatCurrency(y.ebt)),
                  },
                  {
                    metric: 'Tax',
                    values: metrics.profitability.yearly.map(y => formatCurrency(y.tax)),
                  },
                  {
                    metric: 'Net Income',
                    values: metrics.profitability.yearly.map(y => formatCurrency(y.netIncome)),
                    total: formatCurrency(metrics.profitability.total.netIncome)
                  },
                  {
                    metric: 'Gross Margin %',
                    values: metrics.profitability.yearly.map(y => formatPercent(y.grossMargin)),
                  },
                  {
                    metric: 'EBITDA Margin %',
                    values: metrics.profitability.yearly.map(y => formatPercent(y.ebitdaMargin)),
                  },
                  {
                    metric: 'Net Margin %',
                    values: metrics.profitability.yearly.map(y => formatPercent(y.netMargin)),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Capital Tab */}
        <TabsContent value="working-capital" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Working Capital Management</CardTitle>
              <CardDescription>AR, AP, and cash conversion metrics by year</CardDescription>
            </CardHeader>
            <CardContent>
              <TransposedTable
                years={metrics.workingCapital.yearly.map(y => y.year)}
                rows={[
                  {
                    metric: 'AR',
                    values: metrics.workingCapital.yearly.map(y => formatCurrency(y.ar)),
                  },
                  {
                    metric: 'AP',
                    values: metrics.workingCapital.yearly.map(y => formatCurrency(y.ap)),
                  },
                  {
                    metric: 'NWC',
                    values: metrics.workingCapital.yearly.map(y => formatCurrency(y.nwc)),
                  },
                  {
                    metric: 'Revenue',
                    values: metrics.workingCapital.yearly.map(y => formatCurrency(y.revenue)),
                  },
                  {
                    metric: 'DSO (days)',
                    values: metrics.workingCapital.yearly.map(y => formatNumber(y.dso, 0)),
                  },
                  {
                    metric: 'DPO (days)',
                    values: metrics.workingCapital.yearly.map(y => formatNumber(y.dpo, 0)),
                  },
                  {
                    metric: 'NWC % Rev',
                    values: metrics.workingCapital.yearly.map(y => formatPercent(y.nwcPct)),
                  },
                ]}
              />
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
              <TransposedTable
                years={metrics.unitEconomics.yearly.map(y => y.year)}
                showTotal
                totalLabel="Average"
                rows={[
                  {
                    metric: 'Issued Credits',
                    values: metrics.unitEconomics.yearly.map(y => formatNumber(y.issuedCredits, 0)),
                    total: formatNumber(metrics.unitEconomics.total.totalIssued, 0)
                  },
                  {
                    metric: 'WA Price',
                    values: metrics.unitEconomics.yearly.map(y => formatCurrency(y.waPrice)),
                    total: formatCurrency(metrics.unitEconomics.total.avgWaPrice)
                  },
                  {
                    metric: 'COGS/Credit',
                    values: metrics.unitEconomics.yearly.map(y => formatCurrency(y.cogsPerCredit)),
                    total: formatCurrency(metrics.unitEconomics.total.avgCogsPerCredit)
                  },
                  {
                    metric: 'GP/Credit',
                    values: metrics.unitEconomics.yearly.map(y => formatCurrency(y.gpPerCredit)),
                  },
                  {
                    metric: 'OPEX/Credit',
                    values: metrics.unitEconomics.yearly.map(y => formatCurrency(y.opexPerCredit)),
                  },
                  {
                    metric: 'LCOC',
                    values: metrics.unitEconomics.yearly.map(y => formatCurrency(y.lcoc)),
                    total: formatCurrency(metrics.unitEconomics.total.avgLcoc)
                  },
                  {
                    metric: 'All-in Cost',
                    values: metrics.unitEconomics.yearly.map(y => formatCurrency(y.allInCostPerCredit)),
                  },
                ]}
              />
            </CardContent>
          </Card>

          {/* Break-even Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Break-even Analysis</CardTitle>
              <CardDescription>Price and volume thresholds for profitability</CardDescription>
            </CardHeader>
            <CardContent>
              <TransposedTable
                years={metrics.breakEven.yearly.map(y => y.year)}
                rows={[
                  {
                    metric: 'BE Price (Oper)',
                    values: metrics.breakEven.yearly.map(y => formatCurrency(y.bePriceOper)),
                  },
                  {
                    metric: 'Realized Price',
                    values: metrics.breakEven.yearly.map(y => formatCurrency(y.realizedPrice)),
                  },
                  {
                    metric: 'Safety Spread',
                    values: metrics.breakEven.yearly.map(y => (
                      <span className={y.safetySpread && y.safetySpread > 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(y.safetySpread)}
                      </span>
                    )),
                  },
                  {
                    metric: 'BE Volume',
                    values: metrics.breakEven.yearly.map(y => formatNumber(y.beVolumeOper, 0)),
                  },
                ]}
              />
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
              <TransposedTable
                years={metrics.liquidity.yearly.map(y => y.year)}
                rows={[
                  {
                    metric: 'Cash',
                    values: metrics.liquidity.yearly.map(y => formatCurrency(y.cash)),
                  },
                  {
                    metric: 'Current Ratio',
                    values: metrics.liquidity.yearly.map(y => formatNumber(y.currentRatio)),
                  },
                  {
                    metric: 'Cash Ratio',
                    values: metrics.liquidity.yearly.map(y => formatNumber(y.cashRatio)),
                  },
                  {
                    metric: 'D/E',
                    values: metrics.liquidity.yearly.map(y => formatNumber(y.debtToEquity)),
                  },
                  {
                    metric: 'Net Debt/EBITDA',
                    values: metrics.liquidity.yearly.map(y => formatNumber(y.netDebtToEbitda)),
                  },
                  {
                    metric: 'Interest Coverage',
                    values: metrics.liquidity.yearly.map(y => formatNumber(y.interestCoverage)),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debt Service & Coverage</CardTitle>
              <CardDescription>Debt schedule and DSCR by year</CardDescription>
            </CardHeader>
            <CardContent>
              <TransposedTable
                years={metrics.debt.yearly.map(y => y.year)}
                rows={[
                  {
                    metric: 'Beg Balance',
                    values: metrics.debt.yearly.map(y => formatCurrency(y.beginning)),
                  },
                  {
                    metric: 'Draw',
                    values: metrics.debt.yearly.map(y => formatCurrency(y.draw)),
                  },
                  {
                    metric: 'Principal',
                    values: metrics.debt.yearly.map(y => formatCurrency(y.principal)),
                  },
                  {
                    metric: 'End Balance',
                    values: metrics.debt.yearly.map(y => formatCurrency(y.ending)),
                  },
                  {
                    metric: 'Interest',
                    values: metrics.debt.yearly.map(y => formatCurrency(y.interest)),
                  },
                  {
                    metric: 'Debt Service',
                    values: metrics.debt.yearly.map(y => formatCurrency(y.debtService)),
                  },
                  {
                    metric: 'DSCR',
                    values: metrics.debt.yearly.map(y => (
                      <span className={y.dscr && y.dscr < 1.2 ? "text-red-600" : "text-green-600"}>
                        {formatNumber(y.dscr)}x
                      </span>
                    )),
                  },
                ]}
              />
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
              <TransposedTable
                years={metrics.carbonKPIs.yearly.map(y => y.year)}
                showTotal
                rows={[
                  {
                    metric: 'Generated',
                    values: metrics.carbonKPIs.yearly.map(y => formatNumber(y.generated, 0)),
                    total: formatNumber(metrics.carbonKPIs.totalGenerated, 0)
                  },
                  {
                    metric: 'Issued',
                    values: metrics.carbonKPIs.yearly.map(y => formatNumber(y.issued, 0)),
                    total: formatNumber(metrics.carbonKPIs.totalIssued, 0)
                  },
                  {
                    metric: 'Issuance %',
                    values: metrics.carbonKPIs.yearly.map(y => formatPercent(y.issuanceRatio, 0)),
                  },
                  {
                    metric: 'PP Delivered',
                    values: metrics.carbonKPIs.yearly.map(y => formatNumber(y.purchasedDelivered, 0)),
                  },
                  {
                    metric: 'PP Remaining',
                    values: metrics.carbonKPIs.yearly.map(y => formatNumber(y.remainingPurchased, 0)),
                  },
                  {
                    metric: 'WA Price',
                    values: metrics.carbonKPIs.yearly.map(y => formatCurrency(y.waPrice)),
                  },
                  {
                    metric: 'Spot Price',
                    values: metrics.carbonKPIs.yearly.map(y => formatCurrency(y.spotPrice)),
                  },
                ]}
              />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="year" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="spotRevenue" 
                    name="Spot Revenue" 
                    fill="hsl(142, 76%, 36%)" 
                    stackId="a" 
                    radius={[0, 0, 0, 0]}
                    animationDuration={1000}
                  />
                  <Bar 
                    dataKey="prepurchaseRevenue" 
                    name="Pre-purchase Revenue" 
                    fill="hsl(210, 70%, 50%)" 
                    stackId="a" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="year" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ebitda" 
                    name="EBITDA" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(142, 76%, 36%)", r: 3 }}
                    activeDot={{ r: 6, fill: "hsl(142, 76%, 36%)" }}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netIncome" 
                    name="Net Income" 
                    stroke="hsl(210, 70%, 50%)" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(210, 70%, 50%)", r: 3 }}
                    activeDot={{ r: 6, fill: "hsl(210, 70%, 50%)" }}
                    animationDuration={1000}
                  />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="year" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cashEnd" 
                    name="Cash Balance" 
                    fill="hsl(142, 76%, 36%, 0.2)" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    animationDuration={1000}
                  />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="year" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${value.toFixed(1)}x`}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatNumber(value, 2)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="dscr" 
                    name="DSCR" 
                    fill="hsl(142, 76%, 36%)" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={() => 1.2} 
                    name="Covenant (1.20x)" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cumulative NPV Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cumulative NPV by Year</CardTitle>
              <CardDescription>Build-up of net present value over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.returns.equity.cumulativeNPV}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="year" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="Equity NPV" 
                    fill="hsl(142, 76%, 36%, 0.2)"
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Price Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Price Comparison</CardTitle>
              <CardDescription>Weighted average realized price vs break-even price</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.breakEven.yearly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="year" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="realizedPrice" 
                    name="WA Realized Price" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(142, 76%, 36%)", r: 3 }}
                    activeDot={{ r: 6, fill: "hsl(142, 76%, 36%)" }}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bePriceOper" 
                    name="Break-even Price (Oper)" 
                    stroke="hsl(25, 95%, 53%)" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={{ fill: "hsl(25, 95%, 53%)", r: 3 }}
                    activeDot={{ r: 5, fill: "hsl(25, 95%, 53%)" }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t mt-6">
        <Button variant="outline" onClick={() => navigate(`/financial/models/${id}/statements`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Statements
        </Button>
        <Button 
          className="bg-trust hover:bg-trust/90"
          onClick={() => navigate(`/financial/models/${id}/scenarios`)}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          {scenariosExist ? 'View Scenarios' : 'Create Scenarios'}
        </Button>
      </div>
      </div>

      <FinancialMetricsGuide open={showGuide} onOpenChange={setShowGuide} />
    </FinancialPlatformLayout>
  );
}
