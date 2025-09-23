import { AlertTriangle, DollarSign, Users, Globe } from "lucide-react";

const Problem = () => {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Carbon Market Integrity Crisis",
      description: "Projects accused of over-crediting, weak baselines, and questionable additionality undermine trust in carbon markets."
    },
    {
      icon: DollarSign,
      title: "Costly Due Diligence Barriers",
      description: "Developers, especially in emerging markets, cannot afford $100k+ consultant-led assessments early in their project cycle."
    },
    {
      icon: Users,
      title: "Standardization Gap",
      description: "Investors and buyers lack standardized, data-driven screening tools to identify and avoid greenwashing risks."
    },
    {
      icon: Globe,
      title: "Market Access Challenges",
      description: "Without credible pre-assessment, quality projects struggle to attract investment while questionable ones proceed unchecked."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-accent/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            The Carbon Market 
            <span className="text-destructive"> Integrity Crisis</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Today's carbon markets face unprecedented scrutiny. Project developers need affordable 
            validation tools, while investors demand credible screening mechanisms to restore trust.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, index) => (
            <div key={index} className="group">
              <div className="bg-card rounded-2xl p-8 h-full border border-border hover:border-destructive/30 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-destructive/10 mb-6 group-hover:bg-destructive/20 transition-colors">
                  <problem.icon className="h-7 w-7 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{problem.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Problem;