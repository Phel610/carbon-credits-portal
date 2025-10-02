-- Add deleted_at column to model_scenarios table for soft-delete functionality
ALTER TABLE public.model_scenarios 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index on deleted_at for better query performance
CREATE INDEX idx_model_scenarios_deleted_at ON public.model_scenarios(deleted_at);

-- Add comment to explain the column
COMMENT ON COLUMN public.model_scenarios.deleted_at IS 'Timestamp when scenario was soft-deleted. Scenarios are kept for 30 days before permanent deletion.';