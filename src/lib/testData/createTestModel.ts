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
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        ...comprehensiveTestData.project,
        user_id: user.id
      })
      .select()
      .single();

    if (projectError || !newProject) {
      console.error("Failed to create project:", projectError);
      return {
        success: false,
        error: `Failed to create project: ${projectError?.message}`
      };
    }

    console.log("Project created:", newProject.id);

    // Step 2: Create Financial Model
    const { data: newModel, error: modelError } = await supabase
      .from('financial_models')
      .insert({
        ...comprehensiveTestData.model,
        user_id: user.id
      })
      .select()
      .single();

    if (modelError || !newModel) {
      console.error("Failed to create financial model:", modelError);
      return {
        success: false,
        error: `Failed to create financial model: ${modelError?.message}`
      };
    }

    console.log("Financial model created:", newModel.id);

    // Step 3: Populate model inputs using the comprehensive test data
    const model_inputs = [];

    // Process each year's data
    for (let i = 0; i < testYears.length; i++) {
      const year = testYears[i];
      
      // Operational metrics - using correct form keys
      const opMetrics = comprehensiveTestData.operationalMetrics[i];
      model_inputs.push(
        {
          model_id: newModel.id,
          category: 'operational_metrics',
          input_key: 'credits_generated',
          input_value: { value: opMetrics.credits_generated },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'operational_metrics', 
          input_key: 'price_per_credit', // Fixed: was 'credit_price'
          input_value: { value: opMetrics.credit_price },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'operational_metrics',
          input_key: 'issuance_flag',
          input_value: { value: opMetrics.issuance_flag },
          year: year,
        }
      );

      // Expenses - using correct form keys
      const expenses = comprehensiveTestData.expenses[i];
      model_inputs.push(
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'feasibility_costs',
          input_value: { value: expenses.feasibility_costs },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'pdd_costs',
          input_value: { value: expenses.pdd_costs },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'mrv_costs',
          input_value: { value: expenses.mrv_costs },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'staff_costs',
          input_value: { value: expenses.staff_costs },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'capex',
          input_value: { value: expenses.capex },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'depreciation',
          input_value: { value: expenses.depreciation },
          year: year,
        }
      );

      // Financing strategy - using correct form keys and category
      const financing = comprehensiveTestData.financing[i];
      model_inputs.push(
        {
          model_id: newModel.id,
          category: 'financing', // Fixed: was 'financing_strategy'
          input_key: 'equity_injection',
          input_value: { value: financing.equity_injection },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'financing', // Fixed: was 'financing_strategy'
          input_key: 'debt_draw',
          input_value: { value: financing.debt_draw },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'financing', // Fixed: was 'financing_strategy'
          input_key: 'purchase_amount',
          input_value: { value: financing.purchase_amount },
          year: year,
        }
      );
    }

    // Add non-yearly inputs (rates, parameters, etc.) using correct form keys and categories
    model_inputs.push(
      // Expense rates
      {
        model_id: newModel.id,
        category: 'expenses',
        input_key: 'cogs_rate',
        input_value: { value: 15 }, // 15% COGS rate
      },
      {
        model_id: newModel.id,
        category: 'expenses',
        input_key: 'ar_rate', 
        input_value: { value: 12 }, // 12% AR rate
      },
      {
        model_id: newModel.id,
        category: 'expenses',
        input_key: 'ap_rate',
        input_value: { value: 8 }, // 8% AP rate
      },
      {
        model_id: newModel.id,
        category: 'expenses',
        input_key: 'income_tax_rate',
        input_value: { value: 25 }, // 25% tax rate
      },
      
      // Financing parameters - using correct category 'financing'
      {
        model_id: newModel.id,
        category: 'financing', // Fixed: was 'financing_strategy'
        input_key: 'interest_rate',
        input_value: { value: 7 }, // 7% interest rate
      },
      {
        model_id: newModel.id,
        category: 'financing', // Fixed: was 'financing_strategy'
        input_key: 'debt_duration_years',
        input_value: { value: 7 }, // 7-year debt term
      },
      {
        model_id: newModel.id,
        category: 'financing', // Fixed: was 'financing_strategy'
        input_key: 'purchase_share',
        input_value: { value: 40 }, // 40% pre-purchase share
      },
      {
        model_id: newModel.id,
        category: 'financing', // Fixed: was 'financing_strategy'
        input_key: 'discount_rate',
        input_value: { value: 12 }, // 12% discount rate
      },
      {
        model_id: newModel.id,
        category: 'financing', // Fixed: was 'financing_strategy'
        input_key: 'opening_cash_y1',
        input_value: { value: 50000 }, // $50k opening cash
      },
      {
        model_id: newModel.id,
        category: 'financing', // Add missing parameters
        input_key: 'initial_equity_t0',
        input_value: { value: 200000 }, // $200k initial equity
      },
      {
        model_id: newModel.id,
        category: 'financing',
        input_key: 'initial_ppe',
        input_value: { value: 0 }, // $0 initial PPE
      },
      
      // Add notes for each form
      {
        model_id: newModel.id,
        category: 'operational_metrics',
        input_key: 'notes',
        input_value: { value: 'Comprehensive test data for Ghana Solar Cookstoves project. Credits scale from 5,000 to 15,000 annually with strategic issuance pattern.' },
      },
      {
        model_id: newModel.id,
        category: 'expenses',
        input_key: 'notes',
        input_value: { value: 'Realistic expense profile including development costs, ongoing MRV, staff scaling, and major CAPEX investments.' },
      },
      {
        model_id: newModel.id,
        category: 'financing',
        input_key: 'notes',
        input_value: { value: 'Mixed financing with initial equity, 7-year debt facility, and strategic pre-purchase agreements in years 3-4.' },
      }
    );

    console.log(`Inserting ${model_inputs.length} input records...`);

    // Insert all inputs in batches to avoid hitting limits
    const batchSize = 100;
    for (let i = 0; i < model_inputs.length; i += batchSize) {
      const batch = model_inputs.slice(i, i + batchSize);
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
      projectId: newProject.id,
      modelId: newModel.id
    };

  } catch (error) {
    console.error("Error creating comprehensive test model:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};