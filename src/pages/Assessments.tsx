import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Assessment {
  id: string;
  name: string;
  status: string;
  overall_score?: number;
  integrity_rating?: string;
  assessment_type: string;
  completed_at?: string;
  created_at: string;
  project: {
    id: string;
    name: string;
    project_type: string;
    country: string;
  };
}

const Assessments = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchAssessments();
    }
  }, [user]);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          project:projects(id, name, project_type, country)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntegrityColor = (rating?: string) => {
    switch (rating) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatProjectType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading assessments...</div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
            <p className="text-muted-foreground">
              Track and manage your carbon project integrity assessments
            </p>
          </div>
          <Button asChild>
            <Link to={`/assessments/new${searchParams.get('project') ? `?project=${searchParams.get('project')}` : ''}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assessments or projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assessments Grid */}
        {filteredAssessments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">No assessments found</h3>
                <p className="text-muted-foreground mb-4">
                  {assessments.length === 0 
                    ? "Get started by creating your first carbon project assessment."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
                {assessments.length === 0 && (
                  <Button asChild>
                    <Link to="/assessments/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Assessment
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {assessment.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        {assessment.project.name}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(assessment.status)}>
                          {assessment.status.replace('_', ' ')}
                        </Badge>
                        {assessment.integrity_rating && (
                          <Badge className={getIntegrityColor(assessment.integrity_rating)}>
                            {assessment.integrity_rating} integrity
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/assessments/${assessment.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Assessment
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/assessments/${assessment.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Assessment
                          </Link>
                        </DropdownMenuItem>
                        {assessment.status === 'completed' && (
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project Type:</span>
                      <span>{formatProjectType(assessment.project.project_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{assessment.project.country}</span>
                    </div>
                    {assessment.overall_score && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-medium">
                          {assessment.overall_score.toFixed(1)}/5.0
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(assessment.created_at).toLocaleDateString()}</span>
                    </div>
                    {assessment.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed:</span>
                        <span>{new Date(assessment.completed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button asChild className="w-full" size="sm">
                      <Link to={`/assessments/${assessment.id}`}>
                        {assessment.status === 'completed' ? 'View Results' : 'Continue Assessment'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default Assessments;