import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto-purge of deleted scenarios...');

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find scenarios that were deleted more than 30 days ago
    const { data: deletedScenarios, error: fetchError } = await supabase
      .from('model_scenarios')
      .select('id, scenario_name, deleted_at')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', thirtyDaysAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching deleted scenarios:', fetchError);
      throw fetchError;
    }

    if (!deletedScenarios || deletedScenarios.length === 0) {
      console.log('No scenarios to purge.');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No scenarios to purge',
          purged_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${deletedScenarios.length} scenarios to purge`);

    let purgedCount = 0;
    const errors: any[] = [];

    // Delete each scenario permanently
    for (const scenario of deletedScenarios) {
      try {
        console.log(`Purging scenario: ${scenario.scenario_name} (ID: ${scenario.id})`);

        const { error: deleteError } = await supabase
          .from('model_scenarios')
          .delete()
          .eq('id', scenario.id);

        if (deleteError) {
          console.error(`Error deleting scenario ${scenario.id}:`, deleteError);
          errors.push({ scenario_id: scenario.id, error: deleteError.message });
        } else {
          purgedCount++;
          console.log(`Successfully purged scenario: ${scenario.scenario_name}`);
        }
      } catch (error) {
        console.error(`Exception while deleting scenario ${scenario.id}:`, error);
        errors.push({ 
          scenario_id: scenario.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    console.log(`Purge complete. Successfully purged ${purgedCount} scenarios.`);
    
    if (errors.length > 0) {
      console.error('Errors encountered:', errors);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Purged ${purgedCount} scenarios`,
        purged_count: purgedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-purge function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
