import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2, FileText, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { FinancialCalculationEngine, ModelInputData } from '@/lib/financial/calculationEngine';
import { calculateComprehensiveMetrics } from '@/lib/financial/metricsCalculator';
import { YearlyFinancials } from '@/lib/financial/metricsTypes';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { generatePDF } from '@/lib/utils/pdfGenerator';
import OperationalMetricsPanel from './OperationalMetricsPanel';
import ExpensesPanel from './ExpensesPanel';
import FinancingPanel from './FinancingPanel';
import { TransposedTable } from '@/components/ui/transposed-table';

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

// Variable names mapping for display
const VARIABLE_NAMES: Record<string, string> = {
  'credits_generated': 'Credits Generated (Year 1)',
  'price_per_credit': 'Credit Price (Year 1)',
  'cogs_rate': 'COGS Rate',
  'staff_costs': 'Staff Costs (Year 1)',
  'mrv_costs': 'MRV Costs (Year 1)',
  'pdd_costs': 'PDD Costs (Year 1)',
  'feasibility_costs': 'Feasibility Costs (Year 1)',
  'capex': 'CAPEX (Total)',
  'depreciation': 'Depreciation (Year 1)',
  'discount_rate': 'Discount Rate (WACC)',
  'interest_rate': 'Interest Rate',
  'income_tax_rate': 'Income Tax Rate',
  'ar_rate': 'AR Rate',
  'ap_rate': 'AP Rate',
  'equity_injection': 'Equity Injection (Year 1)',
  'debt_draw': 'Debt Draw (Year 1)',
  'purchase_amount': 'Purchase Amount (Year 1)',
  'purchase_share': 'Purchase Share',
  'debt_duration_years': 'Debt Duration',
  'issuance_flag': 'Issuance Flag (Year 1)',
};

// Variable format types mapping
const VARIABLE_FORMATS: Record<string, 'currency' | 'percentage' | 'number'> = {
  'credits_generated': 'number',
  'price_per_credit': 'currency',
  'cogs_rate': 'percentage',
  'staff_costs': 'currency',
  'mrv_costs': 'currency',
  'pdd_costs': 'currency',
  'feasibility_costs': 'currency',
  'capex': 'currency',
  'depreciation': 'currency',
  'discount_rate': 'percentage',
  'interest_rate': 'percentage',
  'income_tax_rate': 'percentage',
  'ar_rate': 'percentage',
  'ap_rate': 'percentage',
  'equity_injection': 'currency',
  'debt_draw': 'currency',
  'purchase_amount': 'currency',
  'purchase_share': 'percentage',
  'debt_duration_years': 'number',
  'issuance_flag': 'number',
};

// Helper functions to format values for display
const formatVariableValue = (key: string, value: number): string => {
  const format = VARIABLE_FORMATS[key] || 'number';
  
  if (format === 'currency') {
    return `$${Math.round(value).toLocaleString()}`;
  }
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  return Math.round(value).toLocaleString();
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number | null, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) return "–";
  if (value === Infinity) return "∞";
  return `${value.toFixed(decimals)}%`;
};

const formatNumber = (value: number | null, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) return "–";
  if (value === Infinity) return "∞";
  return value.toFixed(decimals);
};

const formatIRR = (irr: number | null): string => {
  if (irr === null || typeof irr !== 'number' || isNaN(irr)) return "n/a";
  return formatPercent(irr * 100, 1);
};

const formatPayback = (pb: number | null): string => {
  if (pb === null || typeof pb !== 'number' || isNaN(pb)) return "> horizon";
  return `${pb.toFixed(1)} years`;
};

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
  const [rawInputsData, setRawInputsData] = useState<any[]>([]);
  const [yearlyFinancials, setYearlyFinancials] = useState<YearlyFinancials[]>([]);
  
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

      console.log('Fetched inputs from database:', inputs);

      if (!inputs || inputs.length === 0) {
        throw new Error('No model inputs found for this model');
      }

      // Validate input categories
      const categories = [...new Set(inputs.map(i => i.category))];
      console.log('Input categories found:', categories);
      
      const requiredCategories = ['operational_metrics', 'expenses', 'financing'];
      const missingCategories = requiredCategories.filter(c => !categories.includes(c));
      if (missingCategories.length > 0) {
        console.warn('Missing input categories:', missingCategories);
      }

      // Store raw inputs
      setRawInputsData(inputs || []);

      // Transform inputs into ModelInputData format
      const transformedInputs = transformInputsToModelData(inputs);
      console.log('Transformed inputs for engine:', transformedInputs);

      // Validate transformed inputs before calculation
      if (!transformedInputs.years || transformedInputs.years.length === 0) {
        throw new Error('No years defined in model inputs');
      }

      const requiredArrays = ['credits_generated', 'price_per_credit', 'issuance_flag'];
      for (const key of requiredArrays) {
        if (!transformedInputs[key] || transformedInputs[key].length !== transformedInputs.years.length) {
          console.error(`Invalid array for ${key}:`, transformedInputs[key]);
          throw new Error(`Invalid or missing array for ${key}. Expected ${transformedInputs.years.length} values.`);
        }
      }

      setModelInputs(transformedInputs);

      // Calculate financial statements using the engine
      let results;
      try {
        const engine = new FinancialCalculationEngine(transformedInputs);
        results = engine.calculateFinancialStatements();
        console.log('Financial statements calculated successfully');
        setFinancialData(results);
      } catch (calcError: any) {
        console.error('Calculation engine error:', calcError);
        console.log('Input data that caused error:', transformedInputs);
        throw new Error(`Failed to calculate financial statements: ${calcError.message}`);
      }

      // Calculate comprehensive metrics using metricsCalculator
      const yearlyFinancials: YearlyFinancials[] = results.incomeStatements.map((income: any, idx: number) => ({
        year: income.year,
        // Income Statement
        spotRevenue: income.spot_revenue || 0,
        prepurchaseRevenue: income.prepurchase_revenue || 0,
        totalRevenue: income.total_revenue || 0,
        cogs: income.cogs || 0,
        grossProfit: income.gross_profit || 0,
        feasibility: income.feasibility || 0,
        pdd: income.pdd || 0,
        mrv: income.mrv || 0,
        staff: income.staff || 0,
        opex: income.total_opex || 0,
        ebitda: income.ebitda || 0,
        depreciation: income.depreciation || 0,
        interest: income.interest_expense || 0,
        ebt: income.earnings_before_tax || 0,
        incomeTax: income.income_tax || 0,
        netIncome: income.net_income || 0,
        // Balance Sheet
        cash: results.balanceSheets[idx]?.cash || 0,
        accountsReceivable: results.balanceSheets[idx]?.accounts_receivable || 0,
        ppe: results.balanceSheets[idx]?.ppe_net || 0,
        totalAssets: results.balanceSheets[idx]?.total_assets || 0,
        accountsPayable: results.balanceSheets[idx]?.accounts_payable || 0,
        unearnedRevenue: results.balanceSheets[idx]?.unearned_revenue || 0,
        debt: results.balanceSheets[idx]?.debt_balance || 0,
        totalLiabilities: results.balanceSheets[idx]?.total_liabilities || 0,
        equity: results.balanceSheets[idx]?.total_equity || 0,
        contributedCapital: results.balanceSheets[idx]?.contributed_capital || 0,
        retainedEarnings: results.balanceSheets[idx]?.retained_earnings || 0,
        // Cash Flow
        operatingCF: results.cashFlowStatements[idx]?.operating_cash_flow || 0,
        investingCF: results.cashFlowStatements[idx]?.investing_cash_flow || 0,
        financingCF: results.cashFlowStatements[idx]?.financing_cash_flow || 0,
        netChangeCash: results.cashFlowStatements[idx]?.net_change_cash || 0,
        cashEnd: results.cashFlowStatements[idx]?.cash_end || 0,
        capex: results.cashFlowStatements[idx]?.capex || 0,
        changeAR: results.cashFlowStatements[idx]?.change_ar || 0,
        changeAP: results.cashFlowStatements[idx]?.change_ap || 0,
        changeUnearned: results.cashFlowStatements[idx]?.unearned_release || 0,
        // Debt Schedule
        debtBeginning: results.debtSchedule[idx]?.beginning_balance || 0,
        debtDraw: results.debtSchedule[idx]?.draw || 0,
        debtPrincipal: results.debtSchedule[idx]?.principal_payment || 0,
        debtEnding: results.debtSchedule[idx]?.ending_balance || 0,
        debtInterest: results.debtSchedule[idx]?.interest_expense || 0,
        dscr: results.debtSchedule[idx]?.dscr || 0,
        // Carbon metrics - map from operational inputs
        creditsGenerated: transformedInputs.credits_generated[idx] || 0,
        creditsIssued: transformedInputs.credits_generated[idx] * (transformedInputs.issuance_flag[idx] || 0) || 0,
        purchasedCreditsDelivered: results.carbonStream[idx]?.purchased_credits || 0,
        // Free Cash Flow
        fcfe: results.freeCashFlow[idx]?.fcf_to_equity || 0,
      }));

      const compMetrics = calculateComprehensiveMetrics(
        yearlyFinancials,
        transformedInputs.discount_rate,
        transformedInputs
      );
      setComprehensiveMetrics(compMetrics);
      setYearlyFinancials(yearlyFinancials);

      // Fetch saved scenarios
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('model_scenarios')
        .select('*')
        .eq('model_id', modelId)
        .is('deleted_at', null);

      if (scenariosError) throw scenariosError;
      
      // Get base case values for comparison (use current model inputs as base)
      const baseValues = { ...transformedInputs };
      
      // Process scenarios with their pre-calculated metrics
      const processedScenarios = scenariosData?.map(scenario => {
        try {
          const scenarioData = scenario.scenario_data as any;
          
          // Compute variable changes
          const variables = scenarioData.variables || {};
          const changes = Object.keys(variables)
            .map(key => {
              const newValue = variables[key];
              let baseValue = baseValues[key];
              
              // For array values (like credits_generated, price_per_credit), use first year
              if (Array.isArray(baseValue)) {
                baseValue = baseValue[0];
              }
              if (Array.isArray(newValue)) {
                return null; // Skip array comparisons for now
              }
              
              // Skip if no change or invalid values
              if (baseValue === undefined || newValue === undefined || baseValue === newValue) {
                return null;
              }
              
              // Calculate percentage change
              const percentChange = baseValue !== 0 
                ? ((newValue - baseValue) / baseValue) 
                : 0;
              
              // Only include if change is significant (> 0.01%)
              if (Math.abs(percentChange) < 0.0001) {
                return null;
              }
              
              return {
                key,
                name: VARIABLE_NAMES[key] || key,
                baseValue,
                newValue,
                change: percentChange
              };
            })
            .filter(Boolean);
          
          return {
            scenario_name: scenario.scenario_name,
            is_base_case: scenario.is_base_case || false,
            notes: scenario.notes,
            probability: (scenarioData.probability || 0) / 100,
            metrics: scenarioData.metrics,
            changes
          };
        } catch (error) {
          console.error(`Failed to process scenario "${scenario.scenario_name}":`, error);
          return null;
        }
      }).filter(Boolean) || [];
      
      setScenarios(processedScenarios);


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
    console.log('=== Starting Input Transformation ===');
    const years = Array.from(
      { length: modelData.end_year - modelData.start_year + 1 }, 
      (_, i) => modelData.start_year + i
    );
    console.log('Model years:', years);
    
    // Group inputs by category -> input_key -> year -> value
    const grouped: Record<string, Record<string, Map<number | 'single', any>>> = {};
    
    inputs?.forEach((input, idx) => {
      if (idx < 5) console.log(`Processing input ${idx}:`, input);
      
      if (!grouped[input.category]) {
        grouped[input.category] = {};
      }
      if (!grouped[input.category][input.input_key]) {
        grouped[input.category][input.input_key] = new Map();
      }
      
      // Extract .value from input_value object
      const actualValue = input.input_value?.value !== undefined 
        ? input.input_value.value 
        : input.input_value;
      
      if (input.year !== null && input.year !== undefined) {
        // Yearly input
        grouped[input.category][input.input_key].set(input.year, actualValue);
      } else {
        // Single value (like rates)
        grouped[input.category][input.input_key].set('single', actualValue);
      }
    });
    
    console.log('Grouped inputs by category:', Object.keys(grouped));
    Object.keys(grouped).forEach(cat => {
      console.log(`  ${cat} keys:`, Object.keys(grouped[cat]));
    });
    
    // Helper to build year array
    const buildYearArray = (category: string, key: string, defaultArray: any[]): any[] => {
      const map = grouped[category]?.[key];
      if (!map) {
        console.warn(`No data for ${category}.${key}, using defaults`);
        return defaultArray;
      }
      const result = years.map(year => map.get(year) ?? 0);
      console.log(`${category}.${key}:`, result);
      return result;
    };
    
    // Helper to get single value
    const getSingleValue = (category: string, key: string, defaultValue: any): any => {
      const map = grouped[category]?.[key];
      if (!map) {
        console.warn(`No data for ${category}.${key}, using default:`, defaultValue);
        return defaultValue;
      }
      const result = map.get('single') ?? defaultValue;
      console.log(`${category}.${key}:`, result);
      return result;
    };
    
    const transformed = {
      years,
      // Operational metrics
      credits_generated: buildYearArray('operational_metrics', 'credits_generated', years.map(() => 0)),
      price_per_credit: buildYearArray('operational_metrics', 'price_per_credit', years.map(() => 0)),
      issuance_flag: buildYearArray('operational_metrics', 'issuance_flag', years.map(() => 1)),
      
      // Expenses
      cogs_rate: getSingleValue('expenses', 'cogs_rate', 0.15),
      feasibility_costs: buildYearArray('expenses', 'feasibility_costs', years.map(() => 0)),
      pdd_costs: buildYearArray('expenses', 'pdd_costs', years.map(() => 0)),
      mrv_costs: buildYearArray('expenses', 'mrv_costs', years.map(() => 0)),
      staff_costs: buildYearArray('expenses', 'staff_costs', years.map(() => 0)),
      depreciation: buildYearArray('expenses', 'depreciation', years.map(() => 0)),
      income_tax_rate: getSingleValue('expenses', 'income_tax_rate', 0.25),
      ar_rate: getSingleValue('expenses', 'ar_rate', 0.05),
      ap_rate: getSingleValue('expenses', 'ap_rate', 0.10),
      
      // CAPEX and financing
      capex: buildYearArray('expenses', 'capex', years.map(() => 0)),
      equity_injection: buildYearArray('financing', 'equity_injection', years.map(() => 0)),
      interest_rate: getSingleValue('financing', 'interest_rate', 0.08),
      debt_duration_years: getSingleValue('financing', 'debt_duration_years', 5),
      debt_draw: buildYearArray('financing', 'debt_draw', years.map(() => 0)),
      purchase_amount: buildYearArray('financing', 'purchase_amount', years.map(() => 0)),
      purchase_share: getSingleValue('financing', 'purchase_share', 0.30),
      discount_rate: getSingleValue('financing', 'discount_rate', 0.12),
      initial_equity_t0: getSingleValue('financing', 'initial_equity_t0', 50000),
      opening_cash_y1: getSingleValue('financing', 'opening_cash_y1', 0),
    };
    
    console.log('=== Transformation Complete ===');
    console.log('Final transformed object keys:', Object.keys(transformed));
    
    return transformed;
  };

  const handleDownloadPDF = async () => {
    setGenerating(true);
    
    // Show progress toast
    toast({
      title: "Generating PDF",
      description: "Capturing charts and compiling report...",
    });
    
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
        description: "PDF report with charts generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
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

          {/* Operational Metrics Panel */}
          {financialData && modelInputs && (
            <OperationalMetricsPanel 
              statements={modelInputs.years.map((year: number, idx: number) => ({
                year,
              credits_generated: modelInputs.credits_generated?.[idx] || 0,
              price_per_credit: modelInputs.price_per_credit?.[idx] || 0,
              issuance_flag: modelInputs.issuance_flag?.[idx] || 0,
                credits_issued: (modelInputs.credits_generated[idx] || 0) * (modelInputs.issuance_flag[idx] || 0),
              }))} 
            />
          )}

          {/* Expenses Panel */}
          {modelInputs && (
            <ExpensesPanel 
              modelInputs={modelInputs}
              years={modelInputs.years}
            />
          )}

          {/* Financing Panel */}
          {modelInputs && (
            <FinancingPanel 
              modelInputs={modelInputs}
              years={modelInputs.years}
            />
          )}

          {/* Financial Metrics Summary */}
          {comprehensiveMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Key Financial Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Returns</h4>
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
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Profitability</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-xl font-bold">
                          ${(comprehensiveMetrics.profitability?.total?.revenue || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-xl font-bold">
                          ${(comprehensiveMetrics.profitability?.total?.ebitda || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Total EBITDA</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-xl font-bold">
                          ${(comprehensiveMetrics.profitability?.total?.netIncome || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Net Income</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Debt & Liquidity</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-xl font-bold">
                          {(comprehensiveMetrics.debt?.minDSCR || 0).toFixed(2)}x
                        </p>
                        <p className="text-sm text-muted-foreground">Min DSCR</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-xl font-bold">
                          ${(comprehensiveMetrics.cashHealth?.peakFunding || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Peak Funding</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-xl font-bold">
                          ${(comprehensiveMetrics.cashHealth?.minCashEnd || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Min Cash Balance</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Carbon KPIs</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-xl font-bold">
                          {(comprehensiveMetrics.carbonKPIs?.totalGenerated || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Credits Generated</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-xl font-bold">
                          {(comprehensiveMetrics.carbonKPIs?.totalIssued || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Credits Issued</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-xl font-bold">
                          ${(comprehensiveMetrics.carbonKPIs?.impliedPPPrice || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">Implied PP Price</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* COMPREHENSIVE DETAILED METRICS - All 7 Sections */}
          {comprehensiveMetrics && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Comprehensive Financial Metrics</h2>
                <p className="text-muted-foreground mb-6">Detailed breakdown of all financial metrics across the project lifetime</p>
              </div>

              {/* Section 1: Returns & NPV (Detailed) */}
              <div>
                <h3 className="text-2xl font-semibold mb-4">1. Returns & NPV Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Equity Returns (Levered)</CardTitle>
                      <CardDescription>Returns to equity holders after debt service</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">IRR:</span>
                        <span className="font-mono text-lg">{formatIRR(comprehensiveMetrics.returns?.equity?.irr)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">NPV:</span>
                        <span className="font-mono text-base">{formatCurrency(comprehensiveMetrics.returns?.equity?.npv || 0)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">MIRR:</span>
                        <span className="font-mono text-base">{formatIRR(comprehensiveMetrics.returns?.equity?.mirr)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Payback:</span>
                        <span className="font-mono text-base">{formatPayback(comprehensiveMetrics.returns?.equity?.payback)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Discounted Payback:</span>
                        <span className="font-mono text-base">{formatPayback(comprehensiveMetrics.returns?.equity?.discountedPayback)}</span>
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
                        <span className="font-mono">{formatIRR(comprehensiveMetrics.returns?.project?.irr)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">NPV:</span>
                        <span className="font-mono">{formatCurrency(comprehensiveMetrics.returns?.project?.npv || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MIRR:</span>
                        <span className="font-mono">{formatIRR(comprehensiveMetrics.returns?.project?.mirr)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payback:</span>
                        <span className="font-mono">{formatPayback(comprehensiveMetrics.returns?.project?.payback)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discounted Payback:</span>
                        <span className="font-mono">{formatPayback(comprehensiveMetrics.returns?.project?.discountedPayback)}</span>
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
                        <span className="font-mono text-lg">{formatIRR(comprehensiveMetrics.returns?.investor?.irr)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">NPV:</span>
                        <span className="font-mono text-base">{formatCurrency(comprehensiveMetrics.returns?.investor?.npv || 0)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Section 2: Profitability & Margins (Detailed) */}
              {comprehensiveMetrics.profitability && (
                <div>
                  <h3 className="text-2xl font-semibold mb-4">2. Profitability & Margins</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>Income Statement Metrics by Year</CardTitle>
                      <CardDescription>Revenue, costs, and profitability breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TransposedTable
                        years={comprehensiveMetrics.profitability.yearly.map(y => y.year)}
                        showTotal
                        rows={[
                          {
                            metric: 'Revenue',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatCurrency(y.revenue)),
                            total: formatCurrency(comprehensiveMetrics.profitability.total.revenue)
                          },
                          {
                            metric: 'COGS',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatCurrency(y.cogs)),
                            total: formatCurrency(comprehensiveMetrics.profitability.total.cogs)
                          },
                          {
                            metric: 'Gross Profit',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatCurrency(y.grossProfit)),
                            total: formatCurrency(comprehensiveMetrics.profitability.total.grossProfit)
                          },
                          {
                            metric: 'OPEX',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatCurrency(y.opex)),
                            total: formatCurrency(comprehensiveMetrics.profitability.total.opex)
                          },
                          {
                            metric: 'EBITDA',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatCurrency(y.ebitda)),
                            total: formatCurrency(comprehensiveMetrics.profitability.total.ebitda),
                            className: 'bg-accent/20 font-bold'
                          },
                          {
                            metric: 'Depreciation',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatCurrency(y.depreciation)),
                          },
                          {
                            metric: 'Interest',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatCurrency(y.interest)),
                          },
                          {
                            metric: 'EBT',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatCurrency(y.ebt)),
                          },
                          {
                            metric: 'Tax',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatCurrency(y.tax)),
                          },
                          {
                            metric: 'Net Income',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatCurrency(y.netIncome)),
                            total: formatCurrency(comprehensiveMetrics.profitability.total.netIncome),
                            className: 'bg-primary/10 font-bold'
                          },
                          {
                            metric: 'Gross Margin %',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatPercent(y.grossMargin)),
                          },
                          {
                            metric: 'EBITDA Margin %',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatPercent(y.ebitdaMargin)),
                          },
                          {
                            metric: 'Net Margin %',
                            values: comprehensiveMetrics.profitability.yearly.map(y => formatPercent(y.netMargin)),
                          },
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Section 3: Unit Economics (Detailed) */}
              {comprehensiveMetrics.unitEconomics && (
                <div>
                  <h3 className="text-2xl font-semibold mb-4">3. Unit Economics</h3>
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Per Credit Economics</CardTitle>
                        <CardDescription>Cost and revenue per issued carbon credit</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TransposedTable
                          years={comprehensiveMetrics.unitEconomics.yearly.map(y => y.year)}
                          showTotal
                          totalLabel="Average"
                          rows={[
                            {
                              metric: 'Issued Credits',
                              values: comprehensiveMetrics.unitEconomics.yearly.map(y => formatNumber(y.issuedCredits, 0)),
                              total: formatNumber(comprehensiveMetrics.unitEconomics.total.totalIssued, 0)
                            },
                            {
                              metric: 'WA Price',
                              values: comprehensiveMetrics.unitEconomics.yearly.map(y => formatCurrency(y.waPrice)),
                              total: formatCurrency(comprehensiveMetrics.unitEconomics.total.avgWaPrice)
                            },
                            {
                              metric: 'COGS/Credit',
                              values: comprehensiveMetrics.unitEconomics.yearly.map(y => formatCurrency(y.cogsPerCredit)),
                              total: formatCurrency(comprehensiveMetrics.unitEconomics.total.avgCogsPerCredit)
                            },
                            {
                              metric: 'GP/Credit',
                              values: comprehensiveMetrics.unitEconomics.yearly.map(y => formatCurrency(y.gpPerCredit)),
                            },
                            {
                              metric: 'OPEX/Credit',
                              values: comprehensiveMetrics.unitEconomics.yearly.map(y => formatCurrency(y.opexPerCredit)),
                            },
                            {
                              metric: 'LCOC',
                              values: comprehensiveMetrics.unitEconomics.yearly.map(y => formatCurrency(y.lcoc)),
                              total: formatCurrency(comprehensiveMetrics.unitEconomics.total.avgLcoc)
                            },
                            {
                              metric: 'All-in Cost',
                              values: comprehensiveMetrics.unitEconomics.yearly.map(y => formatCurrency(y.allInCostPerCredit)),
                            },
                          ]}
                        />
                      </CardContent>
                    </Card>

                    {comprehensiveMetrics.breakEven && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Break-even Analysis</CardTitle>
                          <CardDescription>Price and volume thresholds for profitability</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <TransposedTable
                            years={comprehensiveMetrics.breakEven.yearly.map(y => y.year)}
                            rows={[
                              {
                                metric: 'BE Price (Oper)',
                                values: comprehensiveMetrics.breakEven.yearly.map(y => formatCurrency(y.bePriceOper)),
                              },
                              {
                                metric: 'Realized Price',
                                values: comprehensiveMetrics.breakEven.yearly.map(y => formatCurrency(y.realizedPrice)),
                              },
                              {
                                metric: 'Safety Spread',
                                values: comprehensiveMetrics.breakEven.yearly.map(y => formatCurrency(y.safetySpread)),
                              },
                              {
                                metric: 'BE Volume',
                                values: comprehensiveMetrics.breakEven.yearly.map(y => formatNumber(y.beVolumeOper, 0)),
                              },
                            ]}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Section 4: Working Capital Management (Detailed) */}
              {comprehensiveMetrics.workingCapital && (
                <div>
                  <h3 className="text-2xl font-semibold mb-4">4. Working Capital Management</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>AR, AP, and Cash Conversion Metrics</CardTitle>
                      <CardDescription>Working capital efficiency by year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TransposedTable
                        years={comprehensiveMetrics.workingCapital.yearly.map(y => y.year)}
                        rows={[
                          {
                            metric: 'AR',
                            values: comprehensiveMetrics.workingCapital.yearly.map(y => formatCurrency(y.ar)),
                          },
                          {
                            metric: 'AP',
                            values: comprehensiveMetrics.workingCapital.yearly.map(y => formatCurrency(y.ap)),
                          },
                          {
                            metric: 'NWC',
                            values: comprehensiveMetrics.workingCapital.yearly.map(y => formatCurrency(y.nwc)),
                          },
                          {
                            metric: 'Revenue',
                            values: comprehensiveMetrics.workingCapital.yearly.map(y => formatCurrency(y.revenue)),
                          },
                          {
                            metric: 'DSO (days)',
                            values: comprehensiveMetrics.workingCapital.yearly.map(y => formatNumber(y.dso, 0)),
                          },
                          {
                            metric: 'DPO (days)',
                            values: comprehensiveMetrics.workingCapital.yearly.map(y => formatNumber(y.dpo, 0)),
                          },
                          {
                            metric: 'NWC % Rev',
                            values: comprehensiveMetrics.workingCapital.yearly.map(y => formatPercent(y.nwcPct)),
                          },
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Section 5: Liquidity & Debt (Detailed) */}
              {comprehensiveMetrics.liquidity && comprehensiveMetrics.debt && (
                <div>
                  <h3 className="text-2xl font-semibold mb-4">5. Liquidity & Debt</h3>
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Liquidity Ratios</CardTitle>
                        <CardDescription>Balance sheet health and solvency metrics</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TransposedTable
                          years={comprehensiveMetrics.liquidity.yearly.map(y => y.year)}
                          rows={[
                            {
                              metric: 'Cash',
                              values: comprehensiveMetrics.liquidity.yearly.map(y => formatCurrency(y.cash)),
                            },
                            {
                              metric: 'Current Ratio',
                              values: comprehensiveMetrics.liquidity.yearly.map(y => formatNumber(y.currentRatio)),
                            },
                            {
                              metric: 'Cash Ratio',
                              values: comprehensiveMetrics.liquidity.yearly.map(y => formatNumber(y.cashRatio)),
                            },
                            {
                              metric: 'D/E',
                              values: comprehensiveMetrics.liquidity.yearly.map(y => formatNumber(y.debtToEquity)),
                            },
                            {
                              metric: 'Net Debt/EBITDA',
                              values: comprehensiveMetrics.liquidity.yearly.map(y => formatNumber(y.netDebtToEbitda)),
                            },
                            {
                              metric: 'Interest Coverage',
                              values: comprehensiveMetrics.liquidity.yearly.map(y => formatNumber(y.interestCoverage)),
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
                          years={comprehensiveMetrics.debt.yearly.map(y => y.year)}
                          rows={[
                            {
                              metric: 'Beg Balance',
                              values: comprehensiveMetrics.debt.yearly.map(y => formatCurrency(y.beginning)),
                            },
                            {
                              metric: 'Draw',
                              values: comprehensiveMetrics.debt.yearly.map(y => formatCurrency(y.draw)),
                            },
                            {
                              metric: 'Principal',
                              values: comprehensiveMetrics.debt.yearly.map(y => formatCurrency(y.principal)),
                            },
                            {
                              metric: 'End Balance',
                              values: comprehensiveMetrics.debt.yearly.map(y => formatCurrency(y.ending)),
                            },
                            {
                              metric: 'Interest',
                              values: comprehensiveMetrics.debt.yearly.map(y => formatCurrency(y.interest)),
                            },
                            {
                              metric: 'Debt Service',
                              values: comprehensiveMetrics.debt.yearly.map(y => formatCurrency(y.debtService)),
                            },
                            {
                              metric: 'DSCR',
                              values: comprehensiveMetrics.debt.yearly.map(y => `${formatNumber(y.dscr)}x`),
                            },
                          ]}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Section 6: Carbon KPIs (Detailed) */}
              {comprehensiveMetrics.carbonKPIs && (
                <div>
                  <h3 className="text-2xl font-semibold mb-4">6. Carbon KPIs</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>Carbon Credit Metrics</CardTitle>
                      <CardDescription>Generation, issuance, and pricing by year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TransposedTable
                        years={comprehensiveMetrics.carbonKPIs.yearly.map(y => y.year)}
                        showTotal
                        rows={[
                          {
                            metric: 'Generated',
                            values: comprehensiveMetrics.carbonKPIs.yearly.map(y => formatNumber(y.generated, 0)),
                            total: formatNumber(comprehensiveMetrics.carbonKPIs.totalGenerated, 0)
                          },
                          {
                            metric: 'Issued',
                            values: comprehensiveMetrics.carbonKPIs.yearly.map(y => formatNumber(y.issued, 0)),
                            total: formatNumber(comprehensiveMetrics.carbonKPIs.totalIssued, 0)
                          },
                          {
                            metric: 'Issuance %',
                            values: comprehensiveMetrics.carbonKPIs.yearly.map(y => formatPercent(y.issuanceRatio, 0)),
                          },
                          {
                            metric: 'PP Delivered',
                            values: comprehensiveMetrics.carbonKPIs.yearly.map(y => formatNumber(y.purchasedDelivered, 0)),
                          },
                          {
                            metric: 'PP Remaining',
                            values: comprehensiveMetrics.carbonKPIs.yearly.map(y => formatNumber(y.remainingPurchased, 0)),
                          },
                          {
                            metric: 'WA Price',
                            values: comprehensiveMetrics.carbonKPIs.yearly.map(y => formatCurrency(y.waPrice)),
                          },
                          {
                            metric: 'Spot Price',
                            values: comprehensiveMetrics.carbonKPIs.yearly.map(y => formatCurrency(y.spotPrice)),
                          },
                        ]}
                      />
                      {comprehensiveMetrics.carbonKPIs.impliedPPPrice !== null && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <p className="text-sm">
                            <span className="font-medium">Implied Pre-purchase Price:</span>{" "}
                            <span className="font-mono">{formatCurrency(comprehensiveMetrics.carbonKPIs.impliedPPPrice)}</span> per credit
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Section 7: Charts & Visualizations */}
              <div>
                <h3 className="text-2xl font-semibold mb-4">7. Financial Charts & Visualizations</h3>
                
                {/* Revenue by Source Chart */}
                <Card className="mb-4" id="chart-revenue">
                  <CardHeader>
                    <CardTitle>Revenue by Source</CardTitle>
                    <CardDescription>Spot vs pre-purchase revenue over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={yearlyFinancials}>
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
                        />
                        <Bar 
                          dataKey="prepurchaseRevenue" 
                          name="Pre-purchase Revenue" 
                          fill="hsl(210, 70%, 50%)" 
                          stackId="a" 
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Profitability Trend Chart */}
                <Card className="mb-4" id="chart-profitability">
                  <CardHeader>
                    <CardTitle>Profitability Trend</CardTitle>
                    <CardDescription>EBITDA and Net Income over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={comprehensiveMetrics.profitability.yearly}>
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
                        />
                        <Line 
                          type="monotone" 
                          dataKey="netIncome" 
                          name="Net Income" 
                          stroke="hsl(210, 70%, 50%)" 
                          strokeWidth={2}
                          dot={{ fill: "hsl(210, 70%, 50%)", r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cash Position Chart */}
                <Card className="mb-4" id="chart-cash">
                  <CardHeader>
                    <CardTitle>Cash Position</CardTitle>
                    <CardDescription>Cash balance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={yearlyFinancials}>
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
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* DSCR Chart */}
                <Card className="mb-4" id="chart-dscr">
                  <CardHeader>
                    <CardTitle>Debt Service Coverage Ratio</CardTitle>
                    <CardDescription>DSCR by year with covenant threshold</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={comprehensiveMetrics.debt.yearly}>
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
                <Card className="mb-4" id="chart-npv">
                  <CardHeader>
                    <CardTitle>Cumulative NPV by Year</CardTitle>
                    <CardDescription>Build-up of net present value over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={comprehensiveMetrics.returns.equity.cumulativeNPV}>
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
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Price Comparison Chart */}
                <Card className="mb-4" id="chart-prices">
                  <CardHeader>
                    <CardTitle>Price Comparison</CardTitle>
                    <CardDescription>Weighted average realized price vs break-even price</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={comprehensiveMetrics.breakEven.yearly}>
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
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bePriceOper" 
                          name="Break-even Price (Oper)" 
                          stroke="hsl(25, 95%, 53%)" 
                          strokeWidth={2} 
                          strokeDasharray="5 5"
                          dot={{ fill: "hsl(25, 95%, 53%)", r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
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
                  <CarbonStreamTable statements={financialData.carbonStream || []} investorIRR={comprehensiveMetrics?.returns?.equity?.irr || 0} />
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


          {/* Scenarios Display with Probability Weighting */}
          {scenarios.length > 0 && (
            <>
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
                              <span className="font-medium">${(scenario.metrics.returns?.equity?.npv || 0).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Equity IRR: </span>
                              <span className="font-medium">{((scenario.metrics.returns?.equity?.irr || 0) * 100).toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Project NPV: </span>
                              <span className="font-medium">${(scenario.metrics.returns?.project?.npv || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                        {scenario.changes && scenario.changes.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Variables Changed: {scenario.changes.length}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {scenario.changes.map((change: any, idx: number) => (
                                <div key={idx} className="text-xs border-l-2 border-primary/30 pl-2 py-1">
                                  <p className="font-medium">{change.name}</p>
                                  <p className="text-muted-foreground">
                                    {formatVariableValue(change.key, change.baseValue)} → {formatVariableValue(change.key, change.newValue)}
                                    {' '}
                                    <span className={change.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      ({change.change >= 0 ? '+' : ''}{(change.change * 100).toFixed(1)}%)
                                    </span>
                                  </p>
                                </div>
                              ))}
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

              {/* Probability-Weighted Analysis */}
              {scenarios.some(s => s.probability > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Probability-Weighted Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Expected values based on scenario probabilities:
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 border rounded-lg bg-accent/10">
                            <p className="text-xl font-bold text-primary">
                              ${scenarios.reduce((sum, s) => sum + (s.metrics?.returns?.equity?.npv || 0) * (s.probability || 0), 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">Probability-Weighted Equity NPV</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg bg-accent/10">
                            <p className="text-xl font-bold text-primary">
                              {(scenarios.reduce((sum, s) => sum + ((s.metrics?.returns?.equity?.irr || 0) * (s.probability || 0)), 0) * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">Probability-Weighted Equity IRR</p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">Risk Distribution:</p>
                        <div className="space-y-2">
                          {scenarios.filter(s => s.probability > 0).map((scenario, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>{scenario.scenario_name}</span>
                                  <span className="text-muted-foreground">{(scenario.probability * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${scenario.probability * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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