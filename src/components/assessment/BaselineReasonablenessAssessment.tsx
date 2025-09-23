import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Info, Save, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BaselineReasonablenessAssessmentProps {
  assessmentId: string;
  projectData: {
    id: string;
    name: string;
    project_type: string;
    country: string;
  };
  onCompletion: (isCompleted: boolean) => void;
  isCompleted: boolean;
}

interface FormData {
  assumption_transparency: string;
  benchmark_comparison: string;
  data_quality: string;
  validation_methods: string;
  evidence_text: string;
}

const questions = [
  {
    key: 'assumption_transparency',
    label: 'Key Activity/Impact Rates',
    description: 'How reasonable are the assumed activity levels or impact rates in the baseline scenario (e.g., energy demand growth, technology use, land-use change, resource consumption)?',
    options: [
      { value: 'fully_transparent', label: 'Conservative estimates well supported by historical or sector data', score: 5 },
      { value: 'mostly_transparent', label: 'Reasonable estimates with good supporting evidence', score: 4 },
      { value: 'partially_transparent', label: 'Moderately reasonable estimates with some evidence', score: 3 },
      { value: 'limited_transparency', label: 'Questionable estimates with limited evidence', score: 2 },
      { value: 'opaque', label: 'Unrealistic or unsupported estimates', score: 1 }
    ]
  },
  {
    key: 'benchmark_comparison',
    label: 'Emission Factors and Performance Parameters',
    description: 'How appropriate are the emission factors or performance parameters used in the baseline (e.g., grid emission factors, fuel characteristics, yield rates, efficiency levels)?',
    options: [
      { value: 'excellent_alignment', label: 'Scientifically robust and locally validated', score: 5 },
      { value: 'good_alignment', label: 'Appropriate with good validation', score: 4 },
      { value: 'reasonable_alignment', label: 'Reasonable with adequate validation', score: 3 },
      { value: 'poor_alignment', label: 'Questionable with limited validation', score: 2 },
      { value: 'no_alignment', label: 'Inappropriate or unvalidated', score: 1 }
    ]
  },
  {
    key: 'data_quality',
    label: 'Baseline Scenario Construction',
    description: 'How credible is the overall construction of the baseline scenario?',
    options: [
      { value: 'high_quality', label: 'Highly credible and conservative baseline', score: 5 },
      { value: 'good_quality', label: 'Credible with reasonable assumptions', score: 4 },
      { value: 'adequate_quality', label: 'Moderately credible baseline', score: 3 },
      { value: 'poor_quality', label: 'Questionable baseline with concerning assumptions', score: 2 },
      { value: 'unreliable', label: 'Implausible or inflated baseline scenario', score: 1 }
    ]
  },
  {
    key: 'validation_methods',
    label: 'Counterfactual Scenario Credibility',
    description: 'How realistic is the counterfactual "without-project" scenario?',
    options: [
      { value: 'comprehensive', label: 'Highly realistic and well supported by evidence', score: 5 },
      { value: 'good_validation', label: 'Realistic with good justification', score: 4 },
      { value: 'basic_validation', label: 'Moderately realistic', score: 3 },
      { value: 'limited_validation', label: 'Questionable assumptions', score: 2 },
      { value: 'no_validation', label: 'Unrealistic or unsupported counterfactual', score: 1 }
    ]
  }
];

const BaselineReasonablenessAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: BaselineReasonablenessAssessmentProps) => {
  const [formData, setFormData] = useState<FormData>({
    assumption_transparency: '',
    benchmark_comparison: '',
    data_quality: '',
    validation_methods: '',
    evidence_text: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingData();
  }, [assessmentId]);

  useEffect(() => {
    calculateScore();
  }, [formData]);

  const loadExistingData = async () => {
    try {
      const { data: responses } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('criterion_code', 'baseline_reasonableness');

      if (responses && responses.length > 0) {
        const responseMap = responses.reduce((acc, response) => {
          acc[response.question_key] = response.response_value || '';
          return acc;
        }, {} as Record<string, string>);

        const evidenceResponse = responses.find(r => r.question_key === 'evidence_text');
        
        setFormData({
          assumption_transparency: responseMap.assumption_transparency || '',
          benchmark_comparison: responseMap.benchmark_comparison || '',
          data_quality: responseMap.data_quality || '',
          validation_methods: responseMap.validation_methods || '',
          evidence_text: evidenceResponse?.evidence_text || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    const answers = [
      formData.assumption_transparency,
      formData.benchmark_comparison,
      formData.data_quality,
      formData.validation_methods
    ];

    if (answers.every(answer => answer)) {
      let totalScore = 0;
      let count = 0;

      questions.forEach(question => {
        const answer = formData[question.key as keyof FormData];
        if (answer) {
          const option = question.options.find(opt => opt.value === answer);
          if (option) {
            totalScore += option.score;
            count++;
          }
        }
      });

      const calculatedScore = count > 0 ? (totalScore / count) : 0;
      setScore(calculatedScore);
      onCompletion(count === questions.length);
    } else {
      setScore(null);
      onCompletion(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save responses
      for (const question of questions) {
        const value = formData[question.key as keyof FormData];
        if (value) {
          await supabase
            .from('assessment_responses')
            .upsert({
              assessment_id: assessmentId,
              criterion_code: 'baseline_reasonableness',
              question_key: question.key,
              response_value: value,
              evidence_text: question.key === 'evidence_text' ? formData.evidence_text : null
            }, {
              onConflict: 'assessment_id,criterion_code,question_key'
            });
        }
      }

      // Save evidence text separately
      if (formData.evidence_text) {
        await supabase
          .from('assessment_responses')
          .upsert({
            assessment_id: assessmentId,
            criterion_code: 'baseline_reasonableness',
            question_key: 'evidence_text',
            response_value: 'evidence',
            evidence_text: formData.evidence_text
          }, {
            onConflict: 'assessment_id,criterion_code,question_key'
          });
      }

      // Save score
      if (score !== null) {
        await supabase
          .from('additionality_scores')
          .upsert({
            assessment_id: assessmentId,
            baseline_reasonableness_score: score,
            baseline_transparency_score: score,
            baseline_assumptions_score: score
          }, {
            onConflict: 'assessment_id'
          });
      }

      toast({
        title: "Assessment Saved",
        description: "Baseline assumption reasonableness assessment has been saved successfully.",
      });

    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "Failed to save assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>1.5.2 Baseline Assumption Reasonableness:</strong> Assessment of how reasonable and credible the project's baseline scenario assumptions are. Strong assumptions are supported by data, lean toward conservative estimates, and reflect a realistic "without-project" situation.
        </AlertDescription>
      </Alert>

      {/* Score Display */}
      {score !== null && (
        <Card className="bg-accent/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Assessment Complete</span>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Score: {score.toFixed(1)}/5.0
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={question.key}>
            <CardHeader>
              <CardTitle className="text-lg">{question.label}</CardTitle>
              <CardDescription>{question.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData[question.key as keyof FormData]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, [question.key]: value }))}
              >
                {question.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`${question.key}-${option.value}`} />
                    <Label 
                      htmlFor={`${question.key}-${option.value}`} 
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {option.score}/5
                        </Badge>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Supporting Evidence</CardTitle>
            <CardDescription>
              Upload or reference the data sources, studies, or analysis that support the assumptions used in the baseline scenario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.evidence_text}
              onChange={(e) => setFormData(prev => ({ ...prev, evidence_text: e.target.value }))}
              placeholder="Document baseline assumptions, benchmark comparisons, data sources, and validation methods..."
              className="min-h-32"
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Assessment
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BaselineReasonablenessAssessment;