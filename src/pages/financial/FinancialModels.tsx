import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Calculator,
  FileText,
  TrendingUp,
  Calendar,
  Globe,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FinancialModel {
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
  deleted_at?: string | null;
}

const FinancialModels = () => {
  const { user } = useAuth();
  const [models, setModels] = useState<FinancialModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels();
  }, [user]);

  const fetchModels = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching models",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setModels(data || []);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({
        title: "Error",
        description: "Failed to load financial models",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'in_progress':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleDeleteModel = async (modelId: string, modelName: string) => {
    const confirmed = window.confirm(
      `Move "${modelName}" to trash?\n\n` +
      `The model will be kept in trash for 30 days.\n` +
      `You can restore it anytime within this period.\n\n` +
      `After 30 days, it will be permanently deleted.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('financial_models')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', modelId);

      if (error) throw error;

      setModels(models.filter(m => m.id !== modelId));
      
      toast({
        title: "Model moved to trash",
        description: `"${modelName}" has been moved to trash. You have 30 days to restore it.`,
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to move model to trash.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading financial models...</div>
        </div>
      </FinancialPlatformLayout>
    );
  }

  return (
    <FinancialPlatformLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Financial Models</h1>
            <p className="text-muted-foreground">
              Create and manage financial models for your carbon credit projects.
            </p>
          </div>
          <Button asChild className="bg-trust hover:bg-trust/90">
            <Link to="/financial/models/new">
              <Plus className="mr-2 h-4 w-4" />
              New Model
            </Link>
          </Button>
        </div>

        {/* Models Grid */}
        {models.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Financial Models Yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create your first financial model to start building comprehensive projections for your carbon credit projects.
              </p>
              <Button asChild className="bg-trust hover:bg-trust/90">
                <Link to="/financial/models/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Model
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <Card key={model.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      {model.project_name && (
                        <CardDescription className="font-medium">
                          {model.project_name}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(model.status)}>
                        {model.status.replace('_', ' ')}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteModel(model.id, model.name)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Model
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {model.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {model.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    {model.country && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{model.country}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{model.start_year} - {model.end_year}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="default" size="sm" className="flex-1">
                      <Link to={`/financial/models/${model.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Open Model
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/financial/models/${model.id}/metrics`}>
                        <TrendingUp className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {models.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Models</CardDescription>
                <CardTitle className="text-2xl">{models.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-2xl">
                  {models.filter(m => m.status === 'completed').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>In Progress</CardDescription>
                <CardTitle className="text-2xl">
                  {models.filter(m => m.status === 'in_progress').length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>
    </FinancialPlatformLayout>
  );
};

export default FinancialModels;