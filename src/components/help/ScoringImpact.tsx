import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface ScoringImpactProps {
  selectedScore?: number;
  maxScore: number;
  impact: 'high' | 'medium' | 'low';
  description?: string;
  recommendation?: string;
  className?: string;
}

export const ScoringImpact = ({ 
  selectedScore, 
  maxScore, 
  impact, 
  description,
  recommendation,
  className 
}: ScoringImpactProps) => {
  const getImpactColor = () => {
    switch (impact) {
      case 'high':
        return selectedScore && selectedScore >= 4 ? 'text-success' : 'text-destructive';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getImpactIcon = () => {
    if (!selectedScore) return <Minus className="h-3 w-3" />;
    
    if (selectedScore >= 4) {
      return <TrendingUp className="h-3 w-3" />;
    } else if (selectedScore >= 2) {
      return <Minus className="h-3 w-3" />;
    } else {
      return <TrendingDown className="h-3 w-3" />;
    }
  };

  const getImpactText = () => {
    if (!selectedScore) return 'No selection';
    
    if (selectedScore >= 4) {
      return 'Positive Impact';
    } else if (selectedScore >= 2) {
      return 'Neutral Impact';
    } else {
      return 'Negative Impact';
    }
  };

  const getBadgeVariant = () => {
    if (!selectedScore) return 'outline';
    
    if (selectedScore >= 4) {
      return 'default';
    } else if (selectedScore >= 2) {
      return 'secondary';
    } else {
      return 'destructive';
    }
  };

  const getScoreText = () => {
    if (!selectedScore) return '–';
    return `${selectedScore}/${maxScore}`;
  };

  return (
    <Card className={`bg-accent/30 border-dashed ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={getImpactColor()}>
              {getImpactIcon()}
            </div>
            <span className="text-xs font-medium">{getImpactText()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getBadgeVariant()} className="text-xs px-2 py-0">
              {getScoreText()}
            </Badge>
          </div>
        </div>

        {selectedScore && selectedScore < 2 && recommendation && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{recommendation}</p>
          </div>
        )}

        {description && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};