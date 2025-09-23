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

interface BaselineApproachAssessmentProps {
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
  methodology_rigor: string;
  conservatism_level: string;
  approach_flexibility: string;
  validation_robustness: string;
  evidence_text: string;
}

const questions = [
  {
    key: 'methodology_rigor',
    label: 'Methodology Rigor and Completeness',
    description: 'How rigorous and complete is the baseline methodology approach?',
    options: [
      { value: 'highly_rigorous', label: 'Highly rigorous with comprehensive analysis', score: 5 },
      { value: 'good_rigor', label: 'Good methodological rigor', score: 4 },
      { value: 'adequate_rigor', label: 'Adequate rigor with some gaps', score: 3 },
      { value: 'limited_rigor', label: 'Limited methodological rigor', score: 2 },
      { value: 'poor_rigor', label: 'Poor or incomplete methodology', score: 1 }
    ]
  },
  {
    key: 'conservatism_level',
    label: 'Conservative Baseline Assumptions',
    description: 'How conservative are the baseline scenario assumptions?',
    options: [
      { value: 'highly_conservative', label: 'Highly conservative assumptions', score: 5 },
      { value: 'reasonably_conservative', label: 'Reasonably conservative approach', score: 4 },
      { value: 'balanced_approach', label: 'Balanced conservative/optimistic', score: 3 },
      { value: 'somewhat_optimistic', label: 'Somewhat optimistic assumptions', score: 2 },
      { value: 'overly_optimistic', label: 'Overly optimistic baseline', score: 1 }
    ]
  },
  {
    key: 'approach_flexibility',
    label: 'Methodological Approach Appropriateness',
    description: 'How appropriate is the chosen baseline approach for this project type?',
    options: [
      { value: 'perfectly_suited', label: 'Perfectly suited to project context', score: 5 },
      { value: 'well_suited', label: 'Well-suited methodology', score: 4 },
      { value: 'adequately_suited', label: 'Adequately suited with minor issues', score: 3 },
      { value: 'poorly_suited', label: 'Poorly suited to context', score: 2 },
      { value: 'inappropriate', label: 'Inappropriate methodology choice', score: 1 }
    ]
  },
  {
    key: 'validation_robustness',
    label: 'Baseline Validation and Testing',
    description: 'How robust is the validation and testing of baseline assumptions?',
    options: [
      { value: 'comprehensive_validation', label: 'Comprehensive validation and testing', score: 5 },
      { value: 'good_validation', label: 'Good validation processes', score: 4 },
      { value: 'basic_validation', label: 'Basic validation performed', score: 3 },
      { value: 'limited_validation', label: 'Limited validation efforts', score: 2 },
      { value: 'no_validation', label: 'No validation or testing', score: 1 }
    ]
  }
];

const BaselineApproachAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: BaselineApproachAssessmentProps) => {
  const [formData, setFormData] = useState<FormData>({
    methodology_rigor: '',
    conservatism_level: '',
    approach_flexibility: '',
    validation_robustness: '',
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
        .eq('criterion_code', 'baseline_approach');

      if (responses && responses.length > 0) {
        const responseMap = responses.reduce((acc, response) => {
          acc[response.question_key] = response.response_value || '';
          return acc;
        }, {} as Record<string, string>);

        const evidenceResponse = responses.find(r => r.question_key === 'evidence_text');
        
        setFormData({
          methodology_rigor: responseMap.methodology_rigor || '',
          conservatism_level: responseMap.conservatism_level || '',
          approach_flexibility: responseMap.approach_flexibility || '',
          validation_robustness: responseMap.validation_robustness || '',
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
      formData.methodology_rigor,
      formData.conservatism_level,
      formData.approach_flexibility,
      formData.validation_robustness
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
              criterion_code: 'baseline_approach',
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
            criterion_code: 'baseline_approach',
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
            baseline_approach_score: score
          }, {
            onConflict: 'assessment_id'
          });
      }

      toast({
        title: "Assessment Saved",
        description: "Baseline approach assessment has been saved successfully.",
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
          This criterion evaluates the rigor, flexibility, and conservatism of the methodology used to
          establish the baseline scenario for emission reductions.
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
              Provide methodology documentation, validation evidence, and baseline approach analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.evidence_text}
              onChange={(e) => setFormData(prev => ({ ...prev, evidence_text: e.target.value }))}
              placeholder="Document baseline methodology, validation processes, conservatism analysis, and approach justification..."
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

export default BaselineApproachAssessment;