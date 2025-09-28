#!/usr/bin/env tsx
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { runParityCheck } from '../parity/scripts/runParity.js';

const app = express();
const PORT = process.env.PARITY_API_PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'parity-api' });
});

// Parity check endpoint
app.post('/api/parity/run', async (req, res) => {
  try {
    const { scenario } = req.body as { scenario?: string };
    
    if (!scenario) {
      return res.status(400).json({ 
        error: 'Missing "scenario" parameter in request body' 
      });
    }

    // Validate scenario against available fixtures (security)
    const fs = await import('fs');
    const path = await import('path');
    const fixturesDir = path.resolve('./parity/fixtures');
    const allowedScenarios = fs.readdirSync(fixturesDir)
      .filter(dir => fs.statSync(path.join(fixturesDir, dir)).isDirectory());
    
    if (!allowedScenarios.includes(scenario)) {
      return res.status(400).json({ 
        error: `Unknown scenario: ${scenario}. Available scenarios: ${allowedScenarios.join(', ')}` 
      });
    }

    console.log(`Running parity check for scenario: ${scenario}`);
    const report = await runParityCheck(scenario);
    
    console.log(`Parity check completed: ${report.overall} (${report.summary.passed}/${report.summary.totalComparisons} passed)`);
    
    res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Parity check failed:', message);
    
    res.status(500).json({ 
      error: `Parity check failed: ${message}`,
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// List available scenarios endpoint
app.get('/api/parity/scenarios', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const fixturesDir = path.resolve('./parity/fixtures');
    const scenarios = fs.readdirSync(fixturesDir)
      .filter(dir => fs.statSync(path.join(fixturesDir, dir)).isDirectory());
    
    res.json({ scenarios });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to list scenarios: ${message}` });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Parity API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Parity endpoint: http://localhost:${PORT}/api/parity/run`);
});