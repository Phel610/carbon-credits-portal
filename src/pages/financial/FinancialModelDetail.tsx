import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Calculator,
  FileText,
  TrendingUp,
  Settings,
  BarChart3,
  DollarSign,
  Globe,
  Calendar,
  Edit,
  Download,
  CheckCircle,
  Circle,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FinancialModel {
  id: string;
  name: string;
  description?: string;
  country?: string;
  project_name?: string;
  start_year: number;
  end_year: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const FinancialModelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [model, setModel] = useState<FinancialModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [completionStatus, setCompletionStatus] = useState({
    inputs: false,
    statements: false,
    metrics: false,
    scenarios: false,
    reports: false,
  });

  useEffect(() => {
    if (id) {
      fetchModel();
    }
  }, [id, user]);

  const fetchModel = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('financial_models')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: "Error fetching model",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setModel(data);
      await checkCompletionStatus(id);
    } catch (error) {
      console.error('Error fetching model:', error);
      toast({
        title: "Error",
        description: "Failed to load financial model",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkCompletionStatus = async (modelId: string) => {
    try {
      // Check for inputs
      const { data: inputs } = await supabase
        .from('model_inputs')
        .select('id')
        .eq('model_id', modelId)
        .limit(1);

      // Check for statements
      const { data: statements } = await supabase
        .from('financial_statements')
        .select('id')
        .eq('model_id', modelId)
        .limit(1);

      // Check for metrics
      const { data: metrics } = await supabase
        .from('financial_metrics')
        .select('id')
        .eq('model_id', modelId)
        .limit(1);

      // Check for scenarios
      const { data: scenarios } = await supabase
        .from('model_scenarios')
        .select('id')
        .eq('model_id', modelId)
        .limit(1);

      setCompletionStatus({
        inputs: (inputs && inputs.length > 0) || false,
        statements: (statements && statements.length > 0) || false,
        metrics: (metrics && metrics.length > 0) || false,
        scenarios: (scenarios && scenarios.length > 0) || false,
        reports: false, // Reports are generated, so we'll mark as complete when other steps are done
      });
    } catch (error) {
      console.error('Error checking completion status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'in_progress':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading financial model...</div>
        </div>
      </FinancialPlatformLayout>
    );
  }

  if (!model) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Model not found</h2>
            <p className="text-muted-foreground mb-4">The financial model you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/financial/models">Back to Models</Link>
            </Button>
          </div>
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
            onClick={() => navigate('/financial/models')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Models
          </Button>
        </div>

        {/* Model Info */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{model.name}</h1>
              <Badge className={getStatusColor(model.status)}>
                {model.status.replace('_', ' ')}
              </Badge>
            </div>
            {model.project_name && (
              <p className="text-lg text-muted-foreground font-medium">{model.project_name}</p>
            )}
            {model.description && (
              <p className="text-muted-foreground max-w-2xl">{model.description}</p>
            )}
            
            <div className="flex items-center gap-6 pt-2">
              {model.country && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{model.country}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{model.start_year} - {model.end_year} ({model.end_year - model.start_year + 1} years)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Model Status</CardDescription>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {model.status.replace('_', ' ')}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Projection Period</CardDescription>
              <CardTitle className="text-xl">
                {model.end_year - model.start_year + 1} Years
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completion</CardDescription>
              <CardTitle className="text-xl">
                {Math.round((Object.values(completionStatus).filter(Boolean).length / 5) * 100)}%
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last Updated</CardDescription>
              <CardTitle className="text-xl">
                {new Date(model.updated_at).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Guided Workflow */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Model Workflow</CardTitle>
            <CardDescription>
              Follow these steps to build and analyze your financial model
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round((Object.values(completionStatus).filter(Boolean).length / 5) * 100)}%</span>
              </div>
              <Progress 
                value={Math.round((Object.values(completionStatus).filter(Boolean).length / 5) * 100)} 
                className="h-2"
              />
            </div>

            {/* Workflow Steps */}
            <div className="space-y-4">
              {/* Step 1: Inputs */}
              <div className={`flex items-center p-4 rounded-lg border transition-colors ${
                completionStatus.inputs ? 'border-success bg-success/5' : 'border-border'
              }`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Model Inputs</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter operational metrics, expenses, and financing assumptions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionStatus.inputs ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Button asChild variant={completionStatus.inputs ? "outline" : "default"} size="sm">
                      <Link to={`/financial/models/${id}/inputs`}>
                        <FileText className="mr-2 h-4 w-4" />
                        {completionStatus.inputs ? 'Review Inputs' : 'Enter Inputs'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2: Financial Statements */}
              <div className={`flex items-center p-4 rounded-lg border transition-colors ${
                completionStatus.statements ? 'border-success bg-success/5' : 
                !completionStatus.inputs ? 'border-border bg-muted/20' : 'border-border'
              }`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Financial Statements</h4>
                    <p className="text-sm text-muted-foreground">
                      Auto-generated income statement, balance sheet, and cash flow
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionStatus.statements ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Button 
                      asChild 
                      variant={completionStatus.statements ? "outline" : "default"} 
                      size="sm"
                      disabled={!completionStatus.inputs}
                    >
                      <Link to={`/financial/models/${id}/statements`}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {completionStatus.statements ? 'Review Statements' : 'Generate Statements'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 3: Financial Metrics */}
              <div className={`flex items-center p-4 rounded-lg border transition-colors ${
                completionStatus.metrics ? 'border-success bg-success/5' : 
                !completionStatus.statements ? 'border-border bg-muted/20' : 'border-border'
              }`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Financial Metrics</h4>
                    <p className="text-sm text-muted-foreground">
                      NPV, IRR, payback period and other key performance indicators
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionStatus.metrics ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Button 
                      asChild 
                      variant={completionStatus.metrics ? "outline" : "default"} 
                      size="sm"
                      disabled={!completionStatus.statements}
                    >
                      <Link to={`/financial/models/${id}/metrics`}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        {completionStatus.metrics ? 'Review Metrics' : 'Calculate Metrics'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 4: Sensitivity & Scenarios */}
              <div className={`flex items-center p-4 rounded-lg border transition-colors ${
                completionStatus.scenarios ? 'border-success bg-success/5' : 
                !completionStatus.metrics ? 'border-border bg-muted/20' : 'border-border'
              }`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Sensitivity & Scenarios</h4>
                    <p className="text-sm text-muted-foreground">
                      Test different assumptions and create scenario analyses
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionStatus.scenarios ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Button 
                      asChild 
                      variant={completionStatus.scenarios ? "outline" : "default"} 
                      size="sm"
                      disabled={!completionStatus.metrics}
                    >
                      <Link to={`/financial/models/${id}/scenarios`}>
                        <Settings className="mr-2 h-4 w-4" />
                        {completionStatus.scenarios ? 'Review Scenarios' : 'Create Scenarios'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 5: Reports */}
              <div className={`flex items-center p-4 rounded-lg border transition-colors ${
                completionStatus.reports ? 'border-success bg-success/5' : 
                !completionStatus.scenarios ? 'border-border bg-muted/20' : 'border-border'
              }`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    5
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate comprehensive reports and investor presentations
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionStatus.reports ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Button 
                      asChild 
                      variant={completionStatus.reports ? "outline" : "default"} 
                      size="sm"
                      disabled={!completionStatus.scenarios}
                    >
                      <Link to={`/financial/models/${id}/reports`}>
                        <Download className="mr-2 h-4 w-4" />
                        View Reports
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancialPlatformLayout>
  );
};

export default FinancialModelDetail;