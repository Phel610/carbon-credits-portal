import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

interface DisclaimerProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export const Disclaimer = ({ className, variant = 'compact' }: DisclaimerProps) => {
  if (variant === 'compact') {
    return (
      <Alert className={className}>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Independent Assessment Tool:</strong> This platform provides standardized carbon market integrity assessments 
          based on industry best practices. Not affiliated with or endorsed by any specific standard-setting organization.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">Legal Disclaimer & Independence Notice</h3>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Independent Platform:</strong> This assessment platform is independently developed and operated. 
            We are not affiliated with, endorsed by, or connected to any carbon market standard-setting organization.
          </p>
          
          <p>
            <strong>Methodology Attribution:</strong> We review widely cited frameworks across the market and draw inspiration from publicly available 
            carbon market integrity standards and best practices. All content has been independently developed and expressed in our own methodology.
          </p>
          
          <p>
            <strong>Professional Use:</strong> This tool provides standardized assessment capabilities for professional use. 
            Users should validate assessments with qualified carbon market professionals and consider project-specific factors.
          </p>
          
          <p>
            <strong>No Warranty:</strong> Assessments are provided for informational purposes. Users assume responsibility 
            for validating results and ensuring compliance with applicable standards and regulations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};