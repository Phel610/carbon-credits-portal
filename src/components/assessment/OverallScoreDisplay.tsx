import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OverallScoreDisplayProps {
  assessmentId: string;
}

interface ScoreData {
  incentives_score?: number;
  common_practice_score?: number;
  legal_considerations_score?: number;
  baseline_approach_score?: number;
  baseline_reasonableness_score?: number;
  baseline_transparency_score?: number;
  red_green_flags_score?: number;
  overall_additionality_score?: number;
  red_flags?: string[];
  green_flags?: string[];
}

const getScoreColor = (score: number) => {
  if (score >= 4.5) return 'text-green-600';
  if (score >= 3.5) return 'text-blue-600';
  if (score >= 2.5) return 'text-yellow-600';
  if (score >= 1.5) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreBadge = (score: number) => {
  if (score >= 4.5) return { variant: 'default' as const, label: 'Excellent' };
  if (score >= 3.5) return { variant: 'secondary' as const, label: 'Good' };
  if (score >= 2.5) return { variant: 'outline' as const, label: 'Fair' };
  if (score >= 1.5) return { variant: 'destructive' as const, label: 'Poor' };
  return { variant: 'destructive' as const, label: 'Very Poor' };
};

const getAdditionalityInterpretation = (score: number) => {
  if (score >= 4.5) {
    return {
      level: 'Highly Additional',
      description: 'It is highly likely that the emission reductions/removals are additional',
      icon: CheckCircle,
      color: 'text-green-600'
    };
  } else if (score >= 3.5) {
    return {
      level: 'Likely Additional',
      description: 'It is likely that the emission reductions/removals are additional, and the baseline scenario has not been inflated',
      icon: CheckCircle,
      color: 'text-blue-600'
    };
  } else if (score >= 2.5) {
    return {
      level: 'Possibly Additional',
      description: 'It is more likely than not that the emission reductions/removals are additional and/or the baseline scenario has not been inflated',
      icon: Info,
      color: 'text-yellow-600'
    };
  } else if (score >= 1.5) {
    return {
      level: 'Unlikely Additional',
      description: 'It is unlikely that the emission reductions/removals are fully additional and/or the baseline scenario has been significantly inflated',
      icon: AlertTriangle,
      color: 'text-orange-600'
    };
  } else {
    return {
      level: 'Not Additional',
      description: 'Significant Red Flags exist that suggest that the emission reductions/removals are not additional',
      icon: AlertTriangle,
      color: 'text-red-600'
    };
  }
};

export default function OverallScoreDisplay({ assessmentId }: OverallScoreDisplayProps) {
  const [scoreData, setScoreData] = useState<ScoreData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScoreData();
  }, [assessmentId]);

  const fetchScoreData = async () => {
    try {
      const { data } = await supabase
        .from('additionality_scores')
        .select('*')
        .eq('assessment_id', assessmentId)
        .maybeSingle();

      if (data) {
        setScoreData(data);
      }
    } catch (error) {
      console.error('Error fetching score data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overall Additionality Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallScore = scoreData.overall_additionality_score;
  
  if (!overallScore) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Complete all assessment criteria to see your overall additionality score.
        </AlertDescription>
      </Alert>
    );
  }

  const interpretation = getAdditionalityInterpretation(overallScore);
  const IconComponent = interpretation.icon;

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className={`h-6 w-6 ${interpretation.color}`} />
            Overall Additionality Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore.toFixed(1)}/5.0
            </div>
            <Badge {...getScoreBadge(overallScore)} className="mt-2">
              {interpretation.level}
            </Badge>
          </div>
          
          <Progress value={(overallScore / 5) * 100} className="h-3" />
          
          <Alert>
            <AlertDescription className={interpretation.color}>
              <strong>{interpretation.level}:</strong> {interpretation.description}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Activities Additionality (1.1-1.3) */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Activities Additionality
            </h4>
            
            {scoreData.incentives_score && (
              <div className="flex items-center justify-between">
                <span>1.1 Incentives without Carbon Credits</span>
                <Badge variant="outline" className={getScoreColor(scoreData.incentives_score)}>
                  {scoreData.incentives_score.toFixed(1)}
                </Badge>
              </div>
            )}
            
            {scoreData.common_practice_score && (
              <div className="flex items-center justify-between">
                <span>1.2 Common Practice</span>
                <Badge variant="outline" className={getScoreColor(scoreData.common_practice_score)}>
                  {scoreData.common_practice_score.toFixed(1)}
                </Badge>
              </div>
            )}
            
            {scoreData.legal_considerations_score && (
              <div className="flex items-center justify-between">
                <span>1.3 Legal Considerations</span>
                <Badge variant="outline" className={getScoreColor(scoreData.legal_considerations_score)}>
                  {scoreData.legal_considerations_score.toFixed(1)}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Baseline Credibility (1.4-1.5) */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Baseline Credibility
            </h4>
            
            {scoreData.baseline_approach_score && (
              <div className="flex items-center justify-between">
                <span>1.4 Baseline Approach</span>
                <Badge variant="outline" className={getScoreColor(scoreData.baseline_approach_score)}>
                  {scoreData.baseline_approach_score.toFixed(1)}
                </Badge>
              </div>
            )}
            
            {scoreData.baseline_transparency_score && (
              <div className="flex items-center justify-between">
                <span>1.5.1 Baseline Transparency</span>
                <Badge variant="outline" className={getScoreColor(scoreData.baseline_transparency_score)}>
                  {scoreData.baseline_transparency_score.toFixed(1)}
                </Badge>
              </div>
            )}
            
            {scoreData.baseline_reasonableness_score && (
              <div className="flex items-center justify-between">
                <span>1.5.2 Baseline Assumptions</span>
                <Badge variant="outline" className={getScoreColor(scoreData.baseline_reasonableness_score)}>
                  {scoreData.baseline_reasonableness_score.toFixed(1)}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Red/Green Flags */}
          {scoreData.red_green_flags_score && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Additional Factors
              </h4>
              
              <div className="flex items-center justify-between">
                <span>1.6 Red and Green Flags</span>
                <Badge variant="outline" className={getScoreColor(scoreData.red_green_flags_score)}>
                  {scoreData.red_green_flags_score.toFixed(1)}
                </Badge>
              </div>
              
              {(scoreData.red_flags?.length || scoreData.green_flags?.length) && (
                <div className="mt-2 space-y-1">
                  {scoreData.red_flags && scoreData.red_flags.length > 0 && (
                    <div className="text-sm text-red-600">
                      <strong>Red Flags:</strong> {scoreData.red_flags.join(', ')}
                    </div>
                  )}
                  {scoreData.green_flags && scoreData.green_flags.length > 0 && (
                    <div className="text-sm text-green-600">
                      <strong>Green Flags:</strong> {scoreData.green_flags.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring Methodology */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Scoring Methodology:</strong> The overall score uses industry-standard inverse weighting where activities additionality (1.1-1.3) and baseline credibility (1.4-1.5) are inversely weighted. The component with the lower score receives 75% weight to ensure comprehensive evaluation across all criteria. Red/Green flags provide additional adjustments.
        </AlertDescription>
      </Alert>
    </div>
  );
}