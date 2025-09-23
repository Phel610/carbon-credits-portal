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

interface BaselineTransparencyAssessmentProps {
  assessmentId: string;
  projectData: any;
  onCompletion: (isCompleted: boolean) => void;
  isCompleted: boolean;
}

interface FormData {
  documentation_quality: string;
  methodology_disclosure: string;
  data_sources: string;
  assumptions_clarity: string;
  evidence_text: string;
}

const questions = [
  {
    key: 'documentation_quality' as keyof FormData,
    label: 'Depth of baseline documentation',
    description: 'How comprehensive and detailed is the project\'s baseline scenario documentation?',
    options: [
      { value: '5', label: 'Very comprehensive with detailed explanations', score: 5 },
      { value: '4', label: 'Good documentation with most details provided', score: 4 },
      { value: '3', label: 'Adequate documentation with some gaps', score: 3 },
      { value: '2', label: 'Limited documentation with significant gaps', score: 2 },
      { value: '1', label: 'Poor or missing baseline documentation', score: 1 },
    ],
  },
  {
    key: 'methodology_disclosure' as keyof FormData,
    label: 'Clarity on method selection',
    description: 'How clearly does the project disclose its baseline methodology and approach?',
    options: [
      { value: '5', label: 'Full methodology disclosure with clear rationale', score: 5 },
      { value: '4', label: 'Good methodology disclosure with minor gaps', score: 4 },
      { value: '3', label: 'Partial methodology disclosure', score: 3 },
      { value: '2', label: 'Limited methodology disclosure', score: 2 },
      { value: '1', label: 'No clear methodology disclosure', score: 1 },
    ],
  },
  {
    key: 'data_sources' as keyof FormData,
    label: 'Source traceability',
    description: 'How transparent is the project about its data sources and collection methods?',
    options: [
      { value: '5', label: 'All data sources clearly identified and validated', score: 5 },
      { value: '4', label: 'Most data sources identified with good validation', score: 4 },
      { value: '3', label: 'Some data sources identified', score: 3 },
      { value: '2', label: 'Limited data source transparency', score: 2 },
      { value: '1', label: 'Poor or no data source disclosure', score: 1 },
    ],
  },
  {
    key: 'assumptions_clarity' as keyof FormData,
    label: 'Assumption explanations',
    description: 'How clearly are key baseline assumptions explained and justified?',
    options: [
      { value: '5', label: 'All assumptions clearly explained and well-justified', score: 5 },
      { value: '4', label: 'Most assumptions clearly explained', score: 4 },
      { value: '3', label: 'Some assumptions explained', score: 3 },
      { value: '2', label: 'Limited explanation of assumptions', score: 2 },
      { value: '1', label: 'Assumptions not clearly explained', score: 1 },
    ],
  },
];

export default function BaselineTransparencyAssessment({
  assessmentId,
  projectData,
  onCompletion,
  isCompleted,
}: BaselineTransparencyAssessmentProps) {
  const [formData, setFormData] = useState<FormData>({
    documentation_quality: '',
    methodology_disclosure: '',
    data_sources: '',
    assumptions_clarity: '',
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
        .eq('criterion_code', '1.5.1');

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
            criterion_code: '1.5.1',
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
          criterion_code: '1.5.1',
          question_key: 'evidence_text',
          evidence_text: formData.evidence_text,
        });
      }

      // Save score to additionality_scores table
      if (score !== null) {
        await supabase.from('additionality_scores').upsert({
          assessment_id: assessmentId,
          baseline_transparency_score: score,
        });
      }

      toast({
        title: 'Assessment Saved',
        description: 'Your baseline documentation openness assessment has been saved successfully.',
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
          <strong>1.5.1 Baseline Documentation Openness:</strong> This assessment evaluates how transparent the project is in documenting its baseline scenario approach, methodology, data sources, and key assumptions. Clear documentation is essential for objective assessment of baseline credibility.
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
            placeholder="Provide any additional evidence or documentation that supports your transparency assessment..."
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