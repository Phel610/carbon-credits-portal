-- Add a new column to store comprehensive metrics as JSONB
ALTER TABLE public.financial_metrics 
ADD COLUMN comprehensive_data JSONB;