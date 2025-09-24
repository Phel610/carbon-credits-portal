// Help content for additionality assessment criteria

export interface HelpContent {
  rationale: string;
  scoringLogic: string;
  examples?: {
    high: string;
    medium: string;
    low: string;
  };
  keyPoints: string[];
  relatedCriteria?: string[];
}

export const criteriaHelpContent: Record<string, HelpContent> = {
  financialPracticalDrivers: {
    rationale: "This step checks if carbon revenue and related support actually tilt the decision to build the project, and whether those funds help overcome hurdles that would otherwise stop it.",
    scoringLogic: "Combines financial attractiveness (role of carbon credits in project economics) with barrier analysis (strength of implementation obstacles). Projects with strong barriers that require carbon revenue score higher.",
    examples: {
      high: "Project faces significant financing barriers, carbon credits provide >30% of revenue, detailed feasibility study shows project unviable without credits",
      medium: "Project has moderate barriers, carbon credits provide 15-30% of revenue, some evidence of consideration before development",
      low: "Project financially attractive without credits, carbon credits <10% of revenue, barriers are minimal or easily overcome"
    },
    keyPoints: [
      "Carbon credit revenue percentage relative to total project revenue",
      "Internal rate of return with and without carbon credits",
      "Evidence of prior consideration of carbon credits in project planning",
      "Strength and nature of implementation barriers",
      "Quality of documentation supporting barrier claims"
    ]
  },
  
  marketPrevalence: {
    rationale: "Evaluates how common the project's technology or practice is in the target region to determine if widespread adoption suggests business-as-usual implementation.",
    scoringLogic: "Uses market penetration rates, adoption trends, regional context, and technology maturity. Lower penetration rates and stronger adoption barriers indicate higher additionality.",
    examples: {
      high: "Technology has <4% market penetration, significant local barriers exist, technology is frontier/early-stage",
      medium: "Technology has 12-25% penetration, some barriers present, established but not widespread technology",
      low: "Technology has >45% penetration, rapidly becoming the norm, mainstream technology with strong support"
    },
    keyPoints: [
      "Current market penetration percentage in the region",
      "Trend in adoption rates over recent years",
      "Regional barriers and supportive factors",
      "Technology maturity and deployment history",
      "Comparison with similar regions or markets"
    ]
  },
  
  regulatoryContext: {
    rationale: "Assesses whether legal requirements, government incentives, or regulatory trends would drive project implementation regardless of carbon credits.",
    scoringLogic: "Evaluates regulatory requirements, legal mandates, enforcement effectiveness, and compliance timeline pressure. Projects facing immediate regulatory pressure score lower.",
    examples: {
      high: "Activity not required by law, no enforcement mechanisms, no compliance pressure",
      medium: "Future regulatory shifts possible in 2-5 years, moderate enforcement, some timeline pressure",
      low: "Activity already required in practice, strict enforcement, urgent compliance requirements"
    },
    keyPoints: [
      "Current and planned regulatory requirements",
      "Level of government incentives and mandates",
      "Effectiveness of regulatory enforcement",
      "Timeline pressure from compliance requirements",
      "Comparison with regulatory frameworks in similar jurisdictions"
    ]
  },
  
  baselineMethodChoice: {
    rationale: "This step looks at how the baseline is built. We check whether the chosen method is a good fit for the project type, limits room for optimistic choices, and encourages cautious estimates.",
    scoringLogic: "Assesses methodological rigor, conservative assumptions, data quality, and alignment with project characteristics. More rigorous methods with conservative approaches score higher.",
    examples: {
      high: "Very strong method with full analysis, conservative by design, comprehensive data sources",
      medium: "Strong method with good coverage, generally cautious, adequate data quality",
      low: "Weak method, large gaps, overly optimistic assumptions, poor data foundation"
    },
    keyPoints: [
      "Methodological rigor and comprehensiveness",
      "Conservative nature of baseline assumptions",
      "Quality and reliability of data sources",
      "Alignment between methodology and project type",
      "Transparency in method selection rationale"
    ]
  },
  
  baselineDocumentationOpenness: {
    rationale: "Evaluates the transparency and completeness of baseline documentation, which enables independent verification and builds confidence in the assessment.",
    scoringLogic: "Reviews depth of documentation, clarity of method selection, source traceability, and explanation of assumptions. More transparent and complete documentation scores higher.",
    keyPoints: [
      "Depth of baseline documentation",
      "Clarity on method selection",
      "Source traceability",
      "Assumption explanations",
      "Accessibility for independent review"
    ]
  },
  
  baselineAssumptionReasonableness: {
    rationale: "Assessment of how reasonable and credible the project's baseline scenario assumptions are. Strong assumptions are supported by data, lean toward conservative estimates, and reflect a realistic 'without-project' situation.",
    scoringLogic: "Evaluates key activity rates, performance parameters, scenario construction, and overall realism of counterfactual scenarios. More conservative and well-supported assumptions score higher.",
    keyPoints: [
      "Key activity levels or impact rates in baseline scenario",
      "Emission factors and performance parameters appropriateness",
      "Overall baseline scenario construction credibility",
      "Counterfactual scenario realism and justification",
      "Conservative nature and evidence support of assumptions"
    ]
  },
  
  externalEvidenceSignals: {
    rationale: "Reviews external sources including academic literature, industry analysis, and independent assessments to identify factors that either support or challenge additionality claims.",
    scoringLogic: "Balances negative signals (factors reducing additionality confidence) against positive signals (factors supporting additionality). Projects with strong positive signals and few negative signals score higher.",
    examples: {
      high: "Peer-reviewed studies support drivers, independent assessments confirm claims, clear barrier documentation",
      medium: "Mixed evidence in literature, some third-party validation, moderate external support",
      low: "Literature criticism found, systematic external doubts, contradicting independent evidence"
    },
    keyPoints: [
      "Academic literature support or criticism",
      "Industry expert endorsement or skepticism",
      "Independent third-party validations",
      "Media coverage and public perception",
      "Comparative analysis with similar projects"
    ]
  }
};