import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Users, Award } from "lucide-react";

const TargetUsers = () => {
  const users = [
    {
      icon: Building2,
      title: "Project Developers",
      subtitle: "Validate Early, Save Costs",
      description: "Run low-cost feasibility checks before expensive verification processes. Identify potential issues early and improve project design.",
      benefits: ["$100k+ saved on consultants", "Early risk identification", "Improved project design", "Faster investor readiness"],
      color: "primary"
    },
    {
      icon: TrendingUp,
      title: "Investors & Funds",
      subtitle: "Screen Pipelines Efficiently",
      description: "Standardized due diligence outputs help you identify high-integrity projects and avoid greenwashing risks in your portfolio.",
      benefits: ["Standardized screening", "Risk mitigation", "Portfolio integrity", "Due diligence efficiency"],
      color: "trust"
    },
    {
      icon: Users,
      title: "Corporate Buyers",
      subtitle: "Ensure Credit Quality",
      description: "Assess carbon credit supply integrity before purchase. Build confidence in your net-zero commitments with verified quality credits.",
      benefits: ["Credit quality assurance", "Net-zero credibility", "Supply chain integrity", "Compliance confidence"],
      color: "success"
    },
    {
      icon: Award,
      title: "Registries & Standards",
      subtitle: "Encourage Pre-Qualification",
      description: "Provide developers with tools to self-assess before submission, improving application quality and reducing review workload.",
      benefits: ["Higher quality applications", "Reduced review time", "Improved standards", "Market confidence"],
      color: "warning"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Built for Every Stakeholder</Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Trusted by 
            <span className="text-primary"> Carbon Market Leaders</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From project developers in emerging markets to institutional investors managing billion-dollar 
            portfolios, our platform serves every carbon market stakeholder.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {users.map((user, index) => (
            <div key={index} className="group">
              <div className="bg-card rounded-3xl p-8 h-full border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <user.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{user.title}</h3>
                    <p className="text-muted-foreground text-sm">{user.subtitle}</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">{user.description}</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {user.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Button size="lg" className="group">
            Start Your Assessment
            <TrendingUp className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TargetUsers;