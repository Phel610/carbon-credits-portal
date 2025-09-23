import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Target, 
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Info
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CriterionHelpProps {
  title: string;
  rationale: string;
  scoringLogic: string;
  examples?: {
    high: string;
    medium: string;
    low: string;
  };
  keyPoints?: string[];
  relatedCriteria?: string[];
  className?: string;
}

export const CriterionHelp = ({ 
  title, 
  rationale, 
  scoringLogic, 
  examples, 
  keyPoints, 
  relatedCriteria,
  className 
}: CriterionHelpProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`bg-muted/50 border-primary/20 ${className}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">Why This Matters</CardTitle>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Rationale */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">Rationale</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{rationale}</p>
            </div>

            <Separator className="opacity-50" />

            {/* Scoring Logic */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                <h4 className="font-medium text-sm">How Scoring Works</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{scoringLogic}</p>
            </div>

            {/* Key Points */}
            {keyPoints && keyPoints.length > 0 && (
              <>
                <Separator className="opacity-50" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <h4 className="font-medium text-sm">Key Considerations</h4>
                  </div>
                  <ul className="space-y-1">
                    {keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Examples */}
            {examples && (
              <>
                <Separator className="opacity-50" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-trust" />
                    <h4 className="font-medium text-sm">Example Scenarios</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs bg-success/20 text-success-foreground border-success/30">
                          High Score (4-5)
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{examples.high}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs bg-warning/20 text-warning-foreground border-warning/30">
                          Medium Score (2-3)
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{examples.medium}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive-foreground border-destructive/30">
                          Low Score (1)
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{examples.low}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Related Criteria */}
            {relatedCriteria && relatedCriteria.length > 0 && (
              <>
                <Separator className="opacity-50" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-trust" />
                    <h4 className="font-medium text-sm">Related Criteria</h4>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {relatedCriteria.map((criteria, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {criteria}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};