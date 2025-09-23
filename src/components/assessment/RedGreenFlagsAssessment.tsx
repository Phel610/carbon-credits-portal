import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface RedGreenFlagsAssessmentProps {
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

const RedGreenFlagsAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: RedGreenFlagsAssessmentProps) => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This criterion reviews academic literature, industry sources, and news to identify any significant
          criticisms or endorsements regarding the project's additionality.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Literature and Industry Analysis</CardTitle>
          <CardDescription>
            Coming soon - Academic literature review and red/green flag identification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>This assessment module is under development.</p>
            <p className="text-sm mt-2">
              Will include literature search, flag categorization, and third-party validation analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RedGreenFlagsAssessment;