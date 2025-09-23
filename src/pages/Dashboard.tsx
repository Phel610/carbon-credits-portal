import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  FolderOpen, 
  Plus, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  project_type: string;
  country: string;
  status: string;
  created_at: string;
}

interface Assessment {
  id: string;
  name: string;
  status: string;
  overall_score?: number;
  integrity_rating?: string;
  project: {
    name: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch recent projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent assessments with project names
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select(`
          *,
          project:projects(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setProjects(projectsData || []);
      setAssessments(assessmentsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'draft':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getIntegrityColor = (rating?: string) => {
    switch (rating) {
      case 'high':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const stats = {
    totalProjects: projects.length,
    completedAssessments: assessments.filter(a => a.status === 'completed').length,
    avgScore: assessments
      .filter(a => a.overall_score)
      .reduce((acc, a) => acc + (a.overall_score || 0), 0) / 
      (assessments.filter(a => a.overall_score).length || 1),
    highIntegrityProjects: assessments.filter(a => a.integrity_rating === 'high').length
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your carbon project assessments.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                Active carbon projects
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Assessments</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedAssessments}</div>
              <p className="text-xs text-muted-foreground">
                Integrity assessments completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgScore ? stats.avgScore.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of 5.0 integrity scale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Integrity</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highIntegrityProjects}</div>
              <p className="text-xs text-muted-foreground">
                Projects with high integrity rating
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
                Start a new assessment or manage your projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Project
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/assessments/new">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Start New Assessment
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assessment Progress</CardTitle>
              <CardDescription>
                Track your project assessment completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Completed</span>
                  <span>{stats.completedAssessments}/{assessments.length}</span>
                </div>
                <Progress 
                  value={assessments.length > 0 ? (stats.completedAssessments / assessments.length) * 100 : 0}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Complete assessments to get integrity ratings
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects and Assessments */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Your latest carbon projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No projects yet</p>
                  <Button asChild className="mt-2" size="sm">
                    <Link to="/projects/new">Create Your First Project</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.project_type} • {project.country}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(project.status)}
                      >
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                  <Button asChild variant="outline" className="w-full mt-3">
                    <Link to="/projects">View All Projects</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>
                Latest integrity assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No assessments yet</p>
                  <Button asChild className="mt-2" size="sm">
                    <Link to="/assessments/new">Start Your First Assessment</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{assessment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assessment.project?.name}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {assessment.integrity_rating && (
                            <Badge className={getIntegrityColor(assessment.integrity_rating)}>
                              {assessment.integrity_rating}
                            </Badge>
                          )}
                          {assessment.overall_score && (
                            <Badge variant="outline">
                              {assessment.overall_score.toFixed(1)}/5.0
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button asChild variant="outline" className="w-full mt-3">
                    <Link to="/assessments">View All Assessments</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Dashboard;