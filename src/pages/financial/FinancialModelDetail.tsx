import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Download
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
  const [activeTab, setActiveTab] = useState('overview');

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
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Model
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="statements">Statements</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  <CardTitle className="text-xl">0%</CardTitle>
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

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Get Started</CardTitle>
                  <CardDescription>
                    Begin building your financial model by entering key inputs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
            <Button asChild className="w-full" variant="outline">
              <Link to={`/financial/models/${id}/inputs`}>
                <FileText className="mr-2 h-4 w-4" />
                Enter Model Inputs
              </Link>
            </Button>
                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/financial/models/${id}/statements`}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Financial Statements
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis & Reports</CardTitle>
                  <CardDescription>
                    Analyze performance and generate investor reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/financial/models/${id}/metrics`}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Financial Metrics
                    </Link>
                  </Button>
                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/financial/models/${id}/scenarios`}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Scenario Analysis
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inputs Tab */}
          <TabsContent value="inputs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Inputs</CardTitle>
                <CardDescription>
                  Configure all input parameters for your financial model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Input Forms Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Input forms for operational metrics, expenses, and financing will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statements Tab */}
          <TabsContent value="statements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Statements</CardTitle>
                <CardDescription>
                  Auto-calculated income statement, balance sheet, and cash flow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Financial Statements</h3>
                  <p className="text-muted-foreground">
                    Financial statements will be automatically generated based on your inputs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators and financial ratios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Financial Metrics</h3>
                  <p className="text-muted-foreground">
                    NPV, IRR, payback period and other key metrics will be calculated here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scenario Analysis</CardTitle>
                <CardDescription>
                  Test different assumptions and sensitivity analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Scenario Analysis</h3>
                  <p className="text-muted-foreground">
                    Create and compare different scenarios for your financial model.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FinancialPlatformLayout>
  );
};

export default FinancialModelDetail;