import { Badge } from "@/components/ui/badge";
import { Plus, Shield, Repeat, AlertCircle, Users, Eye, Award } from "lucide-react";

const CoreModules = () => {
  const modules = [
    {
      icon: Plus,
      number: "01",
      title: "Additionality",
      description: "Assess if the project truly needs carbon finance through financial, barrier, legal, and baseline analysis.",
      features: ["Financial additionality test", "Barrier analysis", "Legal requirements check", "Baseline scenarios"]
    },
    {
      icon: Shield,
      number: "02", 
      title: "Permanence",
      description: "Evaluate durability of emission reductions and management of reversal risks over project lifetime.",
      features: ["Durability assessment", "Reversal risk analysis", "Buffer pool calculations", "Long-term monitoring"]
    },
    {
      icon: Repeat,
      number: "03",
      title: "Leakage",
      description: "Identify and quantify potential emission shifts to other locations or activities outside project boundaries.",
      features: ["Market leakage analysis", "Activity displacement", "Geographic boundaries", "Mitigation strategies"]
    },
    {
      icon: Users,
      number: "04",
      title: "Safeguards & Co-Benefits",
      description: "Ensure projects avoid harm while creating measurable social and environmental value for communities.",
      features: ["Environmental impact", "Social safeguards", "Community benefits", "Stakeholder engagement"]
    },
    {
      icon: Eye,
      number: "05",
      title: "Governance & Transparency",
      description: "Evaluate project management quality, monitoring systems, and reporting transparency standards.",
      features: ["Management structure", "Monitoring protocols", "Reporting standards", "Stakeholder access"]
    },
    {
      icon: Award,
      number: "06",
      title: "Verification & Market Integrity", 
      description: "Assess compliance with registry standards and third-party verification requirements for market acceptance.",
      features: ["Registry compliance", "Third-party verification", "Market standards", "Certification pathways"]
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-accent/30 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Core Assessment Framework</Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Six Critical 
            <span className="text-primary"> Integrity Criteria</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Each integrity criterion becomes a comprehensive digital module with guided workflows, 
            automated calculations, and standardized scoring aligned with industry best practices.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, index) => (
            <div key={index} className="group">
              <div className="bg-card rounded-2xl p-8 h-full border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <module.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground/50">{module.number}</div>
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{module.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{module.description}</p>
                
                <div className="space-y-2">
                  {module.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreModules;