import { Badge } from "@/components/ui/badge";
import { CheckCircle, DollarSign, Clock, Shield, BarChart3, Users } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: "95% Cost Reduction",
      description: "Save $100k+ compared to traditional consultant-led due diligence processes.",
      metric: "$100k+"
    },
    {
      icon: Clock,
      title: "10x Faster Assessment",
      description: "Complete comprehensive integrity assessments in days, not months.",
      metric: "Days"
    },
    {
      icon: Shield,
      title: "MSCI-Aligned Framework",
      description: "Built on established carbon market integrity standards and best practices.",
      metric: "100%"
    },
    {
      icon: BarChart3,
      title: "Data-Driven Validation",
      description: "Cross-reference against IRENA, IEA, and other authoritative data sources.",
      metric: "Real-time"
    },
    {
      icon: CheckCircle,
      title: "Standardized Outputs",
      description: "Generate consistent reports accepted by investors, buyers, and registries.",
      metric: "Universal"
    },
    {
      icon: Users,
      title: "Market Trust Building",
      description: "Restore confidence in carbon markets through transparent integrity assessment.",
      metric: "Trusted"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-accent/30 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Why Choose Our Platform</Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Restore Trust in 
            <span className="text-primary"> Carbon Markets</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform addresses the fundamental challenges facing carbon markets today, 
            providing affordable, standardized, and credible integrity assessment tools.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="group">
              <div className="bg-card rounded-2xl p-8 h-full border border-border group-hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{benefit.metric}</div>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-gradient-to-r from-primary/10 via-trust/10 to-primary/10 rounded-3xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Transform Carbon Project Assessment?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the movement to restore integrity and trust in carbon markets through 
            standardized, data-driven assessment tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-card rounded-xl p-4 border">
              <div className="text-2xl font-bold text-primary">$100k+</div>
              <div className="text-sm text-muted-foreground">Saved per project</div>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <div className="text-2xl font-bold text-trust">10x</div>
              <div className="text-sm text-muted-foreground">Faster than consultants</div>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <div className="text-2xl font-bold text-success">100%</div>
              <div className="text-sm text-muted-foreground">MSCI aligned</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;