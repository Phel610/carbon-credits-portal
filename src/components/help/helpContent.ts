// MSCI-based help content for additionality assessment criteria

export interface HelpContent {
  rationale: string;
  scoringLogic: string;
  examples?: {
    high: string;
    medium: string;
    low: string;
  };
  keyPoints?: string[];
  relatedCriteria?: string[];
}

export const criteriaHelpContent = {
  // 1.1 Incentives without Carbon Credits
  incentives: {
    rationale: "Carbon credits fundamentally act as an incentive mechanism. The ability to sell credits should incentivize actors to implement mitigation activities that they would not normally pursue. This may be due to the fact that the mitigation activity is not financially attractive without carbon credit revenues, or it would face other barriers that carbon credits can help to alleviate.",
    scoringLogic: "The overall score is determined by weighting Financial Attractiveness and Barrier Analysis. The higher score receives 75% weighting, the lower receives 25%, ensuring that high barriers can offset moderate financial attractiveness and vice versa.",
    keyPoints: [
      "Projects generating 100% revenue from carbon credits automatically score high on Financial Attractiveness",
      "Barrier analysis considers both evidenced barriers and inherent project characteristics",
      "Prior consideration of carbon credits strengthens the financial attractiveness case",
      "The inverse weighting ensures neither sub-component can fully offset a very low score in the other"
    ],
    relatedCriteria: ["Common Practice", "Legal Considerations", "Baseline Reasonableness"]
  },

  // 1.1.1 Financial Attractiveness
  financialAttractiveness: {
    rationale: "Financial attractiveness is an important determinant of whether carbon credits played a decisive role in incentivizing a mitigation activity to go ahead. If credits only represent a fraction of the financial case for a project, but a project still claims credits represent 100% of the emission reductions achieved, additionality is more uncertain.",
    scoringLogic: "Combines three sub-criteria: (1) Carbon credits as % of revenue - higher percentages score better, (2) IRR Analysis - projects should be unattractive without credits but attractive with them, (3) Prior Consideration - evidence that credits were considered before project start.",
    examples: {
      high: "A REDD+ project where carbon credits represent 80-100% of revenue, pre-credit IRR is below benchmark but post-credit IRR exceeds benchmark by 3+ percentage points, with documented evidence of carbon credit consideration in early project documents.",
      medium: "A renewable energy project where carbon credits provide 30-50% of revenue, pre-credit IRR marginally below benchmark, post-credit IRR above benchmark, with some evidence of prior consideration.",
      low: "A project where carbon credits represent <10% of revenue, the project was financially attractive even without credits (pre-credit IRR above benchmark), and no evidence exists of carbon credit consideration before project start."
    },
    keyPoints: [
      "Revenue percentage from carbon credits is often the strongest indicator",
      "IRR analysis should show credits made an unattractive project attractive",
      "Prior consideration requires documented evidence, not just claims",
      "Registration gaps between project start and carbon registration may indicate late consideration"
    ]
  },

  // 1.1.1.1 Carbon Credits as % of Revenue
  carbonRevenue: {
    rationale: "The higher the proportion of a project's revenue that comes from carbon credits, the greater the likely importance of carbon credits to the financial attractiveness of a project. If credits only represent a fraction of the financial case for a project, but a project still claims credits represent 100% of the emission reductions achieved, additionality is more uncertain.",
    scoringLogic: "Projects are scored 1-5 based on the percentage of total revenue from carbon credits: 1 = <10%, 2 = 10-25%, 3 = 25-50%, 4 = 50-75%, 5 = 75-100%. Removal projects often score 5 as credits are their only revenue source.",
    examples: {
      high: "A direct air capture project where carbon credits provide 100% of revenue - no other revenue streams exist",
      medium: "A cookstove project where carbon credits provide 40% of revenue, with device sales providing the remaining 60%", 
      low: "A wind farm where carbon credits provide 8% of revenue, with electricity sales providing 92%"
    },
    keyPoints: [
      "Removal projects typically have 100% revenue from credits",
      "Renewable energy projects often have lower percentages due to electricity sales",
      "Cookstove and household projects vary widely depending on business model",
      "Higher percentages indicate stronger dependence on carbon finance"
    ]
  },

  // 1.1.1.2 IRR Analysis
  irrAnalysis: {
    rationale: "Carbon credits should incentivize actors to implement mitigation activities that would not otherwise have been financially attractive without those revenues. Ideally carbon credits will make a mitigation activity that would otherwise have been financially unattractive into a financially viable one.",
    scoringLogic: "Evaluates three components: (1) Pre-credit IRR vs benchmark - should be below, (2) Post-credit IRR vs benchmark - should be above, (3) Absolute difference between post and pre-credit IRR - should be material (typically 3+ percentage points).",
    examples: {
      high: "Project has 2% IRR without credits (benchmark 8%), 12% IRR with credits, showing 10pp improvement that makes project viable",
      medium: "Project has 6% IRR without credits (benchmark 8%), 10% IRR with credits, showing 4pp improvement and marginal viability",
      low: "Project has 9% IRR without credits (benchmark 8%), 11% IRR with credits - already viable without credits"
    },
    keyPoints: [
      "Benchmark IRR varies by country, technology, and developer type",
      "Material improvement typically means 3+ percentage point increase",
      "Projects viable without credits are less likely to be additional",
      "Very high post-credit IRRs may indicate conservative assumptions"
    ]
  },

  // 1.1.1.3 Prior Consideration
  priorConsideration: {
    rationale: "Projects that can clearly demonstrate that carbon credits were considered prior to their decision to start provide more evidence that credits acted as an important incentive in starting mitigation activities. If no credible evidence exists that credits were considered prior to the initial decision, there is a higher risk that a project would have gone ahead regardless.",
    scoringLogic: "Scored based on documented evidence of carbon credit consideration before project start: letters of intent to registries, carbon consultant employment, board minutes mentioning credits, or registration timeline analysis.",
    examples: {
      high: "Project has documented letter of intent to Verra 6 months before project start, plus board meeting minutes discussing carbon revenue in feasibility analysis",
      medium: "Project registered with CDM within 1 year of start date, with some documentation of carbon consideration in project documents", 
      low: "Project started in 2020 but only registered for carbon credits in 2023, with no documented evidence of prior consideration"
    },
    keyPoints: [
      "Documentary evidence is stronger than retrospective claims",
      "Short gaps between start and registration suggest prior planning",
      "Letters of intent and consultant engagement are strong evidence",
      "Long delays may indicate credits were an afterthought"
    ]
  },

  // 1.1.2 Barrier Analysis
  barrierAnalysis: {
    rationale: "The existence of barriers to implementation might prevent a mitigation activity from going ahead despite being financially viable. In these cases, carbon credits can be pivotal in overcoming these barriers and therefore incentivizing the mitigation activities to go ahead. Projects that face high barriers to implementation are more likely to be additional.",
    scoringLogic: "Assessed through evidenced barriers (project-documented obstacles with supporting sources) and inherent barriers (based on country income level, location type, project size, and developer type characteristics).",
    examples: {
      high: "Small-scale cookstove project in rural Malawi by local NGO - faces high inherent barriers due to low-income country, rural location, small scale, and limited developer capacity",
      medium: "Medium-scale solar project in urban Brazil by established developer - moderate barriers due to middle-income country and urban location, offset by developer experience",
      low: "Large-scale wind project in Germany by multinational developer - minimal barriers due to high-income country, established technology, large scale, and experienced developer"
    },
    keyPoints: [
      "Four key characteristics affect inherent barriers: country, location, scale, developer",
      "Rural, small-scale projects in low-income countries typically face highest barriers",
      "Technology barriers vary - cookstoves face adoption challenges, renewables face grid barriers",
      "Financial barriers include limited access to capital and currency risks",
      "Regulatory barriers include permitting complexity and policy uncertainty"
    ]
  },

  // 1.2 Common Practice
  commonPractice: {
    rationale: "If a technology or practice is already common within a market, then this indicates that these types of projects are more likely to have gone ahead without the introduction of carbon credits. Market penetration assessments evaluate the extent to which a type of mitigation activity or technology is already implemented in the relevant geographical area.",
    scoringLogic: "Scored 1-5 based on market penetration thresholds: 1 = Very High (>50%), 2 = High (30-50%), 3 = Moderate (15-30%), 4 = Low (5-15%), 5 = Very Low (<5%). Lower penetration indicates higher additionality likelihood.",
    examples: {
      high: "Solar PV project in a country where solar represents <2% of electricity generation and has minimal existing capacity",
      medium: "Cookstove project in a region where improved cookstoves have 20% household adoption rate",
      low: "Wind project in a country where wind already provides 60% of electricity generation and is the dominant technology"
    },
    keyPoints: [
      "Market penetration measured at relevant geographic level (country, region, or local)",
      "Technology-specific thresholds based on typical adoption patterns",
      "Timing matters - penetration assessed at project start date, not current levels",
      "Rapid growth markets may indicate technology becoming business-as-usual"
    ],
    relatedCriteria: ["Incentives", "Legal Considerations"]
  },

  // 1.3 Legal Considerations  
  legalConsiderations: {
    rationale: "A project is unlikely to be additional if the mitigation activity is required by law or regulation. Even if not immediately mandated, regulation may impact incentives - for example, requirements for longer-term phase-outs still compromise additionality. Legal requirements must also be enforced to affect additionality.",
    scoringLogic: "Scored 1-5 based on legal requirement severity: 1 = Legally required and enforced, 2 = Legally incentivized with enforcement, 3 = Some regulatory drivers, 4 = Minimal legal requirements, 5 = No relevant legal requirements.",
    examples: {
      high: "REDD+ project in a country with weak forest law enforcement where deforestation is technically illegal but rarely prosecuted",
      medium: "Renewable energy project in a country with renewable portfolio standards but no specific technology mandates",
      low: "Methane destruction project in a country where such activities are legally mandated and actively enforced"
    },
    keyPoints: [
      "Legal requirements must be enforced to impact additionality",
      "NDCs alone don't constitute legal requirements unless specified",
      "Regulatory timelines matter - future requirements can affect current additionality",
      "Enforcement capacity varies significantly between jurisdictions"
    ],
    relatedCriteria: ["Common Practice", "Incentives"]
  },

  // 1.4 Baseline Approach
  baselineApproach: {
    rationale: "Best-practice methodological approaches ensure that baseline scenarios are appropriately and reasonably estimated. Approaches that do not use scientifically best-practice techniques, allow a broad range of approaches or assumptions, or don't incorporate a degree of conservatism, are more at risk of manipulation and/or overestimation.",
    scoringLogic: "Methodology assessed on rigor, flexibility, and conservatism: higher scores for standardized approaches, performance benchmarks, conservative defaults, and limited flexibility in key parameters.",
    examples: {
      high: "Methodology uses standardized emission factors, requires performance benchmarking, includes conservative buffers, and limits flexibility in baseline assumptions",
      medium: "Methodology provides some standardization but allows project-specific adjustments with justification requirements",
      low: "Methodology allows wide flexibility in baseline assumptions with minimal requirements for conservatism or validation"
    },
    keyPoints: [
      "Standardized approaches reduce manipulation risk",
      "Performance benchmarking provides objective baselines", 
      "Conservative defaults protect against overestimation",
      "Flexibility increases risk but may be needed for diverse projects"
    ],
    relatedCriteria: ["Baseline Reasonableness", "Baseline Transparency"]
  },

  // 1.5 Baseline Reasonableness
  baselineReasonableness: {
    rationale: "A project's baseline scenario is evaluated against independent modeling to assess its reasonableness. Transparent documentation and reasonable assumptions compared to independent estimates indicate lower risk of baseline inflation.",
    scoringLogic: "Combines baseline transparency (quality and detail of documentation) and baseline assumptions (reasonableness vs independent estimates). Both components equally weighted.",
    keyPoints: [
      "Transparency requires detailed methodology, data sources, and assumption documentation",
      "Assumptions benchmarked against independent sources and peer projects",
      "Conservative estimates preferred over optimistic ones",
      "Regional and temporal relevance of data sources important"
    ],
    relatedCriteria: ["Baseline Approach", "Red/Green Flags"]
  },

  // 1.5.1 Baseline Transparency
  baselineTransparency: {
    rationale: "The presence of clear documentation and assumptions are critical to make an objective assessment of a project's baseline. It is important that this documentation transparently details a project's approach, sources and assumptions made.",
    scoringLogic: "Scored based on completeness and clarity of baseline documentation: methodology explanation, data source citations, assumption justification, and calculation transparency.",
    examples: {
      high: "Project provides detailed methodology description, cites all data sources with dates and versions, justifies all assumptions with references, and includes step-by-step calculations",
      medium: "Project provides basic methodology and some data sources, with partial assumption justification",
      low: "Project provides minimal baseline documentation with unexplained assumptions and unclear data sources"
    },
    keyPoints: [
      "Complete documentation enables independent verification",
      "Data source citations allow assumption validation", 
      "Assumption justification demonstrates reasonableness",
      "Calculation transparency enables error detection"
    ]
  },

  // 1.5.2 Baseline Assumptions
  baselineAssumptions: {
    rationale: "Each project type has a set of key assumptions that determine the appropriateness of their baseline scenario. Evaluating the reasonableness of these key assumptions indicates whether a project has potentially inflated its baseline.",
    scoringLogic: "Key assumptions benchmarked against independent estimates, peer projects, and conservative ranges. Assumptions within reasonable bounds score higher than outliers or optimistic estimates.",
    examples: {
      high: "REDD+ project uses deforestation rates consistent with government data and peer projects, with conservative adjustments for uncertainty",
      medium: "Project assumptions generally reasonable but some parameters at upper end of expected ranges",
      low: "Project uses deforestation rates 2-3x higher than government estimates or peer projects in similar areas"
    },
    keyPoints: [
      "Key assumptions vary by project type (deforestation rates, emission factors, etc.)",
      "Benchmarking against multiple sources increases confidence",
      "Conservative bias preferred over optimistic projections",
      "Outlier assumptions require strong justification"
    ]
  },

  // 1.6 Red and Green Flags
  redGreenFlags: {
    rationale: "In-depth studies in academic literature or other industry sources that evaluate a specific project can provide a supporting third-party indicator on its likely additionality. Significant criticism or support from reputable sources provides additional evidence.",
    scoringLogic: "Projects with flags receive fixed scores: High Red Flags = 1, Medium Red Flags = 2, Low Red Flags = 2.5, Low Green Flags = 3.5, Medium Green Flags = 4, High Green Flags = 5.",
    examples: {
      high: "Project featured in peer-reviewed paper praising innovative approach and strong additionality evidence",
      medium: "Project mentioned positively in reputable industry reports for good practices",
      low: "Project criticized in academic literature for questionable baseline assumptions or developer practices"
    },
    keyPoints: [
      "Academic sources carry higher weight than media reports",
      "Project-specific analysis valued over general commentary",
      "Recent assessments more relevant than older ones",
      "Multiple consistent sources strengthen flag significance"
    ]
  }
};