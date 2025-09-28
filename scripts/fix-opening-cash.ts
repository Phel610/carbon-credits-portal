// Temporary script to update the current model's opening cash from 10,000 to 150,000
// This fixes the balance check error identified in the analysis

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateOpeningCash() {
  const modelId = '484dd1e3-2172-4e6d-8ee0-c23e8cd6bb29';
  
  try {
    const { error } = await supabase
      .from('model_inputs')
      .update({ 
        input_value: { value: 150000 }
      })
      .eq('model_id', modelId)
      .eq('input_key', 'opening_cash_y1')
      .eq('category', 'financing');

    if (error) {
      console.error('Error updating opening cash:', error);
    } else {
      console.log('✅ Successfully updated opening_cash_y1 from 10,000 to 150,000');
      console.log('This should resolve the -90k balance check error');
    }
  } catch (err) {
    console.error('Failed to update:', err);
  }
}

updateOpeningCash();