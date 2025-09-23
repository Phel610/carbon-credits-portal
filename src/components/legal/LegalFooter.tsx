import { Disclaimer } from './Disclaimer';

export const LegalFooter = () => {
  return (
    <footer className="border-t bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <Disclaimer variant="compact" />
        
        <div className="mt-4 pt-4 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Carbon Integrity Platform. Independent assessment tool for carbon market professionals.
          </p>
        </div>
      </div>
    </footer>
  );
};