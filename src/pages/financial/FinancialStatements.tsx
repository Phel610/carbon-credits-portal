import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Calculator,
  TrendingUp,
  BarChart3,
  Zap,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FinancialCalculationEngine, ModelInputData } from '@/lib/financial/calculationEngine';
import IncomeStatementTable from '@/components/financial/IncomeStatementTable';
import BalanceSheetTable from '@/components/financial/BalanceSheetTable';
import CashFlowStatementTable from '@/components/financial/CashFlowStatementTable';
import DebtScheduleTable from '@/components/financial/DebtScheduleTable';
import CarbonStreamTable from '@/components/financial/CarbonStreamTable';
import FreeCashFlowTable from '@/components/financial/FreeCashFlowTable';

interface FinancialModel {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
}

const FinancialStatements = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [model, setModel] = useState<FinancialModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('income');
  const [statements, setStatements] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchModelAndCalculate();
    }
  }, [id, user]);

  const fetchModelAndCalculate = async () => {
    if (!user || !id) return;

    setLoading(true);
    try {
      // Fetch model
      const { data: modelData, error: modelError } = await supabase
        .from('financial_models')
        .select('*')
        .eq('id', id)
        .single();

      if (modelError) throw modelError;
      setModel(modelData);

      // Fetch and calculate statements
      await calculateStatements(modelData);
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

  const calculateStatements = async (modelData: FinancialModel) => {
    setCalculating(true);
    try {
      // Fetch all inputs for this model
      const { data: inputsData, error: inputsError } = await supabase
        .from('model_inputs')
        .select('*')
        .eq('model_id', modelData.id);

      if (inputsError) throw inputsError;

      // Transform inputs into calculation format
      const inputs = transformInputsForCalculation(inputsData);

      // Calculate financial statements
      const engine = new FinancialCalculationEngine(inputs);
      const calculatedStatements = engine.calculateFinancialStatements();

      // Save calculated statements to database
      await saveStatementsToDatabase(modelData.id, calculatedStatements);

      setStatements(calculatedStatements);
    } catch (error) {
      console.error('Error calculating statements:', error);
      toast({
        title: "Calculation error",
        description: "Failed to calculate financial statements. Please check your inputs.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  // Transform inputs for new calculation engine (matches Excel specification)
  const transformInputsForCalculation = (inputs: any[]): any => {
    const years = Array.from({ length: model.end_year - model.start_year + 1 }, (_, i) => model.start_year + i);
    
    // Initialize arrays for each year
    const initializeYearArray = (defaultValue = 0) => 
      years.reduce((acc, year) => ({ ...acc, [year]: defaultValue }), {});
    
    const transformed = {
      years,
      // Operational metrics
      credits_generated: [],
      price_per_credit: [],
      issuance_flag: [],
      
      // Expenses (negative per Excel convention)
      cogs_rate: 0.15,
      feasibility_costs: [],
      pdd_costs: [],
      mrv_costs: [],
      staff_costs: [],
      depreciation: [],
      income_tax_rate: 0.25,
      
      // Working capital rates (NEW)
      ar_rate: 0.05,
      ap_rate: 0.10,
      
      // CAPEX and financing
      capex: [],
      equity_injection: [],
      interest_rate: 0.08,
      debt_duration_years: 5,
      debt_draw: [],
      
      // Pre-purchase agreements (NEW)
      purchase_amount: [],
      purchase_share: 0.30,
      
      // Returns
      discount_rate: 0.12,
      initial_equity_t0: 0,
      opening_cash_y1: 0,
    };

    // Organize inputs by category and key
    const inputsByCategory: { [key: string]: { [key: string]: any[] } } = {};
    inputs.forEach(input => {
      if (!inputsByCategory[input.category]) {
        inputsByCategory[input.category] = {};
      }
      if (!inputsByCategory[input.category][input.input_key]) {
        inputsByCategory[input.category][input.input_key] = [];
      }
      inputsByCategory[input.category][input.input_key].push(input);
    });

    // Transform operational metrics
    years.forEach(year => {
      const creditsGenerated = inputsByCategory.operational_metrics?.credits_generated?.find(i => i.year === year);
      const pricePerCredit = inputsByCategory.operational_metrics?.price_per_credit?.find(i => i.year === year);
      const issuanceFlag = inputsByCategory.operational_metrics?.issuance_flag?.find(i => i.year === year);
      
      transformed.credits_generated.push(creditsGenerated?.input_value?.value || 0);
      transformed.price_per_credit.push(pricePerCredit?.input_value?.value || 10);
      transformed.issuance_flag.push(issuanceFlag?.input_value?.value || 0);
    });

    // Transform expenses (with year arrays)
    years.forEach(year => {
      const feasibility = inputsByCategory.expenses?.feasibility_costs?.find(i => i.year === year);
      const pdd = inputsByCategory.expenses?.pdd_costs?.find(i => i.year === year);
      const mrv = inputsByCategory.expenses?.mrv_costs?.find(i => i.year === year);
      const staff = inputsByCategory.expenses?.staff_costs?.find(i => i.year === year);
      const capex = inputsByCategory.expenses?.capex?.find(i => i.year === year);
      const depreciation = inputsByCategory.expenses?.depreciation?.find(i => i.year === year);
      
      transformed.feasibility_costs.push(feasibility?.input_value?.value || 0);
      transformed.pdd_costs.push(pdd?.input_value?.value || 0);  
      transformed.mrv_costs.push(mrv?.input_value?.value || 0);
      transformed.staff_costs.push(staff?.input_value?.value || 0);
      transformed.capex.push(capex?.input_value?.value || 0);
      transformed.depreciation.push(depreciation?.input_value?.value || 0);
    });

    // Transform rates and scalar values
    const cogsRate = inputsByCategory.expenses?.cogs_rate?.[0];
    if (cogsRate) transformed.cogs_rate = cogsRate.input_value.value;

    const arRate = inputsByCategory.expenses?.ar_rate?.[0];
    if (arRate) transformed.ar_rate = arRate.input_value.value;

    const apRate = inputsByCategory.expenses?.ap_rate?.[0];
    if (apRate) transformed.ap_rate = apRate.input_value.value;

    const taxRate = inputsByCategory.expenses?.income_tax_rate?.[0];
    if (taxRate) transformed.income_tax_rate = taxRate.input_value.value;

    // Transform financing
    years.forEach(year => {
      const equity = inputsByCategory.financing?.equity_injection?.find(i => i.year === year);
      const debt = inputsByCategory.financing?.debt_draw?.find(i => i.year === year);
      const purchase = inputsByCategory.financing?.purchase_amount?.find(i => i.year === year);
      
      transformed.equity_injection.push(equity?.input_value?.value || 0);
      transformed.debt_draw.push(debt?.input_value?.value || 0);
      transformed.purchase_amount.push(purchase?.input_value?.value || 0);
    });

    const interestRate = inputsByCategory.financing?.interest_rate?.[0];
    if (interestRate) transformed.interest_rate = interestRate.input_value.value;

    const debtDuration = inputsByCategory.financing?.debt_duration_years?.[0];
    if (debtDuration) transformed.debt_duration_years = debtDuration.input_value.value;

    const purchaseShare = inputsByCategory.financing?.purchase_share?.[0];
    if (purchaseShare) transformed.purchase_share = purchaseShare.input_value.value;

    const discountRate = inputsByCategory.financing?.discount_rate?.[0];
    if (discountRate) transformed.discount_rate = discountRate.input_value.value;

    const initialEquity = inputsByCategory.financing?.initial_equity_t0?.[0];
    if (initialEquity) transformed.initial_equity_t0 = initialEquity.input_value.value;

    const openingCash = inputsByCategory.financing?.opening_cash_y1?.[0];
    if (openingCash) transformed.opening_cash_y1 = openingCash.input_value.value;

    console.log('Transformed inputs for new calculation engine:', transformed);
    return transformed;
  };

  const saveStatementsToDatabase = async (modelId: string, statements: any) => {
    try {
      // Delete existing statements
      await supabase
        .from('financial_statements')
        .delete()
        .eq('model_id', modelId);

      // Prepare statements for database
      const statementRows = [];

      // Income statements
      statements.incomeStatements.forEach((stmt: any) => {
        Object.entries(stmt).forEach(([key, value]) => {
          if (key !== 'year') {
            statementRows.push({
              model_id: modelId,
              statement_type: 'income_statement',
              year: stmt.year,
              line_item: key,
              value: value as number,
            });
          }
        });
      });

      // Balance sheets
      statements.balanceSheets.forEach((stmt: any) => {
        Object.entries(stmt).forEach(([key, value]) => {
          if (key !== 'year') {
            statementRows.push({
              model_id: modelId,
              statement_type: 'balance_sheet',
              year: stmt.year,
              line_item: key,
              value: value as number,
            });
          }
        });
      });

      // Cash flow statements
      statements.cashFlowStatements.forEach((stmt: any) => {
        Object.entries(stmt).forEach(([key, value]) => {
          if (key !== 'year') {
            statementRows.push({
              model_id: modelId,
              statement_type: 'cashflow_statement',
              year: stmt.year,
              line_item: key,
              value: value as number,
            });
          }
        });
      });

      // Insert statements
      const { error: statementsError } = await supabase
        .from('financial_statements')
        .insert(statementRows);

      if (statementsError) throw statementsError;

      // Save financial metrics
      await supabase
        .from('financial_metrics')
        .delete()
        .eq('model_id', modelId);

      const metricsRows = Object.entries(statements.metrics).map(([key, value]) => ({
        model_id: modelId,
        metric_name: key,
        value: value as number,
      }));

      const { error: metricsError } = await supabase
        .from('financial_metrics')
        .insert(metricsRows);

      if (metricsError) throw metricsError;

    } catch (error) {
      console.error('Error saving statements:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Calculator className="h-8 w-8 mx-auto mb-4 animate-spin" />
            <div>Loading financial statements...</div>
          </div>
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
            Back to Model
          </Button>
        </div>

        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{model.name} - Financial Statements</h1>
            <p className="text-muted-foreground">
              Auto-calculated financial statements for {model.start_year}-{model.end_year}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => calculateStatements(model)} 
              disabled={calculating}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
              {calculating ? 'Recalculating...' : 'Recalculate'}
            </Button>
          </div>
        </div>

        {calculating && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Zap className="h-8 w-8 mx-auto mb-4 animate-pulse text-trust" />
                <h3 className="text-lg font-semibold mb-2">Calculating Financial Statements</h3>
                <p className="text-muted-foreground">
                  Processing your inputs and generating comprehensive financial projections...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {statements && !calculating && (
          <>
            {/* Key Metrics Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Revenue</CardDescription>
                  <CardTitle className="text-2xl">
                    ${statements.metrics.total_revenue.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total EBITDA</CardDescription>
                  <CardTitle className="text-2xl">
                    ${statements.metrics.total_ebitda.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Net Present Value</CardDescription>
                  <CardTitle className="text-2xl">
                    ${statements.metrics.npv.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Company IRR</CardDescription>
                  <CardTitle className="text-2xl">
                    {statements.metrics.company_irr.toFixed(1)}%
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Financial Statements Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="income">Income Statement</TabsTrigger>
                <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
                <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                <TabsTrigger value="debt">Debt Schedule</TabsTrigger>
                <TabsTrigger value="carbon">Carbon Stream</TabsTrigger>
                <TabsTrigger value="fcf">Free Cash Flow</TabsTrigger>
              </TabsList>

              <TabsContent value="income">
                <IncomeStatementTable statements={statements.incomeStatements} />
              </TabsContent>

              <TabsContent value="balance">
                <BalanceSheetTable statements={statements.balanceSheets} />
              </TabsContent>

              <TabsContent value="cashflow">
                <CashFlowStatementTable statements={statements.cashFlowStatements} />
              </TabsContent>

              <TabsContent value="debt">
                <DebtScheduleTable statements={statements.debtSchedule} />
              </TabsContent>

              <TabsContent value="carbon">
                <CarbonStreamTable 
                  statements={statements.carbonStream} 
                  investorIRR={statements.metrics.investor_irr}
                />
              </TabsContent>

              <TabsContent value="fcf">
                <FreeCashFlowTable statements={statements.freeCashFlow} />
              </TabsContent>
            </Tabs>
          </>
        )}

        {!statements && !calculating && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Statements Generated</h3>
                <p className="text-muted-foreground mb-4">
                  Financial statements will be generated once you complete your model inputs.
                </p>
                <Button asChild>
                  <a href={`/financial/models/${id}/inputs`}>
                    Complete Model Inputs
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FinancialPlatformLayout>
  );
};

export default FinancialStatements;