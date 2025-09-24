import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CarbonPlatformLayout from '@/components/layout/CarbonPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NewProject = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: '',
    country: '',
    location_type: '',
    project_size: '',
    developer_type: '',
    start_date: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...formData,
          user_id: user?.id,
          project_type: formData.project_type as any,
          start_date: formData.start_date || null
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/carbon/projects/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CarbonPlatformLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link 
            to="/carbon/projects" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
            <p className="text-muted-foreground">
              Set up a new carbon project for integrity assessment
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Provide information about your carbon project. This data will be used for integrity assessments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter project name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your carbon project..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_type">Project Type *</Label>
                  <Select value={formData.project_type} onValueChange={(value) => handleInputChange('project_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="redd_plus">REDD+ (Reducing Emissions from Deforestation)</SelectItem>
                      <SelectItem value="renewables">Renewable Energy</SelectItem>
                      <SelectItem value="arr">Afforestation, Reforestation & Revegetation (ARR)</SelectItem>
                      <SelectItem value="cookstoves">Improved Cookstoves</SelectItem>
                      <SelectItem value="biochar">Biochar</SelectItem>
                      <SelectItem value="landfill_gas">Landfill Gas Capture</SelectItem>
                      <SelectItem value="safe_water">Safe Water Projects</SelectItem>
                      <SelectItem value="ifm">Improved Forest Management (IFM)</SelectItem>
                      <SelectItem value="waste_mgmt">Waste Management</SelectItem>
                      <SelectItem value="blue_carbon">Blue Carbon (Coastal Ecosystems)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location & Scale */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Location & Scale</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      placeholder="Enter country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_type">Location Type</Label>
                    <Select value={formData.location_type} onValueChange={(value) => handleInputChange('location_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rural">Rural</SelectItem>
                        <SelectItem value="urban">Urban</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="project_size">Project Size</Label>
                    <Select value={formData.project_size} onValueChange={(value) => handleInputChange('project_size', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="micro">Micro (&lt;1,000 tCO2e/year)</SelectItem>
                        <SelectItem value="small">Small (1,000-15,000 tCO2e/year)</SelectItem>
                        <SelectItem value="medium">Medium (15,000-50,000 tCO2e/year)</SelectItem>
                        <SelectItem value="large">Large (&gt;50,000 tCO2e/year)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="developer_type">Developer Type</Label>
                    <Select value={formData.developer_type} onValueChange={(value) => handleInputChange('developer_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select developer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private Company</SelectItem>
                        <SelectItem value="public">Public/Government</SelectItem>
                        <SelectItem value="ngo">NGO</SelectItem>
                        <SelectItem value="community">Community-based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Project Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading || !formData.name || !formData.project_type || !formData.country}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Project
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/carbon/projects">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </CarbonPlatformLayout>
  );
};

export default NewProject;