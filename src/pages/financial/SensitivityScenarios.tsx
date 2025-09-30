import { useState, useEffect, useMemo } from 'react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FinancialCalculationEngine, ModelInputData } from '@/lib/financial/calculationEngine';
import { calculateComprehensiveMetrics } from '@/lib/financial/metricsCalculator';
import type { ComprehensiveMetrics } from '@/lib/financial/metricsTypes';
import { toEngineInputs, fromEngineToUI } from '@/lib/financial/uiAdapter';

interface SensitivityVariable {
  key: string;
  name: string;
  category: string;
  baseValue: number;
  currentValue: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  format: 'currency' | 'percentage' | 'number';
  description?: string;
}

interface Scenario {
  id: string;
  name: string;
  isBaseCase: boolean;
  variables: Record<string, number>;
  metrics?: ComprehensiveMetrics;
}

const SensitivityScenarios = () => {
  const { id: modelId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelData, setModelData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('sensitivity');
  
  // Sensitivity Analysis State
  const [sensitivities, setSensitivities] = useState<SensitivityVariable[]>([]);
  const [baseMetrics, setBaseMetrics] = useState<ComprehensiveMetrics | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<ComprehensiveMetrics | null>(null);
  
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

      // Fetch all model inputs
      const { data: inputs, error: inputsError } = await supabase
        .from('model_inputs')
        .select('*')
        .eq('model_id', modelId);

      if (inputsError) throw inputsError;

      const modelInputs = transformInputsToModel(inputs || [], model);
      setModelData(modelInputs);
      
      // Initialize sensitivities with base values
      await initializeSensitivities(modelInputs, model);
      
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

  const transformInputsToModel = (inputs: any[], model: any) => {
    const getInputValue = (category: string, key: string, defaultValue: any = null) => {
      const input = inputs.find(i => i.category === category && i.input_key === key);
      if (!input?.input_value) return defaultValue;
      
      // Extract the actual value from the {value: X} structure
      const inputValue = input.input_value;
      return typeof inputValue === 'object' && 'value' in inputValue 
        ? inputValue.value 
        : inputValue;
    };

    // Helper to ensure value is an array of correct length
    const ensureArray = (value: any, length: number, defaultItem: any = 0) => {
      if (Array.isArray(value) && value.length === length) return value;
      if (Array.isArray(value)) return [...value, ...Array(length - value.length).fill(defaultItem)].slice(0, length);
      return Array(length).fill(value ?? defaultItem);
    };

    const years = [];
    for (let year = model.start_year; year <= model.end_year; year++) {
      years.push(year);
    }
    const L = years.length;

    // Get raw values from database
    const creditsGenerated = getInputValue('operational_metrics', 'credits_generated', Array(L).fill(10000));
    const creditPrice = getInputValue('operational_metrics', 'price_per_credit', Array(L).fill(15));
    const staffCostsVal = getInputValue('expenses', 'staff_costs', Array(L).fill(50000));
    const mrvCostsVal = getInputValue('expenses', 'mrv_costs', Array(L).fill(20000));
    const capexVal = getInputValue('expenses', 'capex', Array(L).fill(0));
    const pddVal = getInputValue('expenses', 'pdd_costs', Array(L).fill(0));
    const feasibilityVal = getInputValue('expenses', 'feasibility_costs', Array(L).fill(0));
    const depreciationVal = getInputValue('advanced', 'depreciation', Array(L).fill(0));
    const issuanceVal = getInputValue('operational_metrics', 'issuance_flag', Array(L).fill(1));
    
    const equityVal = getInputValue('financing', 'equity_injection', Array(L).fill(0));
    const debtVal = getInputValue('financing', 'debt_draw', Array(L).fill(0));
    const purchaseAmountVal = getInputValue('financing', 'purchase_amount', Array(L).fill(0));

    // Return in the exact format toEngineInputs expects
    return {
      years,
      
      // Operational - arrays
      issue: ensureArray(issuanceVal, L, 1).map((v: any) => v === 1 || v === true),
      credits_generated: ensureArray(creditsGenerated, L, 10000),
      price_per_credit: ensureArray(creditPrice, L, 15),
      
      // Expenses - arrays (UI shows as positive, will be negated by toEngineInputs)
      feasibility_costs: ensureArray(feasibilityVal, L, 0),
      pdd_costs: ensureArray(pddVal, L, 0),
      mrv_costs: ensureArray(mrvCostsVal, L, 20000),
      staff_costs: ensureArray(staffCostsVal, L, 50000),
      depreciation: ensureArray(depreciationVal, L, 0),
      capex: ensureArray(capexVal, L, 0),
      
      // Rates - scalars (as percentages for UI)
      ar_rate: getInputValue('expenses', 'ar_rate', 10),
      ap_rate: getInputValue('expenses', 'ap_rate', 8),
      cogs_rate: getInputValue('expenses', 'cogs_rate', 10),
      income_tax_rate: getInputValue('expenses', 'income_tax_rate', 25),
      
      // Financing - scalars and arrays
      interest_rate: getInputValue('financing', 'interest_rate', 7.5),
      debt_duration_years: getInputValue('financing', 'debt_duration_years', 5),
      equity_injection: ensureArray(equityVal, L, 0),
      debt_draw: ensureArray(debtVal, L, 0),
      
      // Pre-purchase - array and scalar
      purchase_amount: ensureArray(purchaseAmountVal, L, 0),
      purchase_share: getInputValue('financing', 'purchase_share', 0),
      
      // Other scalars
      opening_cash_y1: getInputValue('financing', 'opening_cash_y1', 0),
      discount_rate: getInputValue('financing', 'discount_rate', 12),
      initial_equity_t0: getInputValue('financing', 'initial_equity_t0', 100000),
      initial_ppe: getInputValue('financing', 'initial_ppe', 0),
    };
  };

  const initializeSensitivities = async (modelInputs: any, model: any) => {
    const years = modelInputs.years.length;
    
    // Get first-year values for arrays
    const getFirstValue = (val: any) => Array.isArray(val) ? val[0] : val;
    const getArraySum = (val: any) => Array.isArray(val) ? val.reduce((a, b) => a + b, 0) : val;

    const sensitivityVars: SensitivityVariable[] = [
      // Revenue & Pricing
      {
        key: 'carbonCreditPrice',
        name: 'Carbon Credit Price',
        category: 'Revenue & Pricing',
        baseValue: getFirstValue(modelInputs.price_per_credit),
        currentValue: getFirstValue(modelInputs.price_per_credit),
        unit: '$/tCO2e',
        min: 5,
        max: 100,
        step: 1,
        format: 'currency',
        description: 'Price per carbon credit (Year 1)'
      },
      {
        key: 'annualCreditsGenerated',
        name: 'Annual Credits Volume',
        category: 'Revenue & Pricing',
        baseValue: getFirstValue(modelInputs.credits_generated),
        currentValue: getFirstValue(modelInputs.credits_generated),
        unit: 'tCO2e/year',
        min: 1000,
        max: 200000,
        step: 1000,
        format: 'number',
        description: 'Volume of credits generated per year'
      },
      {
        key: 'prePurchaseShare',
        name: 'Pre-purchase Agreement %',
        category: 'Revenue & Pricing',
        baseValue: modelInputs.purchase_share,
        currentValue: modelInputs.purchase_share,
        unit: '%',
        min: 0,
        max: 100,
        step: 5,
        format: 'percentage',
        description: 'Percentage of credits sold via pre-purchase'
      },
      {
        key: 'prePurchasePremium',
        name: 'Pre-purchase Premium',
        category: 'Revenue & Pricing',
        baseValue: modelInputs.purchase_amount,
        currentValue: modelInputs.purchase_amount,
        unit: '%',
        min: -50,
        max: 50,
        step: 5,
        format: 'percentage',
        description: 'Premium/discount for pre-purchase agreements'
      },
      
      // Operating Costs
      {
        key: 'staffCosts',
        name: 'Staff Costs',
        category: 'Operating Costs',
        baseValue: Math.abs(getFirstValue(modelInputs.staff_costs)),
        currentValue: Math.abs(getFirstValue(modelInputs.staff_costs)),
        unit: '$/year',
        min: 10000,
        max: 500000,
        step: 5000,
        format: 'currency',
        description: 'Annual staff costs (Year 1)'
      },
      {
        key: 'mrvCosts',
        name: 'MRV Costs',
        category: 'Operating Costs',
        baseValue: Math.abs(getFirstValue(modelInputs.mrv_costs)),
        currentValue: Math.abs(getFirstValue(modelInputs.mrv_costs)),
        unit: '$/year',
        min: 5000,
        max: 200000,
        step: 2500,
        format: 'currency',
        description: 'Monitoring, Reporting & Verification costs'
      },
      
      // Capital & Development
      {
        key: 'capitalExpenditure',
        name: 'CAPEX',
        category: 'Capital & Development',
        baseValue: Math.abs(getFirstValue(modelInputs.capex)),
        currentValue: Math.abs(getFirstValue(modelInputs.capex)),
        unit: '$',
        min: 100000,
        max: 10000000,
        step: 50000,
        format: 'currency',
        description: 'Initial capital expenditure'
      },
      {
        key: 'pddCost',
        name: 'PDD Cost',
        category: 'Capital & Development',
        baseValue: Math.abs(getFirstValue(modelInputs.pdd_costs)),
        currentValue: Math.abs(getFirstValue(modelInputs.pdd_costs)),
        unit: '$',
        min: 10000,
        max: 200000,
        step: 5000,
        format: 'currency',
        description: 'Project Design Document costs'
      },
      {
        key: 'feasibilityCost',
        name: 'Feasibility Study Cost',
        category: 'Capital & Development',
        baseValue: Math.abs(getFirstValue(modelInputs.feasibility_costs)),
        currentValue: Math.abs(getFirstValue(modelInputs.feasibility_costs)),
        unit: '$',
        min: 5000,
        max: 150000,
        step: 5000,
        format: 'currency',
        description: 'Feasibility study costs'
      },
      {
        key: 'depreciationYears',
        name: 'Depreciation Period',
        category: 'Capital & Development',
        baseValue: modelInputs.depreciation,
        currentValue: modelInputs.depreciation,
        unit: 'years',
        min: 3,
        max: 20,
        step: 1,
        format: 'number',
        description: 'Asset depreciation period'
      },
      
      // Financing
      {
        key: 'debtAmount',
        name: 'Debt Amount',
        category: 'Financing',
        baseValue: Math.abs(getFirstValue(modelInputs.debt_draw)),
        currentValue: Math.abs(getFirstValue(modelInputs.debt_draw)),
        unit: '$',
        min: 0,
        max: 5000000,
        step: 50000,
        format: 'currency',
        description: 'Total debt borrowed'
      },
      {
        key: 'debtInterestRate',
        name: 'Interest Rate',
        category: 'Financing',
        baseValue: modelInputs.interest_rate,
        currentValue: modelInputs.interest_rate,
        unit: '%',
        min: 0,
        max: 25,
        step: 0.5,
        format: 'percentage',
        description: 'Annual interest rate on debt'
      },
      {
        key: 'debtTenor',
        name: 'Debt Tenor',
        category: 'Financing',
        baseValue: modelInputs.debt_duration_years,
        currentValue: modelInputs.debt_duration_years,
        unit: 'years',
        min: 1,
        max: 15,
        step: 1,
        format: 'number',
        description: 'Debt repayment period'
      },
      {
        key: 'equityInjection',
        name: 'Equity Investment',
        category: 'Financing',
        baseValue: Math.abs(getFirstValue(modelInputs.equity_injection)),
        currentValue: Math.abs(getFirstValue(modelInputs.equity_injection)),
        unit: '$',
        min: 100000,
        max: 10000000,
        step: 50000,
        format: 'currency',
        description: 'Initial equity investment'
      },
      
      // Financial Assumptions
      {
        key: 'discountRate',
        name: 'Discount Rate (WACC)',
        category: 'Financial Assumptions',
        baseValue: modelInputs.discount_rate,
        currentValue: modelInputs.discount_rate,
        unit: '%',
        min: 5,
        max: 30,
        step: 0.5,
        format: 'percentage',
        description: 'Weighted average cost of capital'
      },
      {
        key: 'taxRate',
        name: 'Tax Rate',
        category: 'Financial Assumptions',
        baseValue: modelInputs.income_tax_rate,
        currentValue: modelInputs.income_tax_rate,
        unit: '%',
        min: 0,
        max: 50,
        step: 1,
        format: 'percentage',
        description: 'Corporate tax rate'
      },
      
      // Working Capital
      {
        key: 'openingCash',
        name: 'Opening Cash Balance',
        category: 'Working Capital',
        baseValue: modelInputs.opening_cash_y1,
        currentValue: modelInputs.opening_cash_y1,
        unit: '$',
        min: 0,
        max: 1000000,
        step: 10000,
        format: 'currency',
        description: 'Initial cash balance'
      },
      {
        key: 'arRate',
        name: 'Accounts Receivable Days',
        category: 'Working Capital',
        baseValue: modelInputs.ar_rate,
        currentValue: modelInputs.ar_rate,
        unit: 'days',
        min: 0,
        max: 180,
        step: 5,
        format: 'number',
        description: 'Days to collect receivables'
      },
      {
        key: 'apRate',
        name: 'Accounts Payable Days',
        category: 'Working Capital',
        baseValue: modelInputs.ap_rate,
        currentValue: modelInputs.ap_rate,
        unit: 'days',
        min: 0,
        max: 180,
        step: 5,
        format: 'number',
        description: 'Days to pay suppliers'
      },
    ];

    setSensitivities(sensitivityVars);
    
    // Calculate base case metrics
    await calculateMetrics(sensitivityVars, modelInputs, true);
  };

  const calculateMetrics = async (variables: SensitivityVariable[], sourceModelData: any, isBaseCase = false) => {
    try {
      setCalculating(true);
      
      // Build updated model inputs from the passed source data
      const updatedInputs = { ...sourceModelData };
      
      variables.forEach(v => {
        const value = v.currentValue;
        
        // Handle different variable types
        if (v.key === 'carbonCreditPrice' || v.key === 'annualCreditsGenerated') {
          // Array values - apply to all years
          updatedInputs[v.key] = Array(sourceModelData.years.length).fill(value);
        } else if (v.key === 'staffCosts' || v.key === 'mrvCosts' || v.key === 'otherOpex') {
          // Operating costs - negative values
          updatedInputs[v.key] = Array(sourceModelData.years.length).fill(-Math.abs(value));
        } else if (v.key === 'capitalExpenditure' || v.key === 'pddCost' || v.key === 'feasibilityCost' || v.key === 'equityInjection') {
          // One-time costs - negative
          updatedInputs[v.key] = -Math.abs(value);
        } else if (v.key === 'debtAmount') {
          // Debt can be zero or positive
          updatedInputs[v.key] = value;
        } else {
          // Direct values
          updatedInputs[v.key] = value;
        }
      });

      // Convert to engine format and calculate
      const engineInputs = toEngineInputs(updatedInputs);
      const engine = new FinancialCalculationEngine(engineInputs);
      const results = engine.calculateFinancialStatements();
      
      // Transform to yearly data using correct snake_case property names
      const yearlyData = engineInputs.years.map((year, idx) => {
        const is = results.incomeStatements[idx];
        const bs = results.balanceSheets[idx];
        const cf = results.cashFlowStatements[idx];
        const ds = results.debtSchedule[idx];
        const cs = results.carbonStream[idx];
        const fcf = results.freeCashFlow[idx];
        
        return {
          year,
          totalRevenue: is.total_revenue,
          spotRevenue: is.spot_revenue,
          prepurchaseRevenue: is.pre_purchase_revenue,
          cogs: is.cogs,
          opexTotal: is.opex_total,
          ebitda: is.ebitda,
          depreciation: is.depreciation,
          interestExpense: is.interest_expense,
          earningsBeforeTax: is.earnings_before_tax,
          incomeTax: is.income_tax,
          netIncome: is.net_income,
          cash: bs.cash,
          accountsReceivable: bs.accounts_receivable,
          ppeNet: bs.ppe_net,
          totalAssets: bs.total_assets,
          accountsPayable: bs.accounts_payable,
          unearnedRevenue: bs.unearned_revenue,
          debtBalance: bs.debt_balance,
          totalLiabilities: bs.total_liabilities,
          totalEquity: bs.total_equity,
          operatingCashFlow: cf.operating_cash_flow,
          investingCashFlow: cf.investing_cash_flow,
          financingCashFlow: cf.financing_cash_flow,
          netCashFlow: cf.net_change_cash,
          debtOpening: ds.beginning_balance,
          debtDrawdown: ds.draw,
          debtPrincipal: ds.principal_payment,
          debtInterest: ds.interest_expense,
          debtClosing: ds.ending_balance,
          dscr: ds.dscr,
          creditsGenerated: is.credits_generated,
          creditsIssued: is.credits_issued,
          spotVolume: is.credits_issued - is.purchased_credits,
          prepurchaseVolume: is.purchased_credits,
          spotPrice: is.price_per_credit,
          prepurchasePrice: is.implied_purchase_price,
          fcfe: fcf.fcf_to_equity,
        };
      });

      const comprehensiveMetrics = calculateComprehensiveMetrics(
        yearlyData,
        engineInputs.discount_rate,
        engineInputs
      );

      if (isBaseCase) {
        setBaseMetrics(comprehensiveMetrics);
      }
      setCurrentMetrics(comprehensiveMetrics);

    } catch (error) {
      console.error('Error calculating metrics:', error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate financial metrics. Please check your inputs.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

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

  const handleSensitivityChange = async (key: string, value: number[]) => {
    const updatedSensitivities = sensitivities.map(s => 
      s.key === key ? { ...s, currentValue: value[0] } : s
    );
    setSensitivities(updatedSensitivities);
    
    // Recalculate metrics
    await calculateMetrics(updatedSensitivities, modelData);
  };

  const resetSensitivities = () => {
    const resetSensitivities = sensitivities.map(s => ({
      ...s,
      currentValue: s.baseValue
    }));
    setSensitivities(resetSensitivities);
    calculateMetrics(resetSensitivities, modelData);
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
        .insert([{
          model_id: modelId,
          scenario_name: newScenarioName,
          scenario_data: scenarioData as any,
          is_base_case: false
        }]);

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

  const loadScenario = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const updatedSensitivities = sensitivities.map(s => ({
      ...s,
      currentValue: scenario.variables[s.key] ?? s.baseValue
    }));

    setSensitivities(updatedSensitivities);
    setSelectedScenario(scenarioId);
    
    // Always recalculate to ensure latest engine logic
    await calculateMetrics(updatedSensitivities, modelData);
  };

  const deleteScenario = async (scenarioId: string) => {
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

  const applyTemplate = async (templateName: string) => {
    let multipliers: Record<string, number> = {};
    
    switch (templateName) {
      case 'conservative':
        multipliers = {
          carbonCreditPrice: 0.7,
          annualCreditsGenerated: 0.8,
          staffCosts: 1.2,
          mrvCosts: 1.2,
          otherOpex: 1.3,
          prePurchaseShare: 0.5,
        };
        break;
      case 'optimistic':
        multipliers = {
          carbonCreditPrice: 1.4,
          annualCreditsGenerated: 1.2,
          staffCosts: 0.9,
          mrvCosts: 0.85,
          otherOpex: 0.8,
          prePurchaseShare: 1.5,
        };
        break;
      case 'highVolume':
        multipliers = {
          annualCreditsGenerated: 2.0,
          carbonCreditPrice: 0.95,
          staffCosts: 1.1,
          capitalExpenditure: 1.3,
        };
        break;
      case 'delayedIssuance':
        multipliers = {
          carbonCreditPrice: 1.1,
          mrvCosts: 1.3,
          openingCash: 1.5,
        };
        break;
      case 'highDebt':
        multipliers = {
          debtAmount: 2.0,
          debtInterestRate: 1.2,
          equityInjection: 0.6,
        };
        break;
    }

    const updatedSensitivities = sensitivities.map(s => {
      const multiplier = multipliers[s.key] || 1;
      let newValue = s.baseValue * multiplier;
      
      // Clamp to min/max
      newValue = Math.max(s.min, Math.min(s.max, newValue));
      
      return { ...s, currentValue: newValue };
    });

    setSensitivities(updatedSensitivities);
    await calculateMetrics(updatedSensitivities, modelData);
    setActiveTab('sensitivity');
  };

  const formatValue = (value: number | undefined, format: 'currency' | 'percentage' | 'number', unit?: string) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
      default:
        return `${value.toLocaleString()}`;
    }
  };

  const getMetricChange = (current: number, base: number) => {
    if (!base || base === 0) return 0;
    return ((current - base) / base) * 100;
  };

  const getMetricChangeColor = (change: number, higherIsBetter: boolean = true) => {
    const isPositive = higherIsBetter ? change > 0 : change < 0;
    if (Math.abs(change) < 0.1) return 'text-muted-foreground';
    return isPositive ? 'text-[hsl(142,76%,36%)]' : 'text-red-600';
  };

  const formatMetricValue = (value: number | null | undefined, format: string) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    
    switch (format) {
      case 'currency':
        return `$${(value / 1000000).toFixed(2)}M`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'years':
        return value > 100 ? '> horizon' : `${value.toFixed(1)} yrs`;
      case 'ratio':
        return `${value.toFixed(2)}x`;
      case 'number':
        return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
      default:
        return value.toFixed(2);
    }
  };

  // Group sensitivities by category
  const groupedSensitivities = useMemo(() => {
    const groups: Record<string, SensitivityVariable[]> = {};
    sensitivities.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [sensitivities]);

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
          {/* Comprehensive Metrics Dashboard */}
          {currentMetrics && baseMetrics && (
            <>
              {/* Returns & NPV */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Returns & NPV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Equity NPV', current: currentMetrics.returns.equity.npv, base: baseMetrics.returns.equity.npv, format: 'currency', higherBetter: true },
                      { label: 'Equity IRR', current: currentMetrics.returns.equity.irr, base: baseMetrics.returns.equity.irr, format: 'percentage', higherBetter: true },
                      { label: 'Project NPV', current: currentMetrics.returns.project.npv, base: baseMetrics.returns.project.npv, format: 'currency', higherBetter: true },
                      { label: 'Project IRR', current: currentMetrics.returns.project.irr, base: baseMetrics.returns.project.irr, format: 'percentage', higherBetter: true },
                    ].map(({ label, current, base, format, higherBetter }) => {
                      const change = getMetricChange(current, base);
                      return (
                        <div key={label} className="space-y-1">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="text-2xl font-mono">{formatMetricValue(current, format)}</p>
                          {Math.abs(change) > 0.1 && (
                            <p className={`text-sm flex items-center gap-1 ${getMetricChangeColor(change, higherBetter)}`}>
                              {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {change > 0 ? '+' : ''}{change.toFixed(1)}% vs base
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Cash Health & Payback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cash Health & Payback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Peak Funding', current: currentMetrics.cashHealth.peakFunding, base: baseMetrics.cashHealth.peakFunding, format: 'currency', higherBetter: false },
                      { label: 'Min Cash Balance', current: currentMetrics.cashHealth.minCashEnd, base: baseMetrics.cashHealth.minCashEnd, format: 'currency', higherBetter: true },
                      { label: 'Payback Period', current: currentMetrics.returns.equity.payback, base: baseMetrics.returns.equity.payback, format: 'years', higherBetter: false },
                      { label: 'Discounted Payback', current: currentMetrics.returns.equity.discountedPayback, base: baseMetrics.returns.equity.discountedPayback, format: 'years', higherBetter: false },
                    ].map(({ label, current, base, format, higherBetter }) => {
                      const change = getMetricChange(current, base);
                      return (
                        <div key={label} className="space-y-1">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="text-2xl font-mono">{formatMetricValue(current, format)}</p>
                          {Math.abs(change) > 0.1 && (
                            <p className={`text-sm flex items-center gap-1 ${getMetricChangeColor(change, higherBetter)}`}>
                              {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {change > 0 ? '+' : ''}{change.toFixed(1)}% vs base
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Profitability & Margins */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Profitability & Margins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Gross Margin', current: currentMetrics.profitability.yearly[0]?.grossMargin, base: baseMetrics.profitability.yearly[0]?.grossMargin, format: 'percentage', higherBetter: true },
                      { label: 'EBITDA Margin', current: currentMetrics.profitability.yearly[0]?.ebitdaMargin, base: baseMetrics.profitability.yearly[0]?.ebitdaMargin, format: 'percentage', higherBetter: true },
                      { label: 'Net Margin', current: currentMetrics.profitability.yearly[0]?.netMargin, base: baseMetrics.profitability.yearly[0]?.netMargin, format: 'percentage', higherBetter: true },
                      { label: 'Total Net Income', current: currentMetrics.profitability.total.netIncome, base: baseMetrics.profitability.total.netIncome, format: 'currency', higherBetter: true },
                    ].map(({ label, current, base, format, higherBetter }) => {
                      const change = getMetricChange(current, base);
                      return (
                        <div key={label} className="space-y-1">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="text-2xl font-mono">{formatMetricValue(current, format)}</p>
                          {Math.abs(change) > 0.1 && (
                            <p className={`text-sm flex items-center gap-1 ${getMetricChangeColor(change, higherBetter)}`}>
                              {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {change > 0 ? '+' : ''}{change.toFixed(1)}% vs base
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Carbon KPIs & Break-even */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Carbon KPIs & Break-even
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Credits Issued', current: currentMetrics.carbonKPIs.totalIssued, base: baseMetrics.carbonKPIs.totalIssued, format: 'number', higherBetter: true },
                      { label: 'Avg Price Realized', current: currentMetrics.carbonKPIs.yearly[0]?.waPrice, base: baseMetrics.carbonKPIs.yearly[0]?.waPrice, format: 'currency', higherBetter: true },
                      { label: 'Break-even Price', current: currentMetrics.breakEven.yearly[0]?.bePriceOper, base: baseMetrics.breakEven.yearly[0]?.bePriceOper, format: 'currency', higherBetter: false },
                      { label: 'Break-even Volume', current: currentMetrics.breakEven.yearly[0]?.beVolumeOper, base: baseMetrics.breakEven.yearly[0]?.beVolumeOper, format: 'number', higherBetter: false },
                    ].map(({ label, current, base, format, higherBetter }) => {
                      const change = getMetricChange(current, base);
                      return (
                        <div key={label} className="space-y-1">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="text-2xl font-mono">{formatMetricValue(current, format)}</p>
                          {Math.abs(change) > 0.1 && (
                            <p className={`text-sm flex items-center gap-1 ${getMetricChangeColor(change, higherBetter)}`}>
                              {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {change > 0 ? '+' : ''}{change.toFixed(1)}% vs base
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Debt Metrics (if applicable) */}
              {currentMetrics.debt.yearly.some(y => y.draw > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Debt Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Min DSCR', current: currentMetrics.debt.minDSCR, base: baseMetrics.debt.minDSCR, format: 'ratio', higherBetter: true },
                        { label: 'Avg DSCR', current: currentMetrics.debt.yearly.reduce((sum, y) => sum + (y.dscr || 0), 0) / currentMetrics.debt.yearly.filter(y => y.dscr).length, base: baseMetrics.debt.yearly.reduce((sum, y) => sum + (y.dscr || 0), 0) / baseMetrics.debt.yearly.filter(y => y.dscr).length, format: 'ratio', higherBetter: true },
                        { label: 'Total Interest', current: currentMetrics.debt.yearly.reduce((sum, y) => sum + y.interest, 0), base: baseMetrics.debt.yearly.reduce((sum, y) => sum + y.interest, 0), format: 'currency', higherBetter: false },
                        { label: 'Debt-to-Equity', current: currentMetrics.liquidity.yearly[0]?.debtToEquity || 0, base: baseMetrics.liquidity.yearly[0]?.debtToEquity || 0, format: 'ratio', higherBetter: false },
                      ].map(({ label, current, base, format, higherBetter }) => {
                        const change = getMetricChange(current, base);
                        return (
                          <div key={label} className="space-y-1">
                            <p className="text-sm text-muted-foreground">{label}</p>
                            <p className="text-2xl font-mono">{formatMetricValue(current, format)}</p>
                            {Math.abs(change) > 0.1 && (
                              <p className={`text-sm flex items-center gap-1 ${getMetricChangeColor(change, higherBetter)}`}>
                                {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {change > 0 ? '+' : ''}{change.toFixed(1)}% vs base
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {calculating && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Recalculating financial metrics...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sensitivity Variables by Category */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sensitivity Variables</CardTitle>
                <Button variant="outline" size="sm" onClick={resetSensitivities} disabled={calculating}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Base Case
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={Object.keys(groupedSensitivities)} className="w-full">
                {Object.entries(groupedSensitivities).map(([category, variables]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-sm font-semibold">
                      {category} ({variables.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6 pt-2">
                        {variables.map((variable) => {
                          const changePercent = ((variable.currentValue - variable.baseValue) / variable.baseValue) * 100;
                          return (
                            <div key={variable.key} className="space-y-3 pb-4 border-b last:border-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <Label className="text-sm font-medium">{variable.name}</Label>
                                  {variable.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{variable.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm flex-shrink-0">
                                  <span className="text-muted-foreground">
                                    Base: {formatValue(variable.baseValue, variable.format)}
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
                                  disabled={calculating}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{formatValue(variable.min, variable.format)}</span>
                                  <span className="font-medium">
                                    Current: {formatValue(variable.currentValue, variable.format)}
                                  </span>
                                  <span>{formatValue(variable.max, variable.format)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
                  onKeyDown={(e) => e.key === 'Enter' && saveScenario()}
                />
                <Button onClick={saveScenario} disabled={calculating || !newScenarioName.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          {/* Quick Scenario Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Scenario Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { id: 'conservative', name: 'Conservative Case', desc: 'Lower prices, higher costs, reduced volume' },
                  { id: 'optimistic', name: 'Optimistic Case', desc: 'Higher prices, lower costs, increased volume' },
                  { id: 'highVolume', name: 'High Volume Case', desc: 'Focus on scale advantages with doubled volume' },
                  { id: 'delayedIssuance', name: 'Delayed Issuance', desc: 'Higher MRV costs, increased cash buffer' },
                  { id: 'highDebt', name: 'High Leverage', desc: 'Increased debt financing, reduced equity' },
                ].map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => applyTemplate(template.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-1">{template.name}</h3>
                      <p className="text-xs text-muted-foreground">{template.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

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
              {scenarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No saved scenarios yet. Create one from the Sensitivity Analysis tab.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scenarios.map((scenario) => (
                    <div key={scenario.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
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
                            className="h-4 w-4"
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{scenario.name}</span>
                            {scenario.isBaseCase && <Badge variant="secondary">Base Case</Badge>}
                          </div>
                          {scenario.metrics && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Equity NPV: {formatMetricValue(scenario.metrics.returns.equity.npv, 'currency')} | 
                              IRR: {formatMetricValue(scenario.metrics.returns.equity.irr, 'percentage')} |
                              Payback: {formatMetricValue(scenario.metrics.returns.equity.payback, 'years')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!scenario.isBaseCase && (
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
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                        <th className="text-left p-3 font-bold">Metric</th>
                        {comparedScenarios.map(scenarioId => {
                          const scenario = scenarios.find(s => s.id === scenarioId);
                          return (
                            <th key={scenarioId} className="text-center p-3 font-bold">
                              {scenario?.name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'equityNPV', label: 'Equity NPV', path: 'returns.equity.npv', format: 'currency' },
                        { key: 'equityIRR', label: 'Equity IRR', path: 'returns.equity.irr', format: 'percentage' },
                        { key: 'projectNPV', label: 'Project NPV', path: 'returns.project.npv', format: 'currency' },
                        { key: 'payback', label: 'Payback Period', path: 'returns.equity.payback', format: 'years' },
                        { key: 'peakFunding', label: 'Peak Funding', path: 'cashHealth.peakFunding', format: 'currency' },
                        { key: 'grossMargin', label: 'Gross Margin (Yr 1)', path: 'profitability.yearly.0.grossMargin', format: 'percentage' },
                        { key: 'netMargin', label: 'Net Margin (Yr 1)', path: 'profitability.yearly.0.netMargin', format: 'percentage' },
                        { key: 'creditsIssued', label: 'Credits Issued', path: 'carbonKPIs.totalIssued', format: 'number' },
                        { key: 'breakEvenPrice', label: 'Break-even Price (Yr 1)', path: 'breakEven.yearly.0.bePriceOper', format: 'currency' },
                      ].map(({ key, label, path, format }) => (
                        <tr key={key} className="border-b">
                          <td className="p-3 font-medium">{label}</td>
                          {comparedScenarios.map(scenarioId => {
                            const scenario = scenarios.find(s => s.id === scenarioId);
                            const value = path.split('.').reduce((obj, key) => obj?.[key], scenario?.metrics as any);
                            return (
                              <td key={scenarioId} className="p-3 text-center">
                                {formatMetricValue(value, format)}
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
