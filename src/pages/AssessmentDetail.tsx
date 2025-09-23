import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  ArrowLeft, 
  Edit, 
  Download,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Assessment {
  id: string;
  name: string;
  status: string;
  overall_score?: number;
  integrity_rating?: string;
  completed_at?: string;
  created_at: string;
  project: {
    id: string;
    name: string;
    project_type: string;
    country: string;
  };
}

interface AdditionalityScores {
  incentives_score?: number;
  common_practice_score?: number;
  legal_considerations_score?: number;
  baseline_approach_score?: number;
  baseline_reasonableness_score?: number;
  red_green_flags_score?: number;
  overall_additionality_score?: number;
  red_flags?: string[];
  green_flags?: string[];
}

const AssessmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [scores, setScores] = useState<AdditionalityScores>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchAssessmentData();
    }
  }, [user, id]);

  const fetchAssessmentData = async () => {
    try {
      // Fetch assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          *,
          project:projects(id, name, project_type, country)
        `)
        .eq('id', id)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Fetch additionality scores
      const { data: scoresData, error: scoresError } = await supabase
        .from('additionality_scores')
        .select('*')
        .eq('assessment_id', id)
        .maybeSingle();

      if (scoresError) throw scoresError;
      if (scoresData) {
        setScores(scoresData);
      }

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
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

  const calculateProgress = () => {
    if (!scores) return 0;
    
    const criteria = [
      scores.incentives_score,
      scores.common_practice_score,
      scores.legal_considerations_score,
      scores.baseline_approach_score,
      scores.baseline_reasonableness_score,
      scores.red_green_flags_score
    ];
    
    const completed = criteria.filter(score => score != null).length;
    return (completed / criteria.length) * 100;
  };

  const criteriaData = [
    {
      key: 'incentives_score',
      title: '1.1 Incentives without Carbon Credits',
      description: 'Financial attractiveness and barrier analysis',
      score: scores.incentives_score
    },
    {
      key: 'common_practice_score',
      title: '1.2 Common Practice',
      description: 'Market penetration assessment',
      score: scores.common_practice_score
    },
    {
      key: 'legal_considerations_score',
      title: '1.3 Legal Considerations',
      description: 'Regulatory requirements evaluation',
      score: scores.legal_considerations_score
    },
    {
      key: 'baseline_approach_score',
      title: '1.4 Baseline Approach',
      description: 'Methodology rigor and conservatism',
      score: scores.baseline_approach_score
    },
    {
      key: 'baseline_reasonableness_score',
      title: '1.5 Baseline Reasonableness',
      description: 'Transparency and assumption validation',
      score: scores.baseline_reasonableness_score
    },
    {
      key: 'red_green_flags_score',
      title: '1.6 Red and Green Flags',
      description: 'Academic literature and industry analysis',
      score: scores.red_green_flags_score
    }
  ];

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            Loading assessment...
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !assessment) {
    return (
      <PortalLayout>
        <div className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Assessment not found'}
            </AlertDescription>
          </Alert>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link 
            to="/assessments" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Link>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{assessment.name}</h1>
              <p className="text-muted-foreground">{assessment.project.name}</p>
            </div>
            <div className="flex items-center gap-2">
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
        </div>

        {/* Overall Score Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Overall Assessment Score
                </CardTitle>
                <CardDescription>
                  Additionality integrity rating based on MSCI framework
                </CardDescription>
              </div>
              {scores.overall_additionality_score && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {scores.overall_additionality_score.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">out of 5.0</div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Assessment Progress</span>
                  <span>{Math.round(calculateProgress())}% Complete</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
              
              {assessment.status === 'draft' || assessment.status === 'in_progress' ? (
                <Button asChild className="w-full sm:w-auto">
                  <Link to={`/assessments/${assessment.id}/additionality`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Continue Assessment
                  </Link>
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/assessments/${assessment.id}/additionality`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Review Assessment
                    </Link>
                  </Button>
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Criteria Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Additionality Criteria Breakdown</CardTitle>
            <CardDescription>
              Detailed scores for each sub-criterion of the MSCI Additionality framework
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criteriaData.map((criterion) => (
                <div key={criterion.key} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex-1">
                    <h4 className="font-medium">{criterion.title}</h4>
                    <p className="text-sm text-muted-foreground">{criterion.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {criterion.score ? (
                      <>
                        <div className="text-right">
                          <div className="font-bold text-lg">{criterion.score.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">/ 5.0</div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </>
                    ) : (
                      <>
                        <div className="text-muted-foreground text-sm">Not completed</div>
                        <div className="h-5 w-5 rounded-full border-2 border-muted" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Flags Summary */}
        {(scores.red_flags?.length || scores.green_flags?.length) && (
          <div className="grid md:grid-cols-2 gap-4">
            {scores.red_flags?.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Red Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {scores.red_flags.map((flag, index) => (
                      <li key={index} className="text-sm text-red-700">• {flag}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {scores.green_flags?.length > 0 && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Green Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {scores.green_flags.map((flag, index) => (
                      <li key={index} className="text-sm text-green-700">• {flag}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Project Type:</span>
                <span className="ml-2 font-medium">
                  {assessment.project.project_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Country:</span>
                <span className="ml-2 font-medium">{assessment.project.country}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Assessment Created:</span>
                <span className="ml-2 font-medium">
                  {new Date(assessment.created_at).toLocaleDateString()}
                </span>
              </div>
              {assessment.completed_at && (
                <div>
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="ml-2 font-medium">
                    {new Date(assessment.completed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default AssessmentDetail;