import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { HelpCircle, Info } from 'lucide-react';

interface HelpTooltipProps {
  content: string;
  children?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  iconOnly?: boolean;
}

export const HelpTooltip = ({ 
  content, 
  children, 
  side = 'top', 
  align = 'center',
  className,
  iconOnly = false
}: HelpTooltipProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {iconOnly ? (
            <button className={`inline-flex text-muted-foreground hover:text-foreground transition-colors ${className}`}>
              <HelpCircle className="h-4 w-4" />
            </button>
          ) : (
            children || (
              <button className={`inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ${className}`}>
                <Info className="h-3 w-3" />
              </button>
            )
          )}
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs">
          <p className="text-xs leading-relaxed whitespace-pre-line">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};