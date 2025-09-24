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
import { Info, Save, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CriterionHelp } from '@/components/help/CriterionHelp';
import { criteriaHelpContent } from '@/components/help/helpContent';

interface ExternalEvidenceSignalsAssessmentProps {
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
  literature_support: string;
  industry_endorsement: string;
  criticism_level: string;
  third_party_validation: string;
  evidence_text: string;
  negative_signals: string[];
  positive_signals: string[];
}

const questions = [
  {
    key: 'literature_support',
    label: 'Academic Literature Support',
    description: 'What does academic literature say about additionality for this project type?',
    options: [
      { value: 'strong_support', label: 'Strong literature support for additionality', score: 5 },
      { value: 'moderate_support', label: 'Moderate literature support', score: 4 },
      { value: 'mixed_evidence', label: 'Mixed evidence in literature', score: 3 },
      { value: 'limited_support', label: 'Limited literature support', score: 2 },
      { value: 'criticism_found', label: 'Literature criticism of additionality', score: 1 }
    ]
  },
  {
    key: 'industry_endorsement',
    label: 'Industry and Expert Endorsement',
    description: 'How do industry experts and organizations view this project type\'s additionality?',
    options: [
      { value: 'strong_endorsement', label: 'Strong industry endorsement', score: 5 },
      { value: 'general_support', label: 'General industry support', score: 4 },
      { value: 'mixed_views', label: 'Mixed industry views', score: 3 },
      { value: 'some_skepticism', label: 'Some industry skepticism', score: 2 },
      { value: 'widespread_criticism', label: 'Widespread industry criticism', score: 1 }
    ]
  },
  {
    key: 'criticism_level',
    label: 'Level of Public/Media Criticism',
    description: 'What is the level of public or media criticism regarding additionality claims?',
    options: [
      { value: 'no_criticism', label: 'No significant criticism found', score: 5 },
      { value: 'minimal_criticism', label: 'Minimal, isolated criticism', score: 4 },
      { value: 'moderate_criticism', label: 'Moderate level of criticism', score: 3 },
      { value: 'significant_criticism', label: 'Significant criticism present', score: 2 },
      { value: 'widespread_criticism', label: 'Widespread, systematic criticism', score: 1 }
    ]
  },
  {
    key: 'third_party_validation',
    label: 'Third-Party Validation',
    description: 'Are there independent third-party validations of additionality claims?',
    options: [
      { value: 'multiple_validations', label: 'Multiple independent validations', score: 5 },
      { value: 'some_validation', label: 'Some third-party validation', score: 4 },
      { value: 'limited_validation', label: 'Limited external validation', score: 3 },
      { value: 'no_validation', label: 'No third-party validation found', score: 2 },
      { value: 'contradicting_evidence', label: 'Third-party evidence contradicting claims', score: 1 }
    ]
  }
];

const commonNegativeSignals = [
  'Consistent critical findings in peer-reviewed studies',
  'Sector-wide doubts about this project model',
  'Credible cases of similar projects found non-additional',
  'New rules likely to make this activity compulsory',
  'Fast organic uptake in the market without credits',
  'Viable returns even without credit income',
  'Technology now mainstream locally'
];

const commonPositiveSignals = [
  'Peer-reviewed studies support additionality drivers',
  'Independent assessments confirm key claims',
  'Recognised implementation hurdles documented',
  'Cautious baseline choices documented',
  'Clear disclosure of methods and sources',
  'Positive third-party technical reviews',
  'Direct proof that barriers were removed'
];

const ExternalEvidenceSignalsAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: ExternalEvidenceSignalsAssessmentProps) => {
  const [formData, setFormData] = useState<FormData>({
    literature_support: '',
    industry_endorsement: '',
    criticism_level: '',
    third_party_validation: '',
    evidence_text: '',
    negative_signals: [],
    positive_signals: []
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
        .eq('criterion_code', 'external_evidence_signals');

      if (responses && responses.length > 0) {
        const responseMap = responses.reduce((acc, response) => {
          acc[response.question_key] = response.response_value || '';
          return acc;
        }, {} as Record<string, string>);

        const evidenceResponse = responses.find(r => r.question_key === 'evidence_text');
        
        setFormData({
          literature_support: responseMap.literature_support || '',
          industry_endorsement: responseMap.industry_endorsement || '',
          criticism_level: responseMap.criticism_level || '',
          third_party_validation: responseMap.third_party_validation || '',
          evidence_text: evidenceResponse?.evidence_text || '',
          negative_signals: responseMap.negative_signals ? JSON.parse(responseMap.negative_signals) : [],
          positive_signals: responseMap.positive_signals ? JSON.parse(responseMap.positive_signals) : []
        });
      }

      // Load existing flags from additionality_scores
      const { data: scoresData } = await supabase
        .from('additionality_scores')
        .select('red_flags, green_flags')
        .eq('assessment_id', assessmentId)
        .maybeSingle();

      if (scoresData) {
        setFormData(prev => ({
          ...prev,
          negative_signals: scoresData.red_flags || [],
          positive_signals: scoresData.green_flags || []
        }));
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    const answers = [
      formData.literature_support,
      formData.industry_endorsement,
      formData.criticism_level,
      formData.third_party_validation
    ];

    if (answers.every(answer => answer)) {
      let totalScore = 0;
      let count = 0;

      questions.forEach(question => {
        const answer = formData[question.key as keyof FormData];
        if (answer && typeof answer === 'string') {
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

  const handleFlagToggle = (flag: string, type: 'negative' | 'positive') => {
    const flagArray = type === 'negative' ? formData.negative_signals : formData.positive_signals;
    const newFlags = flagArray.includes(flag)
      ? flagArray.filter(f => f !== flag)
      : [...flagArray, flag];
    
    setFormData(prev => ({
      ...prev,
      [type === 'negative' ? 'negative_signals' : 'positive_signals']: newFlags
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save responses
      for (const question of questions) {
        const value = formData[question.key as keyof FormData];
        if (value && typeof value === 'string') {
          await supabase
            .from('assessment_responses')
            .upsert({
              assessment_id: assessmentId,
              criterion_code: 'external_evidence_signals',
              question_key: question.key,
              response_value: value,
              evidence_text: question.key === 'evidence_text' ? formData.evidence_text : null
            }, {
              onConflict: 'assessment_id,criterion_code,question_key'
            });
        }
      }

      // Save flags as responses
      await supabase
        .from('assessment_responses')
        .upsert({
          assessment_id: assessmentId,
          criterion_code: 'external_evidence_signals',
          question_key: 'negative_signals',
          response_value: JSON.stringify(formData.negative_signals)
        }, {
          onConflict: 'assessment_id,criterion_code,question_key'
        });

      await supabase
        .from('assessment_responses')
        .upsert({
          assessment_id: assessmentId,
          criterion_code: 'external_evidence_signals',
          question_key: 'positive_signals',
          response_value: JSON.stringify(formData.positive_signals)
        }, {
          onConflict: 'assessment_id,criterion_code,question_key'
        });

      // Save evidence text separately
      if (formData.evidence_text) {
        await supabase
          .from('assessment_responses')
          .upsert({
            assessment_id: assessmentId,
            criterion_code: 'external_evidence_signals',
            question_key: 'evidence_text',
            response_value: 'evidence',
            evidence_text: formData.evidence_text
          }, {
            onConflict: 'assessment_id,criterion_code,question_key'
          });
      }

      // Save score and flags
      if (score !== null) {
        await supabase
          .from('additionality_scores')
          .upsert({
            assessment_id: assessmentId,
            red_green_flags_score: score,
            red_flags: formData.negative_signals,
            green_flags: formData.positive_signals
          }, {
            onConflict: 'assessment_id'
          });
      }

      toast({
        title: "Assessment Saved",
        description: "External evidence signals assessment has been saved successfully.",
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
      {/* Criterion Help */}
      <CriterionHelp
        title="1.6 External Evidence Signals"
        rationale={criteriaHelpContent.externalEvidenceSignals.rationale}
        scoringLogic={criteriaHelpContent.externalEvidenceSignals.scoringLogic}
        keyPoints={criteriaHelpContent.externalEvidenceSignals.keyPoints}
        relatedCriteria={criteriaHelpContent.externalEvidenceSignals.relatedCriteria}
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This criterion reviews academic literature, industry sources, and news to identify any significant
          criticisms or endorsements regarding the project's additionality.
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
                value={formData[question.key as keyof FormData] as string}
                onValueChange={(value) => setFormData(prev => ({ ...prev, [question.key]: value }))}
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

        {/* Negative Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Negative signals
            </CardTitle>
            <CardDescription>
              Select any negative signals that apply to this project (factors that reduce additionality confidence)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {commonNegativeSignals.map((flag) => (
                <div key={flag} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`negative-${flag}`}
                    checked={formData.negative_signals.includes(flag)}
                    onChange={() => handleFlagToggle(flag, 'negative')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`negative-${flag}`} className="flex-1 cursor-pointer text-sm">
                    {flag}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Positive Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Positive signals
            </CardTitle>
            <CardDescription>
              Select any positive signals that apply to this project (factors that increase additionality confidence)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {commonPositiveSignals.map((flag) => (
                <div key={flag} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`positive-${flag}`}
                    checked={formData.positive_signals.includes(flag)}
                    onChange={() => handleFlagToggle(flag, 'positive')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`positive-${flag}`} className="flex-1 cursor-pointer text-sm">
                    {flag}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supporting Evidence</CardTitle>
            <CardDescription>
              Provide literature references, industry reports, and third-party analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.evidence_text}
              onChange={(e) => setFormData(prev => ({ ...prev, evidence_text: e.target.value }))}
              placeholder="Document academic sources, industry reports, media coverage, and third-party validations..."
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

export default ExternalEvidenceSignalsAssessment;