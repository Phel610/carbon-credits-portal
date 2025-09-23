import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BaselineAssumptionsAssessmentProps {
  assessmentId: string;
  projectData: any;
  onCompletion: (isCompleted: boolean) => void;
  isCompleted: boolean;
}

interface FormData {
  deforestation_rates: string;
  emission_factors: string;
  baseline_scenario: string;
  counterfactual_credibility: string;
  evidence_text: string;
}

const questions = [
  {
    key: 'deforestation_rates' as keyof FormData,
    label: 'Baseline Deforestation/Degradation Rates',
    description: 'How reasonable are the assumed baseline deforestation or degradation rates?',
    options: [
      { value: '5', label: 'Conservative rates well-supported by historical data', score: 5 },
      { value: '4', label: 'Reasonable rates with good supporting evidence', score: 4 },
      { value: '3', label: 'Moderately reasonable rates with some evidence', score: 3 },
      { value: '2', label: 'Questionable rates with limited evidence', score: 2 },
      { value: '1', label: 'Unrealistic or unsupported baseline rates', score: 1 },
    ],
  },
  {
    key: 'emission_factors' as keyof FormData,
    label: 'Emission Factors and Carbon Stocks',
    description: 'How appropriate are the emission factors and carbon stock estimates used?',
    options: [
      { value: '5', label: 'Scientifically robust and locally validated factors', score: 5 },
      { value: '4', label: 'Appropriate factors with good validation', score: 4 },
      { value: '3', label: 'Reasonable factors with adequate validation', score: 3 },
      { value: '2', label: 'Questionable factors with limited validation', score: 2 },
      { value: '1', label: 'Inappropriate or unvalidated emission factors', score: 1 },
    ],
  },
  {
    key: 'baseline_scenario' as keyof FormData,
    label: 'Baseline Scenario Construction',
    description: 'How credible is the overall baseline scenario construction?',
    options: [
      { value: '5', label: 'Highly credible and conservative baseline', score: 5 },
      { value: '4', label: 'Credible baseline with reasonable assumptions', score: 4 },
      { value: '3', label: 'Moderately credible baseline', score: 3 },
      { value: '2', label: 'Questionable baseline with concerning assumptions', score: 2 },
      { value: '1', label: 'Implausible or inflated baseline scenario', score: 1 },
    ],
  },
  {
    key: 'counterfactual_credibility' as keyof FormData,
    label: 'Counterfactual Scenario Credibility',
    description: 'How realistic is the counterfactual (without-project) scenario?',
    options: [
      { value: '5', label: 'Highly realistic counterfactual well-supported by evidence', score: 5 },
      { value: '4', label: 'Realistic counterfactual with good justification', score: 4 },
      { value: '3', label: 'Moderately realistic counterfactual', score: 3 },
      { value: '2', label: 'Questionable counterfactual assumptions', score: 2 },
      { value: '1', label: 'Unrealistic or unsupported counterfactual', score: 1 },
    ],
  },
];

export default function BaselineAssumptionsAssessment({
  assessmentId,
  projectData,
  onCompletion,
  isCompleted,
}: BaselineAssumptionsAssessmentProps) {
  const [formData, setFormData] = useState<FormData>({
    deforestation_rates: '',
    emission_factors: '',
    baseline_scenario: '',
    counterfactual_credibility: '',
    evidence_text: '',
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
        .select('question_key, response_value, evidence_text')
        .eq('assessment_id', assessmentId)
        .eq('criterion_code', '1.5.2');

      if (responses?.length) {
        const newFormData = { ...formData };
        responses.forEach((response) => {
          const key = response.question_key as keyof FormData;
          if (key !== 'evidence_text') {
            newFormData[key] = response.response_value || '';
          } else {
            newFormData.evidence_text = response.evidence_text || '';
          }
        });
        setFormData(newFormData);
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    const responses = Object.entries(formData)
      .filter(([key, value]) => key !== 'evidence_text' && value !== '');

    if (responses.length === 0) {
      setScore(null);
      onCompletion(false);
      return;
    }

    const totalScore = responses.reduce((sum, [key, value]) => {
      const question = questions.find((q) => q.key === key);
      const option = question?.options.find((opt) => opt.value === value);
      return sum + (option?.score || 0);
    }, 0);

    const averageScore = totalScore / responses.length;
    const roundedScore = Math.round(averageScore * 10) / 10;
    setScore(roundedScore);
    onCompletion(responses.length === questions.length);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save individual responses
      for (const [key, value] of Object.entries(formData)) {
        if (key !== 'evidence_text' && value) {
          await supabase.from('assessment_responses').upsert({
            assessment_id: assessmentId,
            criterion_code: '1.5.2',
            question_key: key,
            response_value: value,
            evidence_text: key === 'evidence_text' ? value : formData.evidence_text,
          });
        }
      }

      // Save evidence text separately if it exists
      if (formData.evidence_text) {
        await supabase.from('assessment_responses').upsert({
          assessment_id: assessmentId,
          criterion_code: '1.5.2',
          question_key: 'evidence_text',
          evidence_text: formData.evidence_text,
        });
      }

      // Save score to additionality_scores table
      if (score !== null) {
        await supabase.from('additionality_scores').upsert({
          assessment_id: assessmentId,
          baseline_reasonableness_score: score,
        });
      }

      toast({
        title: 'Assessment Saved',
        description: 'Your baseline assumptions assessment has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          <strong>1.5.2 Baseline Assumptions:</strong> This assessment evaluates the reasonableness and credibility of key assumptions used in the project's baseline scenario. Assumptions should be conservative, well-supported by evidence, and represent realistic counterfactual conditions.
        </AlertDescription>
      </Alert>

      {score !== null && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <strong>Current Score:</strong>
            <Badge variant="secondary">{score.toFixed(1)}/5.0</Badge>
          </AlertDescription>
        </Alert>
      )}

      {questions.map((question, index) => (
        <Card key={question.key} className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">
              {index + 1}. {question.label}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{question.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={formData[question.key]}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, [question.key]: value }))
              }
            >
              {question.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${question.key}-${option.value}`} />
                  <Label
                    htmlFor={`${question.key}-${option.value}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option.label}
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
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Provide any additional evidence or analysis supporting your assessment of baseline assumptions..."
            value={formData.evidence_text}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, evidence_text: e.target.value }))
            }
            rows={4}
          />
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Assessment...
          </>
        ) : (
          'Save Assessment'
        )}
      </Button>
    </div>
  );
}