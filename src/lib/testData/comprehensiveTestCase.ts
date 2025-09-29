// Comprehensive test case data for Kenya Clean Cookstoves Project (2025-2029)
// Based on ChatGPT's commercially sensible, internally consistent test case
export const comprehensiveTestData = {
  // Project Data
  project: {
    name: "Kenya Clean Cookstoves Test",
    description: "Commercially grounded 5-year pilot with balanced opening position, moderate issuance, and realistic costs",
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
    name: "Kenya Clean Cookstoves – Test Case",
    project_name: "Kenya Clean Cooking Pilot",
    country: "Kenya",
    start_year: 2025,
    end_year: 2029,
    status: "active",
    description: "Commercially grounded 5-year pilot with balanced opening position, moderate issuance, and realistic costs"
  },

  // UI format data that will be passed to toEngineInputs()
  uiData: {
    // Years array
    years: [2025, 2026, 2027, 2028, 2029],

    // Operational metrics
    credits_generated: [9000, 9000, 9000, 9000, 9000],
    price_per_credit: [16, 16.5, 17, 17.5, 18],
    issue: [false, true, true, true, true], // Year 1: no issuance, Year 2: catch-up issuance

    // Expenses (will be converted to negative outflows by normalizeOutflow)
    feasibility_costs: [15000, 0, 0, 0, 0],
    pdd_costs: [40000, 0, 0, 0, 0],
    mrv_costs: [0, 20000, 20000, 20000, 20000], // MRV only after issuance starts
    staff_costs: [60000, 65000, 70000, 75000, 80000], // Growing staff costs
    capex: [50000, 0, 0, 0, 0], // Capital expenditure in Year 1
    depreciation: [10000, 10000, 10000, 10000, 10000], // Straight-line depreciation

    // Working capital & tax rates (as percentages for UI)
    cogs_rate: 15, // 15% COGS rate
    ar_rate: 10, // 10% accounts receivable rate
    ap_rate: 8, // 8% accounts payable rate
    income_tax_rate: 25, // 25% tax rate

    // Financing
    interest_rate: 7.5, // 7.5% interest rate
    debt_duration_years: 4, // 4-year debt term (fits within 5-year horizon)
    equity_injection: [50000, 0, 0, 0, 0], // Equity injection in Year 1
    debt_draw: [80000, 0, 0, 0, 0], // Debt draw in Year 1

    // Pre-purchase agreements
    purchase_amount: [50000, 0, 0, 0, 0], // Single advance in Year 1
    purchase_share: 30, // 30% of issued credits go to pre-purchase

    // Other parameters
    opening_cash_y1: 75000, // Opening cash = initial equity (balanced)
    initial_equity_t0: 75000, // Initial equity at t₀
    initial_ppe: 0, // No initial PPE (clean opening balance)
    discount_rate: 12 // 12% discount rate
  }
};

// Helper function to validate array lengths
export const validateTestData = () => {
  const targetLength = 5;
  const errors: string[] = [];
  
  // Check UI data arrays
  const { uiData } = comprehensiveTestData;
  
  // Check year-based arrays
  const yearBasedFields = [
    'credits_generated', 'price_per_credit', 'issue',
    'feasibility_costs', 'pdd_costs', 'mrv_costs', 'staff_costs', 'capex', 'depreciation',
    'equity_injection', 'debt_draw', 'purchase_amount'
  ];
  
  yearBasedFields.forEach(field => {
    const value = uiData[field];
    if (Array.isArray(value) && value.length !== targetLength) {
      errors.push(`uiData.${field}: expected ${targetLength}, got ${value.length}`);
    }
  });
  
  // Check years array specifically
  if (uiData.years.length !== targetLength) {
    errors.push(`uiData.years: expected ${targetLength}, got ${uiData.years.length}`);
  }
  
  return errors;
};

// Export years array for consistency
export const testYears = [2025, 2026, 2027, 2028, 2029];