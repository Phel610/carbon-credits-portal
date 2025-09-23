import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface BaselineApproachAssessmentProps {
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

const BaselineApproachAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: BaselineApproachAssessmentProps) => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This criterion evaluates the rigor, flexibility, and conservatism of the methodology used to
          establish the baseline scenario for emission reductions.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Baseline Methodology Assessment</CardTitle>
          <CardDescription>
            Coming soon - Methodology evaluation for {projectData.project_type} baseline scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>This assessment module is under development.</p>
            <p className="text-sm mt-2">
              Will include methodology rigor analysis, approach validation, and baseline risk assessment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BaselineApproachAssessment;