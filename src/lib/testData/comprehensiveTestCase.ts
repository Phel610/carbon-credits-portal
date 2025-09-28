// Comprehensive test case data for Kenya Cookstoves Project (2025-2027)
export const comprehensiveTestData = {
  // Project Data
  project: {
    name: "Kenya Cookstoves Test",
    description: "Test project for realistic financial modeling - 3-year improved cookstoves pilot in rural Kenya",
    project_type: "cookstoves" as const,
    country: "Kenya",
    start_date: "2025-01-01",
    status: "active",
    project_size: "small",
    location_type: "rural",
    developer_type: "private"
  },

  // Financial Model Data
  model: {
    name: "Test Model - Kenya Cookstoves 2025-2027",
    project_name: "Kenya Cookstoves Test",
    country: "Kenya",
    start_year: 2025,
    end_year: 2027,
    status: "active",
    description: "Realistic test model with 3-year financial projections for 5,000 cookstoves"
  },

  // Model Inputs - Operational Metrics (3 years)
  operationalMetrics: {
    // Credit Generation and Pricing - 9,000 credits/year from 5,000 cookstoves (1.8 tCO2/cookstove/year)
    creditsGenerated: [9000, 9000, 9000],
    creditPrice: [16.0, 16.5, 17.0],
    
    // Credit Issuance Strategy - delayed by 1 year for verification
    creditsIssued: [0, 9000, 9000],
    
    // Issuance Flag (0 = no issuance, 1 = issue credits that year)
    issuanceFlag: [0, 1, 1],
    
    // Revenue Components - no other revenue streams
    carbonRevenue: [0, 144000, 153000],
    otherRevenue: [0, 0, 0],
    
    // Cost Structure (35% COGS for cookstove distribution)
    cogsRate: [0.35, 0.35, 0.35],
    
    // Performance Metrics - realistic assumptions
    utilizationRate: [0.80, 0.85, 0.85],
    efficiencyGains: [0.05, 0.05, 0.05]
  },

  // Model Inputs - Expenses (3 years)
  expenses: {
    // Development Costs - front-loaded in year 1
    feasibilityStudies: [5000, 0, 0],
    pddPreparation: [5000, 0, 0],
    
    // Operational Expenses - ongoing MRV and staff
    mrvCosts: [8000, 8000, 8000],
    staffCosts: [7000, 7000, 7000],
    
    // Capital Expenditures - cookstove procurement
    equipmentPurchases: [50000, 0, 0],
    maintenanceCapex: [0, 2000, 2000],
    
    // Administrative costs - minimal for pilot project
    legalProfessional: [2000, 1000, 1000],
    insurance: [1500, 1500, 1500],
    generalAdmin: [3000, 3000, 3000],
    
    // Depreciation - 3-year straight line for equipment
    depreciation: [16667, 16667, 16666],
    
    // Tax Related - Kenya corporate tax rate
    taxRate: [0.30, 0.30, 0.30]
  },

  // Model Inputs - Financing Strategy (3 years)
  financing: {
    // Equity - initial capital injection
    contributedCapital: [25000, 0, 0],
    
    // Debt Structure - 3-year term loan at 10% (matches project duration)
    debtDraws: [50000, 0, 0],
    interestRate: [0.10, 0.10, 0.10],
    loanTerm: 3, // years - matches project duration
    
    // No Purchase Agreements - keep it simple for pilot
    purchaseAgreements: [0, 0, 0],
    purchaseAgreementShare: [0, 0, 0],
    
    // Working Capital - minimal for cookstove project
    accountsReceivableRate: [0.05, 0.05, 0.05],
    accountsPayableRate: [0.08, 0.08, 0.08],
    inventoryRate: [0.02, 0.02, 0.02],
    
    // Cash Management - minimal balance requirement
    minimumCashBalance: [5000, 5000, 5000],
    
    // Opening Cash (will be auto-calculated to balance)
    openingCashY1: 15000 // Reasonable starting cash for pilot project
  }
};

// Helper function to validate array lengths
export const validateTestData = () => {
  const targetLength = 3;
  const errors: string[] = [];
  
  // Check operational metrics arrays
  Object.entries(comprehensiveTestData.operationalMetrics).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length !== targetLength) {
      errors.push(`operationalMetrics.${key}: expected ${targetLength}, got ${value.length}`);
    }
  });
  
  // Check expenses arrays
  Object.entries(comprehensiveTestData.expenses).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length !== targetLength) {
      errors.push(`expenses.${key}: expected ${targetLength}, got ${value.length}`);
    }
  });
  
  // Check financing arrays
  Object.entries(comprehensiveTestData.financing).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length !== targetLength) {
      errors.push(`financing.${key}: expected ${targetLength}, got ${value.length}`);
    }
  });
  
  return errors;
};

// Export years array for consistency
export const testYears = [2025, 2026, 2027];