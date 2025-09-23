import { Disclaimer } from './Disclaimer';

export const LegalFooter = () => {
  return (
    <footer className="border-t bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <Disclaimer variant="compact" />
        
        <div className="mt-4 pt-4 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Carbon Integrity Platform. This tool is independent and not affiliated with any single rating provider. We draw on widely used concepts in carbon integrity and public standards. All trademarks and copyrights belong to their owners.
          </p>
        </div>
      </div>
    </footer>
  );
};