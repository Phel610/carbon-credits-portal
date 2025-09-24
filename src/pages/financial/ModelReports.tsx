import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Eye,
  FileText,
  TrendingUp,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReportPreview from '@/components/financial/ReportPreview';

interface FinancialModel {
  id: string;
  name: string;
  project_name?: string;
  country?: string;
  start_year: number;
  end_year: number;
  status: string;
}

const ModelReports = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [model, setModel] = useState<FinancialModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewReport, setPreviewReport] = useState<'standard' | 'ai-assisted' | null>(null);

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

  const handlePreviewReport = (reportType: 'standard' | 'ai-assisted') => {
    setPreviewReport(reportType);
  };

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading reports...</div>
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
    <>
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
              Back to Model Overview
            </Button>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{model.name} - Reports</h1>
            <p className="text-muted-foreground">
              Generate comprehensive PDF reports with preview functionality
            </p>
          </div>

          {/* Report Types */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Standard PDF Report */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Standard PDF Report
                </CardTitle>
                <CardDescription>
                  Classic financial model output without AI explanations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Includes:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Project overview and key assumptions</li>
                    <li>• Complete financial statements</li>
                    <li>• Financial metrics (NPV, IRR, payback)</li>
                    <li>• Sensitivity & scenario analysis</li>
                    <li>• Charts and visualizations</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handlePreviewReport('standard')}
                    className="flex-1"
                    variant="outline"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI-Assisted PDF Report */}
            <Card className="relative border-primary/20">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI-Assisted PDF Report
                </CardTitle>
                <CardDescription>
                  Enhanced report with AI-generated commentary and insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Everything in Standard Report plus:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• AI-generated executive summary</li>
                    <li>• Automated risk assessment</li>
                    <li>• Plain English scenario explanations</li>
                    <li>• Investor-focused highlights</li>
                    <li>• Intelligent insights and recommendations</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handlePreviewReport('ai-assisted')}
                    className="flex-1"
                    variant="outline"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                What's Included in Every Report
              </CardTitle>
              <CardDescription>
                Comprehensive financial analysis for carbon credit projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Financial Statements</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Complete Income Statement</li>
                    <li>• Full Balance Sheet</li>
                    <li>• Cash Flow Statement</li>
                    <li>• All key financial metrics</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Analysis</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sensitivity analysis</li>
                    <li>• Scenario comparisons</li>
                    <li>• Key performance indicators</li>
                    <li>• Investment returns</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Visualizations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Revenue breakdown charts</li>
                    <li>• Cash flow waterfall</li>
                    <li>• Expense composition</li>
                    <li>• Performance dashboards</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Notes */}
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Preview Before Download</p>
                  <p className="text-sm text-muted-foreground">
                    Review the complete report content before generating your PDF. Make sure all data looks correct and adjust inputs if needed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FinancialPlatformLayout>

      {/* Report Preview Modal */}
      {previewReport && model && (
        <ReportPreview
          modelId={id!}
          reportType={previewReport}
          modelData={model}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </>
  );
};

export default ModelReports;