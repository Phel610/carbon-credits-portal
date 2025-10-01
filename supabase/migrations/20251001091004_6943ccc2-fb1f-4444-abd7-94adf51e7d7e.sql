-- Add notes column to model_scenarios table
ALTER TABLE model_scenarios 
ADD COLUMN IF NOT EXISTS notes TEXT;