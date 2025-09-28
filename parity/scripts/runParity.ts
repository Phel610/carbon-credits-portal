#!/usr/bin/env tsx

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// New roots (prefer envs, fallback to cwd)
const PARITY_ROOT = process.env.PARITY_ROOT_DIR   // e.g. repo root
  ? path.resolve(process.env.PARITY_ROOT_DIR)
  : process.cwd();

const PARITY_DIR = process.env.PARITY_DIR         // e.g. absolute /…/parity
  ? path.resolve(process.env.PARITY_DIR)
  : path.join(PARITY_ROOT, 'parity');

const FIXTURES_DIR = process.env.PARITY_FIXTURES_DIR
  ? path.resolve(process.env.PARITY_FIXTURES_DIR)
  : path.join(PARITY_DIR, 'fixtures');
import { FinancialCalculationEngine } from '../../src/lib/financial/calculationEngine';
import { loadCSV, loadScalarCSV } from './utils/csvLoader';
import { compareValues, getValueFromPath, alignDataByYear, type ComparisonResult } from './utils/comparator';
import { validateInvariants, type InvariantResult } from './utils/invariants';
import { saveReports, type ParityReport } from './utils/reporter';

const program = new Command();

interface ParityConfig {
  tolerance: {
    default_abs: number;
    percent_bps: number;
    irr_bps: number;
  };
  rounding: {
    excel_inputs_decimal_places: number;
    output_decimal_places: number;
  };
  required_tables: string[];
}

interface ExcelMapping {
  [statementType: string]: {
    year_col?: string;
    columns?: { [excelCol: string]: string };
    scalar?: { [excelCol: string]: string };
  };
}

async function loadConfig(): Promise<ParityConfig> {
  const configPath = path.join(PARITY_DIR, 'parity.config.json');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent);
}

async function loadMapping(): Promise<ExcelMapping> {
  const mappingPath = path.join(PARITY_DIR, 'maps', 'excel_to_engine.map.json');
  const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
  return JSON.parse(mappingContent);
}

async function runEngine(inputsPath: string): Promise<any> {
  const inputs = JSON.parse(fs.readFileSync(inputsPath, 'utf-8'));
  const engine = new FinancialCalculationEngine(inputs);
  return engine.calculateFinancialStatements();
}

async function compareStatement(
  statementType: string,
  excelFile: string,
  engineData: any,
  mapping: ExcelMapping,
  config: ParityConfig
): Promise<{ comparisons: ComparisonResult[]; missingFields: string[] }> {
  const comparisons: ComparisonResult[] = [];
  const missingFields: string[] = [];
  
  if (!mapping[statementType]) {
    console.warn(chalk.yellow(`No mapping found for statement type: ${statementType}`));
    return { comparisons, missingFields };
  }
  
  const statementMapping = mapping[statementType];
  
  // Handle scalar metrics (like IRR, NPV)
  if (statementMapping.scalar) {
    const excelData = await loadScalarCSV(excelFile);
    
    for (const [excelCol, enginePath] of Object.entries(statementMapping.scalar)) {
      const excelValue = excelData[excelCol];
      const engineValue = getValueFromPath(engineData, enginePath);
      
      if (excelValue !== undefined && engineValue !== undefined) {
        const comparison = compareValues(excelValue, engineValue, excelCol, config);
        comparisons.push(comparison);
      } else if (excelValue !== undefined && engineValue === undefined) {
        missingFields.push(excelCol);
      }
    }
    
    return { comparisons, missingFields };
  }
  
  // Handle time-series data
  if (!statementMapping.columns || !statementMapping.year_col) {
    console.warn(chalk.yellow(`Incomplete mapping for statement type: ${statementType}`));
    return { comparisons, missingFields };
  }
  
  const excelData = await loadCSV(excelFile);
  const yearCol = statementMapping.year_col;
  
  for (const [excelCol, enginePath] of Object.entries(statementMapping.columns)) {
    const engineTable = getValueFromPath(engineData, enginePath);
    
    if (!Array.isArray(engineTable)) {
      missingFields.push(excelCol);
      continue;
    }
    
    // Align data by year, not by index
    const { excel: alignedExcel, engine: alignedEngine } = alignDataByYear(
      excelData, 
      engineTable, 
      yearCol
    );
    
    // Compare aligned data
    for (let i = 0; i < alignedExcel.length; i++) {
      const excelRow = alignedExcel[i];
      const engineRow = alignedEngine[i];
      const year = excelRow[yearCol];
      const excelValue = excelRow[excelCol];
      
      // Extract field from engine row (handle nested paths)
      const fieldKey = enginePath.split('[*].')[1] || enginePath;
      const engineValue = engineRow[fieldKey];
      
      if (excelValue !== undefined && engineValue !== undefined) {
        const comparison = compareValues(excelValue, engineValue, excelCol, config, year);
        comparisons.push(comparison);
      } else if (excelValue !== undefined && engineValue === undefined) {
        missingFields.push(`${excelCol} (Year ${year})`);
      }
    }
  }
  
  return { comparisons, missingFields };
}

async function runParityCheck(scenarioName: string): Promise<ParityReport> {
  console.log(chalk.blue(`Running parity check for scenario: ${scenarioName}`));
  
  const config = await loadConfig();
  const mapping = await loadMapping();
  
  const fixturesDir = path.join(FIXTURES_DIR, scenarioName);
  const inputsPath = path.join(fixturesDir, 'engine_inputs.json');
  const metadataPath = path.join(fixturesDir, 'metadata.json');
  
  if (!fs.existsSync(inputsPath)) {
    throw new Error(`Engine inputs not found: ${inputsPath}`);
  }
  
  // Check for "should error" scenarios
  let metadata: any = {};
  if (fs.existsSync(metadataPath)) {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  }
  
  let engineData: any;
  let shouldError = metadata.expected_error_regex;
  
  try {
    // Run engine
    engineData = await runEngine(inputsPath);
    console.log(chalk.green('✓ Engine calculation completed'));
    
    // If we expected an error but didn't get one, that's a failure
    if (shouldError) {
      return {
        scenario: scenarioName,
        timestamp: new Date().toISOString(),
        summary: { totalComparisons: 0, passed: 0, failed: 1, completeness: 0 },
        statements: {},
        invariants: [{
          name: 'Expected Error',
          description: `Expected engine to throw error matching: ${shouldError}`,
          pass: false,
          details: 'Engine did not throw expected error'
        }],
        overall: 'FAIL'
      };
    }
  } catch (error) {
    if (shouldError) {
      // Check if the error matches expected pattern
      const errorMessage = error instanceof Error ? error.message : String(error);
      const regex = new RegExp(shouldError, 'i');
      const matches = regex.test(errorMessage);
      
      return {
        scenario: scenarioName,
        timestamp: new Date().toISOString(),
        summary: { totalComparisons: 1, passed: matches ? 1 : 0, failed: matches ? 0 : 1, completeness: 1 },
        statements: {},
        invariants: [{
          name: 'Expected Error',
          description: `Engine should throw error matching: ${shouldError}`,
          pass: matches,
          details: matches ? `Got expected error: ${errorMessage}` : `Got unexpected error: ${errorMessage}`
        }],
        overall: matches ? 'PASS' : 'FAIL'
      };
    } else {
      // Unexpected error
      throw error;
    }
  }
  
  // Compare each statement
  const statements: ParityReport['statements'] = {};
  
  for (const statementType of config.required_tables) {
    const excelFile = path.join(fixturesDir, `excel_${statementType}.csv`);
    
    if (fs.existsSync(excelFile)) {
      const result = await compareStatement(statementType, excelFile, engineData, mapping, config);
      statements[statementType] = result;
      
      const passed = result.comparisons.filter(c => c.match).length;
      const total = result.comparisons.length;
      console.log(chalk.blue(`${statementType}: ${passed}/${total} comparisons passed`));
    } else {
      console.warn(chalk.yellow(`Excel file not found: ${excelFile}`));
      statements[statementType] = { comparisons: [], missingFields: [] };
    }
  }
  
  // Validate invariants with inputs
  console.log(chalk.blue('Validating mathematical invariants...'));
  const inputs = JSON.parse(fs.readFileSync(inputsPath, 'utf-8'));
  const invariants = validateInvariants(engineData, inputs);
  const invariantsPassed = invariants.filter(i => i.pass).length;
  console.log(chalk.blue(`Invariants: ${invariantsPassed}/${invariants.length} passed`));
  
  // Calculate summary
  const allComparisons = Object.values(statements).flatMap(s => s.comparisons);
  const totalComparisons = allComparisons.length;
  const passed = allComparisons.filter(c => c.match).length;
  const failed = totalComparisons - passed;
  
  const allMissingFields = Object.values(statements).flatMap(s => s.missingFields);
  const completeness = allMissingFields.length === 0 ? 1 : (totalComparisons / (totalComparisons + allMissingFields.length));
  
  // Strict completeness enforcement
  const hasAnyMissingFields = allMissingFields.length > 0;
  const overall = failed === 0 && invariants.every(i => i.pass) && !hasAnyMissingFields ? 'PASS' : 'FAIL';
  
  const report: ParityReport = {
    scenario: scenarioName,
    timestamp: new Date().toISOString(),
    summary: {
      totalComparisons,
      passed,
      failed,
      completeness
    },
    statements,
    invariants,
    overall
  };
  
  // Save reports
  const outputDir = path.join(PARITY_DIR, 'out');
  saveReports(report, outputDir);
  
  console.log(chalk.green(`Reports saved to: ${outputDir}`));
  
  return report;
}

async function runAllScenarios(): Promise<void> {
  const scenarios = fs.readdirSync(FIXTURES_DIR).filter(item => {
    const itemPath = path.join(FIXTURES_DIR, item);
    return fs.statSync(itemPath).isDirectory();
  });
  
  console.log(chalk.blue(`Found ${scenarios.length} scenarios: ${scenarios.join(', ')}`));
  
  let allPassed = true;
  
  for (const scenario of scenarios) {
    try {
      const report = await runParityCheck(scenario);
      
      if (report.overall === 'PASS') {
        console.log(chalk.green(`✓ ${scenario}: PASSED`));
      } else {
        console.log(chalk.red(`✗ ${scenario}: FAILED`));
        allPassed = false;
      }
    } catch (error) {
      console.log(chalk.red(`✗ ${scenario}: ERROR - ${error}`));
      allPassed = false;
    }
    
    console.log(''); // Empty line for readability
  }
  
  if (!allPassed) {
    process.exit(1);
  }
}

program
  .name('runParity')
  .description('Run model parity checks against Excel references')
  .version('1.0.0');

program
  .option('--scenario <name>', 'Run specific scenario')
  .option('--all', 'Run all scenarios')
  .action(async (options) => {
    try {
      if (options.all) {
        await runAllScenarios();
      } else if (options.scenario) {
        const report = await runParityCheck(options.scenario);
        
        if (report.overall === 'PASS') {
          console.log(chalk.green.bold('\n✓ PARITY CHECK PASSED'));
        } else {
          console.log(chalk.red.bold('\n✗ PARITY CHECK FAILED'));
          process.exit(1);
        }
      } else {
        console.log(chalk.red('Please specify --scenario <name> or --all'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

export { runParityCheck };