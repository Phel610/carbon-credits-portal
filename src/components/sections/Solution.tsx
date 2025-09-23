import { CheckCircle, Target, BarChart3, FileCheck } from "lucide-react";
import integrityImage from "@/assets/integrity-network.jpg";

const Solution = () => {
  const features = [
    {
      icon: Target,
      title: "Self-Assessment Platform",
      description: "Let developers and investors assess project feasibility and integrity before expensive verification processes."
    },
    {
      icon: BarChart3,
      title: "Digital Integrity Framework",
      description: "Translate leading carbon market frameworks into standardized workflows, calculators, and scorecards."
    },
    {
      icon: FileCheck,
      title: "Standardized Outputs",
      description: "Generate integrity scores, traffic-light ratings, negative/positive signals, and remediation guidance for stakeholders."
    },
    {
      icon: CheckCircle,
      title: "Data-Driven Validation",
      description: "Cross-check user claims against external datasets from IRENA, IEA, policy databases, and emission factors."
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-center lg:text-left mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                A Digital 
                <span className="text-primary"> Integrity Gatekeeper</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Our SaaS platform transforms complex carbon market integrity frameworks 
                into accessible, standardized assessment tools that build trust and reduce risk.
              </p>
            </div>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-trust/20 blur-2xl rounded-full" />
            <img 
              src={integrityImage} 
              alt="Carbon project integrity assessment network visualization"
              className="relative rounded-2xl shadow-xl border border-border"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solution;