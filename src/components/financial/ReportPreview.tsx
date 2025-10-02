import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2, FileText, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
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
  const [modelInputs, setModelInputs] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [comprehensiveMetrics, setComprehensiveMetrics] = useState<any>(null);
  
  // Dynamic imports for table components to avoid module resolution issues
  const [IncomeStatementTable, setIncomeStatementTable] = useState<any>(null);
  const [BalanceSheetTable, setBalanceSheetTable] = useState<any>(null);
  const [CashFlowStatementTable, setCashFlowStatementTable] = useState<any>(null);
  const [DebtScheduleTable, setDebtScheduleTable] = useState<any>(null);
  const [FreeCashFlowTable, setFreeCashFlowTable] = useState<any>(null);
  const [CarbonStreamTable, setCarbonStreamTable] = useState<any>(null);

  useEffect(() => {
    // Load table components dynamically
    const loadComponents = async () => {
      try {
        const [incomeModule, balanceModule, cashFlowModule, debtModule, fcfModule, carbonModule] = await Promise.all([
          import('./IncomeStatementTable'),
          import('./BalanceSheetTable'),
          import('./CashFlowStatementTable'),
          import('./DebtScheduleTable'),
          import('./FreeCashFlowTable'),
          import('./CarbonStreamTable')
        ]);
        
        setIncomeStatementTable(() => incomeModule.default);
        setBalanceSheetTable(() => balanceModule.default);
        setCashFlowStatementTable(() => cashFlowModule.default);
        setDebtScheduleTable(() => debtModule.default);
        setFreeCashFlowTable(() => fcfModule.default);
        setCarbonStreamTable(() => carbonModule.default);
      } catch (error) {
        console.error('Failed to load table components:', error);
        toast({
          title: "Warning",
          description: "Some table components failed to load",
          variant: "destructive",
        });
      }
    };
    
    loadComponents();
  }, []);

  useEffect(() => {
    if (modelId) {
      fetchReportData();
    }
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
      const engine = new FinancialCalculationEngine(transformedInputs);
      const results = engine.calculateFinancialStatements();
      setFinancialData(results);

      // Fetch saved scenarios
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('model_scenarios')
        .select('*')
        .eq('model_id', modelId)
        .is('deleted_at', null);

      if (scenariosError) throw scenariosError;
      
      // Process scenarios with their metrics
      const processedScenarios = scenariosData?.map(scenario => {
        const scenarioData = scenario.scenario_data as any;
        const scenarioEngine = new FinancialCalculationEngine(scenarioData);
        const scenarioResults = scenarioEngine.calculateFinancialStatements();
        
        return {
          scenario_name: scenario.scenario_name,
          is_base_case: scenario.is_base_case || false,
          notes: scenario.notes,
          probability: scenarioData.probability || 0,
          metrics: {
            equityNPV: scenarioResults.metrics?.npv_equity || 0,
            equityIRR: (scenarioResults.metrics?.irr_equity || 0) / 100, // Convert from percentage
            projectNPV: scenarioResults.metrics?.npv_equity || 0, // Use equity NPV as fallback
          },
          changes: [],
        };
      }) || [];
      
      setScenarios(processedScenarios);

      // Build comprehensive metrics from basic metrics
      setComprehensiveMetrics({
        returns: {
          equity: {
            npv: results.metrics?.npv_equity || 0,
            irr: (results.metrics?.irr_equity || 0) / 100, // Convert from percentage
            payback: null,
            discountedPayback: null,
            mirr: null,
            cumulativeNPV: [],
          },
          project: {
            npv: results.metrics?.npv_equity || 0,
            irr: (results.metrics?.irr_equity || 0) / 100,
            payback: null,
            discountedPayback: null,
            mirr: null,
            cumulativeNPV: [],
          },
          investor: {
            npv: 0,
            irr: null,
          },
        },
        debt: {
          yearly: [],
          minDSCR: results.metrics?.min_dscr || null,
          minDSCRYear: null,
          debtAmortizesBy: null,
        },
        liquidity: {
          yearly: [],
        },
        profitability: {
          yearly: [],
          total: {
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            opex: 0,
            ebitda: 0,
            netIncome: 0,
          },
        },
        unitEconomics: {
          yearly: [],
          total: {
            totalIssued: 0,
            avgWaPrice: null,
            avgCogsPerCredit: null,
            avgLcoc: null,
          },
        },
        workingCapital: {
          yearly: [],
        },
        cashHealth: {
          yearly: [],
          minCashEnd: results.metrics?.ending_cash || 0,
          minCashYear: 0,
          peakFunding: 0,
        },
        carbonKPIs: {
          yearly: [],
          impliedPPPrice: null,
          totalGenerated: 0,
          totalIssued: 0,
        },
        breakEven: {
          yearly: [],
        },
        compliance: {
          yearly: [],
          overallPass: true,
        },
      });

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
      // Validate that all required financial data exists
      if (!data.metrics || !data.incomeStatements || !data.cashFlowStatements) {
        throw new Error('Missing required financial data for AI commentary');
      }

      console.log('Sending financial data to AI:', {
        npv: data.metrics.npv,
        irr: data.metrics.irr,
        paybackPeriod: data.metrics.payback_period
      });

      const { data: commentary, error } = await supabase.functions.invoke('generate-ai-report-commentary', {
        body: {
          financialData: {
            projectName: modelData.project_name || modelData.name,
            country: modelData.country || 'Unknown',
            startYear: modelData.start_year,
            endYear: modelData.end_year,
            totalNPV: data.metrics.npv || 0,
            projectIRR: data.metrics.company_irr || 0,
            paybackPeriod: data.metrics.payback_period || 0,
            totalRevenue: data.incomeStatements.reduce((sum: number, stmt: any) => sum + (stmt.total_revenue || 0), 0),
            totalCosts: data.incomeStatements.reduce((sum: number, stmt: any) => sum + Math.abs(stmt.total_opex || 0), 0),
            netIncome: data.incomeStatements.reduce((sum: number, stmt: any) => sum + (stmt.net_income || 0), 0),
            peakFunding: Math.abs(Math.min(...data.cashFlowStatements.map((stmt: any) => stmt.cash_end || 0))),
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

  const transformInputsToModelData = (inputs: any[]): any => {
    const years = Array.from({ length: modelData.end_year - modelData.start_year + 1 }, (_, i) => modelData.start_year + i);
    
    const transformed = {
      years,
      // Operational metrics
      credits_generated: [10000, 12000, 15000, 18000, 20000].slice(0, years.length),
      price_per_credit: [15, 16, 17, 18, 19].slice(0, years.length),
      issuance_flag: [0, 1, 1, 1, 1].slice(0, years.length),
      
      // Expenses (negative per Excel convention)
      cogs_rate: 0.15,
      feasibility_costs: [-50000, 0, 0, 0, 0].slice(0, years.length),
      pdd_costs: [-75000, 0, 0, 0, 0].slice(0, years.length),
      mrv_costs: [-40000, -15000, -15000, -15000, -15000].slice(0, years.length),
      staff_costs: [-100000, -100000, -100000, -100000, -100000].slice(0, years.length),
      depreciation: [-10000, -10000, -10000, -10000, -10000].slice(0, years.length),
      income_tax_rate: 0.25,
      
      // Working capital rates
      ar_rate: 0.05,
      ap_rate: 0.10,
      
      // CAPEX and financing
      capex: [-200000, -100000, 0, 0, 0].slice(0, years.length),
      equity_injection: [500000, 0, 0, 0, 0].slice(0, years.length),
      interest_rate: 0.08,
      debt_duration_years: 5,
      debt_draw: [300000, 0, 0, 0, 0].slice(0, years.length),
      
      // Pre-purchase agreements
      purchase_amount: [0, 50000, 0, 0, 0].slice(0, years.length),
      purchase_share: 0.30,
      
      // Returns
      discount_rate: 0.12,
      initial_equity_t0: 100000,
    };

    // TODO: Parse actual inputs from database to override defaults
    console.log('Using default financial data for report preview:', transformed);
    return transformed;
  };

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      await generatePDF(
        financialData, 
        modelData, 
        reportType, 
        modelInputs,
        scenarios,
        comprehensiveMetrics,
        aiCommentary || undefined
      );
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
                      {(financialData.metrics.company_irr * 100).toFixed(1)}%
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
                      {financialData.metrics.ebitda_margin.toFixed(1)}%
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
                {IncomeStatementTable ? (
                  <IncomeStatementTable statements={financialData.incomeStatements || []} />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground">Loading Income Statement component...</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Balance Sheet</h3>
                {BalanceSheetTable ? (
                  <BalanceSheetTable statements={financialData.balanceSheets || []} />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground">Loading Balance Sheet component...</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Cash Flow Statement</h3>
                {CashFlowStatementTable ? (
                  <CashFlowStatementTable statements={financialData.cashFlowStatements || []} />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground">Loading Cash Flow component...</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Debt Schedule</h3>
                {DebtScheduleTable ? (
                  <DebtScheduleTable statements={financialData.debtSchedule || []} />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground">Loading Debt Schedule component...</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Carbon Stream</h3>
                {CarbonStreamTable ? (
                  <CarbonStreamTable statements={financialData.carbonStream || []} investorIRR={comprehensiveMetrics?.returns?.equityIRR || 0} />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground">Loading Carbon Stream component...</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Free Cash Flow to Equity</h3>
                {FreeCashFlowTable ? (
                  <FreeCashFlowTable statements={financialData.freeCashFlow || []} />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground">Loading Free Cash Flow component...</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* Comprehensive Metrics Display */}
          {comprehensiveMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Comprehensive Metrics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      ${(comprehensiveMetrics.returns?.equity?.npv || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Equity NPV</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {((comprehensiveMetrics.returns?.equity?.irr || 0) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Equity IRR</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      ${(comprehensiveMetrics.returns?.project?.npv || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Project NPV</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {((comprehensiveMetrics.returns?.project?.irr || 0) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Project IRR</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scenarios Display */}
          {scenarios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Saved Scenarios ({scenarios.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scenarios.map((scenario, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{scenario.scenario_name}</h4>
                        {scenario.is_base_case && (
                          <Badge variant="secondary">Base Case</Badge>
                        )}
                      </div>
                      {scenario.probability > 0 && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Probability: {(scenario.probability * 100).toFixed(0)}%
                        </p>
                      )}
                      {scenario.metrics && (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Equity NPV: </span>
                            <span className="font-medium">${(scenario.metrics.equityNPV || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Equity IRR: </span>
                            <span className="font-medium">{((scenario.metrics.equityIRR || 0) * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Project NPV: </span>
                            <span className="font-medium">${(scenario.metrics.projectNPV || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                      {scenario.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">{scenario.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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