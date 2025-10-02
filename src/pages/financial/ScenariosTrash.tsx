import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeletedScenario {
  id: string;
  scenario_name: string;
  deleted_at: string;
  days_remaining: number;
  is_base_case: boolean;
  notes?: string;
}

const ScenariosTrash = () => {
  const { id: modelId } = useParams();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<DeletedScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (modelId) {
      fetchDeletedScenarios();
    }
  }, [modelId]);

  const fetchDeletedScenarios = async () => {
    try {
      setIsLoading(true);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('model_scenarios')
        .select('*')
        .eq('model_id', modelId)
        .not('deleted_at', 'is', null)
        .gte('deleted_at', thirtyDaysAgo.toISOString())
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      const scenariosWithDays = data.map(scenario => {
        const deletedDate = new Date(scenario.deleted_at!);
        const expiryDate = new Date(deletedDate);
        expiryDate.setDate(expiryDate.getDate() + 30);
        const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: scenario.id,
          scenario_name: scenario.scenario_name,
          deleted_at: scenario.deleted_at!,
          days_remaining: Math.max(0, daysRemaining),
          is_base_case: scenario.is_base_case,
          notes: scenario.notes || undefined
        };
      });

      setScenarios(scenariosWithDays);
    } catch (error) {
      console.error('Error fetching deleted scenarios:', error);
      toast({
        title: "Error Loading Trash",
        description: "Failed to load deleted scenarios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (scenarioId: string) => {
    try {
      const { error } = await supabase
        .from('model_scenarios')
        .update({ deleted_at: null })
        .eq('id', scenarioId);

      if (error) throw error;

      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
      
      toast({
        title: "Scenario Restored",
        description: "The scenario has been restored successfully.",
      });
    } catch (error) {
      console.error('Error restoring scenario:', error);
      toast({
        title: "Error Restoring Scenario",
        description: "Failed to restore the scenario.",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (scenarioId: string) => {
    try {
      // Delete the scenario permanently
      const { error } = await supabase
        .from('model_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) throw error;

      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
      
      toast({
        title: "Scenario Permanently Deleted",
        description: "The scenario has been permanently removed.",
      });
    } catch (error) {
      console.error('Error permanently deleting scenario:', error);
      toast({
        title: "Error Deleting Scenario",
        description: "Failed to permanently delete the scenario.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">Loading deleted scenarios...</p>
          </div>
        </div>
      </FinancialPlatformLayout>
    );
  }

  return (
    <FinancialPlatformLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scenarios Trash</h1>
            <p className="text-muted-foreground mt-1">
              Scenarios are kept for 30 days before permanent deletion
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/financial/models/${modelId}/scenarios`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scenarios
          </Button>
        </div>

        {scenarios.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Trash is Empty</p>
              <p className="text-sm text-muted-foreground">
                No deleted scenarios found
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {scenario.scenario_name}
                        {scenario.is_base_case && (
                          <Badge variant="secondary">Base Case</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span>
                            Will be permanently deleted in {scenario.days_remaining} day{scenario.days_remaining !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs mt-1">
                          Deleted on: {new Date(scenario.deleted_at).toLocaleString()}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(scenario.id)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanently
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete Scenario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The scenario "{scenario.scenario_name}" will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePermanentDelete(scenario.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {scenario.notes && (
                  <CardContent>
                    <div className="text-sm">
                      <span className="font-medium">Notes: </span>
                      <span className="text-muted-foreground">{scenario.notes}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </FinancialPlatformLayout>
  );
};

export default ScenariosTrash;
