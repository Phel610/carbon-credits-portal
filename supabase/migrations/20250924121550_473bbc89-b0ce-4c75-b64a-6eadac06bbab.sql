-- Create financial_models table
CREATE TABLE public.financial_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  country TEXT,
  project_name TEXT,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create model_inputs table for all user inputs
CREATE TABLE public.model_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL,
  category TEXT NOT NULL, -- 'project_setup', 'operational_metrics', 'expenses', 'financing', 'investor_assumptions'
  input_key TEXT NOT NULL,
  input_value JSONB, -- Flexible storage for different input types
  year INTEGER, -- For year-specific inputs
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_statements table for calculated outputs
CREATE TABLE public.financial_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL,
  statement_type TEXT NOT NULL, -- 'income_statement', 'balance_sheet', 'cashflow_statement'
  year INTEGER NOT NULL,
  line_item TEXT NOT NULL,
  value DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_metrics table for KPIs
CREATE TABLE public.financial_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL,
  metric_name TEXT NOT NULL, -- 'npv', 'irr', 'payback_period', 'dscr', etc.
  value DECIMAL,
  calculation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create model_scenarios table for scenario management
CREATE TABLE public.model_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL,
  scenario_name TEXT NOT NULL, -- 'base_case', 'high_price', 'low_price', etc.
  scenario_data JSONB NOT NULL, -- Store all input variations
  is_base_case BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sensitivity_analyses table
CREATE TABLE public.sensitivity_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL,
  variable_name TEXT NOT NULL, -- 'carbon_price', 'volume', 'cogs_pct', etc.
  base_value DECIMAL NOT NULL,
  sensitivity_range JSONB NOT NULL, -- Array of percentage changes and resulting metrics
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.financial_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensitivity_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for financial_models
CREATE POLICY "Users can create their own financial models" 
ON public.financial_models 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own financial models" 
ON public.financial_models 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial models" 
ON public.financial_models 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial models" 
ON public.financial_models 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for model_inputs
CREATE POLICY "Users can manage inputs for their models" 
ON public.model_inputs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.financial_models 
  WHERE financial_models.id = model_inputs.model_id 
  AND financial_models.user_id = auth.uid()
));

-- Create RLS policies for financial_statements
CREATE POLICY "Users can view statements for their models" 
ON public.financial_statements 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.financial_models 
  WHERE financial_models.id = financial_statements.model_id 
  AND financial_models.user_id = auth.uid()
));

-- Create RLS policies for financial_metrics
CREATE POLICY "Users can view metrics for their models" 
ON public.financial_metrics 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.financial_models 
  WHERE financial_models.id = financial_metrics.model_id 
  AND financial_models.user_id = auth.uid()
));

-- Create RLS policies for model_scenarios
CREATE POLICY "Users can manage scenarios for their models" 
ON public.model_scenarios 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.financial_models 
  WHERE financial_models.id = model_scenarios.model_id 
  AND financial_models.user_id = auth.uid()
));

-- Create RLS policies for sensitivity_analyses
CREATE POLICY "Users can view sensitivity analyses for their models" 
ON public.sensitivity_analyses 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.financial_models 
  WHERE financial_models.id = sensitivity_analyses.model_id 
  AND financial_models.user_id = auth.uid()
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_financial_models_updated_at
BEFORE UPDATE ON public.financial_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_model_inputs_updated_at
BEFORE UPDATE ON public.model_inputs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_statements_updated_at
BEFORE UPDATE ON public.financial_statements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_model_scenarios_updated_at
BEFORE UPDATE ON public.model_scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_financial_models_user_id ON public.financial_models(user_id);
CREATE INDEX idx_model_inputs_model_id ON public.model_inputs(model_id);
CREATE INDEX idx_model_inputs_category ON public.model_inputs(category);
CREATE INDEX idx_financial_statements_model_id ON public.financial_statements(model_id);
CREATE INDEX idx_financial_statements_year ON public.financial_statements(year);
CREATE INDEX idx_financial_metrics_model_id ON public.financial_metrics(model_id);
CREATE INDEX idx_model_scenarios_model_id ON public.model_scenarios(model_id);
CREATE INDEX idx_sensitivity_analyses_model_id ON public.sensitivity_analyses(model_id);