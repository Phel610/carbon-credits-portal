import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calculator, TrendingUp, FileText } from 'lucide-react';

const PlatformSelection = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your platform to continue with your carbon project work
          </p>
        </div>

        {/* Platform Selection Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Carbon Assessment</CardTitle>
              <CardDescription className="text-base">
                Evaluate project integrity and additionality with comprehensive assessment tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Additionality assessments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Integrity scoring and evaluation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Project management tools</span>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link to="/carbon/dashboard">
                  Continue to Assessment Platform
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-trust/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-trust/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-trust/20 transition-colors">
                <Calculator className="w-8 h-8 text-trust" />
              </div>
              <CardTitle className="text-2xl">Financial Modelling</CardTitle>
              <CardDescription className="text-base">
                Build comprehensive financial models for carbon credit projects and investment analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-trust rounded-full"></div>
                  <span>Revenue and expense modeling</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-trust rounded-full"></div>
                  <span>Financial statements generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-trust rounded-full"></div>
                  <span>Sensitivity analysis and scenarios</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-trust rounded-full"></div>
                  <span>Investment metrics and reporting</span>
                </div>
              </div>
              <Button asChild className="w-full bg-trust hover:bg-trust/90">
                <Link to="/financial/dashboard">
                  Continue to Financial Platform
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 pt-8 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              Active
            </div>
            <p className="text-sm text-muted-foreground">Projects</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-trust">
              <FileText className="w-6 h-6 mx-auto mb-2" />
              Complete
            </div>
            <p className="text-sm text-muted-foreground">Assessments</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              <Calculator className="w-6 h-6 mx-auto mb-2" />
              Financial
            </div>
            <p className="text-sm text-muted-foreground">Models</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              <BarChart3 className="w-6 h-6 mx-auto mb-2" />
              Reports
            </div>
            <p className="text-sm text-muted-foreground">Generated</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformSelection;