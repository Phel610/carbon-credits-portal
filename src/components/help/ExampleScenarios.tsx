import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Lightbulb 
} from 'lucide-react';

interface Scenario {
  title: string;
  description: string;
  score: number;
  reasoning: string;
}

interface ExampleScenariosProps {
  scenarios: Scenario[];
  className?: string;
}

export const ExampleScenarios = ({ scenarios, className }: ExampleScenariosProps) => {
  const getScoreIcon = (score: number) => {
    if (score >= 4) return <CheckCircle className="h-4 w-4 text-success" />;
    if (score >= 2) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 4) return 'default';
    if (score >= 2) return 'secondary';
    return 'destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'Strong';
    if (score >= 2) return 'Moderate';
    return 'Weak';
  };

  return (
    <Card className={`bg-muted/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4 text-primary" />
          Example Scenarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scenarios.map((scenario, index) => (
          <div 
            key={index}
            className="p-3 rounded-lg border bg-card/50 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                {getScoreIcon(scenario.score)}
                <div>
                  <h4 className="text-sm font-medium">{scenario.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scenario.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={getScoreBadge(scenario.score)} className="text-xs">
                  {getScoreLabel(scenario.score)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Score: {scenario.score}
                </span>
              </div>
            </div>
            <div className="pl-6 pt-1 border-t border-border/50">
              <p className="text-xs text-muted-foreground italic">
                <span className="font-medium">Why:</span> {scenario.reasoning}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};