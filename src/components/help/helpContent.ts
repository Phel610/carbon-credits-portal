// Industry-standard help content for additionality assessment criteria

export interface HelpContent {
  rationale: string;
  scoringLogic: string;
  examples?: {
    high: { title: string; description: string; };
    medium: { title: string; description: string; };
    low: { title: string; description: string; };
  };
  keyPoints: string[];
  relatedCriteria?: string[];
}

// Help content for each assessment criterion based on carbon market best practices
export const criteriaHelpContent: Record<string, HelpContent> = {
  incentives: {
    rationale: "Understanding financial incentives is fundamental to additionality assessment. Projects that would proceed without carbon finance demonstrate limited additionality since they represent business-as-usual development patterns.",
    scoringLogic: "Scores reflect the strength of evidence demonstrating carbon finance necessity. Higher scores indicate stronger additionality through demonstrated financial gaps or implementation barriers.",
    examples: {
      high: {
        title: "Clear Financial Dependency",
        description: "Comprehensive financial modeling demonstrates carbon revenues bridge critical investment gaps, with documented analysis of return thresholds."
      },
      medium: {
        title: "Partial Financial Need",
        description: "Carbon finance enhances project viability but alternatives exist, potentially with extended timelines or modified scope."
      },
      low: {
        title: "Commercially Viable Project", 
        description: "Project demonstrates market viability through conventional financing mechanisms without additional incentives."
      }
    },
    keyPoints: [
      "Assess genuine financial need for carbon revenue streams",
      "Evaluate availability and terms of alternative financing options",
      "Review investment return analysis against market benchmarks",
      "Consider implementation timeline impact without carbon finance",
      "Examine project scale and scope modifications under different scenarios"
    ],
    relatedCriteria: ["commonPractice", "financialAttractiveness", "barrierAnalysis"]
  },

  financialAttractiveness: {
    rationale: "Financial performance evaluation establishes whether projects can attract conventional investment. Financially attractive projects typically proceed through standard market mechanisms, limiting their additionality claims.",
    scoringLogic: "Assessment compares project returns against industry benchmarks and investment criteria. Lower financial attractiveness strengthens additionality arguments.",
    examples: {
      high: {
        title: "Below-Market Performance",
        description: "Returns fall substantially below investor thresholds (e.g., 7% IRR vs 12% requirement), creating clear financing gaps."
      },
      medium: {
        title: "Marginal Performance",
        description: "Returns approach but don't consistently meet investment criteria, with extended payback periods compared to sector norms."
      },
      low: {
        title: "Strong Financial Returns",
        description: "Project offers competitive returns exceeding market rates, likely attracting conventional investment without additional support."
      }
    },
    keyPoints: [
      "Compare internal rate of return against sector-specific hurdle rates",
      "Analyze payback periods relative to industry investment patterns",
      "Evaluate risk-adjusted returns considering project-specific risk factors",
      "Assess commercial financing availability and pricing",
      "Review comparable transaction benchmarks in similar market conditions"
    ],
    relatedCriteria: ["incentives", "barrierAnalysis", "commonPractice"]
  },

  barrierAnalysis: {
    rationale: "Comprehensive barrier identification captures non-financial constraints that prevent project implementation. Credible barriers provide additionality evidence even when financial analysis shows marginal viability.",
    scoringLogic: "Evaluation weighs barrier severity against available evidence and mitigation options. Well-documented, substantial barriers strengthen additionality claims.",
    examples: {
      high: {
        title: "Substantial Documented Constraints",
        description: "Multiple significant barriers with verified evidence: technology limitations, regulatory gaps, or structural market failures."
      },
      medium: {
        title: "Moderate Implementation Challenges",
        description: "Identifiable barriers requiring specific interventions: capacity constraints, institutional limitations, or market access issues."
      },
      low: {
        title: "Limited Implementation Challenges",
        description: "Few barriers present, or existing constraints appear addressable through standard business development processes."
      }
    },
    keyPoints: [
      "Document barriers with verifiable, third-party evidence",
      "Distinguish between genuine constraints and business preferences",
      "Evaluate technological, regulatory, institutional, and market-based barriers",
      "Assess barrier mitigation costs and implementation timelines", 
      "Verify barriers are not artificially created or easily overcome"
    ],
    relatedCriteria: ["incentives", "financialAttractiveness", "commonPractice"]
  },

  commonPractice: {
    rationale: "Market penetration analysis determines whether projects represent standard practice or drive genuine market transformation. Widespread practices may offer limited environmental additionality.",
    scoringLogic: "Assessment evaluates market adoption rates, regulatory frameworks, and trend analysis. Less common practices demonstrate stronger additionality potential.",
    examples: {
      high: {
        title: "Pioneering Market Application",
        description: "Technology or approach shows minimal market adoption (<3%) with no regulatory mandates, representing clear market transformation."
      },
      medium: {
        title: "Developing Market Practice",
        description: "Growing but limited adoption (3-15% penetration) with emerging policy support, indicating market development phase."
      },
      low: {
        title: "Established Market Standard",
        description: "Widespread adoption (>15% penetration) or regulatory requirements make this approach standard business practice."
      }
    },
    keyPoints: [
      "Research market penetration data for relevant technology or practice",
      "Analyze regulatory requirements and enforcement in applicable jurisdictions",
      "Evaluate market transformation indicators and adoption trends",
      "Assess technological advancement relative to conventional alternatives",
      "Review industry best practice standards and guidelines"
    ],
    relatedCriteria: ["incentives", "regulatoryAdditionality", "technologyAdditionality"]
  },

  regulatoryAdditionality: {
    rationale: "Regulatory compliance assessment ensures projects exceed legal requirements. Mandatory activities cannot demonstrate additionality since they represent required rather than voluntary action.",
    scoringLogic: "Analysis evaluates current legal frameworks, enforcement patterns, and compliance timelines. Projects exceeding regulatory minimums score higher.",
    keyPoints: [
      "Identify applicable legislation, regulations, and compliance standards",
      "Assess enforcement effectiveness and compliance monitoring systems",
      "Compare project scope against minimum regulatory requirements",
      "Evaluate implementation timelines relative to compliance deadlines",
      "Consider anticipated regulatory changes and policy developments"
    ]
  },

  technologyAdditionality: {
    rationale: "Technology assessment evaluates whether chosen solutions advance beyond conventional practice, supporting market transformation and innovation deployment.",
    scoringLogic: "Evaluation considers technology maturity, market penetration, and performance advantages over standard alternatives.",
    keyPoints: [
      "Compare performance metrics against conventional technology baselines",
      "Assess commercial maturity and market availability",
      "Evaluate adoption barriers and market penetration challenges",
      "Consider innovation potential and technological advancement",
      "Review technology transfer benefits and capacity development impacts"
    ]
  }
};