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
  CheckCircle,
  Circle,
  Calculator,
  DollarSign,
  TrendingUp,
  Building,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import OperationalMetricsForm from '@/components/financial/OperationalMetricsForm';
import ExpensesForm from '@/components/financial/ExpensesForm';
import FinancingForm from '@/components/financial/FinancingForm';
import { ModelInputsGuide } from '@/components/help/ModelInputsGuide';
import { HelpCircle } from 'lucide-react';


interface FinancialModel {
  id: string;
  name: string;
  country?: string;
  start_year: number;
  end_year: number;
}

const ModelInputs = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [model, setModel] = useState<FinancialModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('operational');
  const [completionStatus, setCompletionStatus] = useState({
    operational: false,
    expenses: false,
    financing: false,
  });
  const [statementsExist, setStatementsExist] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (id) {
      fetchModel();
    }
  }, [id, user]);

  const fetchModel = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('financial_models')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: "Error fetching model",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setModel(data);
      
      // Check if statements exist
      const { data: statements } = await supabase
        .from('financial_statements')
        .select('id')
        .eq('model_id', id)
        .limit(1);
      setStatementsExist(statements && statements.length > 0);
      
      // TODO: Check completion status based on existing inputs
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

  const inputCategories = [
    {
      id: 'operational',
      name: 'Operational Metrics',
      description: 'Credits generated, pricing, and issuance schedule',
      icon: Calculator,
      completed: completionStatus.operational,
    },
    {
      id: 'expenses',
      name: 'Expenses',
      description: 'COGS, development costs, CAPEX, and tax rates',
      icon: DollarSign,
      completed: completionStatus.expenses,
    },
    {
      id: 'financing',
      name: 'Financing Strategy',
      description: 'Equity, debt, and pre-purchase agreements',
      icon: Building,
      completed: completionStatus.financing,
    },
  ];

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading model inputs...</div>
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
            <h1 className="text-3xl font-bold tracking-tight">{model.name} - Inputs</h1>
            <p className="text-muted-foreground">
              Configure all input parameters for your financial model ({model.start_year}-{model.end_year})
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowGuide(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Help Guide
          </Button>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Input Progress</CardTitle>
            <CardDescription>
              Complete all input categories to generate financial statements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {inputCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      activeTab === category.id 
                        ? 'border-trust bg-trust/5' 
                        : 'border-border hover:border-trust/50'
                    }`}
                    onClick={() => setActiveTab(category.id)}
                  >
                    <div className="flex items-start justify-between">
                      <Icon className="h-5 w-5 text-trust" />
                      {category.completed ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <h4 className="font-medium mt-2">{category.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Input Forms */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            {inputCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                {category.completed && <CheckCircle className="h-4 w-4 text-success" />}
                <span className="hidden sm:inline">{category.name}</span>
                <span className="sm:hidden">{category.name.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="operational">
            <OperationalMetricsForm modelId={id!} model={model} />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesForm modelId={id!} model={model} />
          </TabsContent>

          <TabsContent value="financing">
            <FinancingForm modelId={id!} model={model} />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => navigate(`/financial/models/${id}`)}>
            Save & Return to Model
          </Button>
          <Button 
            className="bg-trust hover:bg-trust/90"
            onClick={() => navigate(`/financial/models/${id}/statements`)}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            {statementsExist ? 'Review Statements' : 'Generate Statements'}
          </Button>
        </div>
      </div>

      <ModelInputsGuide open={showGuide} onOpenChange={setShowGuide} />
    </FinancialPlatformLayout>
  );
};

export default ModelInputs;