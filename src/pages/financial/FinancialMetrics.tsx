import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FinancialModel {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
}

interface MetricData {
  metric_name: string;
  value: number;
}

const FinancialMetrics = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [model, setModel] = useState<FinancialModel | null>(null);
  const [metrics, setMetrics] = useState<{ [key: string]: number }>({});
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
      const metricsMap: { [key: string]: number } = {};
      metricsData?.forEach((metric: MetricData) => {
        metricsMap[metric.metric_name] = metric.value;
      });
      setMetrics(metricsMap);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatYears = (value: number) => {
    return `${value.toFixed(1)} years`;
  };

  const getMetricStatus = (metricName: string, value: number) => {
    switch (metricName) {
      case 'irr':
        if (value >= 20) return { status: 'excellent', color: 'text-green-600' };
        if (value >= 15) return { status: 'good', color: 'text-blue-600' };
        if (value >= 10) return { status: 'fair', color: 'text-yellow-600' };
        return { status: 'poor', color: 'text-red-600' };
      
      case 'npv':
        if (value >= 1000000) return { status: 'excellent', color: 'text-green-600' };
        if (value >= 500000) return { status: 'good', color: 'text-blue-600' };
        if (value >= 0) return { status: 'fair', color: 'text-yellow-600' };
        return { status: 'poor', color: 'text-red-600' };
      
      case 'payback_period':
        if (value <= 3) return { status: 'excellent', color: 'text-green-600' };
        if (value <= 5) return { status: 'good', color: 'text-blue-600' };
        if (value <= 7) return { status: 'fair', color: 'text-yellow-600' };
        return { status: 'poor', color: 'text-red-600' };
      
      default:
        return { status: 'neutral', color: 'text-muted-foreground' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fair':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getProgressValue = (metricName: string, value: number) => {
    switch (metricName) {
      case 'irr':
        return Math.min(value * 2.5, 100); // 40% IRR = 100%
      case 'ebitda_margin':
      case 'net_margin':
        return Math.min(Math.abs(value), 100);
      case 'payback_period':
        return Math.max(100 - (value * 10), 0); // Lower is better
      default:
        return 50;
    }
  };

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading financial metrics...</div>
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

        {Object.keys(metrics).length === 0 ? (
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
        ) : (
          <>
            {/* Key Performance Indicators */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Project IRR</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getMetricStatus('irr', metrics.irr || 0).color}`}>
                        {formatPercentage(metrics.irr || 0)}
                      </span>
                      {getStatusIcon(getMetricStatus('irr', metrics.irr || 0).status)}
                    </div>
                    <Progress value={getProgressValue('irr', metrics.irr || 0)} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Internal Rate of Return
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Net Present Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getMetricStatus('npv', metrics.npv || 0).color}`}>
                        {formatCurrency(metrics.npv || 0)}
                      </span>
                      {getStatusIcon(getMetricStatus('npv', metrics.npv || 0).status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      At {formatPercentage((metrics as any).discount_rate || 15)} discount rate
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Payback Period</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getMetricStatus('payback_period', metrics.payback_period || 0).color}`}>
                        {formatYears(metrics.payback_period || 0)}
                      </span>
                      {getStatusIcon(getMetricStatus('payback_period', metrics.payback_period || 0).status)}
                    </div>
                    <Progress value={getProgressValue('payback_period', metrics.payback_period || 0)} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Time to recover investment
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">EBITDA Margin</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {formatPercentage(metrics.ebitda_margin || 0)}
                      </span>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Progress value={getProgressValue('ebitda_margin', metrics.ebitda_margin || 0)} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Operating efficiency
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Summary */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Profitability</CardTitle>
                  <CardDescription>
                    Total project revenue and profit metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Revenue</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(metrics.total_revenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total EBITDA</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(metrics.total_ebitda || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Net Income</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(metrics.total_net_income || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Net Margin</span>
                      <span className="text-lg font-semibold">
                        {formatPercentage(metrics.net_margin || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Investment & Cash Flow</CardTitle>
                  <CardDescription>
                    Capital requirements and cash flow metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total CAPEX</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(metrics.total_capex || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Peak Funding Required</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(metrics.peak_funding_required || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Costs</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(metrics.total_costs || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Min. DSCR</span>
                      <span className="text-lg font-semibold">
                        {(metrics.dscr_minimum || 0).toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Assessment</CardTitle>
                <CardDescription>
                  Overall financial performance evaluation based on industry benchmarks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {Object.values(metrics).filter((_, index) => {
                          const metricNames = Object.keys(metrics);
                          const metricName = metricNames[index];
                          return ['irr', 'npv', 'payback_period'].includes(metricName) && 
                                 getMetricStatus(metricName, metrics[metricName]).status === 'excellent';
                        }).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Excellent Metrics</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {Object.values(metrics).filter((_, index) => {
                          const metricNames = Object.keys(metrics);
                          const metricName = metricNames[index];
                          return ['irr', 'npv', 'payback_period'].includes(metricName) && 
                                 getMetricStatus(metricName, metrics[metricName]).status === 'good';
                        }).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Good Metrics</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 mb-2">
                        {Object.values(metrics).filter((_, index) => {
                          const metricNames = Object.keys(metrics);
                          const metricName = metricNames[index];
                          return ['irr', 'npv', 'payback_period'].includes(metricName) && 
                                 ['fair', 'poor'].includes(getMetricStatus(metricName, metrics[metricName]).status);
                        }).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Needs Attention</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Recommendations:</h4>
                    <div className="space-y-2">
                      {(metrics.irr || 0) < 15 && (
                        <div className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <span>IRR below 15% - Consider optimizing credit pricing or reducing costs</span>
                        </div>
                      )}
                      {(metrics.npv || 0) < 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <span>Negative NPV - Project may not be financially viable at current assumptions</span>
                        </div>
                      )}
                      {(metrics.payback_period || 0) > 7 && (
                        <div className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <span>Long payback period - Investors may prefer faster capital recovery</span>
                        </div>
                      )}
                      {(metrics.irr || 0) >= 20 && (metrics.npv || 0) > 1000000 && (
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>Strong financial performance - Project shows excellent investment potential</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </FinancialPlatformLayout>
  );
};

export default FinancialMetrics;