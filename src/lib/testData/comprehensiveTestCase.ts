// Comprehensive test case data for Ghana Solar Cookstoves Project (2025-2034)
export const comprehensiveTestData = {
  // Project Data
  project: {
    name: "Ghana Solar Cookstoves Test",
    description: "Test project for comprehensive financial modeling validation - 10-year solar cookstoves deployment in rural Ghana",
    project_type: "cookstoves" as const,
    country: "Ghana",
    start_date: "2025-01-01",
    status: "active",
    project_size: "medium",
    location_type: "rural",
    developer_type: "private"
  },

  // Financial Model Data
  model: {
    name: "Test Model - Ghana Cookstoves 2025-2034",
    project_name: "Ghana Solar Cookstoves Test",
    country: "Ghana",
    start_year: 2025,
    end_year: 2034,
    status: "active",
    description: "Comprehensive test model with realistic 10-year financial projections"
  },

  // Model Inputs - Operational Metrics (10 years)
  operationalMetrics: {
    // Credit Generation and Pricing
    creditsGenerated: [5000, 6500, 8000, 10000, 11500, 12500, 13500, 14000, 14500, 15000],
    creditPrice: [12.0, 12.5, 13.2, 14.0, 14.8, 15.5, 16.2, 17.0, 17.5, 18.0],
    
    // Credit Issuance Strategy (delayed issuance pattern)
    creditsIssued: [0, 3000, 5000, 8000, 9500, 11000, 12000, 13000, 14000, 15000],
    
    // Issuance Flag (true when credits are issued that year)
    issuanceFlag: [false, true, true, true, true, true, true, true, true, true],
    
    // Revenue Components
    carbonRevenue: [0, 37500, 66000, 112000, 140600, 170500, 194400, 221000, 245000, 270000],
    otherRevenue: [15000, 18000, 22000, 25000, 28000, 30000, 32000, 35000, 37000, 40000],
    
    // Cost Structure (percentages)
    cogsRate: [0.15, 0.14, 0.13, 0.12, 0.12, 0.11, 0.11, 0.10, 0.10, 0.09],
    
    // Performance Metrics
    utilizationRate: [0.75, 0.80, 0.85, 0.88, 0.90, 0.92, 0.93, 0.94, 0.95, 0.95],
    efficiencyGains: [0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.11]
  },

  // Model Inputs - Expenses (10 years)
  expenses: {
    // Development Costs
    feasibilityStudies: [75000, 5000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000],
    pddPreparation: [100000, 50000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000],
    
    // Operational Expenses
    mrvCosts: [20000, 25000, 28000, 30000, 32000, 34000, 35000, 35000, 35000, 35000],
    staffCosts: [180000, 195000, 210000, 225000, 240000, 250000, 250000, 250000, 250000, 250000],
    
    // Capital Expenditures
    equipmentPurchases: [400000, 50000, 75000, 100000, 150000, 50000, 75000, 50000, 25000, 25000],
    maintenanceCapex: [10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000],
    
    // Administrative
    legalProfessional: [25000, 15000, 18000, 20000, 22000, 24000, 26000, 28000, 30000, 32000],
    insurance: [8000, 10000, 12000, 14000, 16000, 18000, 20000, 22000, 24000, 26000],
    generalAdmin: [30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000],
    
    // Depreciation
    depreciation: [45000, 50000, 55000, 60000, 65000, 60000, 55000, 50000, 45000, 40000],
    
    // Tax Related
    taxRate: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25]
  },

  // Model Inputs - Financing Strategy (10 years)
  financing: {
    // Equity
    contributedCapital: [200000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    
    // Debt Structure
    debtDraws: [800000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    interestRate: [0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07],
    loanTerm: 7, // years
    
    // Purchase Agreements
    purchaseAgreements: [0, 0, 350000, 350000, 0, 0, 0, 0, 0, 0],
    purchaseAgreementShare: [0, 0, 0.40, 0.40, 0, 0, 0, 0, 0, 0],
    
    // Working Capital
    accountsReceivableRate: [0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12],
    accountsPayableRate: [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08],
    inventoryRate: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
    
    // Cash Management
    minimumCashBalance: [50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000],
    
    // Opening Cash (will be auto-calculated to balance)
    openingCashY1: 150000 // This will be adjusted as needed for balance
  }
};

// Helper function to validate array lengths
export const validateTestData = () => {
  const targetLength = 10;
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
export const testYears = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034];