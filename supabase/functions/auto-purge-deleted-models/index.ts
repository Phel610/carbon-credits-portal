import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting auto-purge of deleted financial models...');

    // Find models deleted more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: modelsToDelete, error: fetchError } = await supabase
      .from('financial_models')
      .select('id, name, deleted_at')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', thirtyDaysAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching models to purge:', fetchError);
      throw fetchError;
    }

    if (!modelsToDelete || modelsToDelete.length === 0) {
      console.log('No models to purge');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No models to purge',
          purged_count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${modelsToDelete.length} models to purge:`, modelsToDelete.map(m => m.name));

    // Delete related data for each model
    const deletedModels = [];
    const errors = [];

    for (const model of modelsToDelete) {
      try {
        console.log(`Purging model: ${model.name} (ID: ${model.id})`);

        // Delete related data from all tables
        const tables = [
          'sensitivity_analyses',
          'model_scenarios',
          'financial_metrics',
          'financial_statements',
          'model_inputs'
        ];

        for (const table of tables) {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('model_id', model.id);

          if (error) {
            console.error(`Error deleting from ${table}:`, error);
            throw error;
          }
          console.log(`Deleted ${table} for model ${model.id}`);
        }

        // Delete the model itself
        const { error: deleteError } = await supabase
          .from('financial_models')
          .delete()
          .eq('id', model.id);

        if (deleteError) {
          console.error('Error deleting model:', deleteError);
          throw deleteError;
        }

        console.log(`Successfully purged model: ${model.name}`);
        deletedModels.push({
          id: model.id,
          name: model.name,
          deleted_at: model.deleted_at
        });

      } catch (error) {
        console.error(`Failed to purge model ${model.name}:`, error);
        errors.push({
          model_id: model.id,
          model_name: model.name,
          error: error.message
        });
      }
    }

    const response = {
      success: errors.length === 0,
      message: `Successfully purged ${deletedModels.length} out of ${modelsToDelete.length} models`,
      purged_count: deletedModels.length,
      purged_models: deletedModels,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Auto-purge completed:', response);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Auto-purge error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
