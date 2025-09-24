import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinancialData {
  projectName: string;
  country: string;
  startYear: number;
  endYear: number;
  totalNPV: number;
  projectIRR: number;
  paybackPeriod: number;
  totalRevenue: number;
  totalCosts: number;
  netIncome: number;
  peakFunding: number;
  scenarios: Array<{
    name: string;
    npv: number;
    irr: number;
  }>;
  sensitivities: Array<{
    variable: string;
    impact: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { financialData }: { financialData: FinancialData } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate Executive Summary
    const executiveSummary = await generateExecutiveSummary(openAIApiKey, financialData);
    
    // Generate Risk Assessment
    const riskAssessment = await generateRiskAssessment(openAIApiKey, financialData);
    
    // Generate Scenario Commentary
    const scenarioCommentary = await generateScenarioCommentary(openAIApiKey, financialData);
    
    // Generate Investor Highlights
    const investorHighlights = await generateInvestorHighlights(openAIApiKey, financialData);

    return new Response(JSON.stringify({
      executiveSummary,
      riskAssessment,
      scenarioCommentary,
      investorHighlights
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating AI commentary:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateExecutiveSummary(apiKey: string, data: FinancialData): Promise<string> {
  const prompt = `Generate a concise executive summary for a carbon credit project with the following details:
  
Project: ${data.projectName} in ${data.country}
Period: ${data.startYear}-${data.endYear}
NPV: $${data.totalNPV.toLocaleString()}
IRR: ${data.projectIRR.toFixed(1)}%
Payback: ${data.paybackPeriod.toFixed(1)} years
Total Revenue: $${data.totalRevenue.toLocaleString()}
Net Income: $${data.netIncome.toLocaleString()}

Write in plain English, highlighting financial viability and key results. Keep it under 200 words.`;

  return await callOpenAI(apiKey, prompt);
}

async function generateRiskAssessment(apiKey: string, data: FinancialData): Promise<string> {
  const prompt = `Analyze potential risks for this carbon credit project:

Project: ${data.projectName}
NPV: $${data.totalNPV.toLocaleString()}
IRR: ${data.projectIRR.toFixed(1)}%
Peak Funding: $${data.peakFunding.toLocaleString()}
Revenue vs Costs: $${data.totalRevenue.toLocaleString()} vs $${data.totalCosts.toLocaleString()}

Identify key financial risks such as:
- Cash flow challenges
- Sensitivity to market conditions
- Leverage concerns
- Market risks

Keep it under 150 words and focus on actionable insights.`;

  return await callOpenAI(apiKey, prompt);
}

async function generateScenarioCommentary(apiKey: string, data: FinancialData): Promise<string> {
  const scenarioText = data.scenarios.map(s => 
    `${s.name}: NPV $${s.npv.toLocaleString()}, IRR ${s.irr.toFixed(1)}%`
  ).join('\n');

  const prompt = `Explain in simple language how outcomes differ across these scenarios for a carbon credit project:

${scenarioText}

Provide clear, practical explanations of what drives the differences. Use specific examples like "If carbon price falls 10%, IRR decreases from X% to Y%". Keep under 150 words.`;

  return await callOpenAI(apiKey, prompt);
}

async function generateInvestorHighlights(apiKey: string, data: FinancialData): Promise<string> {
  const prompt = `Create investor-focused highlights for this carbon credit project:

Project: ${data.projectName} (${data.country})
NPV: $${data.totalNPV.toLocaleString()}
IRR: ${data.projectIRR.toFixed(1)}%
Payback: ${data.paybackPeriod.toFixed(1)} years

Focus on:
1. Why this project is attractive to investors
2. Key value drivers
3. Potential risks and mitigation strategies

Keep it professional and compelling, under 200 words.`;

  return await callOpenAI(apiKey, prompt);
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system', 
          content: 'You are a financial analyst specializing in carbon credit projects. Provide clear, professional analysis in plain English.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
  }

  return data.choices[0].message.content;
}