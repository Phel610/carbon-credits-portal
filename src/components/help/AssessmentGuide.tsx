import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Target, 
  HelpCircle,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface AssessmentGuideProps {
  className?: string;
}

export const AssessmentGuide = ({ className }: AssessmentGuideProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const guideData = [
    {
      id: 'scoring',
      title: 'Understanding the Scoring System',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Learn how each score translates to additionality likelihood',
      content: {
        overview: 'All criteria are scored on a 1-5 scale where higher scores indicate stronger additionality evidence.',
        scoreDescriptions: [
          { score: 5, label: 'Highly Likely Additional', description: 'Strong evidence that emission reductions would not occur without carbon credits' },
          { score: 4, label: 'Likely Additional', description: 'Good evidence supporting additionality with minimal concerns' },
          { score: 3, label: 'More Likely Than Not', description: 'Evidence suggests additionality but with some uncertainty' },
          { score: 2, label: 'Unlikely Additional', description: 'Significant concerns about whether reductions are truly additional' },
          { score: 1, label: 'Not Additional', description: 'Strong evidence that reductions would occur anyway' }
        ]
      }
    },
    {
      id: 'weighting',
      title: 'How We Combine Scores',
      icon: <Target className="h-4 w-4" />,
      description: 'Understanding the balancing rule approach',
      content: {
        overview: 'We use a balancing rule that gives more weight to the weaker side of the results.',
        explanation: 'A weak area will pull the total down more than a strong area will push it up. This stops strong results in one place from hiding weak spots elsewhere.',
        components: [
          'Project Drivers score (covers 1.1–1.3)',
          'Baseline Quality score (covers 1.4–1.5)',
          'External Evidence adjustment (formerly 1.6)'
        ]
      }
    },
    {
      id: 'best-practices',
      title: 'Assessment Best Practices',
      icon: <CheckCircle className="h-4 w-4" />,
      description: 'Tips for conducting thorough assessments',
      content: {
        tips: [
          'Always provide detailed evidence to support your selections',
          'Consider multiple data sources when available',
          'Be conservative in your assumptions - err on the side of lower additionality',
          'Document all assumptions and data sources clearly',
          'Review peer projects for benchmarking where possible',
          'Consider temporal factors - markets and regulations change over time'
        ]
      }
    }
  ];

  return (
    <Card className={`bg-trust/5 border-trust/20 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-trust" />
          Assessment Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {guideData.map((section) => (
          <Collapsible 
            key={section.id}
            open={expandedSection === section.id}
            onOpenChange={(open) => setExpandedSection(open ? section.id : null)}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                <div className="flex items-center gap-3">
                  {section.icon}
                  <div className="text-left">
                    <div className="font-medium text-sm">{section.title}</div>
                    <div className="text-xs text-muted-foreground">{section.description}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto transform transition-transform data-[state=open]:rotate-90" />
                </div>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="px-3 pb-3">
              <div className="space-y-3 mt-3">
                {section.id === 'scoring' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{section.content.overview}</p>
                    <div className="space-y-2">
                      {section.content.scoreDescriptions.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                          <Badge 
                            variant={item.score >= 4 ? 'default' : item.score >= 3 ? 'secondary' : 'destructive'}
                            className="mt-0.5"
                          >
                            {item.score}
                          </Badge>
                          <div>
                            <div className="font-medium text-sm">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {section.id === 'weighting' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{section.content.overview}</p>
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm">{section.content.explanation}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Score Components:</h4>
                      <ul className="space-y-1">
                        {section.content.components.map((component, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {component}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {section.id === 'best-practices' && (
                  <div className="space-y-3">
                    <ul className="space-y-2">
                      {section.content.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
};