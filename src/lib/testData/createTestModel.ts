import { supabase } from "@/integrations/supabase/client";
import { comprehensiveTestData, validateTestData, testYears } from "./comprehensiveTestCase";
import { toast } from "@/hooks/use-toast";

export interface TestModelResult {
  success: boolean;
  projectId?: string;
  modelId?: string;
  error?: string;
}

export const createComprehensiveTestModel = async (): Promise<TestModelResult> => {
  try {
    // Validate test data first
    const validationErrors = validateTestData();
    if (validationErrors.length > 0) {
      console.error("Test data validation failed:", validationErrors);
      return {
        success: false,
        error: `Test data validation failed: ${validationErrors.join(", ")}`
      };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    console.log("Creating comprehensive test model for user:", user.id);

    // Step 1: Create Project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        ...comprehensiveTestData.project,
        user_id: user.id
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error("Failed to create project:", projectError);
      return {
        success: false,
        error: `Failed to create project: ${projectError?.message}`
      };
    }

    console.log("Project created:", project.id);

    // Step 2: Create Financial Model
    const { data: model, error: modelError } = await supabase
      .from('financial_models')
      .insert({
        ...comprehensiveTestData.model,
        user_id: user.id
      })
      .select()
      .single();

    if (modelError || !model) {
      console.error("Failed to create financial model:", modelError);
      return {
        success: false,
        error: `Failed to create financial model: ${modelError?.message}`
      };
    }

    console.log("Financial model created:", model.id);

    // Step 3: Populate Model Inputs
    const inputs = [];

    // Operational Metrics
    const opMetrics = comprehensiveTestData.operationalMetrics;
    for (let i = 0; i < testYears.length; i++) {
      const year = testYears[i];
      
      // Revenue and credits
      inputs.push(
        {
          model_id: model.id,
          category: 'operational_metrics',
          input_key: 'credits_generated',
          year,
          input_value: opMetrics.creditsGenerated[i]
        },
        {
          model_id: model.id,
          category: 'operational_metrics',
          input_key: 'credit_price',
          year,
          input_value: opMetrics.creditPrice[i]
        },
        {
          model_id: model.id,
          category: 'operational_metrics',
          input_key: 'credits_issued',
          year,
          input_value: opMetrics.creditsIssued[i]
        },
        {
          model_id: model.id,
          category: 'operational_metrics',
          input_key: 'carbon_revenue',
          year,
          input_value: opMetrics.carbonRevenue[i]
        },
        {
          model_id: model.id,
          category: 'operational_metrics',
          input_key: 'other_revenue',
          year,
          input_value: opMetrics.otherRevenue[i]
        },
        {
          model_id: model.id,
          category: 'operational_metrics',
          input_key: 'cogs_rate',
          year,
          input_value: opMetrics.cogsRate[i]
        },
        {
          model_id: model.id,
          category: 'operational_metrics',
          input_key: 'utilization_rate',
          year,
          input_value: opMetrics.utilizationRate[i]
        },
        {
          model_id: model.id,
          category: 'operational_metrics',
          input_key: 'efficiency_gains',
          year,
          input_value: opMetrics.efficiencyGains[i]
        }
      );
    }

    // Expenses
    const expenses = comprehensiveTestData.expenses;
    for (let i = 0; i < testYears.length; i++) {
      const year = testYears[i];
      
      inputs.push(
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'feasibility_studies',
          year,
          input_value: expenses.feasibilityStudies[i]
        },
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'pdd_preparation',
          year,
          input_value: expenses.pddPreparation[i]
        },
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'mrv_costs',
          year,
          input_value: expenses.mrvCosts[i]
        },
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'staff_costs',
          year,
          input_value: expenses.staffCosts[i]
        },
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'equipment_purchases',
          year,
          input_value: expenses.equipmentPurchases[i]
        },
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'maintenance_capex',
          year,
          input_value: expenses.maintenanceCapex[i]
        },
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'legal_professional',
          year,
          input_value: expenses.legalProfessional[i]
        },
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'insurance',
          year,
          input_value: expenses.insurance[i]
        },
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'general_admin',
          year,
          input_value: expenses.generalAdmin[i]
        },
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'depreciation',
          year,
          input_value: expenses.depreciation[i]
        },
        {
          model_id: model.id,
          category: 'expenses',
          input_key: 'tax_rate',
          year,
          input_value: expenses.taxRate[i]
        }
      );
    }

    // Financing Strategy
    const financing = comprehensiveTestData.financing;
    for (let i = 0; i < testYears.length; i++) {
      const year = testYears[i];
      
      inputs.push(
        {
          model_id: model.id,
          category: 'financing_strategy',
          input_key: 'contributed_capital',
          year,
          input_value: financing.contributedCapital[i]
        },
        {
          model_id: model.id,
          category: 'financing_strategy',
          input_key: 'debt_draws',
          year,
          input_value: financing.debtDraws[i]
        },
        {
          model_id: model.id,
          category: 'financing_strategy',
          input_key: 'interest_rate',
          year,
          input_value: financing.interestRate[i]
        },
        {
          model_id: model.id,
          category: 'financing_strategy',
          input_key: 'purchase_agreements',
          year,
          input_value: financing.purchaseAgreements[i]
        },
        {
          model_id: model.id,
          category: 'financing_strategy',
          input_key: 'purchase_agreement_share',
          year,
          input_value: financing.purchaseAgreementShare[i]
        },
        {
          model_id: model.id,
          category: 'financing_strategy',
          input_key: 'accounts_receivable_rate',
          year,
          input_value: financing.accountsReceivableRate[i]
        },
        {
          model_id: model.id,
          category: 'financing_strategy',
          input_key: 'accounts_payable_rate',
          year,
          input_value: financing.accountsPayableRate[i]
        },
        {
          model_id: model.id,
          category: 'financing_strategy',
          input_key: 'inventory_rate',
          year,
          input_value: financing.inventoryRate[i]
        },
        {
          model_id: model.id,
          category: 'financing_strategy',
          input_key: 'minimum_cash_balance',
          year,
          input_value: financing.minimumCashBalance[i]
        }
      );
    }

    // Add single-value inputs (loan term, opening cash)
    inputs.push(
      {
        model_id: model.id,
        category: 'financing_strategy',
        input_key: 'loan_term',
        year: null,
        input_value: financing.loanTerm
      },
      {
        model_id: model.id,
        category: 'financing_strategy',
        input_key: 'opening_cash_y1',
        year: null,
        input_value: financing.openingCashY1
      }
    );

    console.log(`Inserting ${inputs.length} input records...`);

    // Insert all inputs in batches to avoid hitting limits
    const batchSize = 100;
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const { error: inputsError } = await supabase
        .from('model_inputs')
        .insert(batch);

      if (inputsError) {
        console.error(`Failed to insert inputs batch ${i}-${i + batch.length}:`, inputsError);
        return {
          success: false,
          error: `Failed to insert inputs: ${inputsError.message}`
        };
      }
    }

    console.log("All inputs inserted successfully");

    return {
      success: true,
      projectId: project.id,
      modelId: model.id
    };

  } catch (error) {
    console.error("Error creating comprehensive test model:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};