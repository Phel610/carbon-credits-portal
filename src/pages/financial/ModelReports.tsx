import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Download,
  FileText,
  PieChart,
  TrendingUp,
  Printer,
  Mail,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  const handleDownloadReport = (reportType: string) => {
    toast({
      title: "Report Generation",
      description: `${reportType} report generation will be available soon.`,
    });
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
            Generate comprehensive reports and investor presentations for your financial model
          </p>
        </div>

        {/* Report Types */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Executive Summary Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Executive Summary
              </CardTitle>
              <CardDescription>
                High-level overview with key financial metrics and investment highlights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Includes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Project overview and key assumptions</li>
                  <li>• Financial highlights (NPV, IRR, payback)</li>
                  <li>• Revenue and cost projections</li>
                  <li>• Investment summary</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleDownloadReport('Executive Summary')}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadReport('Executive Summary')}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Financial Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Detailed Financial Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive financial statements and detailed analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Includes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete financial statements</li>
                  <li>• Cash flow analysis</li>
                  <li>• Sensitivity analysis results</li>
                  <li>• Risk assessment</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleDownloadReport('Detailed Financial Analysis')}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadReport('Detailed Financial Analysis')}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Investor Presentation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Investor Presentation
              </CardTitle>
              <CardDescription>
                Professional slide deck for investor meetings and presentations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Includes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Executive summary slides</li>
                  <li>• Financial charts and graphs</li>
                  <li>• Market opportunity analysis</li>
                  <li>• Investment proposition</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleDownloadReport('Investor Presentation')}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PPT
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadReport('Investor Presentation')}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Raw Data Export
              </CardTitle>
              <CardDescription>
                Export model data for further analysis in Excel or other tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Available formats:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Excel workbook (.xlsx)</li>
                  <li>• CSV files (comma separated)</li>
                  <li>• JSON data format</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleDownloadReport('Excel Export')}
                  variant="outline" 
                  className="flex-1"
                >
                  Excel
                </Button>
                <Button 
                  onClick={() => handleDownloadReport('CSV Export')}
                  variant="outline" 
                  className="flex-1"
                >
                  CSV
                </Button>
                <Button 
                  onClick={() => handleDownloadReport('JSON Export')}
                  variant="outline" 
                  className="flex-1"
                >
                  JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Report Customization</CardTitle>
            <CardDescription>
              Customize report content and branding (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium">Branding</h4>
                <p className="text-sm text-muted-foreground">
                  Add your company logo and colors
                </p>
                <Button variant="outline" size="sm" disabled>
                  <Mail className="mr-2 h-4 w-4" />
                  Setup Branding
                </Button>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Content Sections</h4>
                <p className="text-sm text-muted-foreground">
                  Choose which sections to include
                </p>
                <Button variant="outline" size="sm" disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  Customize Sections
                </Button>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Auto-Generation</h4>
                <p className="text-sm text-muted-foreground">
                  Schedule automatic report updates
                </p>
                <Button variant="outline" size="sm" disabled>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Setup Auto-Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancialPlatformLayout>
  );
};

export default ModelReports;