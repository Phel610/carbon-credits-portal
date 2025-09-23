import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  project_type: string;
  country: string;
}

const NewAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('project');
  
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: preselectedProjectId || '',
    assessment_type: 'additionality'
  });

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, project_type, country')
        .order('name');

      if (error) throw error;
      setProjects(data || []);

      // Auto-fill assessment name if project is preselected
      if (preselectedProjectId && data) {
        const selectedProject = data.find(p => p.id === preselectedProjectId);
        if (selectedProject) {
          setFormData(prev => ({
            ...prev,
            name: `${selectedProject.name} - Additionality Assessment`,
            project_id: preselectedProjectId
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate name when project changes
    if (field === 'project_id' && value) {
      const selectedProject = projects.find(p => p.id === value);
      if (selectedProject && !formData.name.includes(selectedProject.name)) {
        setFormData(prev => ({
          ...prev,
          name: `${selectedProject.name} - Additionality Assessment`
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          name: formData.name,
          project_id: formData.project_id,
          user_id: user?.id,
          assessment_type: formData.assessment_type,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial additionality scores record
      await supabase
        .from('additionality_scores')
        .insert({
          assessment_id: data.id,
          overall_additionality_score: null
        });

      navigate(`/assessments/${data.id}/additionality`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (projectsLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            Loading projects...
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link 
            to="/assessments" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Assessment</h1>
            <p className="text-muted-foreground">
              Start a new carbon project integrity assessment
            </p>
          </div>
        </div>

        {/* Assessment Type Info */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Additionality Assessment</CardTitle>
                <CardDescription>
                  Industry-standard framework to evaluate if emission reductions are truly additional
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Assessment Covers:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Financial and Practical Drivers</li>
                  <li>• Market Prevalence Analysis</li>
                  <li>• Regulatory Context</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Baseline Evaluation:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Baseline Method Choice</li>
                  <li>• Baseline Documentation & Assumptions</li>
                  <li>• External Evidence Signals</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Setup</CardTitle>
            <CardDescription>
              Configure your assessment details and select the project to evaluate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label htmlFor="project_id">Select Project *</Label>
                {projects.length === 0 ? (
                  <div className="text-center p-6 border border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-2">No projects available</p>
                    <Button asChild size="sm">
                      <Link to="/projects/new">Create a Project First</Link>
                    </Button>
                  </div>
                ) : (
                  <Select 
                    value={formData.project_id} 
                    onValueChange={(value) => handleInputChange('project_id', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project to assess" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex flex-col">
                            <span>{project.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {project.project_type.replace('_', ' ')} • {project.country}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Assessment Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Assessment Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter assessment name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add notes about this assessment..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessment_type">Assessment Type</Label>
                  <Select value={formData.assessment_type} onValueChange={(value) => handleInputChange('assessment_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="additionality">
                        <div className="flex flex-col">
                          <span>Additionality (Available)</span>
                          <span className="text-xs text-muted-foreground">
                            Criterion 1 - Emission reduction additionality
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="quantification" disabled>
                        <div className="flex flex-col">
                          <span>Quantification (Coming Soon)</span>
                          <span className="text-xs text-muted-foreground">
                            Criterion 2 - Measurement accuracy
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading || !formData.name || !formData.project_id || projects.length === 0}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Start Assessment
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/assessments">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Next Steps Preview */}
        {formData.project_id && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Assessment Workflow</CardTitle>
              <CardDescription>
                Your assessment will include these steps:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { step: 1, title: "Financial & Practical Drivers", desc: "Financial attractiveness & barriers" },
                  { step: 2, title: "Market Prevalence", desc: "Market penetration assessment" },
                  { step: 3, title: "Regulatory Context", desc: "Regulatory considerations" },
                  { step: 4, title: "Baseline Method Choice", desc: "Methodology evaluation" },
                  { step: 5, title: "Baseline Documentation & Assumptions", desc: "Assumptions validation" },
                  { step: 6, title: "External Evidence Signals", desc: "Literature review" }
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default NewAssessment;