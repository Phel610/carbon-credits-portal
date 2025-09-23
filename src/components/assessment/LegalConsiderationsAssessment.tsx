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

interface LegalConsiderationsAssessmentProps {
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
  regulatory_requirements: string;
  legal_mandates: string;
  enforcement_level: string;
  compliance_timeline: string;
  evidence_text: string;
}

const questions = [
  {
    key: 'regulatory_requirements',
    label: 'Regulatory Requirements',
    description: 'Are the project activities legally required by existing regulations?',
    options: [
      { value: 'not_required', label: 'Not legally required', score: 5 },
      { value: 'future_requirement', label: 'Future legal requirement (>5 years)', score: 4 },
      { value: 'near_future', label: 'Near future requirement (2-5 years)', score: 3 },
      { value: 'upcoming', label: 'Upcoming requirement (<2 years)', score: 2 },
      { value: 'currently_required', label: 'Currently legally required', score: 1 }
    ]
  },
  {
    key: 'legal_mandates',
    label: 'Legal Mandates and Incentives',
    description: 'What is the level of legal mandates or government incentives for this activity?',
    options: [
      { value: 'no_mandates', label: 'No mandates or incentives', score: 5 },
      { value: 'weak_incentives', label: 'Weak voluntary incentives', score: 4 },
      { value: 'moderate_incentives', label: 'Moderate incentives available', score: 3 },
      { value: 'strong_incentives', label: 'Strong financial incentives', score: 2 },
      { value: 'mandatory', label: 'Mandatory with penalties', score: 1 }
    ]
  },
  {
    key: 'enforcement_level',
    label: 'Enforcement Effectiveness',
    description: 'How effectively are relevant regulations enforced in this jurisdiction?',
    options: [
      { value: 'no_enforcement', label: 'No enforcement mechanism', score: 5 },
      { value: 'weak_enforcement', label: 'Weak/inconsistent enforcement', score: 4 },
      { value: 'moderate_enforcement', label: 'Moderate enforcement', score: 3 },
      { value: 'strong_enforcement', label: 'Strong enforcement', score: 2 },
      { value: 'strict_enforcement', label: 'Strict enforcement with penalties', score: 1 }
    ]
  },
  {
    key: 'compliance_timeline',
    label: 'Compliance Timeline Pressure',
    description: 'Is there time pressure to comply with regulations that would drive adoption?',
    options: [
      { value: 'no_pressure', label: 'No compliance pressure', score: 5 },
      { value: 'distant_deadlines', label: 'Distant compliance deadlines', score: 4 },
      { value: 'moderate_pressure', label: 'Moderate time pressure', score: 3 },
      { value: 'significant_pressure', label: 'Significant compliance pressure', score: 2 },
      { value: 'urgent_compliance', label: 'Urgent compliance requirements', score: 1 }
    ]
  }
];

const LegalConsiderationsAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: LegalConsiderationsAssessmentProps) => {
  const [formData, setFormData] = useState<FormData>({
    regulatory_requirements: '',
    legal_mandates: '',
    enforcement_level: '',
    compliance_timeline: '',
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
        .eq('criterion_code', 'legal_considerations');

      if (responses && responses.length > 0) {
        const responseMap = responses.reduce((acc, response) => {
          acc[response.question_key] = response.response_value || '';
          return acc;
        }, {} as Record<string, string>);

        const evidenceResponse = responses.find(r => r.question_key === 'evidence_text');
        
        setFormData({
          regulatory_requirements: responseMap.regulatory_requirements || '',
          legal_mandates: responseMap.legal_mandates || '',
          enforcement_level: responseMap.enforcement_level || '',
          compliance_timeline: responseMap.compliance_timeline || '',
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
      formData.regulatory_requirements,
      formData.legal_mandates,
      formData.enforcement_level,
      formData.compliance_timeline
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
              criterion_code: 'legal_considerations',
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
            criterion_code: 'legal_considerations',
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
            legal_considerations_score: score
          }, {
            onConflict: 'assessment_id'
          });
      }

      toast({
        title: "Assessment Saved",
        description: "Legal considerations assessment has been saved successfully.",
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
          This criterion assesses whether the project activities are legally required or incentivized by
          regulations, which would compromise additionality.
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
              Provide regulatory analysis, legal references, and enforcement documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.evidence_text}
              onChange={(e) => setFormData(prev => ({ ...prev, evidence_text: e.target.value }))}
              placeholder="Document relevant regulations, legal requirements, enforcement history, and compliance analysis..."
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

export default LegalConsiderationsAssessment;