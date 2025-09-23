import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface CommonPracticeAssessmentProps {
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

const CommonPracticeAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: CommonPracticeAssessmentProps) => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This criterion evaluates the market penetration of the project's technology or practice to determine
          if the activity is already common in the region, which would reduce additionality.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Market Penetration Analysis</CardTitle>
          <CardDescription>
            Coming soon - Market penetration assessment for {projectData.project_type} projects in {projectData.country}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>This assessment module is under development.</p>
            <p className="text-sm mt-2">
              Will include market data analysis, technology adoption rates, and regional penetration metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommonPracticeAssessment;