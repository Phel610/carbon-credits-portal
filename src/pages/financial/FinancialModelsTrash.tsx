import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Clock,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DeletedModel {
  id: string;
  name: string;
  description?: string;
  country?: string;
  project_name?: string;
  start_year: number;
  end_year: number;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  days_remaining: number;
}

export default function FinancialModelsTrash() {
  const { user } = useAuth();
  const [models, setModels] = useState<DeletedModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDeletedModels();
    }
  }, [user]);

  const fetchDeletedModels = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('financial_models')
        .select('*')
        .not('deleted_at', 'is', null)
        .gte('deleted_at', thirtyDaysAgo.toISOString())
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      const modelsWithDays = data?.map(model => ({
        ...model,
        days_remaining: 30 - Math.floor(
          (new Date().getTime() - new Date(model.deleted_at!).getTime()) 
          / (1000 * 60 * 60 * 24)
        )
      })) || [];

      setModels(modelsWithDays);
    } catch (error) {
      console.error('Error fetching deleted models:', error);
      toast({
        title: "Failed to load trash",
        description: "There was an error loading deleted models.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (modelId: string, modelName: string) => {
    const confirmed = window.confirm(
      `Restore "${modelName}"?\n\nThe model will be moved back to your active models.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('financial_models')
        .update({ deleted_at: null })
        .eq('id', modelId);

      if (error) throw error;

      setModels(models.filter(m => m.id !== modelId));
      
      toast({
        title: "Model restored",
        description: `"${modelName}" has been restored successfully.`,
      });
    } catch (error) {
      console.error('Error restoring model:', error);
      toast({
        title: "Restore failed",
        description: error instanceof Error ? error.message : "Failed to restore the model.",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (modelId: string, modelName: string) => {
    const confirmed = window.confirm(
      `PERMANENTLY delete "${modelName}"?\n\n` +
      `This will delete:\n` +
      `• All inputs\n` +
      `• All financial statements\n` +
      `• All metrics\n` +
      `• All scenarios\n` +
      `• All sensitivity analyses\n\n` +
      `This action CANNOT be undone!`
    );

    if (!confirmed) return;

    try {
      const tables = [
        'sensitivity_analyses',
        'model_scenarios', 
        'financial_metrics',
        'financial_statements',
        'model_inputs'
      ] as const;

      for (const table of tables) {
        const { error } = await supabase
          .from(table as any)
          .delete()
          .eq('model_id', modelId);
        
        if (error) throw error;
      }

      const { error: modelError } = await supabase
        .from('financial_models')
        .delete()
        .eq('id', modelId);

      if (modelError) throw modelError;

      setModels(models.filter(m => m.id !== modelId));
      
      toast({
        title: "Model permanently deleted",
        description: `"${modelName}" and all its data have been permanently deleted.`,
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete the model permanently.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trust mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading trash...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/financial/models">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Models
            </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight text-gradient">Trash</h1>
          <p className="text-muted-foreground mt-2">
            Deleted models are kept for 30 days before permanent deletion
          </p>
        </div>
      </div>

      {models.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Trash is empty</h3>
            <p className="text-muted-foreground text-center">
              Deleted models will appear here and be kept for 30 days
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{model.name}</CardTitle>
                    {model.description && (
                      <CardDescription className="line-clamp-2">
                        {model.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-warning">
                    {model.days_remaining} {model.days_remaining === 1 ? 'day' : 'days'} remaining
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium">
                    {model.start_year} - {model.end_year}
                  </span>
                </div>

                {model.country && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Country:</span>
                    <span className="font-medium">{model.country}</span>
                  </div>
                )}

                <div className="pt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleRestore(model.id, model.name)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handlePermanentDelete(model.id, model.name)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
