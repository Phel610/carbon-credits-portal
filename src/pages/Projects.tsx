import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CarbonPlatformLayout from '@/components/layout/CarbonPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  BarChart3,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  description?: string;
  project_type: string;
  country: string;
  location_type?: string;
  project_size?: string;
  developer_type?: string;
  status: string;
  start_date?: string;
  created_at: string;
  assessments?: Array<{
    id: string;
    name: string;
    status: string;
    overall_score?: number;
  }>;
}

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          assessments(id, name, status, overall_score)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesType = typeFilter === 'all' || project.project_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
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
      <CarbonPlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading projects...</div>
        </div>
      </CarbonPlatformLayout>
    );
  }

  return (
    <CarbonPlatformLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage your carbon projects and their assessments
            </p>
          </div>
          <Button asChild>
            <Link to="/carbon/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
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
                    placeholder="Search projects..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="redd_plus">REDD+</SelectItem>
                  <SelectItem value="renewables">Renewables</SelectItem>
                  <SelectItem value="arr">ARR</SelectItem>
                  <SelectItem value="cookstoves">Cookstoves</SelectItem>
                  <SelectItem value="biochar">Biochar</SelectItem>
                  <SelectItem value="landfill_gas">Landfill Gas</SelectItem>
                  <SelectItem value="safe_water">Safe Water</SelectItem>
                  <SelectItem value="ifm">IFM</SelectItem>
                  <SelectItem value="waste_mgmt">Waste Management</SelectItem>
                  <SelectItem value="blue_carbon">Blue Carbon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  {projects.length === 0 
                    ? "Get started by creating your first carbon project."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
                {projects.length === 0 && (
                  <Button asChild>
                    <Link to="/carbon/projects/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Project
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {project.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {formatProjectType(project.project_type)}
                        </Badge>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
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
                          <Link to={`/carbon/projects/${project.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Project
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/carbon/assessments/new?project=${project.id}`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            New Assessment
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{project.country}</span>
                    </div>
                    {project.project_size && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="capitalize">{project.project_size}</span>
                      </div>
                    )}
                    {project.start_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span>{new Date(project.start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Assessment Status */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Assessments:</span>
                      <span className="font-medium">
                        {project.assessments?.length || 0}
                      </span>
                    </div>
                    {project.assessments && project.assessments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {project.assessments.slice(0, 2).map((assessment) => (
                          <div key={assessment.id} className="flex justify-between text-xs">
                            <span className="truncate">{assessment.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {assessment.overall_score 
                                ? `${assessment.overall_score.toFixed(1)}/5`
                                : assessment.status
                              }
                            </Badge>
                          </div>
                        ))}
                        {project.assessments.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{project.assessments.length - 2} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button asChild className="w-full" size="sm">
                      <Link to={`/carbon/projects/${project.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CarbonPlatformLayout>
  );
};

export default Projects;