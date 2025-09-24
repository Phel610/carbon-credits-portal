import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Target, 
  CheckCircle,
  BarChart3,
  HelpCircle
} from 'lucide-react';

interface AssessmentGuidePopupProps {
  className?: string;
}

export const AssessmentGuidePopup = ({ className }: AssessmentGuidePopupProps) => {
  const guideData = [
    {
      id: 'scoring',
      title: 'Scoring System',
      tabLabel: 'Scoring',
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
      title: 'Score Combination',
      tabLabel: 'Weighting',
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
      title: 'Best Practices',
      tabLabel: 'Tips',
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
    <div className={className}>
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="default"
            className="bg-trust/5 border-trust/20 hover:bg-trust/10 hover:border-trust/30 text-trust hover:text-trust/90 transition-all duration-200"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Assessment Guide
            <HelpCircle className="h-3 w-3 ml-2 opacity-60" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-trust" />
              Assessment Guide
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="scoring" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              {guideData.map((section) => (
                <TabsTrigger 
                  key={section.id} 
                  value={section.id}
                  className="flex items-center gap-2"
                >
                  {section.icon}
                  <span className="hidden sm:inline">{section.tabLabel}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {guideData.map((section) => (
              <TabsContent 
                key={section.id} 
                value={section.id} 
                className="max-h-[60vh] overflow-y-auto mt-6 space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                    {section.icon}
                    <div>
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  
                  {section.id === 'scoring' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border">
                        {section.content.overview}
                      </p>
                      <div className="grid gap-3">
                        {section.content.scoreDescriptions.map((item, index) => (
                          <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-card border hover:shadow-sm transition-shadow">
                            <Badge 
                              variant={item.score >= 4 ? 'default' : item.score >= 3 ? 'secondary' : 'destructive'}
                              className="text-base px-3 py-1"
                            >
                              {item.score}
                            </Badge>
                            <div className="space-y-1">
                              <div className="font-medium">{item.label}</div>
                              <div className="text-sm text-muted-foreground leading-relaxed">{item.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.id === 'weighting' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border">
                        {section.content.overview}
                      </p>
                      <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Target className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                          <p className="text-sm leading-relaxed">{section.content.explanation}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Score Components
                        </h4>
                        <div className="grid gap-2">
                          {section.content.components.map((component, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                              <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <span className="text-sm leading-relaxed">{component}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === 'best-practices' && (
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        {section.content.tips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-3 p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                            <CheckCircle className="h-4 w-4 text-success mt-1 flex-shrink-0" />
                            <span className="text-sm leading-relaxed">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};