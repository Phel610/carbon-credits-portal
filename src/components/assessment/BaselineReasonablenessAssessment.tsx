import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface BaselineReasonablenessAssessmentProps {
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

const BaselineReasonablenessAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: BaselineReasonablenessAssessmentProps) => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This criterion evaluates the transparency and reasonableness of baseline scenario assumptions
          compared to external benchmarks and best practices.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Baseline Assumptions Validation</CardTitle>
          <CardDescription>
            Coming soon - Baseline transparency and assumption reasonableness assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>This assessment module is under development.</p>
            <p className="text-sm mt-2">
              Will include assumption validation, transparency scoring, and baseline reasonableness analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BaselineReasonablenessAssessment;