import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  DollarSign,
  Percent,
  Calculator,
  Copy,
  Trash2,
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FinancialCalculationEngine, ModelInputData } from '@/lib/financial/calculationEngine';
import { calculateComprehensiveMetrics } from '@/lib/financial/metricsCalculator';
import { YearlyFinancials } from '@/lib/financial/metricsTypes';
import { toEngineInputs } from '@/lib/financial/uiAdapter';
import debounce from 'lodash.debounce';

interface SensitivityVariable {
  key: string;
  name: string;
  baseValue: number;
  currentValue: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  format: 'currency' | 'percentage' | 'number';
}

interface Scenario {
  id: string;
  name: string;
  isBaseCase: boolean;
  variables: Record<string, number>;
  metrics?: {
    equityNPV: number;
    equityIRR: number;
    projectNPV: number;
    projectIRR: number;
    paybackPeriod: number;
    peakFunding: number;
    minDSCR: number;
    ebitdaMargin: number;
  };
}

const SensitivityScenarios = () => {
  const { id: modelId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [modelName, setModelName] = useState('');
  const [activeTab, setActiveTab] = useState('sensitivity');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  // Sensitivity Analysis State
  const [sensitivities, setSensitivities] = useState<SensitivityVariable[]>([]);
  const [baseMetrics, setBaseMetrics] = useState<any>(null);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [comprehensiveMetrics, setComprehensiveMetrics] = useState<any>(null);
  
  // Scenario Management State
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [newScenarioName, setNewScenarioName] = useState('');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparedScenarios, setComparedScenarios] = useState<string[]>([]);

  useEffect(() => {
    if (modelId) {
      fetchModelData();
    }
  }, [modelId]);

  const fetchModelData = async () => {
    try {
      setLoading(true);

      // Fetch model details
      const { data: model, error: modelError } = await supabase
        .from('financial_models')
        .select('*')
        .eq('id', modelId)
        .maybeSingle();

      if (modelError) throw modelError;
      if (!model) {
        toast({
          title: "Model not found",
          description: "The financial model could not be found.",
          variant: "destructive",
        });
        return;
      }

      setModelName(model.name);

      // Fetch model inputs to determine base values
      await fetchBaseValues();
      
      // Fetch existing scenarios
      await fetchScenarios();

    } catch (error) {
      console.error('Error fetching model data:', error);
      toast({
        title: "Error",
        description: "Failed to load model data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseValues = async () => {
    try {
      const { data: inputs, error } = await supabase
        .from('model_inputs')
        .select('*')
        .eq('model_id', modelId);

      if (error) throw error;

      const { data: model } = await supabase
        .from('financial_models')
        .select('start_year, end_year')
        .eq('id', modelId)
        .single();

      if (!model) throw new Error('Model not found');

      const numYears = model.end_year - model.start_year + 1;

      // Helper to get first year value from array or single value
      const getFirstYearValue = (inputs: any[], category: string, key: string): number => {
        const val = getInputValue(inputs, category, key);
        if (Array.isArray(val) && val.length > 0) return val[0];
        return val || 0;
      };

      // Helper to calculate depreciation period (CAPEX / annual depreciation)
      const calculateDepreciationPeriod = (): number => {
        const capexVal = Math.abs(getFirstYearValue(inputs, 'expenses', 'capex'));
        const depreciationVal = Math.abs(getFirstYearValue(inputs, 'expenses', 'depreciation'));
        if (capexVal > 0 && depreciationVal > 0) {
          return Math.round(capexVal / depreciationVal);
        }
        return 5; // default
      };

      // Helper to convert AR/AP rate to days
      const rateToDays = (rate: number): number => {
        return Math.round(rate * 365);
      };

      // Transform inputs to sensitivity variables - ALL 19 VARIABLES
      const sensitivityVars: SensitivityVariable[] = [
        // Revenue & Pricing
        {
          key: 'price_per_credit',
          name: 'Carbon Credit Price',
          baseValue: getFirstYearValue(inputs, 'operational_metrics', 'price_per_credit') || 15,
          currentValue: getFirstYearValue(inputs, 'operational_metrics', 'price_per_credit') || 15,
          unit: '$/tCO2e',
          min: 5,
          max: 50,
          step: 0.5,
          format: 'currency'
        },
        {
          key: 'credits_generated',
          name: 'Volume of Credits Generated',
          baseValue: getFirstYearValue(inputs, 'operational_metrics', 'credits_generated') || 10000,
          currentValue: getFirstYearValue(inputs, 'operational_metrics', 'credits_generated') || 10000,
          unit: 'tCO2e/year',
          min: 1000,
          max: 100000,
          step: 500,
          format: 'number'
        },
        {
          key: 'purchase_share',
          name: 'Pre-purchase Agreement %',
          baseValue: (getInputValue(inputs, 'operational_metrics', 'purchase_share') || 0) * 100,
          currentValue: (getInputValue(inputs, 'operational_metrics', 'purchase_share') || 0) * 100,
          unit: '%',
          min: 0,
          max: 100,
          step: 5,
          format: 'percentage'
        },
        // Operating Costs
        {
          key: 'cogs_rate',
          name: 'COGS Percentage',
          baseValue: (getInputValue(inputs, 'expenses', 'cogs_rate') || 0.35) * 100,
          currentValue: (getInputValue(inputs, 'expenses', 'cogs_rate') || 0.35) * 100,
          unit: '%',
          min: 10,
          max: 80,
          step: 1,
          format: 'percentage'
        },
        {
          key: 'staff_costs',
          name: 'Annual Staff Costs',
          baseValue: Math.abs(getFirstYearValue(inputs, 'expenses', 'staff_costs') || 50000),
          currentValue: Math.abs(getFirstYearValue(inputs, 'expenses', 'staff_costs') || 50000),
          unit: '$',
          min: 10000,
          max: 500000,
          step: 10000,
          format: 'currency'
        },
        {
          key: 'mrv_costs',
          name: 'Annual MRV Costs',
          baseValue: Math.abs(getFirstYearValue(inputs, 'expenses', 'mrv_costs') || 20000),
          currentValue: Math.abs(getFirstYearValue(inputs, 'expenses', 'mrv_costs') || 20000),
          unit: '$',
          min: 5000,
          max: 200000,
          step: 5000,
          format: 'currency'
        },
        {
          key: 'pdd_costs',
          name: 'PDD Development Costs',
          baseValue: Math.abs(getFirstYearValue(inputs, 'expenses', 'pdd_costs') || 30000),
          currentValue: Math.abs(getFirstYearValue(inputs, 'expenses', 'pdd_costs') || 30000),
          unit: '$',
          min: 10000,
          max: 200000,
          step: 5000,
          format: 'currency'
        },
        {
          key: 'feasibility_costs',
          name: 'Feasibility Study Costs',
          baseValue: Math.abs(getFirstYearValue(inputs, 'expenses', 'feasibility_costs') || 25000),
          currentValue: Math.abs(getFirstYearValue(inputs, 'expenses', 'feasibility_costs') || 25000),
          unit: '$',
          min: 10000,
          max: 150000,
          step: 5000,
          format: 'currency'
        },
        // Capital & Development
        {
          key: 'capex',
          name: 'CAPEX Amount',
          baseValue: Math.abs(getFirstYearValue(inputs, 'expenses', 'capex') || 500000),
          currentValue: Math.abs(getFirstYearValue(inputs, 'expenses', 'capex') || 500000),
          unit: '$',
          min: 100000,
          max: 5000000,
          step: 25000,
          format: 'currency'
        },
        {
          key: 'depreciation_period',
          name: 'Depreciation Period',
          baseValue: calculateDepreciationPeriod(),
          currentValue: calculateDepreciationPeriod(),
          unit: 'years',
          min: 3,
          max: 20,
          step: 1,
          format: 'number'
        },
        // Financing
        {
          key: 'debt_draw',
          name: 'Debt Amount',
          baseValue: getFirstYearValue(inputs, 'financing', 'debt_draw') || 0,
          currentValue: getFirstYearValue(inputs, 'financing', 'debt_draw') || 0,
          unit: '$',
          min: 0,
          max: 3000000,
          step: 50000,
          format: 'currency'
        },
        {
          key: 'interest_rate',
          name: 'Interest Rate',
          baseValue: (getInputValue(inputs, 'financing', 'interest_rate') || 0.10) * 100,
          currentValue: (getInputValue(inputs, 'financing', 'interest_rate') || 0.10) * 100,
          unit: '%',
          min: 3,
          max: 20,
          step: 0.25,
          format: 'percentage'
        },
        {
          key: 'debt_duration_years',
          name: 'Debt Tenor',
          baseValue: getInputValue(inputs, 'financing', 'debt_duration_years') || 5,
          currentValue: getInputValue(inputs, 'financing', 'debt_duration_years') || 5,
          unit: 'years',
          min: 2,
          max: 15,
          step: 1,
          format: 'number'
        },
        {
          key: 'equity_injection',
          name: 'Equity Investment',
          baseValue: getFirstYearValue(inputs, 'financing', 'equity_injection') || 0,
          currentValue: getFirstYearValue(inputs, 'financing', 'equity_injection') || 0,
          unit: '$',
          min: 0,
          max: 2000000,
          step: 50000,
          format: 'currency'
        },
        // Financial Assumptions
        {
          key: 'income_tax_rate',
          name: 'Tax Rate',
          baseValue: (getInputValue(inputs, 'expenses', 'income_tax_rate') || 0.25) * 100,
          currentValue: (getInputValue(inputs, 'expenses', 'income_tax_rate') || 0.25) * 100,
          unit: '%',
          min: 0,
          max: 50,
          step: 0.5,
          format: 'percentage'
        },
        {
          key: 'discount_rate',
          name: 'Discount Rate (WACC)',
          baseValue: (getInputValue(inputs, 'financial_assumptions', 'discount_rate') || 0.12) * 100,
          currentValue: (getInputValue(inputs, 'financial_assumptions', 'discount_rate') || 0.12) * 100,
          unit: '%',
          min: 5,
          max: 25,
          step: 0.25,
          format: 'percentage'
        },
        {
          key: 'initial_equity_t0',
          name: 'Opening Cash Balance',
          baseValue: getInputValue(inputs, 'financing', 'initial_equity_t0') || 0,
          currentValue: getInputValue(inputs, 'financing', 'initial_equity_t0') || 0,
          unit: '$',
          min: 0,
          max: 1000000,
          step: 10000,
          format: 'currency'
        },
        // Working Capital
        {
          key: 'ar_days',
          name: 'Accounts Receivable Days',
          baseValue: rateToDays(getInputValue(inputs, 'financial_assumptions', 'ar_rate') || 0.05),
          currentValue: rateToDays(getInputValue(inputs, 'financial_assumptions', 'ar_rate') || 0.05),
          unit: 'days',
          min: 0,
          max: 180,
          step: 5,
          format: 'number'
        },
        {
          key: 'ap_days',
          name: 'Accounts Payable Days',
          baseValue: rateToDays(getInputValue(inputs, 'financial_assumptions', 'ap_rate') || 0.10),
          currentValue: rateToDays(getInputValue(inputs, 'financial_assumptions', 'ap_rate') || 0.10),
          unit: 'days',
          min: 0,
          max: 180,
          step: 5,
          format: 'number'
        }
      ];

      setSensitivities(sensitivityVars);
      
      // Calculate base case metrics
      await calculateMetrics(sensitivityVars);

    } catch (error) {
      console.error('Error fetching base values:', error);
    }
  };

  const getInputValue = (inputs: any[], category: string, key: string): any => {
    const input = inputs.find(i => i.category === category && i.input_key === key);
    if (!input) return null;
    
    // Extract .value from JSONB structure
    const inputValue = input.input_value;
    if (inputValue && typeof inputValue === 'object' && 'value' in inputValue) {
      return inputValue.value;
    }
    
    return inputValue;
  };

  const transformInputsToEngine = async (variables: SensitivityVariable[]): Promise<ModelInputData | null> => {
    try {
      // Fetch all model inputs from database
      const { data: inputs, error: inputsError } = await supabase
        .from('model_inputs')
        .select('*')
        .eq('model_id', modelId);

      if (inputsError) throw inputsError;

      const { data: model, error: modelError } = await supabase
        .from('financial_models')
        .select('start_year, end_year')
        .eq('id', modelId)
        .single();

      if (modelError) throw modelError;

      // Build years array
      const years: number[] = [];
      for (let year = model.start_year; year <= model.end_year; year++) {
        years.push(year);
      }

      // Helper to get array from inputs
      const getArray = (category: string, key: string, defaultValue: number = 0): number[] => {
        const input = inputs?.find(i => i.category === category && i.input_key === key);
        if (!input) return years.map(() => defaultValue);
        
        const inputValue = input.input_value;
        const value = (inputValue && typeof inputValue === 'object' && 'value' in inputValue) 
          ? (inputValue as any).value 
          : inputValue;
        
        if (Array.isArray(value)) {
          // Pad to match years length
          return [...value, ...Array(Math.max(0, years.length - value.length)).fill(defaultValue)];
        }
        // Single value - repeat for all years
        return years.map(() => value ?? defaultValue);
      };

      // Helper to get scalar from inputs
      const getScalar = (category: string, key: string, defaultValue: number = 0): number => {
        const input = inputs?.find(i => i.category === category && i.input_key === key);
        if (!input) return defaultValue;
        
        const inputValue = input.input_value;
        const value = (inputValue && typeof inputValue === 'object' && 'value' in inputValue) 
          ? (inputValue as any).value 
          : inputValue;
        
        if (Array.isArray(value)) return value[0] ?? defaultValue;
        return value ?? defaultValue;
      };

      // Create sensitivity overrides map
      const overrides: Record<string, number> = {};
      variables.forEach(v => {
        overrides[v.key] = v.currentValue;
      });

      // Apply overrides with proper conversions
      const applyOverride = (key: string, baseValue: number, isPercentage: boolean = false, isNegative: boolean = false): number => {
        let value = overrides[key] !== undefined ? overrides[key] : baseValue;
        if (isPercentage) value = value / 100; // Convert percentage to decimal
        if (isNegative) value = -Math.abs(value); // Make negative for costs
        return value;
      };

      // Build ModelInputData with sensitivity overrides
      const pricePerCredit = overrides['price_per_credit'] ?? getArray('operational_metrics', 'price_per_credit', 15)[0];
      const creditsGenerated = overrides['credits_generated'] ?? getArray('operational_metrics', 'credits_generated', 10000)[0];
      const purchaseShare = applyOverride('purchase_share', getScalar('operational_metrics', 'purchase_share', 0), true);
      
      const cogsRate = applyOverride('cogs_rate', getScalar('expenses', 'cogs_rate', 0.35), true);
      const staffCosts = applyOverride('staff_costs', Math.abs(getArray('expenses', 'staff_costs', 50000)[0]), false, true);
      const mrvCosts = applyOverride('mrv_costs', Math.abs(getArray('expenses', 'mrv_costs', 20000)[0]), false, true);
      const pddCosts = applyOverride('pdd_costs', Math.abs(getArray('expenses', 'pdd_costs', 30000)[0]), false, true);
      const feasibilityCosts = applyOverride('feasibility_costs', Math.abs(getArray('expenses', 'feasibility_costs', 25000)[0]), false, true);
      
      const capexAmount = applyOverride('capex', Math.abs(getArray('expenses', 'capex', 500000)[0]), false, true);
      const depreciationPeriod = overrides['depreciation_period'] ?? 5;
      const annualDepreciation = capexAmount / depreciationPeriod; // Already negative from capexAmount
      
      const debtDraw = overrides['debt_draw'] ?? getArray('financing', 'debt_draw', 0)[0];
      const interestRate = applyOverride('interest_rate', getScalar('financing', 'interest_rate', 0.10), true);
      const debtDuration = overrides['debt_duration_years'] ?? getScalar('financing', 'debt_duration_years', 5);
      const equityInjection = overrides['equity_injection'] ?? getArray('financing', 'equity_injection', 0)[0];
      
      const incomeTaxRate = applyOverride('income_tax_rate', getScalar('expenses', 'income_tax_rate', 0.25), true);
      const discountRate = applyOverride('discount_rate', getScalar('financial_assumptions', 'discount_rate', 0.12), true);
      const initialEquity = overrides['initial_equity_t0'] ?? getScalar('financing', 'initial_equity_t0', 0);
      
      const arDays = overrides['ar_days'] ?? Math.round((getScalar('financial_assumptions', 'ar_rate', 0.05)) * 365);
      const apDays = overrides['ap_days'] ?? Math.round((getScalar('financial_assumptions', 'ap_rate', 0.10)) * 365);
      const arRate = arDays / 365;
      const apRate = apDays / 365;

      // Get purchase_amount and issuance_flag from database (not sensitized)
      const purchaseAmount = getArray('operational_metrics', 'purchase_amount', 0);
      const issuanceFlag = getArray('operational_metrics', 'issuance_flag', 1);

      const modelInputs: ModelInputData = {
        years,
        credits_generated: years.map(() => creditsGenerated),
        price_per_credit: years.map(() => pricePerCredit),
        issuance_flag: issuanceFlag,
        cogs_rate: cogsRate,
        feasibility_costs: years.map((_, i) => i === 0 ? feasibilityCosts : 0),
        pdd_costs: years.map((_, i) => i === 0 ? pddCosts : 0),
        mrv_costs: years.map(() => mrvCosts),
        staff_costs: years.map(() => staffCosts),
        depreciation: years.map(() => annualDepreciation),
        income_tax_rate: incomeTaxRate,
        ar_rate: arRate,
        ap_rate: apRate,
        capex: years.map((_, i) => i === 0 ? capexAmount : 0),
        equity_injection: years.map((_, i) => i === 0 ? equityInjection : 0),
        interest_rate: interestRate,
        debt_duration_years: Math.round(debtDuration),
        debt_draw: years.map((_, i) => i === 0 ? debtDraw : 0),
        purchase_amount: purchaseAmount,
        purchase_share: purchaseShare,
        discount_rate: discountRate,
        initial_equity_t0: initialEquity,
        opening_cash_y1: initialEquity, // Set opening cash equal to initial equity for balance
        initial_ppe: 0
      };

      return modelInputs;

    } catch (error) {
      console.error('Error transforming inputs:', error);
      return null;
    }
  };

  const validateScenario = (variables: SensitivityVariable[]): string[] => {
    const warnings: string[] = [];
    
    // Get current values
    const pricePerCredit = variables.find(v => v.key === 'price_per_credit')?.currentValue || 0;
    const creditsGenerated = variables.find(v => v.key === 'credits_generated')?.currentValue || 0;
    const cogsRate = variables.find(v => v.key === 'cogs_rate')?.currentValue || 0;
    const capex = variables.find(v => v.key === 'capex')?.currentValue || 0;
    const debtDraw = variables.find(v => v.key === 'debt_draw')?.currentValue || 0;
    const interestRate = variables.find(v => v.key === 'interest_rate')?.currentValue || 0;
    const staffCosts = variables.find(v => v.key === 'staff_costs')?.currentValue || 0;
    const mrvCosts = variables.find(v => v.key === 'mrv_costs')?.currentValue || 0;
    
    // Check if revenue is too low relative to costs
    const estimatedRevenue = pricePerCredit * creditsGenerated;
    const estimatedCosts = (estimatedRevenue * cogsRate / 100) + staffCosts + mrvCosts;
    if (estimatedRevenue < estimatedCosts * 0.8) {
      warnings.push('Revenue may not cover operational costs - consider increasing price or volume');
    }
    
    // Check if debt is too high relative to CAPEX
    if (debtDraw > capex * 3) {
      warnings.push('Debt amount significantly exceeds CAPEX - may indicate overleveraging');
    }
    
    // Check if interest rate is unrealistically high
    if (interestRate > 15) {
      warnings.push('Interest rate above 15% may be unrealistic for carbon projects');
    }
    
    // Check if COGS rate is extreme
    if (cogsRate > 60) {
      warnings.push('COGS above 60% may result in low profitability');
    }
    
    return warnings;
  };

  const calculateMetrics = async (variables: SensitivityVariable[]) => {
    try {
      setCalculating(true);
      setValidationWarnings([]);
      
      // Validate scenario
      const warnings = validateScenario(variables);
      if (warnings.length > 0) {
        setValidationWarnings(warnings);
      }
      
      // Transform inputs to engine format with sensitivity overrides
      const engineInputs = await transformInputsToEngine(variables);
      if (!engineInputs) {
        throw new Error('Failed to transform inputs');
      }

      // Run calculation engine
      const engine = new FinancialCalculationEngine(engineInputs);
      const results = engine.calculateFinancialStatements();

      // Transform to YearlyFinancials format
      const yearlyData: YearlyFinancials[] = engineInputs.years.map((year, index) => ({
        year,
        // Income Statement
        spotRevenue: results.incomeStatements[index].spot_revenue,
        prepurchaseRevenue: results.incomeStatements[index].pre_purchase_revenue,
        totalRevenue: results.incomeStatements[index].total_revenue,
        cogs: results.incomeStatements[index].cogs,
        grossProfit: results.incomeStatements[index].total_revenue - results.incomeStatements[index].cogs,
        feasibility: results.incomeStatements[index].feasibility_costs,
        pdd: results.incomeStatements[index].pdd_costs,
        mrv: results.incomeStatements[index].mrv_costs,
        staff: results.incomeStatements[index].staff_costs,
        opex: results.incomeStatements[index].opex_total,
        ebitda: results.incomeStatements[index].ebitda,
        depreciation: results.incomeStatements[index].depreciation,
        interest: results.incomeStatements[index].interest_expense,
        ebt: results.incomeStatements[index].earnings_before_tax,
        incomeTax: results.incomeStatements[index].income_tax,
        netIncome: results.incomeStatements[index].net_income,
        // Balance Sheet
        cash: results.balanceSheets[index].cash,
        accountsReceivable: results.balanceSheets[index].accounts_receivable,
        ppe: results.balanceSheets[index].ppe_net,
        totalAssets: results.balanceSheets[index].total_assets,
        accountsPayable: results.balanceSheets[index].accounts_payable,
        unearnedRevenue: results.balanceSheets[index].unearned_revenue,
        debt: results.balanceSheets[index].debt_balance,
        totalLiabilities: results.balanceSheets[index].total_liabilities,
        equity: results.balanceSheets[index].total_equity,
        retainedEarnings: results.balanceSheets[index].retained_earnings,
        contributedCapital: results.balanceSheets[index].contributed_capital,
        // Cash Flow
        operatingCF: results.cashFlowStatements[index].operating_cash_flow,
        capex: results.cashFlowStatements[index].capex,
        investingCF: results.cashFlowStatements[index].investing_cash_flow,
        financingCF: results.cashFlowStatements[index].financing_cash_flow,
        netChangeCash: results.cashFlowStatements[index].net_change_cash,
        cashEnd: results.cashFlowStatements[index].cash_end,
        changeAR: results.cashFlowStatements[index].change_ar,
        changeAP: results.cashFlowStatements[index].change_ap,
        changeUnearned: results.cashFlowStatements[index].unearned_inflow - results.cashFlowStatements[index].unearned_release,
        // Debt Schedule
        debtBeginning: results.debtSchedule[index].beginning_balance,
        debtDraw: results.debtSchedule[index].draw,
        debtPrincipal: results.debtSchedule[index].principal_payment,
        debtEnding: results.debtSchedule[index].ending_balance,
        debtInterest: results.debtSchedule[index].interest_expense,
        dscr: results.debtSchedule[index].dscr,
        // Carbon
        creditsGenerated: results.incomeStatements[index].credits_generated,
        creditsIssued: results.incomeStatements[index].credits_issued,
        purchasedCreditsDelivered: results.incomeStatements[index].purchased_credits,
        // Free Cash Flow
        fcfe: results.freeCashFlow[index].fcf_to_equity
      }));

      // Calculate comprehensive metrics
      const comprehensiveMetrics = calculateComprehensiveMetrics(
        yearlyData,
        engineInputs.discount_rate,
        engineInputs
      );

      // Extract key metrics for display
      const metrics = {
        equityNPV: comprehensiveMetrics.returns.equity.npv,
        equityIRR: (comprehensiveMetrics.returns.equity.irr ?? 0) * 100,
        projectNPV: comprehensiveMetrics.returns.project.npv,
        projectIRR: (comprehensiveMetrics.returns.project.irr ?? 0) * 100,
        paybackPeriod: comprehensiveMetrics.returns.equity.payback ?? 0,
        peakFunding: Math.abs(comprehensiveMetrics.cashHealth.peakFunding),
        minDSCR: comprehensiveMetrics.debt.minDSCR ?? 0,
        ebitdaMargin: comprehensiveMetrics.profitability.yearly[0]?.ebitdaMargin ?? 0
      };

      if (!baseMetrics) {
        setBaseMetrics(metrics);
      }
      setCurrentMetrics(metrics);
      setComprehensiveMetrics(comprehensiveMetrics);

    } catch (error: any) {
      console.error('Error calculating metrics:', error);
      
      let errorMessage = "Failed to calculate financial metrics";
      if (error?.message?.includes('division by zero')) {
        errorMessage = "Invalid scenario: Division by zero detected. Please adjust your inputs.";
      } else if (error?.message?.includes('negative')) {
        errorMessage = "Invalid scenario: Negative values detected in critical calculations.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Calculation Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  // Debounced version of calculateMetrics
  const debouncedCalculateMetrics = useCallback(
    debounce((variables: SensitivityVariable[]) => {
      calculateMetrics(variables);
    }, 500),
    []
  );

  const fetchScenarios = async () => {
    try {
      const { data: scenarios, error } = await supabase
        .from('model_scenarios')
        .select('*')
        .eq('model_id', modelId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedScenarios: Scenario[] = scenarios.map(s => {
        const scenarioData = s.scenario_data as any;
        return {
          id: s.id,
          name: s.scenario_name,
          isBaseCase: s.is_base_case,
          variables: scenarioData?.variables || {},
          metrics: scenarioData?.metrics
        };
      });

      // Ensure there's always a base case
      if (!formattedScenarios.some(s => s.isBaseCase)) {
        const baseCase: Scenario = {
          id: 'base-case',
          name: 'Base Case',
          isBaseCase: true,
          variables: {},
          metrics: baseMetrics
        };
        formattedScenarios.unshift(baseCase);
      }

      setScenarios(formattedScenarios);
      
      // Set default selection to base case
      const baseCase = formattedScenarios.find(s => s.isBaseCase);
      if (baseCase) {
        setSelectedScenario(baseCase.id);
      }

    } catch (error) {
      console.error('Error fetching scenarios:', error);
    }
  };

  const handleSensitivityChange = (key: string, value: number[]) => {
    const updatedSensitivities = sensitivities.map(s => 
      s.key === key ? { ...s, currentValue: value[0] } : s
    );
    setSensitivities(updatedSensitivities);
    
    // Recalculate metrics with debouncing (500ms delay)
    debouncedCalculateMetrics(updatedSensitivities);
  };

  const resetSensitivities = () => {
    const resetSensitivities = sensitivities.map(s => ({
      ...s,
      currentValue: s.baseValue
    }));
    setSensitivities(resetSensitivities);
    calculateMetrics(resetSensitivities);
  };

  const saveScenario = async () => {
    if (!newScenarioName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a scenario name",
        variant: "destructive",
      });
      return;
    }

    try {
      const scenarioData = {
        variables: sensitivities.reduce((acc, s) => ({
          ...acc,
          [s.key]: s.currentValue
        }), {}),
        metrics: currentMetrics
      };

      const { error } = await supabase
        .from('model_scenarios')
        .insert({
          model_id: modelId,
          scenario_name: newScenarioName,
          scenario_data: scenarioData,
          is_base_case: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Scenario saved successfully",
      });

      setNewScenarioName('');
      await fetchScenarios();

    } catch (error) {
      console.error('Error saving scenario:', error);
      toast({
        title: "Error",
        description: "Failed to save scenario",
        variant: "destructive",
      });
    }
  };

  const loadScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const updatedSensitivities = sensitivities.map(s => ({
      ...s,
      currentValue: scenario.variables[s.key] ?? s.baseValue
    }));

    setSensitivities(updatedSensitivities);
    setSelectedScenario(scenarioId);
    
    if (scenario.metrics) {
      setCurrentMetrics(scenario.metrics);
    } else {
      calculateMetrics(updatedSensitivities);
    }
  };

  const deleteScenario = async (scenarioId: string) => {
    if (scenarioId === 'base-case') return; // Can't delete base case

    try {
      const { error } = await supabase
        .from('model_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      });

      await fetchScenarios();

    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast({
        title: "Error",
        description: "Failed to delete scenario",
        variant: "destructive",
      });
    }
  };

  const formatValue = (value: number, format: 'currency' | 'percentage' | 'number', unit: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'number':
        return `${value.toLocaleString()} ${unit.replace(/(.*?)\/(.*?)/, '$1')}`;
      default:
        return `${value} ${unit}`;
    }
  };

  const getMetricChange = (current: number, base: number) => {
    if (!base || base === 0) return 0;
    return ((current - base) / base) * 100;
  };

  const getMetricChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </FinancialPlatformLayout>
    );
  }

  return (
    <FinancialPlatformLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(`/financial/models/${modelId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Model
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Sensitivity & Scenarios</h1>
          <p className="text-muted-foreground">{modelName}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="sensitivity" className="space-y-6">
          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-base text-yellow-800 dark:text-yellow-200">
                    Scenario Warnings
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {validationWarnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Loading Overlay */}
          {calculating && (
            <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Recalculating financial metrics...
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Metrics Dashboard */}
          {currentMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { key: 'equityNPV', label: 'Equity NPV', value: currentMetrics.equityNPV, format: 'currency', icon: DollarSign },
                { key: 'equityIRR', label: 'Equity IRR', value: currentMetrics.equityIRR, format: 'percentage', icon: Percent },
                { key: 'projectNPV', label: 'Project NPV', value: currentMetrics.projectNPV, format: 'currency', icon: DollarSign },
                { key: 'projectIRR', label: 'Project IRR', value: currentMetrics.projectIRR, format: 'percentage', icon: Percent },
              ].map(({ key, label, value, format, icon: Icon }) => {
                const baseValue = baseMetrics?.[key] || 0;
                const change = getMetricChange(value, baseValue);
                return (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getMetricChangeIcon(change)}
                          {Math.abs(change) > 0.1 && (
                            <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">
                          {format === 'currency' 
                            ? `$${(value / 1000000).toFixed(1)}M`
                            : format === 'percentage'
                            ? `${value.toFixed(1)}%`
                            : `${value.toFixed(1)} years`
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Additional Key Metrics */}
          {currentMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { key: 'paybackPeriod', label: 'Payback Period', value: currentMetrics.paybackPeriod, format: 'years', icon: Target },
                { key: 'peakFunding', label: 'Peak Funding', value: currentMetrics.peakFunding, format: 'currency', icon: BarChart3 },
                { key: 'minDSCR', label: 'Min DSCR', value: currentMetrics.minDSCR, format: 'number', icon: Calculator },
                { key: 'ebitdaMargin', label: 'EBITDA Margin', value: currentMetrics.ebitdaMargin, format: 'percentage', icon: Percent },
              ].map(({ key, label, value, format, icon: Icon }) => {
                const baseValue = baseMetrics?.[key] || 0;
                const change = getMetricChange(value, baseValue);
                return (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getMetricChangeIcon(change)}
                          {Math.abs(change) > 0.1 && (
                            <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">
                          {format === 'currency' 
                            ? `$${(value / 1000000).toFixed(1)}M`
                            : format === 'percentage'
                            ? `${value.toFixed(1)}%`
                            : format === 'years'
                            ? `${value.toFixed(1)} years`
                            : `${value.toFixed(2)}x`
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Detailed Metrics Tables */}
          {comprehensiveMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profitability Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="font-semibold">${(comprehensiveMetrics.profitability.total.revenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">EBITDA</span>
                      <span className="font-semibold">${(comprehensiveMetrics.profitability.total.ebitda || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Net Income</span>
                      <span className="font-semibold">${(comprehensiveMetrics.profitability.total.netIncome || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Avg Gross Margin</span>
                      <span className="font-semibold">
                        {comprehensiveMetrics.profitability.yearly.length 
                          ? (comprehensiveMetrics.profitability.yearly.reduce((sum: number, y: any) => sum + (y.grossMargin || 0), 0) / comprehensiveMetrics.profitability.yearly.length * 100).toFixed(1) 
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Avg Net Margin</span>
                      <span className="font-semibold">
                        {comprehensiveMetrics.profitability.yearly.length 
                          ? (comprehensiveMetrics.profitability.yearly.reduce((sum: number, y: any) => sum + (y.netMargin || 0), 0) / comprehensiveMetrics.profitability.yearly.length * 100).toFixed(1) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Carbon Credit KPIs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Total Generated</span>
                      <span className="font-semibold">{(comprehensiveMetrics.carbonKPIs.totalGenerated || 0).toLocaleString()} credits</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Total Issued</span>
                      <span className="font-semibold">{(comprehensiveMetrics.carbonKPIs.totalIssued || 0).toLocaleString()} credits</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Issuance Ratio</span>
                      <span className="font-semibold">
                        {comprehensiveMetrics.carbonKPIs.totalGenerated 
                          ? ((comprehensiveMetrics.carbonKPIs.totalIssued / comprehensiveMetrics.carbonKPIs.totalGenerated) * 100).toFixed(1) 
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Avg Credit Price</span>
                      <span className="font-semibold">
                        ${comprehensiveMetrics.carbonKPIs.yearly.length 
                          ? (comprehensiveMetrics.carbonKPIs.yearly.reduce((sum: number, y: any) => sum + (y.waPrice || 0), 0) / comprehensiveMetrics.carbonKPIs.yearly.length).toFixed(2) 
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Implied PP Price</span>
                      <span className="font-semibold">${(comprehensiveMetrics.carbonKPIs.impliedPPPrice || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sensitivity Sliders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sensitivity Variables</CardTitle>
                <Button variant="outline" size="sm" onClick={resetSensitivities}>
                  Reset to Base Case
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {sensitivities.map((variable) => {
                const changePercent = ((variable.currentValue - variable.baseValue) / variable.baseValue) * 100;
                return (
                  <div key={variable.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{variable.name}</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          Base: {formatValue(variable.baseValue, variable.format, variable.unit)}
                        </span>
                        {Math.abs(changePercent) > 0.1 && (
                          <Badge variant={changePercent > 0 ? "default" : "secondary"}>
                            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Slider
                        value={[variable.currentValue]}
                        onValueChange={(value) => handleSensitivityChange(variable.key, value)}
                        min={variable.min}
                        max={variable.max}
                        step={variable.step}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatValue(variable.min, variable.format, variable.unit)}</span>
                        <span className="font-medium">
                          Current: {formatValue(variable.currentValue, variable.format, variable.unit)}
                        </span>
                        <span>{formatValue(variable.max, variable.format, variable.unit)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Save Current as Scenario */}
          <Card>
            <CardHeader>
              <CardTitle>Save Current Settings as Scenario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter scenario name..."
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                />
                <Button onClick={saveScenario} disabled={calculating}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          {/* Scenario List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Saved Scenarios</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComparisonMode(!comparisonMode)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {comparisonMode ? 'Exit Comparison' : 'Compare Scenarios'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {comparisonMode ? (
                        <input
                          type="checkbox"
                          checked={comparedScenarios.includes(scenario.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setComparedScenarios([...comparedScenarios, scenario.id]);
                            } else {
                              setComparedScenarios(comparedScenarios.filter(id => id !== scenario.id));
                            }
                          }}
                        />
                      ) : (
                        <Button
                          variant={selectedScenario === scenario.id ? "default" : "ghost"}
                          size="sm"
                          onClick={() => loadScenario(scenario.id)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Load
                        </Button>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{scenario.name}</span>
                          {scenario.isBaseCase && <Badge variant="secondary">Base Case</Badge>}
                        </div>
                        {scenario.metrics && (
                          <div className="text-sm text-muted-foreground">
                            Equity NPV: ${(scenario.metrics.equityNPV / 1000000).toFixed(1)}M | 
                            Equity IRR: {scenario.metrics.equityIRR.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!scenario.isBaseCase && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newName = prompt('Enter new scenario name:', scenario.name);
                              if (newName && newName !== scenario.name) {
                                // Handle rename logic here
                              }
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this scenario?')) {
                                deleteScenario(scenario.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scenario Comparison */}
          {comparisonMode && comparedScenarios.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Scenario Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Metric</th>
                        {comparedScenarios.map(scenarioId => {
                          const scenario = scenarios.find(s => s.id === scenarioId);
                          return (
                            <th key={scenarioId} className="text-center p-3">
                              {scenario?.name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {['equityNPV', 'equityIRR', 'projectNPV', 'projectIRR', 'paybackPeriod', 'peakFunding', 'minDSCR', 'ebitdaMargin'].map(metric => (
                        <tr key={metric} className="border-b">
                          <td className="p-3 font-medium capitalize">
                            {metric === 'equityNPV' ? 'Equity NPV' : 
                             metric === 'equityIRR' ? 'Equity IRR' : 
                             metric === 'projectNPV' ? 'Project NPV' : 
                             metric === 'projectIRR' ? 'Project IRR' : 
                             metric === 'paybackPeriod' ? 'Payback Period' : 
                             metric === 'peakFunding' ? 'Peak Funding' :
                             metric === 'minDSCR' ? 'Min DSCR' :
                             'EBITDA Margin'}
                          </td>
                          {comparedScenarios.map(scenarioId => {
                            const scenario = scenarios.find(s => s.id === scenarioId);
                            const value = scenario?.metrics?.[metric] || 0;
                            return (
                              <td key={scenarioId} className="p-3 text-center">
                                {metric === 'equityNPV' || metric === 'projectNPV' || metric === 'peakFunding' 
                                  ? `$${(value / 1000000).toFixed(1)}M`
                                  : metric === 'equityIRR' || metric === 'projectIRR' || metric === 'ebitdaMargin'
                                  ? `${value.toFixed(1)}%`
                                  : metric === 'paybackPeriod'
                                  ? `${value.toFixed(1)} years`
                                  : `${value.toFixed(2)}x`
                                }
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Scenario Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Scenario Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Conservative Case', desc: 'Lower prices, higher costs', multipliers: { price_per_credit: 0.8, credits_generated: 0.9, cogs_rate: 1.2 } },
                  { name: 'Optimistic Case', desc: 'Higher prices, lower costs', multipliers: { price_per_credit: 1.3, credits_generated: 1.1, cogs_rate: 0.8 } },
                  { name: 'High Volume Case', desc: 'Focus on scale advantages', multipliers: { credits_generated: 1.5, cogs_rate: 0.9, capex: 1.2 } },
                ].map((template) => (
                  <Card key={template.name} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    // Apply template multipliers to sensitivities
                    const updatedSensitivities = sensitivities.map(s => {
                      const multiplier = template.multipliers[s.key] || 1;
                      return {
                        ...s,
                        currentValue: s.baseValue * multiplier
                      };
                    });
                    setSensitivities(updatedSensitivities);
                    calculateMetrics(updatedSensitivities);
                    setActiveTab('sensitivity');
                  }}>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t mt-6">
        <Button variant="outline" onClick={() => navigate(`/financial/models/${modelId}/metrics`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Metrics
        </Button>
        <Button 
          className="bg-trust hover:bg-trust/90"
          onClick={() => navigate(`/financial/models/${modelId}/reports`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Generate Reports
        </Button>
      </div>
    </div>
    </FinancialPlatformLayout>
  );
};

export default SensitivityScenarios;