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
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Save
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Import criterion components (to be created)
import IncentivesAssessment from '@/components/assessment/IncentivesAssessment';
import CommonPracticeAssessment from '@/components/assessment/CommonPracticeAssessment';
import LegalConsiderationsAssessment from '@/components/assessment/LegalConsiderationsAssessment';
import BaselineApproachAssessment from '@/components/assessment/BaselineApproachAssessment';
import BaselineReasonablenessAssessment from '@/components/assessment/BaselineReasonablenessAssessment';
import RedGreenFlagsAssessment from '@/components/assessment/RedGreenFlagsAssessment';

interface Assessment {
  id: string;
  name: string;
  status: string;
  project: {
    id: string;
    name: string;
    project_type: string;
    country: string;
  };
}

const criteriaSteps = [
  {
    id: 'incentives',
    title: '1.1 Incentives without Carbon Credits',
    description: 'Financial attractiveness and barrier analysis',
    component: IncentivesAssessment
  },
  {
    id: 'common_practice',
    title: '1.2 Common Practice',
    description: 'Market penetration assessment',
    component: CommonPracticeAssessment
  },
  {
    id: 'legal_considerations',
    title: '1.3 Legal Considerations',
    description: 'Regulatory requirements evaluation',
    component: LegalConsiderationsAssessment
  },
  {
    id: 'baseline_approach',
    title: '1.4 Baseline Approach',
    description: 'Methodology rigor and conservatism',
    component: BaselineApproachAssessment
  },
  {
    id: 'baseline_reasonableness',
    title: '1.5 Baseline Reasonableness',
    description: 'Transparency and assumption validation',
    component: BaselineReasonablenessAssessment
  },
  {
    id: 'red_green_flags',
    title: '1.6 Red and Green Flags',
    description: 'Academic literature and industry analysis',
    component: RedGreenFlagsAssessment
  }
];

const AdditionalityAssessment = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchAssessment();
    }
  }, [user, id]);

  const fetchAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          project:projects(id, name, project_type, country)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAssessment(data);

      // Check which steps are completed based on existing scores
      const { data: scoresData } = await supabase
        .from('additionality_scores')
        .select('*')
        .eq('assessment_id', id)
        .maybeSingle();

      if (scoresData) {
        const completed = new Set<number>();
        if (scoresData.incentives_score) completed.add(0);
        if (scoresData.common_practice_score) completed.add(1);
        if (scoresData.legal_considerations_score) completed.add(2);
        if (scoresData.baseline_approach_score) completed.add(3);
        if (scoresData.baseline_reasonableness_score) completed.add(4);
        if (scoresData.red_green_flags_score) completed.add(5);
        setCompletedSteps(completed);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStepCompletion = (stepIndex: number, isCompleted: boolean) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (isCompleted) {
        newSet.add(stepIndex);
      } else {
        newSet.delete(stepIndex);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    if (currentStep < criteriaSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveAndExit = async () => {
    setSaving(true);
    try {
      // Update assessment status based on completion
      const allCompleted = completedSteps.size === criteriaSteps.length;
      const hasAnyProgress = completedSteps.size > 0;
      
      let newStatus = 'draft';
      if (allCompleted) {
        newStatus = 'completed';
      } else if (hasAnyProgress) {
        newStatus = 'in_progress';
      }

      await supabase
        .from('assessments')
        .update({
          status: newStatus,
          completed_at: allCompleted ? new Date().toISOString() : null
        })
        .eq('id', id);

      navigate(`/assessments/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateProgress = () => {
    return (completedSteps.size / criteriaSteps.length) * 100;
  };

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

  const CurrentComponent = criteriaSteps[currentStep].component;

  return (
    <PortalLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link 
            to={`/assessments/${id}`} 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessment Overview
          </Link>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Additionality Assessment</h1>
              <p className="text-muted-foreground">{assessment.project.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Step {currentStep + 1} of {criteriaSteps.length}
              </Badge>
              <Button 
                onClick={handleSaveAndExit} 
                variant="outline" 
                size="sm"
                disabled={saving}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save & Exit
              </Button>
            </div>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Assessment Progress</CardTitle>
              <span className="text-sm text-muted-foreground">
                {completedSteps.size}/{criteriaSteps.length} criteria completed
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={calculateProgress()} className="h-2 mb-4" />
            
            {/* Step indicators */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {criteriaSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all hover:bg-accent",
                    currentStep === index && "border-primary bg-primary/5",
                    completedSteps.has(index) && "bg-green-50 border-green-200"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">1.{index + 1}</span>
                    {completedSteps.has(index) && (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {step.title.replace('1.' + (index + 1) + ' ', '')}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Step */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {criteriaSteps[currentStep].title}
            </CardTitle>
            <CardDescription>
              {criteriaSteps[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CurrentComponent
              assessmentId={id!}
              projectData={assessment.project}
              onCompletion={(isCompleted: boolean) => handleStepCompletion(currentStep, isCompleted)}
              isCompleted={completedSteps.has(currentStep)}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep === criteriaSteps.length - 1 ? (
              <Button onClick={handleSaveAndExit} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Complete Assessment
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default AdditionalityAssessment;