import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download,
  Bot,
  BarChart3,
  Calculator,
  Calendar,
  Globe,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ReportsGuide } from '@/components/help/ReportsGuide';
import { HelpCircle } from 'lucide-react';

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
}

const FinancialReports = () => {
  const { user } = useAuth();
  const [models, setModels] = useState<FinancialModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    fetchModels();
  }, [user]);

  const fetchModels = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching models",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setModels(data || []);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({
        title: "Error",
        description: "Failed to load financial models",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateStandardReport = async (modelId: string, modelName: string) => {
    setGeneratingReport(modelId);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Report generated successfully",
        description: `Standard PDF report for ${modelName} is ready for download.`,
      });
      
      // In a real implementation, this would trigger PDF download
      console.log(`Generating standard report for model ${modelId}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report generation failed",
        description: "Failed to generate the PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const generateAIReport = async (modelId: string, modelName: string) => {
    setGeneratingReport(modelId);
    try {
      // Simulate AI-assisted report generation (longer process)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      toast({
        title: "AI-assisted report generated",
        description: `AI-enhanced PDF report for ${modelName} is ready for download.`,
      });
      
      // In a real implementation, this would trigger PDF download
      console.log(`Generating AI-assisted report for model ${modelId}`);
    } catch (error) {
      console.error('Error generating AI report:', error);
      toast({
        title: "AI report generation failed",
        description: "Failed to generate the AI-assisted report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(null);
    }
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

  return (
    <FinancialPlatformLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
            <p className="text-muted-foreground">
              Generate comprehensive PDF reports for your carbon project financial models.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowGuide(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Help Guide
          </Button>
        </div>

        {/* Report Types Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Standard PDF Report
              </CardTitle>
              <CardDescription>
                Classic financial model output with comprehensive data tables and charts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium mb-2">Includes:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Project overview and assumptions</li>
                    <li>Complete financial statements (10+ years)</li>
                    <li>Key financial metrics (NPV, IRR, payback)</li>
                    <li>Sensitivity analysis tables</li>
                    <li>Professional charts and visualizations</li>
                  </ul>
                </div>
                <Badge variant="outline" className="bg-muted">
                  Professional Grade • Investor Ready
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI-Assisted Report
              </CardTitle>
              <CardDescription>
                Everything in Standard Report plus AI-generated insights and commentary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium mb-2">Additional AI Features:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Executive summary in plain English</li>
                    <li>Risk assessment and flags</li>
                    <li>Scenario commentary and insights</li>
                    <li>Investor-focused highlights</li>
                    <li>Recommendations and mitigations</li>
                  </ul>
                </div>
                <Badge variant="outline" className="bg-trust/10 text-trust border-trust">
                  AI-Enhanced • Strategic Insights
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Models List */}
        {models.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Financial Models</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create and complete financial models to generate comprehensive PDF reports for your investors.
              </p>
              <Button asChild className="bg-trust hover:bg-trust/90">
                <Link to="/financial/models/new">
                  <Calculator className="mr-2 h-4 w-4" />
                  Create Your First Model
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Available Models for Reporting</CardTitle>
              <CardDescription>
                Select a financial model to generate professional PDF reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{model.name}</h3>
                          <Badge variant={model.status === 'completed' ? 'default' : 'secondary'}>
                            {model.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {model.project_name && (
                          <p className="text-muted-foreground font-medium">{model.project_name}</p>
                        )}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          {model.country && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span>{model.country}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{model.start_year} - {model.end_year}</span>
                          </div>
                        </div>
                        {model.description && (
                          <p className="text-sm text-muted-foreground">{model.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t">
                      <Button 
                        onClick={() => generateStandardReport(model.id, model.name)}
                        disabled={generatingReport === model.id}
                        variant="outline"
                        className="flex-1"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {generatingReport === model.id ? 'Generating...' : 'Standard Report'}
                      </Button>
                      
                      <Button 
                        onClick={() => generateAIReport(model.id, model.name)}
                        disabled={generatingReport === model.id}
                        className="flex-1 bg-trust hover:bg-trust/90"
                      >
                        {generatingReport === model.id ? (
                          <Zap className="mr-2 h-4 w-4 animate-pulse" />
                        ) : (
                          <Bot className="mr-2 h-4 w-4" />
                        )}
                        {generatingReport === model.id ? 'Generating AI Report...' : 'AI-Assisted Report'}
                      </Button>
                      
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/financial/models/${model.id}`}>
                          View Model
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Reports</CardTitle>
            <CardDescription>
              Preview examples of our financial report formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-4 text-center space-y-3">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Amazon Reforestation</h4>
                  <p className="text-sm text-muted-foreground">Standard Report Sample</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  View Sample
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 text-center space-y-3">
                <Bot className="h-8 w-8 mx-auto text-trust" />
                <div>
                  <h4 className="font-medium">Mangrove Restoration</h4>
                  <p className="text-sm text-muted-foreground">AI-Enhanced Sample</p>
                </div>
                <Button variant="outline" size="sm" className="w-full border-trust text-trust hover:bg-trust/10">
                  <Download className="mr-2 h-4 w-4" />
                  View AI Sample
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 text-center space-y-3">
                <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Report Template</h4>
                  <p className="text-sm text-muted-foreground">Blank Template</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Features */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included in Every Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Financial Analysis
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete 3-statement model</li>
                  <li>• NPV, IRR, and payback calculations</li>
                  <li>• EBITDA and margin analysis</li>
                  <li>• Free cash flow projections</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Charts & Visuals
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Revenue and expense breakdown</li>
                  <li>• Cash flow waterfall charts</li>
                  <li>• Scenario comparison graphs</li>
                  <li>• Sensitivity analysis heatmaps</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Professional Format
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Investor-ready presentation</li>
                  <li>• Executive summary</li>
                  <li>• Detailed assumptions log</li>
                  <li>• Print-ready PDF format</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ReportsGuide open={showGuide} onOpenChange={setShowGuide} />
    </FinancialPlatformLayout>
  );
};

export default FinancialReports;