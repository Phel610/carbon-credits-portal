import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface LegalConsiderationsAssessmentProps {
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

const LegalConsiderationsAssessment = ({ assessmentId, projectData, onCompletion, isCompleted }: LegalConsiderationsAssessmentProps) => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This criterion assesses whether the project activities are legally required or incentivized by
          regulations, which would compromise additionality.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Legal Requirements Analysis</CardTitle>
          <CardDescription>
            Coming soon - Legal and regulatory assessment for {projectData.project_type} projects in {projectData.country}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>This assessment module is under development.</p>
            <p className="text-sm mt-2">
              Will include regulatory requirement analysis, enforcement evaluation, and legal mandate assessment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalConsiderationsAssessment;