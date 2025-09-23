import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-trust to-primary-glow opacity-95" />
      
      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <Shield className="h-6 w-6 text-primary-foreground" />
              <span className="text-primary-foreground/90 font-medium">
                Carbon Project Integrity
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              Assess Carbon Project 
              <span className="text-primary-glow"> Feasibility</span> & 
              <span className="text-trust-foreground"> Integrity</span>
            </h1>
            
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl">
              Digital workflows and scorecards that translate carbon market integrity frameworks 
              into standardized, data-driven assessments. Avoid greenwashing risks and validate 
              project credibility before costly verification.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="group" asChild>
                <Link to="/auth">
                  Start Assessment
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline-hero" size="lg" asChild>
                <Link to="/auth">View Demo</Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-6 mt-8 text-primary-foreground/70">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>$100k+ saved vs consultants</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>MSCI-aligned framework</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-glow/20 to-trust/20 blur-3xl" />
            <img 
              src={heroImage} 
              alt="Carbon project assessment dashboard showing integrity metrics and data visualization"
              className="relative rounded-2xl shadow-2xl border border-primary-foreground/20"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;