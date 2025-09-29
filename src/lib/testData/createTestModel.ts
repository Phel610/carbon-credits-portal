import { supabase } from "@/integrations/supabase/client";
import { comprehensiveTestData, validateTestData, testYears } from "./comprehensiveTestCase";
import { toast } from "@/hooks/use-toast";
import { toEngineInputs } from "@/lib/financial/uiAdapter";

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

    // Step 3: Use the comprehensive UI data structure directly
    const engineInputs = toEngineInputs(comprehensiveTestData.uiData);

    // Step 4: Populate model inputs using converted engine format
    const model_inputs = [];

    // Process each year's data using converted engine values
    for (let i = 0; i < testYears.length; i++) {
      const year = testYears[i];
      
      // Operational metrics
      model_inputs.push(
        {
          model_id: newModel.id,
          category: 'operational_metrics',
          input_key: 'credits_generated',
          input_value: { value: engineInputs.credits_generated[i] },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'operational_metrics', 
          input_key: 'price_per_credit',
          input_value: { value: engineInputs.price_per_credit[i] },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'operational_metrics',
          input_key: 'credits_issued',
          input_value: { value: engineInputs.credits_generated[i] * (engineInputs.issuance_flag[i] === 1 ? 1 : 0) },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'operational_metrics',
          input_key: 'issuance_flag',
          input_value: { value: engineInputs.issuance_flag[i] },
          year: year,
        }
      );

      // Expenses (now properly negative from adapter)
      model_inputs.push(
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'feasibility_costs',
          input_value: { value: engineInputs.feasibility_costs[i] },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'pdd_costs',
          input_value: { value: engineInputs.pdd_costs[i] },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'mrv_costs',
          input_value: { value: engineInputs.mrv_costs[i] },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'staff_costs',
          input_value: { value: engineInputs.staff_costs[i] },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'capex',
          input_value: { value: engineInputs.capex[i] },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'expenses',
          input_key: 'depreciation',
          input_value: { value: engineInputs.depreciation[i] },
          year: year,
        }
      );

      // Financing
      model_inputs.push(
        {
          model_id: newModel.id,
          category: 'financing',
          input_key: 'equity_injection',
          input_value: { value: engineInputs.equity_injection[i] },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'financing',
          input_key: 'debt_draw',
          input_value: { value: engineInputs.debt_draw[i] },
          year: year,
        },
        {
          model_id: newModel.id,
          category: 'financing',
          input_key: 'purchase_amount',
          input_value: { value: engineInputs.purchase_amount[i] },
          year: year,
        }
      );
    }

    // Add non-yearly inputs using converted engine format (now as decimals)
    model_inputs.push(
      {
        model_id: newModel.id,
        category: 'expenses',
        input_key: 'cogs_rate',
        input_value: { value: engineInputs.cogs_rate },
      },
      {
        model_id: newModel.id,
        category: 'expenses',
        input_key: 'ar_rate', 
        input_value: { value: engineInputs.ar_rate },
      },
      {
        model_id: newModel.id,
        category: 'expenses',
        input_key: 'ap_rate',
        input_value: { value: engineInputs.ap_rate },
      },
      {
        model_id: newModel.id,
        category: 'expenses',
        input_key: 'income_tax_rate',
        input_value: { value: engineInputs.income_tax_rate },
      },
      
      {
        model_id: newModel.id,
        category: 'financing',
        input_key: 'interest_rate',
        input_value: { value: engineInputs.interest_rate },
      },
      {
        model_id: newModel.id,
        category: 'financing',
        input_key: 'debt_duration_years',
        input_value: { value: engineInputs.debt_duration_years },
      },
      {
        model_id: newModel.id,
        category: 'financing',
        input_key: 'purchase_share',
        input_value: { value: engineInputs.purchase_share },
      },
      {
        model_id: newModel.id,
        category: 'financing',
        input_key: 'discount_rate',
        input_value: { value: engineInputs.discount_rate },
      },
      {
        model_id: newModel.id,
        category: 'financing',
        input_key: 'opening_cash_y1',
        input_value: { value: engineInputs.opening_cash_y1 },
      },
      {
        model_id: newModel.id,
        category: 'financing',
        input_key: 'initial_equity_t0',
        input_value: { value: engineInputs.initial_equity_t0 },
      },
      {
        model_id: newModel.id,
        category: 'financing',
        input_key: 'initial_ppe',
        input_value: { value: engineInputs.initial_ppe },
      },
      
      // Add notes for each form
      {
        model_id: newModel.id,
        category: 'operational_metrics',
        input_key: 'notes',
        input_value: { value: 'Comprehensive test data for Kenya Cookstoves project. Credits scale from 8,000 annually with strategic issuance pattern.' },
      },
      {
        model_id: newModel.id,
        category: 'expenses',
        input_key: 'notes',
        input_value: { value: 'Realistic expense profile including development costs, ongoing MRV, staff scaling, and equipment purchases.' },
      },
      {
        model_id: newModel.id,
        category: 'financing',
        input_key: 'notes',
        input_value: { value: 'Mixed financing with initial equity, 5-year debt facility, and strategic pre-purchase agreements.' },
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