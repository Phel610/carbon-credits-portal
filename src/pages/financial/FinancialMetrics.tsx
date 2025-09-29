import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  Activity, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Zap 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ComprehensiveMetrics } from '@/lib/financial/comprehensiveMetrics';
import { 
  formatCurrency, 
  formatPercentage, 
  formatRatio, 
  formatSafeCurrency, 
  formatSafePercentage, 
  formatSafeRatio,
  getMetricStatus,
  getProgressValue 
} from '@/lib/financial/metricsFormatters';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

interface FinancialModel {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
}

interface MetricData {
  metric_name: string;
  value: number | string;
}

const FinancialMetrics = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [model, setModel] = useState<FinancialModel | null>(null);
  const [comprehensiveMetrics, setComprehensiveMetrics] = useState<ComprehensiveMetrics | null>(null);
  const [legacyMetrics, setLegacyMetrics] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchModelAndMetrics();
    }
  }, [id, user]);

  const fetchModelAndMetrics = async () => {
    if (!user || !id) return;

    try {
      // Fetch model
      const { data: modelData, error: modelError } = await supabase
        .from('financial_models')
        .select('*')
        .eq('id', id)
        .single();

      if (modelError) throw modelError;
      setModel(modelData);

      // Fetch metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('financial_metrics')
        .select('*')
        .eq('model_id', id);

      if (metricsError) throw metricsError;

      // Transform metrics data
      const legacyMap: { [key: string]: number } = {};
      let comprehensive: ComprehensiveMetrics | null = null;
      
      metricsData?.forEach((metric: MetricData) => {
        if (metric.metric_name === 'comprehensive_metrics') {
          try {
            comprehensive = JSON.parse(metric.value as string);
          } catch (e) {
            console.error('Failed to parse comprehensive metrics:', e);
          }
        } else if (typeof metric.value === 'number') {
          legacyMap[metric.metric_name] = metric.value;
        }
      });
      
      setLegacyMetrics(legacyMap);
      setComprehensiveMetrics(comprehensive);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Zap className="h-8 w-8 mx-auto mb-4 animate-pulse text-trust" />
            <div>Loading comprehensive financial metrics...</div>
          </div>
        </div>
      </FinancialPlatformLayout>
    );
  }

  if (!model) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Model not found</div>
        </div>
      </FinancialPlatformLayout>
    );
  }

  // Show legacy UI if no comprehensive metrics available
  if (!comprehensiveMetrics && Object.keys(legacyMetrics).length === 0) {
    return (
      <FinancialPlatformLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/financial/models/${id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Model
            </Button>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{model.name} - Financial Metrics</h1>
            <p className="text-muted-foreground">
              Key performance indicators and financial ratios for your carbon project
            </p>
          </div>

          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Metrics Available</h3>
                <p className="text-muted-foreground mb-4">
                  Financial metrics will be calculated once you complete your model inputs and generate statements.
                </p>
                <Button asChild>
                  <a href={`/financial/models/${id}/statements`}>
                    Generate Financial Statements
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </FinancialPlatformLayout>
    );
  }

  // If we have comprehensive metrics, show the new comprehensive UI
  if (comprehensiveMetrics) {
    const summary = comprehensiveMetrics.summary;
    const years = Object.keys(comprehensiveMetrics.profitability).map(Number).sort();
    const latestYear = Math.max(...years);

    // Prepare chart data
    const profitabilityChartData = years.map(year => {
      const prof = (comprehensiveMetrics.profitability as any)[year];
      return {
        year,
        revenue: prof.total_revenue,
        ebitda: prof.ebitda,
        net_income: prof.net_income
      };
    });

    const cashChartData = years.map(year => {
      const cash = (comprehensiveMetrics.cashHealth as any)[year];
      return {
        year,
        cash_end: cash.cash_end
      };
    });

    const dscrChartData = years.map(year => {
      const coverage = (comprehensiveMetrics.debtCoverage as any)[year];
      return {
        year,
        dscr: typeof coverage.dscr_conservative === 'number' ? coverage.dscr_conservative : 0
      };
    });

    return (
      <FinancialPlatformLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/financial/models/${id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Model
            </Button>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{model.name} - Comprehensive Financial Metrics</h1>
            <p className="text-muted-foreground">
              Complete financial analysis with industry-standard metrics and benchmarks
            </p>
          </div>

          {/* Top Summary Tiles (Latest Year) */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_revenue)}</div>
                <p className="text-xs text-muted-foreground">Total across horizon</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_ebitda)}</div>
                <p className="text-xs text-muted-foreground">Total across horizon</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_net_income)}</div>
                <p className="text-xs text-muted-foreground">Total across horizon</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Cash End</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.latest_year_cash)}</div>
                <p className="text-xs text-muted-foreground">Final year balance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Min DSCR</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMetricStatus('min_dscr', summary.min_dscr).color}`}>
                  {formatRatio(summary.min_dscr)}
                </div>
                <p className="text-xs text-muted-foreground">Debt coverage ratio</p>
              </CardContent>
            </Card>
          </div>

          {/* Key Returns Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Equity IRR</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className={`text-2xl font-bold ${typeof summary.equity_irr === 'number' ? getMetricStatus('irr', summary.equity_irr).color : 'text-muted-foreground'}`}>
                    {typeof summary.equity_irr === 'number' ? formatPercentage(summary.equity_irr) : summary.equity_irr}
                  </div>
                  {typeof summary.equity_irr === 'number' && (
                    <Progress value={getProgressValue('irr', summary.equity_irr)} className="h-2" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Project IRR</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className={`text-2xl font-bold ${typeof summary.project_irr === 'number' ? getMetricStatus('irr', summary.project_irr).color : 'text-muted-foreground'}`}>
                    {typeof summary.project_irr === 'number' ? formatPercentage(summary.project_irr) : summary.project_irr}
                  </div>
                  {typeof summary.project_irr === 'number' && (
                    <Progress value={getProgressValue('irr', summary.project_irr)} className="h-2" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Equity NPV</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMetricStatus('npv', comprehensiveMetrics.returns.equity.npv).color}`}>
                  {formatCurrency(comprehensiveMetrics.returns.equity.npv)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Current Ratio</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSafeRatio(summary.latest_year_current_ratio)}
                </div>
                <p className="text-xs text-muted-foreground">Latest year liquidity</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profitability Trends</CardTitle>
                <CardDescription>Revenue, EBITDA, and Net Income over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={profitabilityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="ebitda" stroke="hsl(var(--secondary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="net_income" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Balance</CardTitle>
                <CardDescription>End-of-year cash position</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cashChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area type="monotone" dataKey="cash_end" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics Tables */}
          <Tabs defaultValue="profitability" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profitability">Profitability</TabsTrigger>
              <TabsTrigger value="unit-economics">Unit Economics</TabsTrigger>
              <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
              <TabsTrigger value="debt">Debt Coverage</TabsTrigger>
              <TabsTrigger value="carbon">Carbon KPIs</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="profitability">
              <Card>
                <CardHeader>
                  <CardTitle>Profitability & Margins</CardTitle>
                  <CardDescription>Revenue, costs, and profitability metrics by year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          {years.map(year => (
                            <TableHead key={year} className="text-right">{year}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Total Revenue</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.profitability as any)[year].total_revenue)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">COGS</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.profitability as any)[year].cogs)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Gross Profit</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.profitability as any)[year].gross_profit)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">OPEX</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.profitability as any)[year].opex)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">EBITDA</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.profitability as any)[year].ebitda)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Net Income</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.profitability as any)[year].net_income)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-semibold">Gross Margin</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right font-semibold">
                              {formatSafePercentage((comprehensiveMetrics.profitability as any)[year].gross_margin)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-semibold">EBITDA Margin</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right font-semibold">
                              {formatSafePercentage((comprehensiveMetrics.profitability as any)[year].ebitda_margin)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-semibold">Net Margin</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right font-semibold">
                              {formatSafePercentage((comprehensiveMetrics.profitability as any)[year].net_margin)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unit-economics">
              <Card>
                <CardHeader>
                  <CardTitle>Unit Economics (Per Credit)</CardTitle>
                  <CardDescription>Per-credit metrics for issued credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          {years.map(year => (
                            <TableHead key={year} className="text-right">{year}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Issued Credits</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {(comprehensiveMetrics.unitEconomics as any)[year].issued_credits.toLocaleString()}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">WA Realized Price</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatSafeCurrency((comprehensiveMetrics.unitEconomics as any)[year].wa_realized_price)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">COGS per Credit</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatSafeCurrency((comprehensiveMetrics.unitEconomics as any)[year].cogs_per_credit)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">OPEX per Credit</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatSafeCurrency((comprehensiveMetrics.unitEconomics as any)[year].opex_per_credit)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">LCOC (Operating)</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatSafeCurrency((comprehensiveMetrics.unitEconomics as any)[year].lcoc_operational)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">All-in Cost per Credit</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatSafeCurrency((comprehensiveMetrics.unitEconomics as any)[year].all_in_cost_per_credit)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="liquidity">
              <Card>
                <CardHeader>
                  <CardTitle>Liquidity & Working Capital</CardTitle>
                  <CardDescription>Cash position and working capital metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          {years.map(year => (
                            <TableHead key={year} className="text-right">{year}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Cash</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.liquidity as any)[year].cash)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Current Assets</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.liquidity as any)[year].current_assets)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Current Liabilities</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.liquidity as any)[year].current_liabilities)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-semibold">Current Ratio</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right font-semibold">
                              {formatSafeRatio((comprehensiveMetrics.liquidity as any)[year].current_ratio)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-semibold">Cash Ratio</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right font-semibold">
                              {formatSafeRatio((comprehensiveMetrics.liquidity as any)[year].cash_ratio)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Net Debt</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.liquidity as any)[year].net_debt)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="debt">
              <Card>
                <CardHeader>
                  <CardTitle>Debt Coverage & Service</CardTitle>
                  <CardDescription>Debt service coverage and payment schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          {years.map(year => (
                            <TableHead key={year} className="text-right">{year}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Beginning Balance</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.debtCoverage as any)[year].beginning_balance)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Principal Paid</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.debtCoverage as any)[year].principal_paid)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Interest Expense</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.debtCoverage as any)[year].interest_expense)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Total Debt Service</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatCurrency((comprehensiveMetrics.debtCoverage as any)[year].total_debt_service)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-semibold">DSCR (Conservative)</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right font-semibold">
                              {formatSafeRatio((comprehensiveMetrics.debtCoverage as any)[year].dscr_conservative)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Minimum DSCR:</span>
                        <span className={`font-bold ${getMetricStatus('min_dscr', comprehensiveMetrics.debtCoverage.min_dscr).color}`}>
                          {formatRatio(comprehensiveMetrics.debtCoverage.min_dscr)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Min DSCR Year:</span>
                        <span className="font-bold">{comprehensiveMetrics.debtCoverage.min_dscr_year}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="carbon">
              <Card>
                <CardHeader>
                  <CardTitle>Carbon-Commercial KPIs</CardTitle>
                  <CardDescription>Carbon credit generation, issuance, and pricing metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          {years.map(year => (
                            <TableHead key={year} className="text-right">{year}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Generated Credits</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {(comprehensiveMetrics.carbonKPIs as any)[year].generated_credits.toLocaleString()}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Issued Credits</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {(comprehensiveMetrics.carbonKPIs as any)[year].issued_credits.toLocaleString()}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Issuance Ratio</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatPercentage((comprehensiveMetrics.carbonKPIs as any)[year].issuance_ratio)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">WA Realized Price (All)</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatSafeCurrency((comprehensiveMetrics.carbonKPIs as any)[year].wa_realized_price_all)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">WA Spot Price</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-right">
                              {formatSafeCurrency((comprehensiveMetrics.carbonKPIs as any)[year].wa_spot_price)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Implied Purchase Price:</span>
                        <span className="font-bold">{formatCurrency(comprehensiveMetrics.carbonKPIs.implied_purchase_price, 2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Total Purchased Credits:</span>
                        <span className="font-bold">{comprehensiveMetrics.carbonKPIs.total_purchased_credits.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance & Identity Checks</CardTitle>
                  <CardDescription>Financial statement integrity and consistency validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Check</TableHead>
                          {years.map(year => (
                            <TableHead key={year} className="text-center">{year}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Balance Sheet Identity</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-center">
                              {(comprehensiveMetrics.compliance as any)[year].balance_identity ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-600 mx-auto" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Cash Tie-out</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-center">
                              {(comprehensiveMetrics.compliance as any)[year].cash_tieout ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-600 mx-auto" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Equity Identity</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-center">
                              {(comprehensiveMetrics.compliance as any)[year].equity_identity ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-600 mx-auto" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Liability Signs</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-center">
                              {(comprehensiveMetrics.compliance as any)[year].liability_signs ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-600 mx-auto" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Debt Schedule Consistency</TableCell>
                          {years.map(year => (
                            <TableCell key={year} className="text-center">
                              {(comprehensiveMetrics.compliance as any)[year].debt_schedule_consistency ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-600 mx-auto" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </FinancialPlatformLayout>
    );
  }

  // Fallback to legacy metrics if available
  return (
    <FinancialPlatformLayout>
      <div className="p-6 space-y-6">
        {/* Legacy metrics display - existing code preserved */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/financial/models/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Model
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{model.name} - Financial Metrics</h1>
          <p className="text-muted-foreground">
            Key performance indicators and financial ratios for your carbon project
          </p>
        </div>

        {/* Legacy metrics display */}
        <div className="text-center py-12">
          <p className="text-muted-foreground">Legacy metrics view - please regenerate statements for comprehensive metrics</p>
        </div>
      </div>
    </FinancialPlatformLayout>
  );
};

export default FinancialMetrics;
