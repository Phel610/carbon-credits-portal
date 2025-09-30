-- Add deleted_at column for soft delete
ALTER TABLE public.financial_models 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Add index for better query performance on deleted models
CREATE INDEX idx_financial_models_deleted_at 
ON public.financial_models(deleted_at);

-- Add index for finding models that need auto-purge (older than 30 days)
CREATE INDEX idx_financial_models_auto_purge 
ON public.financial_models(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.financial_models.deleted_at IS 
'Timestamp when model was soft-deleted. Models are auto-purged after 30 days.';