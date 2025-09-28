// Comprehensive test case data for Kenya Cookstoves Project (2025-2029)
export const comprehensiveTestData = {
  // Project Data
  project: {
    name: "Kenya Cookstoves Test",
    description: "Test project for realistic financial modeling - 5-year improved cookstoves deployment in rural Kenya",
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
    name: "Test Model - Kenya Cookstoves 2025-2029",
    project_name: "Kenya Cookstoves Test",
    country: "Kenya",
    start_year: 2025,
    end_year: 2029,
    status: "active",
    description: "Realistic test model with 5-year financial projections for 5,000 cookstoves"
  },

  // Model Inputs - Operational Metrics (5 years)
  operationalMetrics: {
    // Credit Generation and Pricing - 8,000 credits/year from 5,000 cookstoves
    creditsGenerated: [8000, 8000, 8000, 8000, 8000],
    creditPrice: [8.0, 9.0, 10.0, 11.0, 12.0],
    
    // Credit Issuance Strategy - delayed by 6 months for verification
    creditsIssued: [0, 8000, 8000, 8000, 8000],
    
    // Issuance Flag (0 = no issuance, 1 = issue credits that year)
    issuanceFlag: [0, 1, 1, 1, 1],
    
    // Revenue Components - no other revenue streams
    carbonRevenue: [0, 72000, 80000, 88000, 96000],
    otherRevenue: [0, 0, 0, 0, 0],
    
    // Cost Structure (40% COGS for cookstove procurement and distribution)
    cogsRate: [0.40, 0.40, 0.40, 0.40, 0.40],
    
    // Performance Metrics - simple assumptions
    utilizationRate: [0.80, 0.85, 0.85, 0.85, 0.85],
    efficiencyGains: [0.05, 0.05, 0.05, 0.05, 0.05]
  },

  // Model Inputs - Expenses (5 years)
  expenses: {
    // Development Costs - front-loaded in year 1
    feasibilityStudies: [25000, 0, 0, 0, 0],
    pddPreparation: [40000, 0, 0, 0, 0],
    
    // Operational Expenses - ongoing MRV and staff
    mrvCosts: [15000, 10000, 10000, 10000, 10000],
    staffCosts: [50000, 50000, 50000, 50000, 50000],
    
    // Capital Expenditures - cookstove inventory
    equipmentPurchases: [150000, 50000, 50000, 50000, 50000],
    maintenanceCapex: [0, 5000, 5000, 5000, 5000],
    
    // Administrative costs - minimal for small project
    legalProfessional: [10000, 5000, 5000, 5000, 5000],
    insurance: [3000, 3000, 3000, 3000, 3000],
    generalAdmin: [10000, 10000, 10000, 10000, 10000],
    
    // Depreciation - 5-year straight line for equipment
    depreciation: [30000, 30000, 30000, 30000, 30000],
    
    // Tax Related - Kenya corporate tax rate
    taxRate: [0.30, 0.30, 0.30, 0.30, 0.30]
  },

  // Model Inputs - Financing Strategy (5 years)
  financing: {
    // Equity - initial capital injection
    contributedCapital: [100000, 0, 0, 0, 0],
    
    // Debt Structure - simple 5-year term loan at 10%
    debtDraws: [200000, 0, 0, 0, 0],
    interestRate: [0.10, 0.10, 0.10, 0.10, 0.10],
    loanTerm: 5, // years
    
    // No Purchase Agreements - keep it simple
    purchaseAgreements: [0, 0, 0, 0, 0],
    purchaseAgreementShare: [0, 0, 0, 0, 0],
    
    // Working Capital - minimal for cookstove project
    accountsReceivableRate: [0.05, 0.05, 0.05, 0.05, 0.05],
    accountsPayableRate: [0.08, 0.08, 0.08, 0.08, 0.08],
    inventoryRate: [0.02, 0.02, 0.02, 0.02, 0.02],
    
    // Cash Management - minimal balance requirement
    minimumCashBalance: [10000, 10000, 10000, 10000, 10000],
    
    // Opening Cash (will be auto-calculated to balance)
    openingCashY1: 50000 // Reasonable starting cash for small project
  }
};

// Helper function to validate array lengths
export const validateTestData = () => {
  const targetLength = 5;
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
export const testYears = [2025, 2026, 2027, 2028, 2029];