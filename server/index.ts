#!/usr/bin/env tsx
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runParityCheck } from '../parity/scripts/runParity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow override via env, else resolve relative to this file
const FIXTURES_DIR = process.env.PARITY_FIXTURES_DIR 
  ? path.resolve(process.env.PARITY_FIXTURES_DIR)
  : path.resolve(__dirname, '../parity/fixtures');

const PARITY_DIR = process.env.PARITY_DIR
  ? path.resolve(process.env.PARITY_DIR)
  : path.resolve(__dirname, '../parity');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

function listScenarios(): string[] {
  return fs.readdirSync(FIXTURES_DIR)
    .filter((d) => fs.statSync(path.join(FIXTURES_DIR, d)).isDirectory());
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'parity-api' });
});

// Parity check endpoint
app.post('/api/parity/run', async (req, res) => {
  try {
    const scenario = String(req.body?.scenario || '');

    if (!scenario) {
      return res.status(400).json({ error: 'Missing "scenario" parameter in request body' });
    }

    // Belt-and-suspenders name check (you already whitelist via FS)
    if (!/^[\w-]+$/.test(scenario)) {
      return res.status(400).json({ error: 'Invalid scenario name' });
    }

    const allowed = listScenarios();
    if (!allowed.includes(scenario)) {
      return res.status(400).json({ 
        error: `Unknown scenario: ${scenario}. Available: ${allowed.join(', ')}` 
      });
    }

    const report = await runParityCheck(scenario);
    res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({
      error: `Parity check failed: ${message}`,
      ...(isProd ? {} : { stack: error instanceof Error ? error.stack : undefined }),
    });
  }
});

// List available scenarios endpoint
app.get('/api/parity/scenarios', (_req, res) => {
  try {
    res.json({ scenarios: listScenarios() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to list scenarios: ${message}` });
  }
});

// Get saved report for a scenario
app.get('/api/parity/report/:scenario', (req, res) => {
  try {
    const scenario = String(req.params.scenario || '');
    if (!/^[\w-]+$/.test(scenario)) {
      return res.status(400).json({ error: 'Invalid scenario name' });
    }

    const allowed = listScenarios();
    if (!allowed.includes(scenario)) {
      return res.status(404).json({ error: `Unknown scenario: ${scenario}` });
    }

    const reportPath = path.join(PARITY_DIR, 'out', `${scenario}.json`);
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ error: `No report found for scenario: ${scenario}` });
    }

    // Lightweight caching headers
    const stat = fs.statSync(reportPath);
    const etag = `W/"${stat.size}-${Number(stat.mtimeMs).toString(16)}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', stat.mtime.toUTCString());

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    return res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({
      error: `Failed to load report: ${message}`,
      ...(isProd ? {} : { stack: error instanceof Error ? error.stack : undefined }),
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Parity API server http://localhost:${PORT}`);
});