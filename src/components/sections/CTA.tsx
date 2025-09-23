import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Calendar } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-trust to-primary-glow" />
      
      <div className="relative z-10 container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
          Start Assessing Carbon Project 
          <span className="text-primary-glow"> Integrity Today</span>
        </h2>
        
        <p className="text-xl text-primary-foreground/80 mb-8 max-w-3xl mx-auto">
          Join leading developers, investors, and buyers who trust our platform 
          to validate carbon project credibility and avoid greenwashing risks.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button variant="hero" size="lg" className="group">
            Start Free Assessment
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline-hero" size="lg" className="group">
            <Calendar className="mr-2 h-5 w-5" />
            Schedule Demo
          </Button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-foreground mb-2">5 min</div>
            <div className="text-primary-foreground/70">Quick setup</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-foreground mb-2">No credit card</div>
            <div className="text-primary-foreground/70">Free to start</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-foreground mb-2">24/7</div>
            <div className="text-primary-foreground/70">Expert support</div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <p className="text-primary-foreground/70 mb-4">
            Questions? Get in touch with our carbon market experts
          </p>
          <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10">
            <Mail className="mr-2 h-4 w-4" />
            contact@carbonintegrity.com
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;