import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  TrendingUp, 
  Plus, 
  DollarSign,
  PieChart,
  FileText,
  Target
} from 'lucide-react';

const FinancialDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Simulate data loading
      setTimeout(() => setLoading(false), 1000);
    }
  }, [user]);

  // Mock data for initial implementation
  const stats = {
    totalModels: 0,
    activeScenarios: 0,
    avgNPV: 0,
    completedReports: 0
  };

  if (loading) {
    return (
      <FinancialPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading financial dashboard...</div>
        </div>
      </FinancialPlatformLayout>
    );
  }

  return (
    <FinancialPlatformLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Build comprehensive financial models for your carbon credit projects.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Financial Models</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalModels}</div>
              <p className="text-xs text-muted-foreground">
                Active carbon project models
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scenarios</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeScenarios}</div>
              <p className="text-xs text-muted-foreground">
                Sensitivity analyses created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. NPV</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.avgNPV ? stats.avgNPV.toLocaleString() : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Net present value of projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedReports}</div>
              <p className="text-xs text-muted-foreground">
                Financial reports generated
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Start building financial models for your carbon projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full bg-trust hover:bg-trust/90">
                <Link to="/financial/models/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Model
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/financial/scenarios">
                  <PieChart className="mr-2 h-4 w-4" />
                  Scenario Analysis
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Progress</CardTitle>
              <CardDescription>
                Track your financial modeling completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Completed Models</span>
                  <span>0/0</span>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Build your first model to get started
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started with Financial Modeling</CardTitle>
            <CardDescription>
              Follow these steps to create your first carbon project financial model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-trust/10 rounded-full flex items-center justify-center text-sm font-medium text-trust">
                    1
                  </div>
                  <h4 className="font-medium">Project Setup</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  Define projection years, country, and basic project information
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-trust/10 rounded-full flex items-center justify-center text-sm font-medium text-trust">
                    2
                  </div>
                  <h4 className="font-medium">Input Data</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  Enter operational metrics, expenses, and financing strategy
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-trust/10 rounded-full flex items-center justify-center text-sm font-medium text-trust">
                    3
                  </div>
                  <h4 className="font-medium">Analysis</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  Review financial statements and generate investor reports
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button asChild className="bg-trust hover:bg-trust/90">
                <Link to="/financial/models/new">
                  Start Your First Model
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/financial/models">
                  View All Models
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancialPlatformLayout>
  );
};

export default FinancialDashboard;