-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  organization TEXT,
  role TEXT CHECK (role IN ('developer', 'investor', 'corporate', 'consultant')) DEFAULT 'developer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project types enum
CREATE TYPE public.project_type AS ENUM (
  'redd_plus', 'renewables', 'arr', 'cookstoves', 'biochar', 
  'landfill_gas', 'safe_water', 'ifm', 'waste_mgmt', 'blue_carbon'
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  project_type project_type NOT NULL,
  country TEXT NOT NULL,
  location_type TEXT CHECK (location_type IN ('rural', 'urban', 'mixed')),
  project_size TEXT CHECK (project_size IN ('micro', 'small', 'medium', 'large')),
  developer_type TEXT CHECK (developer_type IN ('private', 'public', 'ngo', 'community')),
  start_date DATE,
  status TEXT CHECK (status IN ('draft', 'active', 'completed', 'cancelled')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessments table
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')) DEFAULT 'draft',
  assessment_type TEXT DEFAULT 'additionality',
  overall_score DECIMAL(3,2) CHECK (overall_score >= 1 AND overall_score <= 5),
  integrity_rating TEXT CHECK (integrity_rating IN ('high', 'medium', 'low')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessment responses table for storing user inputs
CREATE TABLE public.assessment_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  criterion_code TEXT NOT NULL, -- e.g., '1.1.1.1', '1.2', etc.
  question_key TEXT NOT NULL,
  response_value TEXT,
  response_numeric DECIMAL(10,4),
  response_boolean BOOLEAN,
  evidence_text TEXT,
  data_sources TEXT[], -- array of data source URLs/references
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, criterion_code, question_key)
);

-- Create additionality scores table for detailed scoring
CREATE TABLE public.additionality_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  
  -- Sub-criterion 1.1 - Incentives without Credits
  incentives_score DECIMAL(3,2) CHECK (incentives_score >= 1 AND incentives_score <= 5),
  financial_attractiveness_score DECIMAL(3,2),
  barrier_analysis_score DECIMAL(3,2),
  
  -- Sub-criterion 1.2 - Common Practice  
  common_practice_score DECIMAL(3,2) CHECK (common_practice_score >= 1 AND common_practice_score <= 5),
  market_penetration_score DECIMAL(3,2),
  
  -- Sub-criterion 1.3 - Legal Considerations
  legal_considerations_score DECIMAL(3,2) CHECK (legal_considerations_score >= 1 AND legal_considerations_score <= 5),
  
  -- Sub-criterion 1.4 - Baseline Approach
  baseline_approach_score DECIMAL(3,2) CHECK (baseline_approach_score >= 1 AND baseline_approach_score <= 5),
  
  -- Sub-criterion 1.5 - Baseline Reasonableness
  baseline_reasonableness_score DECIMAL(3,2) CHECK (baseline_reasonableness_score >= 1 AND baseline_reasonableness_score <= 5),
  baseline_transparency_score DECIMAL(3,2),
  baseline_assumptions_score DECIMAL(3,2),
  
  -- Sub-criterion 1.6 - Red and Green Flags
  red_green_flags_score DECIMAL(3,2) CHECK (red_green_flags_score >= 1 AND red_green_flags_score <= 5),
  red_flags TEXT[], -- array of identified red flags
  green_flags TEXT[], -- array of identified green flags
  
  -- Overall additionality score
  overall_additionality_score DECIMAL(3,2) CHECK (overall_additionality_score >= 1 AND overall_additionality_score <= 5),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id)
);

-- Create reference data tables
CREATE TABLE public.countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  income_level TEXT
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additionality_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for assessments
CREATE POLICY "Users can view their own assessments" 
ON public.assessments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessments" 
ON public.assessments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments" 
ON public.assessments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessments" 
ON public.assessments FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for assessment responses
CREATE POLICY "Users can view their assessment responses" 
ON public.assessment_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = assessment_id AND assessments.user_id = auth.uid())
);

CREATE POLICY "Users can create their assessment responses" 
ON public.assessment_responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = assessment_id AND assessments.user_id = auth.uid())
);

CREATE POLICY "Users can update their assessment responses" 
ON public.assessment_responses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = assessment_id AND assessments.user_id = auth.uid())
);

-- Create RLS policies for additionality scores
CREATE POLICY "Users can view their additionality scores" 
ON public.additionality_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = assessment_id AND assessments.user_id = auth.uid())
);

CREATE POLICY "Users can create their additionality scores" 
ON public.additionality_scores FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = assessment_id AND assessments.user_id = auth.uid())
);

CREATE POLICY "Users can update their additionality scores" 
ON public.additionality_scores FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE assessments.id = assessment_id AND assessments.user_id = auth.uid())
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_responses_updated_at
  BEFORE UPDATE ON public.assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_additionality_scores_updated_at
  BEFORE UPDATE ON public.additionality_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample countries
INSERT INTO public.countries (code, name, region, income_level) VALUES
('US', 'United States', 'North America', 'High'),
('CA', 'Canada', 'North America', 'High'),
('BR', 'Brazil', 'South America', 'Upper Middle'),
('KE', 'Kenya', 'Africa', 'Lower Middle'),
('IN', 'India', 'Asia', 'Lower Middle'),
('CN', 'China', 'Asia', 'Upper Middle'),
('DE', 'Germany', 'Europe', 'High'),
('AU', 'Australia', 'Oceania', 'High');

-- Make countries table publicly readable
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Countries are viewable by everyone" ON public.countries FOR SELECT USING (true);