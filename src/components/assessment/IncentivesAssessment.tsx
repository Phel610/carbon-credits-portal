import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator,
  DollarSign,
  Shield,
  AlertTriangle,
  Info,
  TrendingUp
} from 'lucide-react';
import { CriterionHelp } from '@/components/help/CriterionHelp';
import { ScoringImpact } from '@/components/help/ScoringImpact';
import { HelpTooltip } from '@/components/help/HelpTooltip';
import { AssessmentGuide } from '@/components/help/AssessmentGuide';
import { criteriaHelpContent } from '@/components/help/helpContent';
import { useToast } from '@/hooks/use-toast';

interface IncentivesAssessmentProps {
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

interface AssessmentData {
  // 1.1.1 Financial Attractiveness
  carbon_credit_revenue_percentage?: number;
  irr_without_credits?: number;
  irr_with_credits?: number;
  irr_benchmark?: number;
  prior_consideration?: string;
  prior_consideration_evidence?: string;
  
  // 1.1.2 Barrier Analysis
  barrier_strength?: number;
  barrier_types?: string[];
  barrier_evidence?: string;
  
  // Overall scoring
  financial_attractiveness_score?: number;
  barrier_analysis_score?: number;
  overall_incentives_score?: number;
}

const IncentivesAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: IncentivesAssessmentProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AssessmentData>({});
  
  useEffect(() => {
    fetchExistingData();
  }, [assessmentId]);

  useEffect(() => {
    // Calculate scores whenever data changes
    calculateScores();
  }, [data.carbon_credit_revenue_percentage, data.irr_without_credits, data.irr_with_credits, data.prior_consideration, data.barrier_strength]);

  const fetchExistingData = async () => {
    try {
      const { data: responses } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('criterion_code', '1.1');

      if (responses) {
        const formattedData: AssessmentData = {};
        responses.forEach(response => {
          const key = response.question_key as keyof AssessmentData;
          if (response.response_numeric !== null) {
            (formattedData as any)[key] = response.response_numeric;
          } else if (response.response_value) {
            (formattedData as any)[key] = response.response_value;
          }
        });
        setData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const saveResponse = async (questionKey: string, value: any, isNumeric = false) => {
    try {
      await supabase
        .from('assessment_responses')
        .upsert({
          assessment_id: assessmentId,
          criterion_code: '1.1',
          question_key: questionKey,
          response_value: isNumeric ? null : String(value),
          response_numeric: isNumeric ? Number(value) : null
        });
    } catch (error) {
      console.error('Error saving response:', error);
    }
  };

  const handleInputChange = (key: keyof AssessmentData, value: any, isNumeric = false) => {
    setData(prev => ({ ...prev, [key]: value }));
    saveResponse(key, value, isNumeric);
  };

  const calculateFinancialAttractiveness = (): number => {
    let score = 1;
    
    // 1.1.1.1 Carbon Credit Revenue Percentage (40% weight)
    const revenuePercentage = data.carbon_credit_revenue_percentage || 0;
    let revenueScore = 1;
    if (revenuePercentage >= 80) revenueScore = 5;
    else if (revenuePercentage >= 60) revenueScore = 4;
    else if (revenuePercentage >= 40) revenueScore = 3;
    else if (revenuePercentage >= 20) revenueScore = 2;
    
    // 1.1.1.2 IRR Analysis (40% weight)
    let irrScore = 1;
    const irrWithout = data.irr_without_credits || 0;
    const irrWith = data.irr_with_credits || 0;
    const benchmark = data.irr_benchmark || 10;
    
    const improvementRatio = irrWith / Math.max(benchmark, 1);
    const withoutRatio = irrWithout / Math.max(benchmark, 1);
    
    if (withoutRatio < 0.8 && improvementRatio > 1.2) irrScore = 5;
    else if (withoutRatio < 1.0 && improvementRatio > 1.1) irrScore = 4;
    else if (improvementRatio > 1.05) irrScore = 3;
    else if (improvementRatio > 1.0) irrScore = 2;
    
    // 1.1.1.3 Prior Consideration (20% weight)
    let priorScore = 1;
    if (data.prior_consideration === 'strong_evidence') priorScore = 5;
    else if (data.prior_consideration === 'some_evidence') priorScore = 3;
    else if (data.prior_consideration === 'minimal_evidence') priorScore = 2;
    
    score = (revenueScore * 0.4) + (irrScore * 0.4) + (priorScore * 0.2);
    return Math.round(score * 100) / 100;
  };

  const calculateBarrierAnalysis = (): number => {
    const barrierStrength = data.barrier_strength || 1;
    return Math.round(barrierStrength * 100) / 100;
  };

  const calculateOverallIncentives = (): number => {
    const financialScore = calculateFinancialAttractiveness();
    const barrierScore = calculateBarrierAnalysis();
    
    // Use balancing rule that gives more weight to the weaker side
    const highestScore = Math.max(financialScore, barrierScore);
    const lowestScore = Math.min(financialScore, barrierScore);
    
    const overall = (highestScore * 0.75) + (lowestScore * 0.25);
    return Math.round(overall * 100) / 100;
  };

  const calculateScores = async () => {
    const financialScore = calculateFinancialAttractiveness();
    const barrierScore = calculateBarrierAnalysis();
    const overallScore = calculateOverallIncentives();
    
    setData(prev => ({
      ...prev,
      financial_attractiveness_score: financialScore,
      barrier_analysis_score: barrierScore,
      overall_incentives_score: overallScore
    }));

    // Save to database
    try {
      await supabase
        .from('additionality_scores')
        .upsert({
          assessment_id: assessmentId,
          incentives_score: overallScore,
          financial_attractiveness_score: financialScore,
          barrier_analysis_score: barrierScore
        });
      
      // Check if assessment is complete
      const isComplete = !!(
        data.carbon_credit_revenue_percentage &&
        data.irr_without_credits &&
        data.irr_with_credits &&
        data.prior_consideration &&
        data.barrier_strength
      );
      
      onCompletion(isComplete);
    } catch (error) {
      console.error('Error saving scores:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    if (score >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 4) return 'High';
    if (score >= 3) return 'Medium';
    if (score >= 2) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="space-y-6">
        {/* Assessment Guide */}
        <AssessmentGuide className="mb-6" />

        {/* Criterion Help */}
        <CriterionHelp
          title="1.1 Financial and Practical Drivers"
          rationale={criteriaHelpContent.financialPracticalDrivers.rationale}
          scoringLogic={criteriaHelpContent.financialPracticalDrivers.scoringLogic}
          keyPoints={criteriaHelpContent.financialPracticalDrivers.keyPoints}
          relatedCriteria={criteriaHelpContent.financialPracticalDrivers.relatedCriteria}
        />

        {/* Overview Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This step checks if carbon revenue and related support actually tilt the decision to build the project, and whether those funds help overcome hurdles that would otherwise stop it.
        </AlertDescription>
      </Alert>

      {/* 1.1.1 Financial Attractiveness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            1.1.1 Financial Attractiveness
          </CardTitle>
          <CardDescription>
            Evaluate the role of carbon credits in the project's financial viability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Carbon Credit Revenue % */}
          <div className="space-y-3">
            <Label htmlFor="revenue_percentage" className="text-base font-medium">
              1.1.1.1 Carbon Credits as % of Total Revenue
            </Label>
            <p className="text-sm text-muted-foreground">
              What percentage of the project's total expected revenue will come from carbon credit sales?
            </p>
            <div className="flex items-center gap-3">
              <Input
                id="revenue_percentage"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={data.carbon_credit_revenue_percentage || ''}
                onChange={(e) => handleInputChange('carbon_credit_revenue_percentage', e.target.value, true)}
                className="w-32"
              />
              <span className="text-sm">%</span>
            </div>
            {data.carbon_credit_revenue_percentage && (
              <div className="text-xs text-muted-foreground">
                Score: {data.carbon_credit_revenue_percentage >= 80 ? '5' : 
                       data.carbon_credit_revenue_percentage >= 60 ? '4' :
                       data.carbon_credit_revenue_percentage >= 40 ? '3' :
                       data.carbon_credit_revenue_percentage >= 20 ? '2' : '1'}/5
              </div>
            )}
          </div>

          <Separator />

          {/* IRR Analysis */}
          <div className="space-y-4">
            <Label className="text-base font-medium">1.1.1.2 Internal Rate of Return (IRR) Analysis</Label>
            <p className="text-sm text-muted-foreground">
              Compare the project's financial returns with and without carbon credit revenues
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="irr_without">IRR without Carbon Credits (%)</Label>
                <Input
                  id="irr_without"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={data.irr_without_credits || ''}
                  onChange={(e) => handleInputChange('irr_without_credits', e.target.value, true)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="irr_with">IRR with Carbon Credits (%)</Label>
                <Input
                  id="irr_with"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={data.irr_with_credits || ''}
                  onChange={(e) => handleInputChange('irr_with_credits', e.target.value, true)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="irr_benchmark">Required IRR Benchmark (%)</Label>
                <Input
                  id="irr_benchmark"
                  type="number"
                  step="0.1"
                  placeholder="10.0"
                  value={data.irr_benchmark || ''}
                  onChange={(e) => handleInputChange('irr_benchmark', e.target.value, true)}
                />
              </div>
            </div>

            {data.irr_with_credits && data.irr_without_credits && data.irr_benchmark && (
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="text-sm">
                  <span className="font-medium">IRR Improvement:</span> 
                  {' '}+{(data.irr_with_credits - data.irr_without_credits).toFixed(1)}%
                </div>
                <div className="text-sm">
                  <span className="font-medium">Benchmark Comparison:</span>
                  {' '}Without credits: {(data.irr_without_credits / data.irr_benchmark * 100).toFixed(0)}% of benchmark
                  {' '}| With credits: {(data.irr_with_credits / data.irr_benchmark * 100).toFixed(0)}% of benchmark
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Prior Consideration */}
          <div className="space-y-3">
            <Label className="text-base font-medium">1.1.1.3 Prior Consideration of Carbon Credits</Label>
            <p className="text-sm text-muted-foreground">
              Was there evidence that carbon credits were considered before the project decision was made?
            </p>
            
            <RadioGroup
              value={data.prior_consideration}
              onValueChange={(value) => handleInputChange('prior_consideration', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="strong_evidence" id="strong" />
                <label htmlFor="strong" className="text-sm">
                  Clear proof before commitment (for example, board notes, a signed scope with a carbon advisor, or early contact with a program)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="some_evidence" id="some" />
                <label htmlFor="some" className="text-sm">
                  Some signs before commitment (mentions in internal docs)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minimal_evidence" id="minimal" />
                <label htmlFor="minimal" className="text-sm">
                  Weak signs after the fact (late program contact, long delay between start and registration)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no_evidence" id="none" />
                <label htmlFor="none" className="text-sm">
                  No evidence provided
                </label>
              </div>
            </RadioGroup>

            {data.prior_consideration && (
              <Textarea
                placeholder="Provide evidence or explanation for your selection..."
                value={data.prior_consideration_evidence || ''}
                onChange={(e) => handleInputChange('prior_consideration_evidence', e.target.value)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* 1.1.2 Barrier Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            1.1.2 Barrier Analysis
          </CardTitle>
          <CardDescription>
            Assess barriers that carbon credits help overcome
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">Strength of Barriers</Label>
            <p className="text-sm text-muted-foreground">
              Rate the overall strength of barriers that would prevent this project without carbon credit incentives
            </p>
            
            <Select
              value={data.barrier_strength?.toString()}
              onValueChange={(value) => handleInputChange('barrier_strength', value, true)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select barrier strength" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Very High - Multiple severe barriers (financial, technical, regulatory, social)</SelectItem>
                <SelectItem value="4">High - Several significant barriers requiring substantial intervention</SelectItem>
                <SelectItem value="3">Medium - Some meaningful barriers that credits help address</SelectItem>
                <SelectItem value="2">Low - Minor barriers that credits only partially address</SelectItem>
                <SelectItem value="1">Very Low - Minimal or no barriers to implementation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="barrier_evidence">Barrier Evidence and Analysis</Label>
            <Textarea
              id="barrier_evidence"
              placeholder="Describe specific barriers (technological, financial, institutional, social) and how carbon credits help overcome them..."
              value={data.barrier_evidence || ''}
              onChange={(e) => handleInputChange('barrier_evidence', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scoring Summary */}
      {(data.financial_attractiveness_score || data.barrier_analysis_score) && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Incentives Scoring Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold mb-1">
                  {data.financial_attractiveness_score?.toFixed(1) || '—'}
                </div>
                <div className="text-sm text-muted-foreground mb-2">Financial Attractiveness</div>
                {data.financial_attractiveness_score && (
                  <Badge className={getScoreColor(data.financial_attractiveness_score)}>
                    {getScoreBadge(data.financial_attractiveness_score)}
                  </Badge>
                )}
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold mb-1">
                  {data.barrier_analysis_score?.toFixed(1) || '—'}
                </div>
                <div className="text-sm text-muted-foreground mb-2">Barrier Analysis</div>
                {data.barrier_analysis_score && (
                  <Badge className={getScoreColor(data.barrier_analysis_score)}>
                    {getScoreBadge(data.barrier_analysis_score)}
                  </Badge>
                )}
              </div>
              
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold mb-1 text-primary">
                  {data.overall_incentives_score?.toFixed(1) || '—'}
                </div>
                <div className="text-sm text-muted-foreground mb-2">Overall Score</div>
                {data.overall_incentives_score && (
                  <Badge className={getScoreColor(data.overall_incentives_score)}>
                    {getScoreBadge(data.overall_incentives_score)}
                  </Badge>
                )}
              </div>
            </div>
            
            <Alert className="mt-4">
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Scoring Method:</strong> Uses industry-standard inverse weighting where the highest sub-score 
                receives 75% weight and the lowest receives 25% weight, ensuring comprehensive evaluation across both criteria.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IncentivesAssessment;