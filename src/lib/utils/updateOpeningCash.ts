import { supabase } from '@/integrations/supabase/client';

// Utility to update opening cash for the current model to fix balance check error
export async function updateModelOpeningCash(modelId: string, newOpeningCash: number) {
  try {
    const { error } = await supabase
      .from('model_inputs')
      .update({ 
        input_value: { value: newOpeningCash }
      })
      .eq('model_id', modelId)
      .eq('input_key', 'opening_cash_y1')
      .eq('category', 'financing');

    if (error) {
      console.error('Error updating opening cash:', error);
      return { success: false, error };
    }

    console.log(`✅ Successfully updated opening_cash_y1 to ${newOpeningCash.toLocaleString()}`);
    return { success: true };
  } catch (err) {
    console.error('Failed to update opening cash:', err);
    return { success: false, error: err };
  }
}

// Quick fix for the specific model with balance check error
export async function fixCurrentModelOpeningCash() {
  const modelId = '484dd1e3-2172-4e6d-8ee0-c23e8cd6bb29';
  const correctOpeningCash = 150000;
  
  console.log('🔧 Applying opening cash fix for balance check error...');
  const result = await updateModelOpeningCash(modelId, correctOpeningCash);
  
  if (result.success) {
    console.log('💡 This should resolve the -90k balance check error');
    console.log('🔄 Please refresh the financial statements page to see the fix');
  }
  
  return result;
}