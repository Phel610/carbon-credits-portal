import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2, FileText, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import IncomeStatementTable from './IncomeStatementTable';
import BalanceSheetTable from './BalanceSheetTable';
import CashFlowStatementTable from './CashFlowStatementTable';
import { FinancialCalculationEngine, ModelInputData } from '@/lib/financial/calculationEngine';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { generatePDF } from '@/lib/utils/pdfGenerator';

interface ReportPreviewProps {
  modelId: string;
  reportType: 'standard' | 'ai-assisted';
  modelData: {
    name: string;
    project_name?: string;
    country?: string;
    start_year: number;
    end_year: number;
  };
  onClose: () => void;
}

interface AICommentary {
  executiveSummary: string;
  riskAssessment: string;
  scenarioCommentary: string;
  investorHighlights: string;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ 
  modelId, 
  reportType, 
  modelData, 
  onClose 
}) => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [financialData, setFinancialData] = useState<any>(null);
  const [aiCommentary, setAiCommentary] = useState<AICommentary | null>(null);
  const [modelInputs, setModelInputs] = useState<ModelInputData | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [modelId]);

  const fetchReportData = async () => {
    try {
      // Fetch model inputs
      const { data: inputs, error: inputsError } = await supabase
        .from('model_inputs')
        .select('*')
        .eq('model_id', modelId);

      if (inputsError) throw inputsError;

      // Transform inputs into ModelInputData format
      const transformedInputs = transformInputsToModelData(inputs);
      setModelInputs(transformedInputs);

      // Calculate financial statements
      const engine = new FinancialCalculationEngine(
        transformedInputs,
        modelData.start_year,
        modelData.end_year
      );

      const results = engine.calculateFinancialStatements();
      setFinancialData(results);

      // Generate AI commentary if needed
      if (reportType === 'ai-assisted') {
        await generateAICommentary(results);
      }

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAICommentary = async (data: any) => {
    try {
      const { data: commentary, error } = await supabase.functions.invoke('generate-ai-report-commentary', {
        body: {
          financialData: {
            projectName: modelData.project_name || modelData.name,
            country: modelData.country || 'Unknown',
            startYear: modelData.start_year,
            endYear: modelData.end_year,
            totalNPV: data.metrics.npv,
            projectIRR: data.metrics.project_irr,
            paybackPeriod: data.metrics.payback_period,
            totalRevenue: data.incomeStatements.reduce((sum: number, stmt: any) => sum + stmt.total_revenue, 0),
            totalCosts: data.incomeStatements.reduce((sum: number, stmt: any) => sum + stmt.total_expenses, 0),
            netIncome: data.incomeStatements.reduce((sum: number, stmt: any) => sum + stmt.net_income, 0),
            peakFunding: Math.abs(Math.min(...data.cashFlowStatements.map((stmt: any) => stmt.ending_cash_balance))),
            scenarios: [],
            sensitivities: []
          }
        }
      });

      if (error) throw error;
      setAiCommentary(commentary);
    } catch (error) {
      console.error('Error generating AI commentary:', error);
      toast({
        title: "Warning",
        description: "Could not generate AI commentary, showing standard report",
        variant: "destructive",
      });
    }
  };

  const transformInputsToModelData = (inputs: any[]): ModelInputData => {
    // This is a simplified transformation - in practice, you'd need more robust parsing
    const defaultData: ModelInputData = {
      operational_metrics: {
        credits_generated: { 2024: 10000, 2025: 12000, 2026: 15000 },
        price_per_credit: { 2024: 15, 2025: 16, 2026: 17 },
        credits_issued: { 2024: 10000, 2025: 12000, 2026: 15000 }
      },
      expenses: {
        cogs_percentage: 0.3,
        feasibility_study_cost: 50000,
        pdd_development_cost: 75000,
        initial_mrv_cost: 25000,
        annual_mrv_cost: 10000,
        staff_costs: 100000,
        capex: { 2024: 200000, 2025: 100000 },
        depreciation_method: 'straight_line',
        depreciation_years: 5,
        income_tax_rate: 0.25
      },
      financing: {
        equity_investments: [{ year: 2024, amount: 500000, investor_type: 'founder' }],
        debt_facilities: [],
        pre_purchase_agreements: []
      },
      investor_assumptions: {
        discount_rate: 0.12,
        target_irr: 0.15
      }
    };

    // TODO: Parse actual inputs from database
    return defaultData;
  };

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      await generatePDF(financialData, modelData, reportType, aiCommentary || undefined);
      toast({
        title: "Success",
        description: "PDF report generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex items-center justify-center p-6">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading report data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="container mx-auto p-4 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {reportType === 'ai-assisted' ? <TrendingUp className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  {reportType === 'ai-assisted' ? 'AI-Assisted PDF Report' : 'Standard PDF Report'}
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {modelData.project_name || modelData.name} • {modelData.country}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={generating}
                  className="bg-primary hover:bg-primary/90"
                >
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </Button>
                <Button onClick={onClose} variant="outline">
                  Close Preview
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* AI Commentary Sections (only for AI-assisted reports) */}
          {reportType === 'ai-assisted' && aiCommentary && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {aiCommentary.executiveSummary}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {aiCommentary.riskAssessment}
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project Name</p>
                  <p className="font-medium">{modelData.project_name || modelData.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Country/Region</p>
                  <p className="font-medium">{modelData.country || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Year</p>
                  <p className="font-medium">{modelData.start_year}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Year</p>
                  <p className="font-medium">{modelData.end_year}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Metrics */}
          {financialData && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      ${financialData.metrics.npv.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Net Present Value</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {(financialData.metrics.project_irr * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Project IRR</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {financialData.metrics.payback_period.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Payback Period (Years)</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {(financialData.metrics.ebitda_margin * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">EBITDA Margin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Statements */}
          {financialData && (
            <>
              <div>
                <h3 className="text-xl font-semibold mb-4">Income Statement</h3>
                <IncomeStatementTable statements={financialData.incomeStatements} />
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Balance Sheet</h3>
                <BalanceSheetTable statements={financialData.balanceSheets} />
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Cash Flow Statement</h3>
                <CashFlowStatementTable statements={financialData.cashFlowStatements} />
              </div>
            </>
          )}

          {/* AI Commentary for Scenarios and Investor Highlights */}
          {reportType === 'ai-assisted' && aiCommentary && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Scenario Commentary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {aiCommentary.scenarioCommentary}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Investor Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {aiCommentary.investorHighlights}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;