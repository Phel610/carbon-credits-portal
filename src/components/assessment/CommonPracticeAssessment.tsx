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
import { CriterionHelp } from '@/components/help/CriterionHelp';
import { ScoringImpact } from '@/components/help/ScoringImpact';
import { HelpTooltip } from '@/components/help/HelpTooltip';
import { criteriaHelpContent } from '@/components/help/helpContent';

interface CommonPracticeAssessmentProps {
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
  market_penetration: string;
  adoption_rate: string;
  regional_analysis: string;
  technology_maturity: string;
  evidence_text: string;
}

const questions = [
  {
    key: 'market_penetration',
    label: 'Market Penetration Assessment',
    description: 'What is the current market penetration of this technology/practice in the region?',
    options: [
      { value: 'rare', label: 'Rare (under 4%)', score: 5 },
      { value: 'limited', label: 'Limited (4-12%)', score: 4 },
      { value: 'emerging', label: 'Emerging (12-25%)', score: 3 },
      { value: 'established', label: 'Established (25-45%)', score: 2 },
      { value: 'widespread', label: 'Widespread (above 45%)', score: 1 }
    ]
  },
  {
    key: 'adoption_rate',
    label: 'Adoption Rate Trend',
    description: 'What is the trend in adoption rate for similar projects?',
    options: [
      { value: 'declining', label: 'Declining adoption', score: 5 },
      { value: 'stable_low', label: 'Stable at low levels', score: 4 },
      { value: 'gradual_increase', label: 'Gradual increase', score: 3 },
      { value: 'rapid_increase', label: 'Rapid increase', score: 2 },
      { value: 'market_standard', label: 'Rapidly becoming the norm', score: 1 }
    ]
  },
  {
    key: 'regional_analysis',
    label: 'Regional Context',
    description: 'How does the regional context affect technology adoption?',
    options: [
      { value: 'strong_barriers', label: 'Significant local barriers', score: 5 },
      { value: 'some_barriers', label: 'Some barriers to adoption', score: 4 },
      { value: 'neutral', label: 'Neutral environment', score: 3 },
      { value: 'some_support', label: 'Some local tailwinds', score: 2 },
      { value: 'strong_support', label: 'Strong supportive environment', score: 1 }
    ]
  },
  {
    key: 'technology_maturity',
    label: 'Technology Maturity',
    description: 'What is the maturity level of the technology being deployed?',
    options: [
      { value: 'cutting_edge', label: 'Frontier / early-stage', score: 5 },
      { value: 'proven_limited', label: 'Proven but limited deployment', score: 4 },
      { value: 'established', label: 'Established technology', score: 3 },
      { value: 'mature', label: 'Mature technology', score: 2 },
      { value: 'standard', label: 'Standard/Conventional technology', score: 1 }
    ]
  }
];

const CommonPracticeAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: CommonPracticeAssessmentProps) => {
  const [formData, setFormData] = useState<FormData>({
    market_penetration: '',
    adoption_rate: '',
    regional_analysis: '',
    technology_maturity: '',
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
        .eq('criterion_code', 'common_practice');

      if (responses && responses.length > 0) {
        const responseMap = responses.reduce((acc, response) => {
          acc[response.question_key] = response.response_value || '';
          return acc;
        }, {} as Record<string, string>);

        const evidenceResponse = responses.find(r => r.question_key === 'evidence_text');
        
        setFormData({
          market_penetration: responseMap.market_penetration || '',
          adoption_rate: responseMap.adoption_rate || '',
          regional_analysis: responseMap.regional_analysis || '',
          technology_maturity: responseMap.technology_maturity || '',
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
      formData.market_penetration,
      formData.adoption_rate,
      formData.regional_analysis,
      formData.technology_maturity
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
              criterion_code: 'common_practice',
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
            criterion_code: 'common_practice',
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
            common_practice_score: score,
            market_penetration_score: score
          }, {
            onConflict: 'assessment_id'
          });
      }

        toast({
          title: "Assessment Saved",
          description: "Market prevalence assessment has been saved successfully.",
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
          This criterion evaluates the market penetration of the project's technology or practice to determine
          if the activity is already common in the region, which would reduce additionality.
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
              Provide evidence, data sources, and reasoning for your assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.evidence_text}
              onChange={(e) => setFormData(prev => ({ ...prev, evidence_text: e.target.value }))}
              placeholder="Document market data, adoption studies, regional analysis, and other supporting evidence..."
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

export default CommonPracticeAssessment;