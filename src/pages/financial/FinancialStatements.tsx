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
      const inputs = transformInputsForCalculation(inputsData, modelData);

      // Calculate financial statements
      const engine = new FinancialCalculationEngine(inputs, modelData.start_year, modelData.end_year);
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

  const transformInputsForCalculation = (inputsData: any[], modelData: FinancialModel): ModelInputData => {
    const inputs: ModelInputData = {
      operational_metrics: {
        credits_generated: {},
        price_per_credit: {},
        credits_issued: {},
      },
      expenses: {
        cogs_percentage: 15,
        feasibility_study_cost: 0,
        pdd_development_cost: 0,
        initial_mrv_cost: 0,
        annual_mrv_cost: 0,
        staff_costs: 0,
        capex: {},
        depreciation_method: 'straight_line',
        depreciation_years: 10,
        income_tax_rate: 25,
      },
      financing: {
        equity_investments: [],
        debt_facilities: [],
        pre_purchase_agreements: [],
      },
      investor_assumptions: {
        discount_rate: 15,
        target_irr: 20,
      },
    };

    // Process inputs by category
    inputsData.forEach(input => {
      const value = input.input_value?.value || input.input_value;

      switch (input.category) {
        case 'operational_metrics':
          if (input.input_key === 'credits_generated' && input.year) {
            inputs.operational_metrics.credits_generated[input.year] = value;
          } else if (input.input_key === 'price_per_credit' && input.year) {
            inputs.operational_metrics.price_per_credit[input.year] = value;
          } else if (input.input_key === 'credits_issued' && input.year) {
            inputs.operational_metrics.credits_issued[input.year] = value;
          }
          break;

        case 'expenses':
          if (input.input_key === 'capex' && input.year) {
            inputs.expenses.capex[input.year] = value;
          } else if (input.input_key in inputs.expenses) {
            (inputs.expenses as any)[input.input_key] = value;
          }
          break;

        case 'financing':
          if (input.input_key === 'equity_investment') {
            inputs.financing.equity_investments.push(input.input_value);
          } else if (input.input_key === 'debt_facility') {
            inputs.financing.debt_facilities.push(input.input_value);
          } else if (input.input_key === 'pre_purchase_agreement') {
            inputs.financing.pre_purchase_agreements.push(input.input_value);
          }
          break;

        case 'investor_assumptions':
          if (input.input_key in inputs.investor_assumptions) {
            (inputs.investor_assumptions as any)[input.input_key] = value;
          }
          break;
      }
    });

    return inputs;
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
                  <CardDescription>Project IRR</CardDescription>
                  <CardTitle className="text-2xl">
                    {statements.metrics.irr.toFixed(1)}%
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Financial Statements Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="income">Income Statement</TabsTrigger>
                <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
                <TabsTrigger value="cashflow">Cash Flow Statement</TabsTrigger>
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