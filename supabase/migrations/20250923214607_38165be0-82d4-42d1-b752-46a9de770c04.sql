-- Create function to calculate overall additionality score using inverse weighting
CREATE OR REPLACE FUNCTION calculate_overall_additionality_score(
    incentives_score NUMERIC,
    common_practice_score NUMERIC,
    legal_considerations_score NUMERIC,
    baseline_approach_score NUMERIC,
    baseline_reasonableness_score NUMERIC,
    baseline_transparency_score NUMERIC,
    red_green_flags_score NUMERIC,
    red_flags TEXT[],
    green_flags TEXT[]
) RETURNS NUMERIC AS $$
DECLARE
    activities_score NUMERIC;
    baseline_score NUMERIC;
    combined_baseline_reasonableness NUMERIC;
    overall_score NUMERIC;
    flag_adjustment NUMERIC := 0;
BEGIN
    -- Combine baseline reasonableness sub-components (equal weighting)
    IF baseline_reasonableness_score IS NOT NULL AND baseline_transparency_score IS NOT NULL THEN
        combined_baseline_reasonableness := (baseline_reasonableness_score + baseline_transparency_score) / 2.0;
    ELSIF baseline_reasonableness_score IS NOT NULL THEN
        combined_baseline_reasonableness := baseline_reasonableness_score;
    ELSIF baseline_transparency_score IS NOT NULL THEN
        combined_baseline_reasonableness := baseline_transparency_score;
    ELSE
        combined_baseline_reasonableness := NULL;
    END IF;

    -- Calculate activities score (average of 1.1, 1.2, 1.3)
    activities_score := (
        COALESCE(incentives_score, 0) + 
        COALESCE(common_practice_score, 0) + 
        COALESCE(legal_considerations_score, 0)
    ) / 3.0;

    -- Calculate baseline score (average of 1.4, 1.5)
    baseline_score := (
        COALESCE(baseline_approach_score, 0) + 
        COALESCE(combined_baseline_reasonableness, 0)
    ) / 2.0;

    -- Apply inverse weighting: higher weight to lower score
    IF activities_score <= baseline_score THEN
        overall_score := (activities_score * 0.75) + (baseline_score * 0.25);
    ELSE
        overall_score := (activities_score * 0.25) + (baseline_score * 0.75);
    END IF;

    -- Apply red/green flags adjustments
    IF red_flags IS NOT NULL AND array_length(red_flags, 1) > 0 THEN
        flag_adjustment := flag_adjustment - (array_length(red_flags, 1) * 0.5); -- -0.5 per red flag
    END IF;
    
    IF green_flags IS NOT NULL AND array_length(green_flags, 1) > 0 THEN
        flag_adjustment := flag_adjustment + (array_length(green_flags, 1) * 0.3); -- +0.3 per green flag
    END IF;

    overall_score := overall_score + flag_adjustment;

    -- Ensure score is within 1-5 range
    overall_score := GREATEST(1.0, LEAST(5.0, overall_score));

    RETURN overall_score;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to automatically update overall additionality score
CREATE OR REPLACE FUNCTION update_overall_additionality_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.overall_additionality_score := calculate_overall_additionality_score(
        NEW.incentives_score,
        NEW.common_practice_score,
        NEW.legal_considerations_score,
        NEW.baseline_approach_score,
        NEW.baseline_reasonableness_score,
        NEW.baseline_transparency_score,
        NEW.red_green_flags_score,
        NEW.red_flags,
        NEW.green_flags
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for additionality_scores table
DROP TRIGGER IF EXISTS trigger_update_overall_additionality_score ON public.additionality_scores;
CREATE TRIGGER trigger_update_overall_additionality_score
    BEFORE INSERT OR UPDATE ON public.additionality_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_overall_additionality_score();