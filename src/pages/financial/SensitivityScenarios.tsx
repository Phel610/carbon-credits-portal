import { useState, useEffect, useCallback } from 'react';
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
import { 
  ArrowLeft, 
  Save, 
  TrendingUp, 
  TrendingDown, 
  Target,
  AlertTriangle,
  Loader2,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FinancialCalculationEngine, ModelInputData } from '@/lib/financial/calculationEngine';
import { calculateComprehensiveMetrics } from '@/lib/financial/metricsCalculator';
import { YearlyFinancials } from '@/lib/financial/metricsTypes';
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
  basePattern?: number[]; // Store full year-by-year pattern
}

interface Scenario {
  id: string;
  name: string;
  isBaseCase: boolean;
  variables: Record<string, number>;
  metrics?: any;
}

// ============= Pattern Detection & Preservation Helpers =============

const getBasePattern = (inputs: any[], category: string, key: string, years: number[]): number[] => {
  // Find ALL rows for this variable
  const matchingInputs = inputs?.filter(i => i.category === category && i.input_key === key) || [];
  
  if (matchingInputs.length === 0) return years.map(() => 0);
  
  // Check if data is year-specific or a single value
  const hasYearData = matchingInputs.some(i => i.year !== null);
  
  if (hasYearData) {
    // Build year-by-year array from multiple rows
    const yearMap = new Map();
    matchingInputs.forEach(input => {
      if (input.year) {
        const inputValue = input.input_value;
        const value = (inputValue && typeof inputValue === 'object' && 'value' in inputValue) 
          ? inputValue.value 
          : inputValue;
        yearMap.set(input.year, value ?? 0);
      }
    });
    
    // Map to array in year order
    return years.map(year => yearMap.get(year) ?? 0);
  } else {
    // Single value applied to all years
    const inputValue = matchingInputs[0].input_value;
    const value = (inputValue && typeof inputValue === 'object' && 'value' in inputValue) 
      ? inputValue.value 
      : inputValue;
      
    if (Array.isArray(value)) {
      return [...value, ...Array(Math.max(0, years.length - value.length)).fill(0)];
    }
    return years.map(() => value ?? 0);
  }
};

const getScalar = (inputs: any[], category: string, key: string, defaultValue: number = 0): number => {
  const input = inputs?.find(i => i.category === category && i.input_key === key);
  if (!input) return defaultValue;
  
  const inputValue = input.input_value;
  const value = (inputValue && typeof inputValue === 'object' && 'value' in inputValue) 
    ? inputValue.value 
    : inputValue;
  
  if (Array.isArray(value)) return value[0] ?? defaultValue;
  return value ?? defaultValue;
};

const getGrowthPattern = (pattern: number[]): number[] => {
  const growthFactors: number[] = [1]; // First year always 1x
  for (let i = 1; i < pattern.length; i++) {
    const absBase = Math.abs(pattern[i-1]);
    const absNext = Math.abs(pattern[i]);
    if (absBase !== 0) {
      growthFactors.push(absNext / absBase);
    } else {
      growthFactors.push(1);
    }
  }
  return growthFactors;
};

const applyGrowthPattern = (newBase: number, growthFactors: number[]): number[] => {
  const result = [newBase];
  for (let i = 1; i < growthFactors.length; i++) {
    result.push(result[i-1] * growthFactors[i]);
  }
  return result;
};

const applyProportionalPattern = (basePattern: number[], newTotal: number): number[] => {
  const nonZeroValues = basePattern.filter(v => v !== 0);
  if (nonZeroValues.length === 0) return basePattern;
  
  const baseTotal = nonZeroValues.reduce((sum, v) => sum + Math.abs(v), 0);
  if (baseTotal === 0) return basePattern;
  
  const multiplier = Math.abs(newTotal) / baseTotal;
  return basePattern.map(v => v === 0 ? 0 : v * multiplier);
};

// ============= Main Component =============

const SensitivityScenarios = () => {
  const { id: modelId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [modelName, setModelName] = useState('');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  const [sensitivities, setSensitivities] = useState<SensitivityVariable[]>([]);
  const [baseMetrics, setBaseMetrics] = useState<any>(null);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [newScenarioName, setNewScenarioName] = useState('');

  useEffect(() => {
    if (modelId) {
      fetchModelData();
    }
  }, [modelId]);

  const fetchModelData = async () => {
    try {
      setLoading(true);

      const { data: model, error: modelError } = await supabase
        .from('financial_models')
        .select('*')
        .eq('id', modelId)
        .maybeSingle();

      if (modelError) throw modelError;
      if (!model) {
        toast({
          title: "Model not found",
          variant: "destructive",
        });
        return;
      }

      setModelName(model.name);
      await fetchBaseValues();
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
      const { data: inputs } = await supabase
        .from('model_inputs')
        .select('*')
        .eq('model_id', modelId);

      const { data: model } = await supabase
        .from('financial_models')
        .select('start_year, end_year')
        .eq('id', modelId)
        .single();

      if (!model) throw new Error('Model not found');

      const years = Array.from(
        { length: model.end_year - model.start_year + 1 },
        (_, i) => model.start_year + i
      );

      // Load full patterns for all array fields
      const creditsGeneratedPattern = getBasePattern(inputs, 'operational_metrics', 'credits_generated', years);
      const pricePerCreditPattern = getBasePattern(inputs, 'operational_metrics', 'price_per_credit', years);
      const purchaseAmountPattern = getBasePattern(inputs, 'financing', 'purchase_amount', years);
      
      const staffCostsPattern = getBasePattern(inputs, 'expenses', 'staff_costs', years);
      const mrvCostsPattern = getBasePattern(inputs, 'expenses', 'mrv_costs', years);
      const pddCostsPattern = getBasePattern(inputs, 'expenses', 'pdd_costs', years);
      const feasibilityCostsPattern = getBasePattern(inputs, 'expenses', 'feasibility_costs', years);
      const depreciationPattern = getBasePattern(inputs, 'expenses', 'depreciation', years);
      const capexPattern = getBasePattern(inputs, 'expenses', 'capex', years);
      
      const equityInjectionPattern = getBasePattern(inputs, 'financing', 'equity_injection', years);
      const debtDrawPattern = getBasePattern(inputs, 'financing', 'debt_draw', years);

      // Create sensitivity variables with proper base values
      const sensitivityVars: SensitivityVariable[] = [
        // OPERATIONAL METRICS
        {
          key: 'credits_generated',
          name: 'Credits Generated (Year 1)',
          baseValue: Math.abs(creditsGeneratedPattern[0]) || 10000,
          currentValue: Math.abs(creditsGeneratedPattern[0]) || 10000,
          unit: 'tCO2e',
          min: 1000,
          max: 100000,
          step: 500,
          format: 'number',
          basePattern: creditsGeneratedPattern
        },
        {
          key: 'price_per_credit',
          name: 'Credit Price (Year 1)',
          baseValue: pricePerCreditPattern[0] || 15,
          currentValue: pricePerCreditPattern[0] || 15,
          unit: '$/tCO2e',
          min: 5,
          max: 100,
          step: 1,
          format: 'currency',
          basePattern: pricePerCreditPattern
        },
        {
          key: 'purchase_share',
          name: 'Pre-purchase Agreement %',
          baseValue: (getScalar(inputs, 'operational_metrics', 'purchase_share') || 0) * 100,
          currentValue: (getScalar(inputs, 'operational_metrics', 'purchase_share') || 0) * 100,
          unit: '%',
          min: 0,
          max: 100,
          step: 5,
          format: 'percentage'
        },
        {
          key: 'purchase_amount',
          name: 'Pre-purchase Amount (Year 1)',
          baseValue: Math.abs(purchaseAmountPattern[0]) || 0,
          currentValue: Math.abs(purchaseAmountPattern[0]) || 0,
          unit: '$',
          min: 0,
          max: 1000000,
          step: 10000,
          format: 'currency',
          basePattern: purchaseAmountPattern
        },

        // EXPENSES
        {
          key: 'cogs_rate',
          name: 'COGS Rate',
          baseValue: (getScalar(inputs, 'expenses', 'cogs_rate') || 0.35) * 100,
          currentValue: (getScalar(inputs, 'expenses', 'cogs_rate') || 0.35) * 100,
          unit: '%',
          min: 5,
          max: 80,
          step: 1,
          format: 'percentage'
        },
        {
          key: 'staff_costs',
          name: 'Staff Costs (Year 1)',
          baseValue: Math.abs(staffCostsPattern[0]) || 50000,
          currentValue: Math.abs(staffCostsPattern[0]) || 50000,
          unit: '$',
          min: 10000,
          max: 500000,
          step: 10000,
          format: 'currency',
          basePattern: staffCostsPattern
        },
    {
      key: 'mrv_costs',
      name: 'MRV Costs (Year 1)',
      baseValue: Math.abs(mrvCostsPattern.find(v => v !== 0) ?? mrvCostsPattern[0] ?? 20000),
      currentValue: Math.abs(mrvCostsPattern.find(v => v !== 0) ?? mrvCostsPattern[0] ?? 20000),
      unit: '$',
      min: 5000,
      max: 200000,
      step: 5000,
      format: 'currency',
      basePattern: mrvCostsPattern
    },
        {
          key: 'pdd_costs',
          name: 'PDD Costs (Year 1)',
          baseValue: Math.abs(pddCostsPattern[0]) || 30000,
          currentValue: Math.abs(pddCostsPattern[0]) || 30000,
          unit: '$',
          min: 10000,
          max: 200000,
          step: 5000,
          format: 'currency',
          basePattern: pddCostsPattern
        },
        {
          key: 'feasibility_costs',
          name: 'Feasibility Costs (Year 1)',
          baseValue: Math.abs(feasibilityCostsPattern[0]) || 25000,
          currentValue: Math.abs(feasibilityCostsPattern[0]) || 25000,
          unit: '$',
          min: 10000,
          max: 150000,
          step: 5000,
          format: 'currency',
          basePattern: feasibilityCostsPattern
        },
        {
          key: 'capex',
          name: 'CAPEX (Total)',
          baseValue: Math.abs(capexPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 500000,
          currentValue: Math.abs(capexPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 500000,
          unit: '$',
          min: 100000,
          max: 5000000,
          step: 25000,
          format: 'currency',
          basePattern: capexPattern
        },
        {
          key: 'depreciation',
          name: 'Depreciation (Year 1)',
          baseValue: Math.abs(depreciationPattern[0]) || 50000,
          currentValue: Math.abs(depreciationPattern[0]) || 50000,
          unit: '$',
          min: 10000,
          max: 500000,
          step: 10000,
          format: 'currency',
          basePattern: depreciationPattern
        },
        {
          key: 'income_tax_rate',
          name: 'Income Tax Rate',
          baseValue: (getScalar(inputs, 'expenses', 'income_tax_rate') || 0.25) * 100,
          currentValue: (getScalar(inputs, 'expenses', 'income_tax_rate') || 0.25) * 100,
          unit: '%',
          min: 0,
          max: 50,
          step: 0.5,
          format: 'percentage'
        },
        {
          key: 'ar_rate',
          name: 'Accounts Receivable Days',
          baseValue: Math.round((getScalar(inputs, 'financial_assumptions', 'ar_rate') || 0.05) * 365),
          currentValue: Math.round((getScalar(inputs, 'financial_assumptions', 'ar_rate') || 0.05) * 365),
          unit: 'days',
          min: 0,
          max: 180,
          step: 5,
          format: 'number'
        },
        {
          key: 'ap_rate',
          name: 'Accounts Payable Days',
          baseValue: Math.round((getScalar(inputs, 'financial_assumptions', 'ap_rate') || 0.10) * 365),
          currentValue: Math.round((getScalar(inputs, 'financial_assumptions', 'ap_rate') || 0.10) * 365),
          unit: 'days',
          min: 0,
          max: 180,
          step: 5,
          format: 'number'
        },

        // FINANCING
        {
          key: 'discount_rate',
          name: 'Discount Rate (WACC)',
          baseValue: (getScalar(inputs, 'financial_assumptions', 'discount_rate') || 0.12) * 100,
          currentValue: (getScalar(inputs, 'financial_assumptions', 'discount_rate') || 0.12) * 100,
          unit: '%',
          min: 5,
          max: 25,
          step: 0.5,
          format: 'percentage'
        },
        {
          key: 'interest_rate',
          name: 'Interest Rate',
          baseValue: (getScalar(inputs, 'financing', 'interest_rate') || 0.10) * 100,
          currentValue: (getScalar(inputs, 'financing', 'interest_rate') || 0.10) * 100,
          unit: '%',
          min: 3,
          max: 20,
          step: 0.25,
          format: 'percentage'
        },
        {
          key: 'debt_draw',
          name: 'Debt Amount (Total)',
          baseValue: Math.abs(debtDrawPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 0,
          currentValue: Math.abs(debtDrawPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 0,
          unit: '$',
          min: 0,
          max: 3000000,
          step: 50000,
          format: 'currency',
          basePattern: debtDrawPattern
        },
        {
          key: 'debt_duration_years',
          name: 'Debt Tenor',
          baseValue: getScalar(inputs, 'financing', 'debt_duration_years') || 5,
          currentValue: getScalar(inputs, 'financing', 'debt_duration_years') || 5,
          unit: 'years',
          min: 2,
          max: 15,
          step: 1,
          format: 'number'
        },
        {
          key: 'equity_injection',
          name: 'Equity Investment (Total)',
          baseValue: Math.abs(equityInjectionPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 0,
          currentValue: Math.abs(equityInjectionPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 0,
          unit: '$',
          min: 0,
          max: 2000000,
          step: 50000,
          format: 'currency',
          basePattern: equityInjectionPattern
        },
        {
          key: 'initial_equity_t0',
          name: 'Initial Equity (T0)',
          baseValue: getScalar(inputs, 'financing', 'initial_equity_t0') || 0,
          currentValue: getScalar(inputs, 'financing', 'initial_equity_t0') || 0,
          unit: '$',
          min: 0,
          max: 1000000,
          step: 10000,
          format: 'currency'
        },
        {
          key: 'opening_cash_y1',
          name: 'Opening Cash (Year 1)',
          baseValue: getScalar(inputs, 'financing', 'opening_cash_y1') || 0,
          currentValue: getScalar(inputs, 'financing', 'opening_cash_y1') || 0,
          unit: '$',
          min: 0,
          max: 1000000,
          step: 10000,
          format: 'currency'
        },
        {
          key: 'initial_ppe',
          name: 'Initial PPE',
          baseValue: getScalar(inputs, 'financing', 'initial_ppe') || 0,
          currentValue: getScalar(inputs, 'financing', 'initial_ppe') || 0,
          unit: '$',
          min: 0,
          max: 2000000,
          step: 25000,
          format: 'currency'
        }
      ];

      setSensitivities(sensitivityVars);
      await calculateMetrics(sensitivityVars);

    } catch (error) {
      console.error('Error fetching base values:', error);
    }
  };

  const transformInputsToEngine = async (variables: SensitivityVariable[]): Promise<ModelInputData | null> => {
    try {
      const { data: inputs } = await supabase
        .from('model_inputs')
        .select('*')
        .eq('model_id', modelId);

      const { data: model } = await supabase
        .from('financial_models')
        .select('start_year, end_year')
        .eq('id', modelId)
        .single();

      if (!model) return null;

      const years = Array.from(
        { length: model.end_year - model.start_year + 1 },
        (_, i) => model.start_year + i
      );

      // Get variable by key helper
      const getVar = (key: string) => variables.find(v => v.key === key);

      // Process array variables with pattern preservation
      const processArrayVar = (key: string, isGrowthPattern: boolean, makeNegative: boolean = false): number[] => {
        const variable = getVar(key);
        if (!variable || !variable.basePattern) {
          return years.map(() => 0);
        }

        const basePattern = variable.basePattern;
        const newValue = variable.currentValue;

        let result: number[];
        if (isGrowthPattern) {
          // Growth pattern: staff_costs, mrv_costs, depreciation, credits_generated, price_per_credit
          const growthFactors = getGrowthPattern(basePattern.map(v => Math.abs(v)));
          result = applyGrowthPattern(Math.abs(newValue), growthFactors);
        } else {
          // Proportional pattern: capex, equity_injection, debt_draw, purchase_amount, pdd_costs, feasibility_costs
          result = applyProportionalPattern(basePattern, newValue);
        }

        return makeNegative ? result.map(v => -Math.abs(v)) : result;
      };

      // Build engine inputs
      const modelInputs: ModelInputData = {
        years,
        
        // GROWTH PATTERN ARRAYS
        credits_generated: processArrayVar('credits_generated', true, false),
        price_per_credit: processArrayVar('price_per_credit', true, false),
        staff_costs: processArrayVar('staff_costs', true, true),
        mrv_costs: processArrayVar('mrv_costs', true, true),
        depreciation: processArrayVar('depreciation', true, true),
        
        // PROPORTIONAL PATTERN ARRAYS
        capex: processArrayVar('capex', false, true),
        equity_injection: processArrayVar('equity_injection', false, false),
        debt_draw: processArrayVar('debt_draw', false, false),
        purchase_amount: processArrayVar('purchase_amount', false, false),
        pdd_costs: processArrayVar('pdd_costs', false, true),
        feasibility_costs: processArrayVar('feasibility_costs', false, true),
        
        // CONSTANTS (single values for all years)
        cogs_rate: (getVar('cogs_rate')?.currentValue ?? 35) / 100,
        income_tax_rate: (getVar('income_tax_rate')?.currentValue ?? 25) / 100,
        interest_rate: (getVar('interest_rate')?.currentValue ?? 10) / 100,
        discount_rate: (getVar('discount_rate')?.currentValue ?? 12) / 100,
        purchase_share: (getVar('purchase_share')?.currentValue ?? 0) / 100,
        ar_rate: (getVar('ar_rate')?.currentValue ?? 18) / 365,
        ap_rate: (getVar('ap_rate')?.currentValue ?? 36) / 365,
        debt_duration_years: Math.round(getVar('debt_duration_years')?.currentValue ?? 5),
        initial_equity_t0: getVar('initial_equity_t0')?.currentValue ?? 0,
        opening_cash_y1: getVar('opening_cash_y1')?.currentValue ?? 0,
        initial_ppe: getVar('initial_ppe')?.currentValue ?? 0,
        
        // BINARY FLAGS (load from database, not sensitized)
        issuance_flag: getBasePattern(inputs, 'operational_metrics', 'issuance_flag', years)
      };

      return modelInputs;

    } catch (error) {
      console.error('Error transforming inputs:', error);
      return null;
    }
  };

  const calculateMetrics = useCallback(async (variables: SensitivityVariable[]) => {
    try {
      setCalculating(true);
      setValidationWarnings([]);

      const modelInputs = await transformInputsToEngine(variables);
      if (!modelInputs) {
        throw new Error('Failed to transform inputs');
      }

      // Initialize and run calculation engine
      const engine = new FinancialCalculationEngine(modelInputs);
      const results = engine.calculateFinancialStatements();

      // Transform to YearlyFinancials format
      const yearlyData: YearlyFinancials[] = modelInputs.years.map((year, idx) => {
        const income = results.incomeStatements[idx];
        const balance = results.balanceSheets[idx];
        const cashFlow = results.cashFlowStatements[idx];
        const debt = results.debtSchedule[idx];
        const carbon = results.carbonStream[idx];
        const fcf = results.freeCashFlow[idx];

        return {
          year,
          
          // Income Statement
          spotRevenue: income.spot_revenue,
          prepurchaseRevenue: income.pre_purchase_revenue,
          totalRevenue: income.total_revenue,
          cogs: income.cogs,
          grossProfit: income.total_revenue - income.cogs,
          feasibility: income.feasibility_costs,
          pdd: income.pdd_costs,
          mrv: income.mrv_costs,
          staff: income.staff_costs,
          opex: income.opex_total,
          ebitda: income.ebitda,
          depreciation: income.depreciation,
          interest: income.interest_expense,
          ebt: income.earnings_before_tax,
          incomeTax: income.income_tax,
          netIncome: income.net_income,
          
          // Balance Sheet
          cash: balance.cash,
          accountsReceivable: balance.accounts_receivable,
          ppe: balance.ppe_net,
          totalAssets: balance.total_assets,
          accountsPayable: balance.accounts_payable,
          unearnedRevenue: balance.unearned_revenue,
          debt: balance.debt_balance,
          totalLiabilities: balance.total_liabilities,
          equity: balance.total_equity,
          contributedCapital: balance.contributed_capital,
          retainedEarnings: balance.retained_earnings,
          
          // Cash Flow
          operatingCF: cashFlow.operating_cash_flow,
          investingCF: cashFlow.investing_cash_flow,
          financingCF: cashFlow.financing_cash_flow,
          netChangeCash: cashFlow.net_change_cash,
          cashEnd: cashFlow.cash_end,
          capex: cashFlow.capex,
          changeAR: cashFlow.change_ar,
          changeAP: cashFlow.change_ap,
          changeUnearned: cashFlow.unearned_inflow - cashFlow.unearned_release,
          
          // Debt Schedule
          debtBeginning: debt.beginning_balance,
          debtDraw: debt.draw,
          debtPrincipal: debt.principal_payment,
          debtEnding: debt.ending_balance,
          debtInterest: debt.interest_expense,
          dscr: debt.dscr,
          
          // Carbon metrics
          creditsGenerated: income.credits_generated,
          creditsIssued: income.credits_issued,
          purchasedCreditsDelivered: carbon.purchased_credits,
          
          // Free Cash Flow
          fcfe: fcf.fcf_to_equity
        };
      });

      // Calculate comprehensive metrics
      const metrics = calculateComprehensiveMetrics(
        yearlyData,
        modelInputs.discount_rate,
        modelInputs
      );

      // Set base metrics on first calculation
      if (!baseMetrics) {
        setBaseMetrics(metrics);
      }
      setCurrentMetrics(metrics);

    } catch (error) {
      console.error('Error calculating metrics:', error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate financial metrics",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  }, [baseMetrics, modelId]);

  const debouncedCalculateMetrics = useCallback(
    debounce((variables: SensitivityVariable[]) => {
      calculateMetrics(variables);
    }, 500),
    [calculateMetrics]
  );

  const handleSensitivityChange = (key: string, value: number[]) => {
    const newSensitivities = sensitivities.map(s =>
      s.key === key ? { ...s, currentValue: value[0] } : s
    );
    setSensitivities(newSensitivities);
    debouncedCalculateMetrics(newSensitivities);
  };

  const resetSensitivities = () => {
    const resetVars = sensitivities.map(s => ({
      ...s,
      currentValue: s.baseValue
    }));
    setSensitivities(resetVars);
    calculateMetrics(resetVars);
  };

  const saveScenario = async () => {
    if (!newScenarioName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a scenario name",
        variant: "destructive",
      });
      return;
    }

    try {
      const variablesMap: Record<string, number> = {};
      sensitivities.forEach(s => {
        variablesMap[s.key] = s.currentValue;
      });

      const { error } = await supabase
        .from('model_scenarios')
        .insert({
          model_id: modelId,
          scenario_name: newScenarioName,
          scenario_data: {
            variables: variablesMap,
            metrics: currentMetrics
          },
          is_base_case: false
        });

      if (error) throw error;

      toast({
        title: "Scenario Saved",
        description: `"${newScenarioName}" has been saved successfully`,
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

  const fetchScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('model_scenarios')
        .select('*')
        .eq('model_id', modelId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const scenarioList: Scenario[] = data.map(s => {
        const scenarioData = s.scenario_data as any;
        return {
          id: s.id,
          name: s.scenario_name,
          isBaseCase: s.is_base_case || false,
          variables: scenarioData?.variables || {},
          metrics: scenarioData?.metrics
        };
      });

      setScenarios(scenarioList);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    }
  };

  const loadScenario = (scenario: Scenario) => {
    const newSensitivities = sensitivities.map(s => ({
      ...s,
      currentValue: scenario.variables[s.key] ?? s.baseValue
    }));
    setSensitivities(newSensitivities);
    calculateMetrics(newSensitivities);
    toast({
      title: "Scenario Loaded",
      description: `Loaded "${scenario.name}"`,
    });
  };

  const deleteScenario = async (scenarioId: string) => {
    try {
      const { error } = await supabase
        .from('model_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) throw error;

      toast({
        title: "Scenario Deleted",
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

  const formatValue = (value: number, format: string): string => {
    if (format === 'currency') {
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const getMetricChange = (current: number | null | undefined, base: number | null | undefined) => {
    if (!current || !base || base === 0) return 0;
    return ((current - base) / base) * 100;
  };

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </FinancialPlatformLayout>
    );
  }

  return (
    <FinancialPlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/financial/models/${modelId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Sensitivity & Scenarios</h1>
              <p className="text-muted-foreground">{modelName}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="sensitivity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
            <TabsTrigger value="scenarios">Scenario Manager</TabsTrigger>
          </TabsList>

          {/* Sensitivity Analysis Tab */}
          <TabsContent value="sensitivity" className="space-y-6">
            {calculating && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recalculating metrics...
                  </div>
                </CardContent>
              </Card>
            )}

            {validationWarnings.length > 0 && (
              <Card className="border-warning">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    Validation Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {validationWarnings.map((warning, idx) => (
                      <li key={idx} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Key Metrics Summary */}
            {baseMetrics && currentMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Equity NPV', key: 'equityNPV', format: 'currency' },
                      { label: 'Equity IRR', key: 'equityIRR', format: 'percentage' },
                      { label: 'Project NPV', key: 'projectNPV', format: 'currency' },
                      { label: 'Payback Period', key: 'paybackPeriod', format: 'years' }
                    ].map(metric => {
                      const baseVal = baseMetrics.returns?.[metric.key];
                      const currentVal = currentMetrics.returns?.[metric.key];
                      const change = getMetricChange(currentVal, baseVal);
                      
                      return (
                        <div key={metric.key} className="space-y-2">
                          <div className="text-sm text-muted-foreground">{metric.label}</div>
                          <div className="text-2xl font-bold">
                            {metric.format === 'currency' 
                              ? `$${(currentVal || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                              : metric.format === 'percentage'
                              ? `${((currentVal || 0) * 100).toFixed(1)}%`
                              : `${(currentVal || 0).toFixed(1)} yrs`
                            }
                          </div>
                          {Math.abs(change) > 0.1 && (
                            <div className={`text-sm flex items-center gap-1 ${change > 0 ? 'text-success' : 'text-destructive'}`}>
                              {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {Math.abs(change).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sensitivity Variables */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Adjust Variables</CardTitle>
                  <Button variant="outline" size="sm" onClick={resetSensitivities}>
                    Reset All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Operational Metrics */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Operational Metrics
                  </h3>
                  <div className="space-y-6">
                    {sensitivities
                      .filter(s => ['credits_generated', 'price_per_credit', 'purchase_share', 'purchase_amount'].includes(s.key))
                      .map(variable => (
                        <div key={variable.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>{variable.name}</Label>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {formatValue(variable.currentValue, variable.format)}
                              </Badge>
                              {Math.abs(variable.currentValue - variable.baseValue) > 0.01 && (
                                <Badge variant="secondary">
                                  {variable.currentValue > variable.baseValue ? '+' : ''}
                                  {((variable.currentValue - variable.baseValue) / variable.baseValue * 100).toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Slider
                            value={[variable.currentValue]}
                            onValueChange={(value) => handleSensitivityChange(variable.key, value)}
                            min={variable.min}
                            max={variable.max}
                            step={variable.step}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatValue(variable.min, variable.format)}</span>
                            <span>{formatValue(variable.max, variable.format)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <Separator />

                {/* Expenses */}
                <div>
                  <h3 className="font-semibold mb-4">Expenses</h3>
                  <div className="space-y-6">
                    {sensitivities
                      .filter(s => ['cogs_rate', 'staff_costs', 'mrv_costs', 'pdd_costs', 'feasibility_costs', 'capex', 'depreciation', 'income_tax_rate', 'ar_rate', 'ap_rate'].includes(s.key))
                      .map(variable => (
                        <div key={variable.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>{variable.name}</Label>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {formatValue(variable.currentValue, variable.format)}
                              </Badge>
                              {Math.abs(variable.currentValue - variable.baseValue) > 0.01 && (
                                <Badge variant="secondary">
                                  {variable.currentValue > variable.baseValue ? '+' : ''}
                                  {((variable.currentValue - variable.baseValue) / variable.baseValue * 100).toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Slider
                            value={[variable.currentValue]}
                            onValueChange={(value) => handleSensitivityChange(variable.key, value)}
                            min={variable.min}
                            max={variable.max}
                            step={variable.step}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatValue(variable.min, variable.format)}</span>
                            <span>{formatValue(variable.max, variable.format)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <Separator />

                {/* Financing */}
                <div>
                  <h3 className="font-semibold mb-4">Financing</h3>
                  <div className="space-y-6">
                    {sensitivities
                      .filter(s => ['discount_rate', 'interest_rate', 'debt_draw', 'debt_duration_years', 'equity_injection', 'initial_equity_t0', 'opening_cash_y1', 'initial_ppe'].includes(s.key))
                      .map(variable => (
                        <div key={variable.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>{variable.name}</Label>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {formatValue(variable.currentValue, variable.format)}
                              </Badge>
                              {Math.abs(variable.currentValue - variable.baseValue) > 0.01 && (
                                <Badge variant="secondary">
                                  {variable.currentValue > variable.baseValue ? '+' : ''}
                                  {((variable.currentValue - variable.baseValue) / variable.baseValue * 100).toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Slider
                            value={[variable.currentValue]}
                            onValueChange={(value) => handleSensitivityChange(variable.key, value)}
                            min={variable.min}
                            max={variable.max}
                            step={variable.step}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatValue(variable.min, variable.format)}</span>
                            <span>{formatValue(variable.max, variable.format)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Scenario */}
            <Card>
              <CardHeader>
                <CardTitle>Save Current Scenario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Scenario name..."
                    value={newScenarioName}
                    onChange={(e) => setNewScenarioName(e.target.value)}
                  />
                  <Button onClick={saveScenario}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenario Manager Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Scenarios</CardTitle>
              </CardHeader>
              <CardContent>
                {scenarios.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No saved scenarios yet. Create one in the Sensitivity Analysis tab.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scenarios.map(scenario => (
                      <div key={scenario.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{scenario.name}</div>
                          {scenario.isBaseCase && (
                            <Badge variant="secondary" className="mt-1">Base Case</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadScenario(scenario)}
                          >
                            Load
                          </Button>
                          {!scenario.isBaseCase && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteScenario(scenario.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FinancialPlatformLayout>
  );
};

export default SensitivityScenarios;
