import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, TrendingUp, TrendingDown, Target, Receipt, Landmark, AlertTriangle, Loader2, Trash2, Copy, Star, FileDown, StickyNote, CheckSquare, HelpCircle, CheckCircle, Pencil, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FinancialCalculationEngine, ModelInputData } from '@/lib/financial/calculationEngine';
import { calculateComprehensiveMetrics } from '@/lib/financial/metricsCalculator';
import { YearlyFinancials } from '@/lib/financial/metricsTypes';
import debounce from 'lodash.debounce';
import ScenarioCharts from '@/components/financial/ScenarioCharts';
import ScenarioTemplates from '@/components/financial/ScenarioTemplates';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpTooltip } from '@/components/help/HelpTooltip';
import { SensitivityTutorial } from '@/components/help/SensitivityTutorial';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  notes?: string;
  probability?: number;
  yearlyFinancials?: YearlyFinancials[];
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
        const value = inputValue && typeof inputValue === 'object' && 'value' in inputValue ? inputValue.value : inputValue;
        yearMap.set(input.year, value ?? 0);
      }
    });

    // Map to array in year order
    return years.map(year => yearMap.get(year) ?? 0);
  } else {
    // Single value applied to all years
    const inputValue = matchingInputs[0].input_value;
    const value = inputValue && typeof inputValue === 'object' && 'value' in inputValue ? inputValue.value : inputValue;
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
  const value = inputValue && typeof inputValue === 'object' && 'value' in inputValue ? inputValue.value : inputValue;
  if (Array.isArray(value)) return value[0] ?? defaultValue;
  return value ?? defaultValue;
};
const getGrowthPattern = (pattern: number[]): number[] => {
  const growthFactors: number[] = [1]; // First year always 1x
  for (let i = 1; i < pattern.length; i++) {
    const absBase = Math.abs(pattern[i - 1]);
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
    result.push(result[i - 1] * growthFactors[i]);
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
  const {
    id: modelId
  } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [modelName, setModelName] = useState('');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sensitivities, setSensitivities] = useState<SensitivityVariable[]>([]);
  const [baseMetrics, setBaseMetrics] = useState<any>(null);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [scenarioNotes, setScenarioNotes] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [showProbabilityWeighting, setShowProbabilityWeighting] = useState(false);
  const [scenarioProbabilities, setScenarioProbabilities] = useState<Record<string, number>>({});
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateApplied, setTemplateApplied] = useState<{
    name: string;
    changes: string[];
  } | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPostSaveDialog, setShowPostSaveDialog] = useState(false);
  const [lastSavedScenarioName, setLastSavedScenarioName] = useState('');
  const [activeTab, setActiveTab] = useState('sensitivity');
  const [editingNotesMode, setEditingNotesMode] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (modelId) {
      fetchModelData();
    }
  }, [modelId]);
  const fetchModelData = async () => {
    try {
      setLoading(true);
      const {
        data: model,
        error: modelError
      } = await supabase.from('financial_models').select('*').eq('id', modelId).maybeSingle();
      if (modelError) throw modelError;
      if (!model) {
        toast({
          title: "Model not found",
          variant: "destructive"
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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchBaseValues = async () => {
    try {
      const {
        data: inputs
      } = await supabase.from('model_inputs').select('*').eq('model_id', modelId);
      const {
        data: model
      } = await supabase.from('financial_models').select('start_year, end_year').eq('id', modelId).single();
      if (!model) throw new Error('Model not found');
      const years = Array.from({
        length: model.end_year - model.start_year + 1
      }, (_, i) => model.start_year + i);

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
        min: 0,
        max: 100000,
        step: 100,
        format: 'number',
        basePattern: creditsGeneratedPattern
      }, {
        key: 'price_per_credit',
        name: 'Credit Price (Year 1)',
        baseValue: pricePerCreditPattern[0] || 15,
        currentValue: pricePerCreditPattern[0] || 15,
        unit: '$/tCO2e',
        min: 0,
        max: 100,
        step: 0.5,
        format: 'currency',
        basePattern: pricePerCreditPattern
      },
      // Pre-purchase variables moved to Financing section

      // EXPENSES
      {
        key: 'cogs_rate',
        name: 'COGS Rate',
        baseValue: (getScalar(inputs, 'expenses', 'cogs_rate') || 0.35) * 100,
        currentValue: (getScalar(inputs, 'expenses', 'cogs_rate') || 0.35) * 100,
        unit: '%',
        min: 0,
        max: 80,
        step: 1,
        format: 'percentage'
      }, {
        key: 'staff_costs',
        name: 'Staff Costs (Year 1)',
        baseValue: Math.abs(staffCostsPattern[0]) || 50000,
        currentValue: Math.abs(staffCostsPattern[0]) || 50000,
        unit: '$',
        min: 0,
        max: 500000,
        step: 1000,
        format: 'currency',
        basePattern: staffCostsPattern
      }, {
        key: 'mrv_costs',
        name: 'MRV Costs (Year 1)',
        baseValue: Math.abs(mrvCostsPattern.find(v => v !== 0) ?? mrvCostsPattern[0] ?? 20000),
        currentValue: Math.abs(mrvCostsPattern.find(v => v !== 0) ?? mrvCostsPattern[0] ?? 20000),
        unit: '$',
        min: 0,
        max: 200000,
        step: 1000,
        format: 'currency',
        basePattern: mrvCostsPattern
      }, {
        key: 'pdd_costs',
        name: 'PDD Costs (Year 1)',
        baseValue: Math.abs(pddCostsPattern[0]) || 30000,
        currentValue: Math.abs(pddCostsPattern[0]) || 30000,
        unit: '$',
        min: 0,
        max: 200000,
        step: 1000,
        format: 'currency',
        basePattern: pddCostsPattern
      }, {
        key: 'feasibility_costs',
        name: 'Feasibility Costs (Year 1)',
        baseValue: Math.abs(feasibilityCostsPattern[0]) || 25000,
        currentValue: Math.abs(feasibilityCostsPattern[0]) || 25000,
        unit: '$',
        min: 0,
        max: 150000,
        step: 1000,
        format: 'currency',
        basePattern: feasibilityCostsPattern
      }, {
        key: 'capex',
        name: 'CAPEX (Total)',
        baseValue: Math.abs(capexPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 500000,
        currentValue: Math.abs(capexPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 500000,
        unit: '$',
        min: 0,
        max: 5000000,
        step: 5000,
        format: 'currency',
        basePattern: capexPattern
      }, {
        key: 'depreciation',
        name: 'Depreciation (Year 1)',
        baseValue: Math.abs(depreciationPattern[0]) || 50000,
        currentValue: Math.abs(depreciationPattern[0]) || 50000,
        unit: '$',
        min: 0,
        max: 500000,
        step: 1000,
        format: 'currency',
        basePattern: depreciationPattern
      }, {
        key: 'income_tax_rate',
        name: 'Income Tax Rate',
        baseValue: (getScalar(inputs, 'expenses', 'income_tax_rate') || 0.25) * 100,
        currentValue: (getScalar(inputs, 'expenses', 'income_tax_rate') || 0.25) * 100,
        unit: '%',
        min: 0,
        max: 50,
        step: 0.5,
        format: 'percentage'
      }, {
        key: 'ar_rate',
        name: 'Accounts Receivable (%)',
        baseValue: (getScalar(inputs, 'expenses', 'ar_rate') || 0.05) * 100,
        currentValue: (getScalar(inputs, 'expenses', 'ar_rate') || 0.05) * 100,
        unit: '%',
        min: 0,
        max: 100,
        step: 1,
        format: 'percentage'
      }, {
        key: 'ap_rate',
        name: 'Accounts Payable (%)',
        baseValue: (getScalar(inputs, 'expenses', 'ap_rate') || 0.10) * 100,
        currentValue: (getScalar(inputs, 'expenses', 'ap_rate') || 0.10) * 100,
        unit: '%',
        min: 0,
        max: 100,
        step: 1,
        format: 'percentage'
      },
      // FINANCING
      {
        key: 'discount_rate',
        name: 'Discount Rate (WACC)',
        baseValue: (getScalar(inputs, 'financial_assumptions', 'discount_rate') || 0.12) * 100,
        currentValue: (getScalar(inputs, 'financial_assumptions', 'discount_rate') || 0.12) * 100,
        unit: '%',
        min: 0,
        max: 25,
        step: 0.5,
        format: 'percentage'
      }, {
        key: 'interest_rate',
        name: 'Interest Rate',
        baseValue: (getScalar(inputs, 'financing', 'interest_rate') || 0.10) * 100,
        currentValue: (getScalar(inputs, 'financing', 'interest_rate') || 0.10) * 100,
        unit: '%',
        min: 0,
        max: 20,
        step: 0.25,
        format: 'percentage'
      }, {
        key: 'debt_draw',
        name: 'Debt Amount (Total)',
        baseValue: Math.abs(debtDrawPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 0,
        currentValue: Math.abs(debtDrawPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 0,
        unit: '$',
        min: 0,
        max: 3000000,
        step: 10000,
        format: 'currency',
        basePattern: debtDrawPattern
      }, {
        key: 'debt_duration_years',
        name: 'Debt Duration (Years)',
        baseValue: getScalar(inputs, 'financing', 'debt_duration_years') || 5,
        currentValue: getScalar(inputs, 'financing', 'debt_duration_years') || 5,
        unit: 'years',
        min: 1,
        max: 15,
        step: 1,
        format: 'number'
      }, {
        key: 'purchase_share',
        name: 'Pre-purchase Agreement %',
        baseValue: (getScalar(inputs, 'financing', 'purchase_share') || 0) * 100,
        currentValue: (getScalar(inputs, 'financing', 'purchase_share') || 0) * 100,
        unit: '%',
        min: 0,
        max: 100,
        step: 5,
        format: 'percentage'
      }, {
        key: 'purchase_amount',
        name: 'Pre-purchase Amount (Year 1)',
        baseValue: Math.abs(purchaseAmountPattern[0]) || 0,
        currentValue: Math.abs(purchaseAmountPattern[0]) || 0,
        unit: '$',
        min: 0,
        max: 1000000,
        step: 5000,
        format: 'currency',
        basePattern: purchaseAmountPattern
      }, {
        key: 'equity_injection',
        name: 'Equity Investment (Total)',
        baseValue: Math.abs(equityInjectionPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 0,
        currentValue: Math.abs(equityInjectionPattern.reduce((sum, v) => sum + Math.abs(v), 0)) || 0,
        unit: '$',
        min: 0,
        max: 2000000,
        step: 10000,
        format: 'currency',
        basePattern: equityInjectionPattern
      }, {
        key: 'initial_equity_t0',
        name: 'Initial Equity (T0)',
        baseValue: getScalar(inputs, 'financing', 'initial_equity_t0') || 0,
        currentValue: getScalar(inputs, 'financing', 'initial_equity_t0') || 0,
        unit: '$',
        min: 0,
        max: 1000000,
        step: 5000,
        format: 'currency'
      }, {
        key: 'opening_cash_y1',
        name: 'Opening Cash (Year 1)',
        baseValue: getScalar(inputs, 'financing', 'opening_cash_y1') || 0,
        currentValue: getScalar(inputs, 'financing', 'opening_cash_y1') || 0,
        unit: '$',
        min: 0,
        max: 1000000,
        step: 5000,
        format: 'currency'
      }, {
        key: 'initial_ppe',
        name: 'Initial PPE',
        baseValue: getScalar(inputs, 'financing', 'initial_ppe') || 0,
        currentValue: getScalar(inputs, 'financing', 'initial_ppe') || 0,
        unit: '$',
        min: 0,
        max: 2000000,
        step: 10000,
        format: 'currency'
      }];
      setSensitivities(sensitivityVars);
      await calculateMetrics(sensitivityVars, true);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching base values:', error);
    }
  };
  const transformInputsToEngine = async (variables: SensitivityVariable[]): Promise<ModelInputData | null> => {
    try {
      const {
        data: inputs
      } = await supabase.from('model_inputs').select('*').eq('model_id', modelId);
      const {
        data: model
      } = await supabase.from('financial_models').select('start_year, end_year').eq('id', modelId).single();
      if (!model) return null;
      const years = Array.from({
        length: model.end_year - model.start_year + 1
      }, (_, i) => model.start_year + i);

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
        ar_rate: (getVar('ar_rate')?.currentValue ?? 5) / 100,
        ap_rate: (getVar('ap_rate')?.currentValue ?? 10) / 100,
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
  const calculateMetrics = useCallback(async (variables: SensitivityVariable[], skipToast = false) => {
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
      const metrics = calculateComprehensiveMetrics(yearlyData, modelInputs.discount_rate, modelInputs);

      // Attach yearlyFinancials for charts
      const metricsWithYearly = {
        ...metrics,
        yearlyFinancials: yearlyData
      };

      // Set base metrics on first calculation
      if (!baseMetrics) {
        setBaseMetrics(metricsWithYearly);
      }
      setCurrentMetrics(metricsWithYearly);
      console.log('✅ Metrics calculated successfully', {
        equityNPV: metrics.returns?.equity?.npv,
        equityIRR: metrics.returns?.equity?.irr,
        hasYearlyData: yearlyData.length > 0
      });
      if (!skipToast) {
        toast({
          title: "Metrics calculated successfully",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error calculating metrics:', error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate financial metrics",
        variant: "destructive"
      });
    } finally {
      setCalculating(false);
    }
  }, [baseMetrics, modelId]);
  const debouncedCalculateMetrics = useCallback(debounce((variables: SensitivityVariable[], skipToast = false) => {
    calculateMetrics(variables, skipToast);
  }, 500), [calculateMetrics]);
  const handleSensitivityChange = (key: string, value: number[]) => {
    const newSensitivities = sensitivities.map(s => s.key === key ? {
      ...s,
      currentValue: value[0]
    } : s);
    setSensitivities(newSensitivities);
    debouncedCalculateMetrics(newSensitivities, isInitialLoad);
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
        variant: "destructive"
      });
      return;
    }

    // Validate that metrics have been calculated
    if (!currentMetrics) {
      toast({
        title: "No Metrics Available",
        description: "Please wait for calculations to complete before saving",
        variant: "destructive"
      });
      return;
    }
    console.log('💾 Saving scenario with metrics:', {
      name: newScenarioName,
      hasMetrics: !!currentMetrics,
      equityNPV: currentMetrics?.returns?.equity?.npv,
      hasYearlyData: !!currentMetrics?.yearlyFinancials
    });
    try {
      const variablesMap: Record<string, number> = {};
      sensitivities.forEach(s => {
        variablesMap[s.key] = s.currentValue;
      });

      // Check if this is the first scenario (auto-set as base case)
      const isFirstScenario = scenarios.length === 0;
      const {
        data,
        error
      } = await supabase.from('model_scenarios').insert({
        model_id: modelId,
        scenario_name: newScenarioName,
        scenario_data: {
          variables: variablesMap,
          metrics: currentMetrics
        },
        is_base_case: isFirstScenario,
        notes: ''
      }).select().single();
      if (error) throw error;
      console.log('✅ Scenario saved successfully:', data);
      setLastSavedScenarioName(newScenarioName);
      setShowPostSaveDialog(true);
      setNewScenarioName('');
      await fetchScenarios();
    } catch (error) {
      console.error('Error saving scenario:', error);
      toast({
        title: "Error",
        description: "Failed to save scenario",
        variant: "destructive"
      });
    }
  };
  const fetchScenarios = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('model_scenarios').select('*').eq('model_id', modelId).is('deleted_at', null).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      const scenarioList: Scenario[] = data.map(s => {
        const scenarioData = s.scenario_data as any;
        return {
          id: s.id,
          name: s.scenario_name,
          isBaseCase: s.is_base_case || false,
          variables: scenarioData?.variables || {},
          metrics: scenarioData?.metrics,
          notes: s.notes || '',
          probability: scenarioData?.probability || 0,
          yearlyFinancials: scenarioData?.metrics?.yearlyFinancials
        };
      });
      setScenarios(scenarioList);

      // Initialize notes and probabilities state
      const notesMap: Record<string, string> = {};
      const probabilitiesMap: Record<string, number> = {};
      scenarioList.forEach(s => {
        notesMap[s.id] = s.notes || '';
        probabilitiesMap[s.id] = s.probability || 0;
      });
      setScenarioNotes(notesMap);
      setScenarioProbabilities(probabilitiesMap);
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
    setActiveTab('sensitivity');
    toast({
      title: "Scenario Loaded",
      description: `Applied "${scenario.name}" to sensitivity sliders`
    });
  };
  const saveScenarioNotes = async (scenarioId: string, notes: string) => {
    setSavingNoteId(scenarioId);
    try {
      const {
        error
      } = await supabase.from('model_scenarios').update({
        notes
      }).eq('id', scenarioId);
      if (error) throw error;
      toast({
        title: "Notes Saved",
        description: "Scenario notes updated successfully"
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      });
    } finally {
      setSavingNoteId(null);
    }
  };
  const debouncedSaveNotes = useCallback(debounce((scenarioId: string, notes: string) => {
    saveScenarioNotes(scenarioId, notes);
  }, 2000), []);
  const handleNoteChange = (scenarioId: string, value: string) => {
    setScenarioNotes(prev => ({
      ...prev,
      [scenarioId]: value
    }));
    debouncedSaveNotes(scenarioId, value);
  };
  const deleteScenario = async (scenarioId: string) => {
    try {
      const {
        error
      } = await supabase.from('model_scenarios').update({
        deleted_at: new Date().toISOString()
      }).eq('id', scenarioId);
      if (error) throw error;
      setSelectedScenarioIds(prev => prev.filter(id => id !== scenarioId));
      toast({
        title: "Scenario Moved to Trash",
        description: "Will be permanently deleted in 30 days"
      });
      await fetchScenarios();
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast({
        title: "Error",
        description: "Failed to move scenario to trash",
        variant: "destructive"
      });
    }
  };
  const duplicateScenario = async (scenario: Scenario) => {
    try {
      const newName = `${scenario.name} (Copy)`;
      const {
        error
      } = await supabase.from('model_scenarios').insert({
        model_id: modelId,
        scenario_name: newName,
        scenario_data: {
          variables: scenario.variables,
          metrics: scenario.metrics
        },
        is_base_case: false
      });
      if (error) throw error;
      toast({
        title: "Scenario Duplicated",
        description: `Created "${newName}"`
      });
      await fetchScenarios();
    } catch (error) {
      console.error('Error duplicating scenario:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate scenario",
        variant: "destructive"
      });
    }
  };
  const setAsBaseCase = async (scenarioId: string) => {
    try {
      // First, unset all base cases
      await supabase.from('model_scenarios').update({
        is_base_case: false
      }).eq('model_id', modelId);

      // Then set the selected scenario as base case
      const {
        error
      } = await supabase.from('model_scenarios').update({
        is_base_case: true
      }).eq('id', scenarioId);
      if (error) throw error;
      toast({
        title: "Base Case Updated"
      });
      await fetchScenarios();
    } catch (error) {
      console.error('Error setting base case:', error);
      toast({
        title: "Error",
        description: "Failed to set base case",
        variant: "destructive"
      });
    }
  };
  const exportScenario = (scenario: Scenario) => {
    const data = {
      name: scenario.name,
      variables: scenario.variables,
      metrics: scenario.metrics,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name.replace(/\s+/g, '_')}_scenario.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Scenario Exported",
      description: "Downloaded as JSON file"
    });
  };
  const toggleScenarioSelection = (scenarioId: string) => {
    setSelectedScenarioIds(prev => prev.includes(scenarioId) ? prev.filter(id => id !== scenarioId) : [...prev, scenarioId]);
  };
  const getVariableChanges = (scenario: Scenario) => {
    const changes: Array<{
      key: string;
      name: string;
      baseValue: number;
      newValue: number;
      change: number;
    }> = [];
    sensitivities.forEach(s => {
      const newValue = scenario.variables[s.key];
      if (newValue !== undefined && Math.abs(newValue - s.baseValue) > 0.01) {
        changes.push({
          key: s.key,
          name: s.name,
          baseValue: s.baseValue,
          newValue: newValue,
          change: (newValue - s.baseValue) / s.baseValue * 100
        });
      }
    });
    return changes;
  };
  const getImpactSummary = (scenario: Scenario) => {
    if (!scenario.metrics || !baseMetrics) return null;

    // FIXED: Using correct nested paths for metrics
    const impacts = [{
      label: 'NPV',
      change: getMetricChange(scenario.metrics.returns?.equity?.npv, baseMetrics.returns?.equity?.npv)
    }, {
      label: 'IRR',
      change: getMetricChange(scenario.metrics.returns?.equity?.irr, baseMetrics.returns?.equity?.irr)
    }, {
      label: 'Revenue',
      change: getMetricChange(scenario.metrics.profitability?.total?.revenue, baseMetrics.profitability?.total?.revenue)
    }];
    return impacts.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3);
  };
  const applyTemplateToSensitivities = (adjustments: Record<string, number>, templateName: string) => {
    const newSensitivities = sensitivities.map(s => ({
      ...s,
      currentValue: adjustments[s.key] ?? s.currentValue
    }));
    setSensitivities(newSensitivities);
    setNewScenarioName(templateName);
    calculateMetrics(newSensitivities);

    // Build list of changes
    const changes: string[] = [];
    Object.entries(adjustments).forEach(([key, newValue]) => {
      const variable = sensitivities.find(v => v.key === key);
      if (variable && variable.baseValue !== newValue) {
        const pctChange = (newValue - variable.baseValue) / variable.baseValue * 100;
        changes.push(`${variable.name}: ${pctChange > 0 ? '+' : ''}${pctChange.toFixed(0)}%`);
      }
    });
    setTemplateApplied({
      name: templateName,
      changes
    });
    setShowTemplateDialog(true);
    setActiveTab('sensitivity');
  };

  // Debounced probability save
  const debouncedSaveProbability = useCallback(debounce(async (scenarioId: string, probability: number) => {
    try {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (!scenario) return;
      const {
        error
      } = await supabase.from('model_scenarios').update({
        scenario_data: {
          variables: scenario.variables,
          metrics: scenario.metrics,
          yearlyFinancials: scenario.yearlyFinancials,
          probability
        } as any
      }).eq('id', scenarioId);
      if (error) throw error;
    } catch (error) {
      console.error('Error saving probability:', error);
    }
  }, 1000), [scenarios]);
  const handleProbabilityChange = (scenarioId: string, value: number) => {
    setScenarioProbabilities(prev => ({
      ...prev,
      [scenarioId]: value
    }));
    debouncedSaveProbability(scenarioId, value);
  };
  const calculateWeightedMetrics = () => {
    const totalProbability = Object.values(scenarioProbabilities).reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalProbability - 100) > 0.1) {
      return null;
    }

    // FIXED: Using correct nested paths for metrics
    const weightedMetrics: any = {
      equityNPV: 0,
      equityIRR: 0,
      projectNPV: 0,
      totalRevenue: 0
    };
    scenarios.forEach(scenario => {
      const probability = (scenarioProbabilities[scenario.id] || 0) / 100;
      if (scenario.metrics?.returns) {
        weightedMetrics.equityNPV += (scenario.metrics.returns.equity?.npv || 0) * probability;
        weightedMetrics.equityIRR += (scenario.metrics.returns.equity?.irr || 0) * probability;
        weightedMetrics.projectNPV += (scenario.metrics.returns.project?.npv || 0) * probability;
      }
      if (scenario.metrics?.profitability) {
        weightedMetrics.totalRevenue += (scenario.metrics.profitability.total?.revenue || 0) * probability;
      }
    });
    console.log('[Weighted Metrics] Calculated:', weightedMetrics);
    return weightedMetrics;
  };
  const formatValue = (value: number, format: string): string => {
    if (format === 'currency') {
      return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })}`;
    }
    if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    });
  };
  const getMetricChange = (current: number | null | undefined, base: number | null | undefined) => {
    if (!current || !base || base === 0) return 0;
    return (current - base) / base * 100;
  };
  if (loading) {
    return <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </FinancialPlatformLayout>;
  }
  return <FinancialPlatformLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/financial/models/${modelId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Model
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{modelName} - Sensitivity & Scenarios</h1>
            <p className="text-muted-foreground">Test different assumptions and compare scenario outcomes</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowTutorial(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Help Guide
          </Button>
        </div>

        <TooltipProvider>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
              <TabsTrigger value="scenarios">Scenario Manager</TabsTrigger>
            </TabsList>

            {/* Sensitivity Analysis Tab */}
            <TabsContent value="sensitivity" className="space-y-6">
              {/* Getting Started Guide */}
              {scenarios.length === 0 && <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <HelpCircle className="h-5 w-5" />
                      Getting Started with Sensitivity Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-blue-700 dark:text-blue-300">
                      Use this tool to understand how changes in key variables impact your project's financial outcomes:
                    </p>
                    <div className="space-y-2 text-blue-700 dark:text-blue-300">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold">Step 1:</span>
                        <span>Adjust the sliders below to change key input variables (prices, quantities, costs, etc.)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold">Step 2:</span>
                        <span>Watch the "Key Impacts" section update in real-time to see how metrics change</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold">Step 3:</span>
                        <span>Save interesting combinations as named scenarios (e.g., "Best Case", "Conservative", "High Growth")</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold">Step 4:</span>
                        <span>Switch to the "Scenario Manager" tab to compare multiple scenarios side-by-side</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>}
              
              {/* Calculation Status */}
              {calculating && <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Recalculating metrics...
                    </div>
                  </CardContent>
                </Card>}

            {validationWarnings.length > 0 && <Card className="border-warning">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    Validation Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {validationWarnings.map((warning, idx) => <li key={idx} className="text-sm">{warning}</li>)}
                  </ul>
                </CardContent>
              </Card>}

            {/* Returns & NPV Analysis */}
            {baseMetrics && currentMetrics && (() => {
              const discountRate = sensitivities.find(s => s.key === 'discount_rate')?.currentValue ?? 12;
              const formatIRR = (value: number | null) => value ? `${(value * 100).toFixed(1)}%` : 'n/a';
              const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, {
                maximumFractionDigits: 0
              })}`;
              const formatPayback = (value: number | null) => value && value < 100 ? `${value.toFixed(1)} yrs` : '> horizon';
              const getChangeColor = (current: number | null, base: number | null) => {
                if (!current || !base) return '';
                const change = (current - base) / Math.abs(base) * 100;
                if (Math.abs(change) < 0.1) return '';
                return change > 0 ? 'text-success' : 'text-destructive';
              };
              const renderMetricRow = (label: string, currentVal: number | null, baseVal: number | null, formatter: (val: number | null) => string) => {
                const changeColor = getChangeColor(currentVal, baseVal);
                const change = currentVal && baseVal ? (currentVal - baseVal) / Math.abs(baseVal) * 100 : 0;
                return <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground">{label}:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{formatter(currentVal)}</span>
                      {Math.abs(change) > 0.1 && <span className={`text-xs flex items-center gap-0.5 ${changeColor}`}>
                          {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(change).toFixed(0)}%
                        </span>}
                    </div>
                  </div>;
              };
              return <>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Returns & NPV Analysis</h3>
                    <p className="text-sm text-muted-foreground">Real-time impact on investment returns as you adjust variables</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Equity Returns (Levered) */}
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Equity Returns (Levered)</CardTitle>
                        <CardDescription className="text-xs">Returns to equity holders after debt service</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {renderMetricRow('IRR', currentMetrics.returns?.equity?.irr, baseMetrics.returns?.equity?.irr, formatIRR)}
                        {renderMetricRow(`NPV @ ${discountRate.toFixed(1)}%`, currentMetrics.returns?.equity?.npv, baseMetrics.returns?.equity?.npv, formatCurrency)}
                        {renderMetricRow('MIRR', currentMetrics.returns?.equity?.mirr, baseMetrics.returns?.equity?.mirr, formatIRR)}
                        {renderMetricRow('Payback', currentMetrics.returns?.equity?.payback, baseMetrics.returns?.equity?.payback, formatPayback)}
                        {renderMetricRow('Discounted Payback', currentMetrics.returns?.equity?.discountedPayback, baseMetrics.returns?.equity?.discountedPayback, formatPayback)}
                      </CardContent>
                    </Card>

                    {/* Project Returns (Unlevered) */}
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Project Returns (Unlevered)</CardTitle>
                        <CardDescription className="text-xs">Returns before financing considerations</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {renderMetricRow('IRR', currentMetrics.returns?.project?.irr, baseMetrics.returns?.project?.irr, formatIRR)}
                        {renderMetricRow(`NPV @ ${discountRate.toFixed(1)}%`, currentMetrics.returns?.project?.npv, baseMetrics.returns?.project?.npv, formatCurrency)}
                        {renderMetricRow('MIRR', currentMetrics.returns?.project?.mirr, baseMetrics.returns?.project?.mirr, formatIRR)}
                        {renderMetricRow('Payback', currentMetrics.returns?.project?.payback, baseMetrics.returns?.project?.payback, formatPayback)}
                        {renderMetricRow('Discounted Payback', currentMetrics.returns?.project?.discountedPayback, baseMetrics.returns?.project?.discountedPayback, formatPayback)}
                      </CardContent>
                    </Card>

                    {/* Investor Returns (Pre-purchase) */}
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Investor Returns (Pre-purchase)</CardTitle>
                        <CardDescription className="text-xs">Returns to carbon stream investor</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {renderMetricRow('IRR', currentMetrics.returns?.investor?.irr, baseMetrics.returns?.investor?.irr, formatIRR)}
                        {renderMetricRow(`NPV @ ${discountRate.toFixed(1)}%`, currentMetrics.returns?.investor?.npv, baseMetrics.returns?.investor?.npv, formatCurrency)}
                      </CardContent>
                    </Card>
                  </div>
                </>;
            })()}

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
                <Card className="p-6 bg-card/50 border-2 border-green-200 dark:border-green-800 shadow-sm">
                  <div className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/30 dark:to-transparent px-4 py-4 rounded-lg mb-6 border-l-4 border-green-500">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-green-900 dark:text-green-100">
                      <div className="p-1.5 bg-green-500 rounded">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      Operational Metrics
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Control revenue drivers and carbon credit generation
                    </p>
                  </div>
                  <div className="space-y-10">
                    {sensitivities.filter(s => ['credits_generated', 'price_per_credit'].includes(s.key)).map(variable => <div key={variable.key} className="space-y-4 p-4 bg-muted/25 rounded-lg border border-border/60">
                          {/* Header with variable name and reset button */}
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">{variable.name}</Label>
                            {Math.abs(variable.currentValue - variable.baseValue) > 0.01 && <Button variant="ghost" size="sm" onClick={() => handleSensitivityChange(variable.key, [variable.baseValue])} className="h-7 px-2 text-xs">
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reset
                              </Button>}
                          </div>
                          
                          {/* Three-column value display */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {/* Base Value */}
                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                              <div className="text-muted-foreground mb-1 uppercase font-semibold text-[10px]">Base</div>
                              <div className="font-mono font-semibold text-blue-700 dark:text-blue-300">
                                {formatValue(variable.baseValue, variable.format)}
                              </div>
                            </div>
                            
                            {/* Current Value */}
                            <div className={`text-center p-2 rounded border ${variable.currentValue > variable.baseValue ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : variable.currentValue < variable.baseValue ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}>
                              <div className="text-muted-foreground mb-1 uppercase font-semibold text-[10px]">Current</div>
                              <div className={`font-mono font-semibold ${variable.currentValue > variable.baseValue ? "text-green-700 dark:text-green-300" : variable.currentValue < variable.baseValue ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"}`}>
                                {formatValue(variable.currentValue, variable.format)}
                              </div>
                            </div>
                            
                            {/* Change Percentage */}
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                              <div className="text-muted-foreground mb-1 uppercase font-semibold text-[10px]">Change</div>
                              <div className={`font-mono font-semibold flex items-center justify-center gap-1 ${variable.currentValue > variable.baseValue ? "text-green-700 dark:text-green-300" : variable.currentValue < variable.baseValue ? "text-red-700 dark:text-red-300" : "text-gray-500"}`}>
                                {Math.abs(variable.currentValue - variable.baseValue) > 0.01 ? <>
                                    {variable.currentValue > variable.baseValue ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {variable.currentValue > variable.baseValue ? '+' : ''}
                                    {((variable.currentValue - variable.baseValue) / variable.baseValue * 100).toFixed(1)}%
                                  </> : <span className="text-muted-foreground">—</span>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Slider with Base Case Marker */}
                          <div className="relative pt-6 mt-10">
                            <Slider value={[variable.currentValue]} onValueChange={value => handleSensitivityChange(variable.key, value)} min={variable.min} max={variable.max} step={variable.step} className="w-full" />
                            
                            {/* Base Case Marker Line */}
                            <div className="absolute top-3 h-2 w-0.5 bg-green-500 -translate-x-1/2 pointer-events-none" style={{
                          left: `${(variable.baseValue - variable.min) / (variable.max - variable.min) * 100}%`
                        }}>
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                                BASE
                              </div>
                            </div>
                          </div>
                          
                          {/* Manual Input Field */}
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Precise:
                            </Label>
                            <Input type="number" value={variable.currentValue} onChange={e => {
                          const newValue = parseFloat(e.target.value) || 0;
                          const clampedValue = Math.max(variable.min, Math.min(variable.max, newValue));
                          handleSensitivityChange(variable.key, [clampedValue]);
                        }} className="h-8 flex-1 text-sm" step={variable.format === 'percentage' ? 0.1 : variable.format === 'currency' ? 0.01 : 1} />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{variable.unit}</span>
                          </div>
                          
                          {/* Min/Max Range Labels */}
                          <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span className="font-mono">
                              <span className="text-[10px] uppercase tracking-wider">Min: </span>
                              {formatValue(variable.min, variable.format)}
                            </span>
                            <span className="font-mono">
                              <span className="text-[10px] uppercase tracking-wider">Max: </span>
                              {formatValue(variable.max, variable.format)}
                            </span>
                          </div>
                        </div>)}
                  </div>
                </Card>

                {/* Separator */}
                <div className="my-8" />

                {/* Expenses */}
                <Card className="p-6 bg-card/50 border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                  <div className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 dark:to-transparent px-4 py-4 rounded-lg mb-6 border-l-4 border-blue-500">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <div className="p-1.5 bg-blue-500 rounded">
                        <Receipt className="h-4 w-4 text-white" />
                      </div>
                      Expenses
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Adjust operational costs and working capital assumptions
                    </p>
                  </div>
                  <div className="space-y-10">
                    {sensitivities.filter(s => ['cogs_rate', 'staff_costs', 'mrv_costs', 'pdd_costs', 'feasibility_costs', 'capex', 'depreciation', 'income_tax_rate', 'ar_rate', 'ap_rate'].includes(s.key)).map(variable => <div key={variable.key} className="space-y-4 p-4 bg-muted/25 rounded-lg border border-border/60">
                          {/* Header with variable name and reset button */}
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">{variable.name}</Label>
                            {Math.abs(variable.currentValue - variable.baseValue) > 0.01 && <Button variant="ghost" size="sm" onClick={() => handleSensitivityChange(variable.key, [variable.baseValue])} className="h-7 px-2 text-xs">
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reset
                              </Button>}
                          </div>
                          
                          {/* Three-column value display */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {/* Base Value */}
                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                              <div className="text-muted-foreground mb-1 uppercase font-semibold text-[10px]">Base</div>
                              <div className="font-mono font-semibold text-blue-700 dark:text-blue-300">
                                {formatValue(variable.baseValue, variable.format)}
                              </div>
                            </div>
                            
                            {/* Current Value */}
                            <div className={`text-center p-2 rounded border ${variable.currentValue > variable.baseValue ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : variable.currentValue < variable.baseValue ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}>
                              <div className="text-muted-foreground mb-1 uppercase font-semibold text-[10px]">Current</div>
                              <div className={`font-mono font-semibold ${variable.currentValue > variable.baseValue ? "text-green-700 dark:text-green-300" : variable.currentValue < variable.baseValue ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"}`}>
                                {formatValue(variable.currentValue, variable.format)}
                              </div>
                            </div>
                            
                            {/* Change Percentage */}
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                              <div className="text-muted-foreground mb-1 uppercase font-semibold text-[10px]">Change</div>
                              <div className={`font-mono font-semibold flex items-center justify-center gap-1 ${variable.currentValue > variable.baseValue ? "text-green-700 dark:text-green-300" : variable.currentValue < variable.baseValue ? "text-red-700 dark:text-red-300" : "text-gray-500"}`}>
                                {Math.abs(variable.currentValue - variable.baseValue) > 0.01 ? <>
                                    {variable.currentValue > variable.baseValue ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {variable.currentValue > variable.baseValue ? '+' : ''}
                                    {((variable.currentValue - variable.baseValue) / variable.baseValue * 100).toFixed(1)}%
                                  </> : <span className="text-muted-foreground">—</span>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Slider with Base Case Marker */}
                          <div className="relative pt-6 mt-10 mx-0">
                            <Slider value={[variable.currentValue]} onValueChange={value => handleSensitivityChange(variable.key, value)} min={variable.min} max={variable.max} step={variable.step} className="w-full" />
                            
                            {/* Base Case Marker Line */}
                            <div className="absolute top-3 h-2 w-0.5 bg-blue-500 -translate-x-1/2 pointer-events-none" style={{
                          left: `${(variable.baseValue - variable.min) / (variable.max - variable.min) * 100}%`
                        }}>
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                BASE
                              </div>
                            </div>
                          </div>
                          
                          {/* Manual Input Field */}
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Precise:
                            </Label>
                            <Input type="number" value={variable.currentValue} onChange={e => {
                          const newValue = parseFloat(e.target.value) || 0;
                          const clampedValue = Math.max(variable.min, Math.min(variable.max, newValue));
                          handleSensitivityChange(variable.key, [clampedValue]);
                        }} className="h-8 flex-1 text-sm" step={variable.format === 'percentage' ? 0.1 : variable.format === 'currency' ? 0.01 : 1} />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{variable.unit}</span>
                          </div>
                          
                          {/* Min/Max Range Labels */}
                          <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span className="font-mono">
                              <span className="text-[10px] uppercase tracking-wider">Min: </span>
                              {formatValue(variable.min, variable.format)}
                            </span>
                            <span className="font-mono">
                              <span className="text-[10px] uppercase tracking-wider">Max: </span>
                              {formatValue(variable.max, variable.format)}
                            </span>
                          </div>
                        </div>)}
                  </div>
                </Card>

                {/* Separator */}
                <div className="my-8" />

                {/* Financing */}
                <Card className="p-6 bg-card/50 border-2 border-orange-200 dark:border-orange-800 shadow-sm">
                  <div className="bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/30 dark:to-transparent px-4 py-4 rounded-lg mb-6 border-l-4 border-orange-500">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-orange-900 dark:text-orange-100">
                      <div className="p-1.5 bg-orange-500 rounded">
                        <Landmark className="h-4 w-4 text-white" />
                      </div>
                      Financing
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Modify funding structure and investment parameters
                    </p>
                  </div>
                  <div className="space-y-10">
                    {sensitivities.filter(s => ['discount_rate', 'interest_rate', 'debt_draw', 'debt_duration_years', 'purchase_share', 'purchase_amount', 'equity_injection', 'initial_equity_t0', 'opening_cash_y1', 'initial_ppe'].includes(s.key)).map(variable => <div key={variable.key} className="space-y-4 p-4 bg-muted/25 rounded-lg border border-border/60">
                          {/* Header with variable name and reset button */}
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">{variable.name}</Label>
                            {Math.abs(variable.currentValue - variable.baseValue) > 0.01 && <Button variant="ghost" size="sm" onClick={() => handleSensitivityChange(variable.key, [variable.baseValue])} className="h-7 px-2 text-xs">
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reset
                              </Button>}
                          </div>
                          
                          {/* Three-column value display */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {/* Base Value */}
                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                              <div className="text-muted-foreground mb-1 uppercase font-semibold text-[10px]">Base</div>
                              <div className="font-mono font-semibold text-blue-700 dark:text-blue-300">
                                {formatValue(variable.baseValue, variable.format)}
                              </div>
                            </div>
                            
                            {/* Current Value */}
                            <div className={`text-center p-2 rounded border ${variable.currentValue > variable.baseValue ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : variable.currentValue < variable.baseValue ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}>
                              <div className="text-muted-foreground mb-1 uppercase font-semibold text-[10px]">Current</div>
                              <div className={`font-mono font-semibold ${variable.currentValue > variable.baseValue ? "text-green-700 dark:text-green-300" : variable.currentValue < variable.baseValue ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"}`}>
                                {formatValue(variable.currentValue, variable.format)}
                              </div>
                            </div>
                            
                            {/* Change Percentage */}
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                              <div className="text-muted-foreground mb-1 uppercase font-semibold text-[10px]">Change</div>
                              <div className={`font-mono font-semibold flex items-center justify-center gap-1 ${variable.currentValue > variable.baseValue ? "text-green-700 dark:text-green-300" : variable.currentValue < variable.baseValue ? "text-red-700 dark:text-red-300" : "text-gray-500"}`}>
                                {Math.abs(variable.currentValue - variable.baseValue) > 0.01 ? <>
                                    {variable.currentValue > variable.baseValue ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {variable.currentValue > variable.baseValue ? '+' : ''}
                                    {((variable.currentValue - variable.baseValue) / variable.baseValue * 100).toFixed(1)}%
                                  </> : <span className="text-muted-foreground">—</span>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Slider with Base Case Marker */}
                          <div className="relative pt-6 mt-10">
                            <Slider value={[variable.currentValue]} onValueChange={value => handleSensitivityChange(variable.key, value)} min={variable.min} max={variable.max} step={variable.step} className="w-full" />
                            
                            {/* Base Case Marker Line */}
                            <div className="absolute top-3 h-2 w-0.5 bg-orange-500 -translate-x-1/2 pointer-events-none" style={{
                          left: `${(variable.baseValue - variable.min) / (variable.max - variable.min) * 100}%`
                        }}>
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                                BASE
                              </div>
                            </div>
                          </div>
                          
                          {/* Manual Input Field */}
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Precise:
                            </Label>
                            <Input type="number" value={variable.currentValue} onChange={e => {
                          const newValue = parseFloat(e.target.value) || 0;
                          const clampedValue = Math.max(variable.min, Math.min(variable.max, newValue));
                          handleSensitivityChange(variable.key, [clampedValue]);
                        }} className="h-8 flex-1 text-sm" step={variable.format === 'percentage' ? 0.1 : variable.format === 'currency' ? 0.01 : 1} />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{variable.unit}</span>
                          </div>
                          
                          {/* Min/Max Range Labels */}
                          <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span className="font-mono">
                              <span className="text-[10px] uppercase tracking-wider">Min: </span>
                              {formatValue(variable.min, variable.format)}
                            </span>
                            <span className="font-mono">
                              <span className="text-[10px] uppercase tracking-wider">Max: </span>
                              {formatValue(variable.max, variable.format)}
                            </span>
                          </div>
                        </div>)}
                  </div>
                </Card>
              </CardContent>
            </Card>

            {/* Save Scenario */}
            <Card>
              <CardHeader>
                <CardTitle>Save Current Scenario</CardTitle>
                <CardDescription>
                  {currentMetrics ? 'Metrics calculated and ready to save' : 'Adjust variables and wait for calculations'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Scenario name..." value={newScenarioName} onChange={e => setNewScenarioName(e.target.value)} />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={saveScenario} disabled={calculating || !currentMetrics || !newScenarioName.trim()}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!currentMetrics ? 'Wait for metrics to calculate' : !newScenarioName.trim() ? 'Enter a scenario name' : 'Save this scenario'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenario Manager Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            {/* Create from Template Button */}
            <div className="flex justify-between items-center">
              <ScenarioTemplates sensitivities={sensitivities} onApplyTemplate={applyTemplateToSensitivities} />
              <div className="flex gap-2 items-center">
                <HelpTooltip content={`Probability Weighting allows you to assign likelihood percentages to different scenarios, creating a probability-weighted expected outcome. 

This is especially useful for:
1. Risk analysis - weighing best/base/worst cases
2. Decision-making under uncertainty
3. Portfolio planning

Example: Assign 20% to pessimistic, 60% to base case, and 20% to optimistic scenarios.`} iconOnly />
                <Button variant="outline" onClick={() => setShowProbabilityWeighting(!showProbabilityWeighting)}>
                  {showProbabilityWeighting ? 'Hide' : 'Show'} Probability Weighting
                </Button>
              </div>
            </div>

            {/* Probability Weighting Section */}
            {showProbabilityWeighting && scenarios.length > 0 && <Card>
                <CardHeader>
                  <CardTitle>Probability-Weighted Analysis</CardTitle>
                  <CardDescription>
                    Assign probability percentages to each scenario (must sum to 100%)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {scenarios.map(scenario => <div key={scenario.id} className="space-y-2">
                        <Label htmlFor={`prob-${scenario.id}`} className="text-sm">
                          {scenario.name}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input id={`prob-${scenario.id}`} type="number" min="0" max="100" step="1" value={scenarioProbabilities[scenario.id] || 0} onChange={e => handleProbabilityChange(scenario.id, Number(e.target.value))} className="w-20" />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>)}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Total Probability:</span>
                      <Badge variant={Math.abs(Object.values(scenarioProbabilities).reduce((sum, p) => sum + p, 0) - 100) < 0.1 ? "default" : "destructive"}>
                        {Object.values(scenarioProbabilities).reduce((sum, p) => sum + p, 0).toFixed(1)}%
                      </Badge>
                    </div>

                    {(() => {
                    const weightedMetrics = calculateWeightedMetrics();
                    if (!weightedMetrics) {
                      return <div className="text-sm text-warning flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Probabilities must sum to exactly 100% to calculate weighted metrics
                          </div>;
                    }
                    return <div className="space-y-2">
                          <h4 className="font-medium">Expected Value (Probability-Weighted):</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Equity NPV</div>
                              <div className="text-lg font-bold">
                                ${weightedMetrics.equityNPV.toLocaleString(undefined, {
                              maximumFractionDigits: 0
                            })}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Equity IRR</div>
                              <div className="text-lg font-bold">
                                {(weightedMetrics.equityIRR * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Project NPV</div>
                              <div className="text-lg font-bold">
                                ${weightedMetrics.projectNPV.toLocaleString(undefined, {
                              maximumFractionDigits: 0
                            })}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Total Revenue</div>
                              <div className="text-lg font-bold">
                                ${weightedMetrics.totalRevenue.toLocaleString(undefined, {
                              maximumFractionDigits: 0
                            })}
                              </div>
                            </div>
                          </div>
                        </div>;
                  })()}
                  </div>
                </CardContent>
              </Card>}

            {/* Scenario Comparison Charts */}
            <ScenarioCharts selectedScenarios={scenarios.filter(s => selectedScenarioIds.includes(s.id))} />

            {/* Scenario Comparison Table */}
            {selectedScenarioIds.length > 1 && <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      Scenario Comparison Table
                      <HelpTooltip content="Compare key metrics side-by-side across scenarios. The 'Base Case' serves as the reference point - percentage changes show how each scenario differs from the base. Select 2+ scenarios using checkboxes to enable comparison." iconOnly />
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Detailed metric comparison with % change from base case
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Metric</th>
                          {scenarios.filter(s => selectedScenarioIds.includes(s.id)).map(scenario => <th key={scenario.id} className="text-right p-2 font-medium">
                                {scenario.name}
                                {scenario.isBaseCase && <Badge variant="secondary" className="ml-2">Base</Badge>}
                              </th>)}
                        </tr>
                      </thead>
                       <tbody>
                        {[{
                        label: 'Equity NPV',
                        path: 'returns.equity.npv',
                        format: 'currency'
                      }, {
                        label: 'Equity IRR',
                        path: 'returns.equity.irr',
                        format: 'percentage'
                      }, {
                        label: 'Project NPV',
                        path: 'returns.project.npv',
                        format: 'currency'
                      }, {
                        label: 'Payback Period',
                        path: 'returns.equity.payback',
                        format: 'years'
                      }, {
                        label: 'Total Revenue',
                        path: 'profitability.total.revenue',
                        format: 'currency'
                      }, {
                        label: 'Total Costs',
                        path: 'profitability.total.cogs',
                        format: 'currency'
                      }].map(metric => {
                        const baseCaseScenario = scenarios.find(s => s.isBaseCase && selectedScenarioIds.includes(s.id));

                        // Helper to get nested value from path like 'returns.equity.npv'
                        const getNestedValue = (obj: any, path: string): number | null => {
                          return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? null;
                        };
                        const baseValue = getNestedValue(baseCaseScenario?.metrics, metric.path);
                        return <tr key={metric.path} className="border-b">
                              <td className="p-2 text-muted-foreground">{metric.label}</td>
                              {scenarios.filter(s => selectedScenarioIds.includes(s.id)).map(scenario => {
                            const value = getNestedValue(scenario.metrics, metric.path);
                            const change = baseValue && value !== null ? (value - baseValue) / baseValue * 100 : 0;
                            const isBase = scenario.isBaseCase;
                            return <td key={scenario.id} className="p-2 text-right">
                                      <div>
                                        <span className="font-medium">
                                          {value === null || value === undefined ? 'N/A' : metric.format === 'currency' ? `$${value.toLocaleString(undefined, {
                                    maximumFractionDigits: 0
                                  })}` : metric.format === 'percentage' ? `${(value * 100).toFixed(1)}%` : `${value.toFixed(1)} yrs`}
                                        </span>
                                        {!isBase && baseValue !== null && value !== null && Math.abs(change) > 0.1 && <Badge variant={change > 0 ? "default" : "destructive"} className="ml-2 text-xs">
                                            {change > 0 ? '+' : ''}{change.toFixed(0)}%
                                          </Badge>}
                                      </div>
                                    </td>;
                          })}
                            </tr>;
                      })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>}

            {/* Saved Scenarios List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Saved Scenarios</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/financial/models/${modelId}/scenarios/trash`)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    View Deleted Scenarios
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {scenarios.length === 0 ? <div className="text-center py-12 space-y-4">
                    <div className="text-muted-foreground">
                      <p className="text-lg font-medium">No saved scenarios yet</p>
                      <p className="text-sm mt-2">Create your first scenario to start comparing alternatives</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground max-w-md mx-auto">
                      <div className="flex items-start gap-2 text-left w-full">
                        <span className="font-semibold">1.</span>
                        <span>Adjust variables in the Sensitivity Analysis tab</span>
                      </div>
                      <div className="flex items-start gap-2 text-left w-full">
                        <span className="font-semibold">2.</span>
                        <span>Click "Save Current Scenario" with a descriptive name</span>
                      </div>
                      <div className="flex items-start gap-2 text-left w-full">
                        <span className="font-semibold">3.</span>
                        <span>Return here to compare multiple scenarios</span>
                      </div>
                    </div>
                    <Button onClick={() => setActiveTab('sensitivity')} className="mt-4">
                      Go to Sensitivity Analysis
                    </Button>
                  </div> : <div className="space-y-4">
                    {scenarios.map(scenario => {
                    const changes = getVariableChanges(scenario);
                    const impacts = getImpactSummary(scenario);
                    const isSelected = selectedScenarioIds.includes(scenario.id);
                    return <Card key={scenario.id} className={isSelected ? "border-primary" : ""}>
                          <CardContent className="p-4 space-y-3">
                            {/* Header Row */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleScenarioSelection(scenario.id)} className="mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg">{scenario.name}</span>
                                    {scenario.isBaseCase && <Badge variant="secondary">
                                        <Star className="h-3 w-3 mr-1" />
                                        Base Case
                                      </Badge>}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {changes.length} variable{changes.length !== 1 ? 's' : ''} changed
                                  </div>
                                </div>
                              </div>
                              
                              {/* Delete button in header */}
                              {!scenario.isBaseCase && <HelpTooltip content="Move this scenario to trash (deleted after 30 days)">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Move to Trash</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to move "{scenario.name}" to trash? It will be permanently deleted after 30 days.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteScenario(scenario.id)}>
                                          Move to Trash
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </HelpTooltip>}
                            </div>

                            {/* Variables Changed */}
                            {changes.length > 0 && <div className="space-y-2">
                                <div className="text-sm font-medium">Variables Changed:</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {changes.map(change => <div key={change.key} className="text-xs border rounded p-2">
                                      <div className="font-medium">{change.name}</div>
                                      <div className="text-muted-foreground flex items-center justify-between">
                                        <span>{formatValue(change.baseValue, sensitivities.find(s => s.key === change.key)?.format || 'number')} → {formatValue(change.newValue, sensitivities.find(s => s.key === change.key)?.format || 'number')}</span>
                                        <Badge variant={change.change > 0 ? "default" : "destructive"} className="text-xs">
                                          {change.change > 0 ? '+' : ''}{change.change.toFixed(0)}%
                                        </Badge>
                                      </div>
                                    </div>)}
                                </div>
                              </div>}

                            {/* Impact Summary */}
                            {impacts && impacts.length > 0 && <div className="space-y-2">
                                <div className="text-sm font-medium">Impact Summary:</div>
                                <div className="flex gap-2 flex-wrap">
                                  {impacts.map((impact, idx) => <Badge key={idx} variant={Math.abs(impact.change) < 5 ? "outline" : impact.change > 0 ? "default" : "destructive"}>
                                      {impact.label}: {impact.change > 0 ? '+' : ''}{impact.change.toFixed(1)}%
                                    </Badge>)}
                                </div>
                              </div>}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t">
                              <HelpTooltip content="Load this scenario's variables into the sensitivity sliders for further adjustment">
                                <Button variant="outline" size="sm" onClick={() => loadScenario(scenario)}>
                                  Apply to Sensitivity
                                </Button>
                              </HelpTooltip>
                              <HelpTooltip content="Create a copy of this scenario">
                                <Button variant="outline" size="sm" onClick={() => duplicateScenario(scenario)}>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Duplicate
                                </Button>
                              </HelpTooltip>
                              {!scenario.isBaseCase && <HelpTooltip content="Mark this scenario as the baseline for comparisons">
                                  <Button variant="outline" size="sm" onClick={() => setAsBaseCase(scenario.id)}>
                                    <Star className="h-3 w-3 mr-1" />
                                    Set as Base
                                  </Button>
                                </HelpTooltip>}
                              <HelpTooltip content="Add or edit notes about this scenario's assumptions and findings">
                                <Button variant="outline" size="sm" onClick={() => setEditingNoteId(editingNoteId === scenario.id ? null : scenario.id)}>
                                  <StickyNote className="h-3 w-3 mr-1" />
                                  Notes
                                </Button>
                              </HelpTooltip>
                            </div>

                            {/* Notes Section */}
                            {(editingNoteId === scenario.id || scenarioNotes[scenario.id] && scenarioNotes[scenario.id].trim() !== '') && <div className="pt-2 border-t space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Scenario Notes</Label>
                                  <div className="flex items-center gap-2">
                                    {savingNoteId === scenario.id && <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Saving...
                                      </span>}
                                    {!editingNotesMode[scenario.id] ? <Button size="sm" variant="ghost" onClick={() => setEditingNotesMode(prev => ({
                                ...prev,
                                [scenario.id]: true
                              }))}>
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Edit Notes
                                      </Button> : <Button size="sm" variant="ghost" onClick={async () => {
                                await saveScenarioNotes(scenario.id, scenarioNotes[scenario.id] || '');
                                setEditingNotesMode(prev => ({
                                  ...prev,
                                  [scenario.id]: false
                                }));
                              }} disabled={savingNoteId === scenario.id}>
                                        <Save className="h-3 w-3 mr-1" />
                                        Save Notes
                                      </Button>}
                                  </div>
                                </div>
                                <Textarea placeholder="Add notes about this scenario's assumptions, rationale, or key findings..." value={scenarioNotes[scenario.id] || ''} onChange={e => handleNoteChange(scenario.id, e.target.value)} rows={3} disabled={!editingNotesMode[scenario.id]} className={!editingNotesMode[scenario.id] ? 'bg-muted' : ''} />
                                {editingNotesMode[scenario.id] && <p className="text-xs text-muted-foreground">
                                    Notes auto-save after 2 seconds of typing
                                  </p>}
                              </div>}
                          </CardContent>
                        </Card>;
                  })}
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </TooltipProvider>

        {/* Template Application Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Template Applied: {templateApplied?.name}
              </DialogTitle>
              <DialogDescription>
                We've adjusted your variables based on this template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-medium mb-2">Variables Changed:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {templateApplied?.changes.map((change, idx) => <li key={idx}>• {change}</li>)}
                </ul>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Close
              </Button>
              <Button onClick={() => {
              setShowTemplateDialog(false);
              setActiveTab('sensitivity');
            }}>
                Review & Adjust
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Post-Save Action Dialog */}
        <Dialog open={showPostSaveDialog} onOpenChange={setShowPostSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Scenario Saved Successfully!
              </DialogTitle>
              <DialogDescription>
                "{lastSavedScenarioName}" has been saved and is ready to compare
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => {
              setShowPostSaveDialog(false);
              resetSensitivities();
            }}>
                Create Another Scenario
              </Button>
              <Button onClick={() => {
              setShowPostSaveDialog(false);
              setActiveTab('scenarios');
            }}>
                View in Scenario Manager
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bottom Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => navigate(`/financial/models/${modelId}/metrics`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Metrics
          </Button>
          <Button onClick={() => navigate(`/financial/models/${modelId}/reports`)}>
            <FileDown className="mr-2 h-4 w-4" />
            Generate Reports
          </Button>
        </div>

        {/* Tutorial Dialog */}
        <SensitivityTutorial open={showTutorial} onOpenChange={setShowTutorial} />
      </div>
    </FinancialPlatformLayout>;
};
export default SensitivityScenarios;