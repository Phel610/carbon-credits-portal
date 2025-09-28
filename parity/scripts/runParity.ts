#!/usr/bin/env tsx

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
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
  const configPath = path.join(process.cwd(), 'parity', 'parity.config.json');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent);
}

async function loadMapping(): Promise<ExcelMapping> {
  const mappingPath = path.join(process.cwd(), 'parity', 'maps', 'excel_to_engine.map.json');
  const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
  return JSON.parse(mappingContent);
}

async function runEngine(inputsPath: string): Promise<any> {
  const inputsContent = fs.readFileSync(inputsPath, 'utf-8');
  const inputs = JSON.parse(inputsContent);
  
  // Transform inputs to match engine format
  const engineInputs = {
    years: inputs.years,
    credits_generated: inputs.revenues.credits_sold,
    price_per_credit: inputs.revenues.spot_price,
    issuance_flag: inputs.years.map(() => 1), // Assume all years have issuance
    
    // Convert costs to negative values (engine convention)
    cogs_rate: inputs.costs.cogs_rate,
    feasibility_costs: inputs.costs.feasibility.map((v: number) => -Math.abs(v)),
    pdd_costs: inputs.costs.pdd.map((v: number) => -Math.abs(v)),
    mrv_costs: inputs.costs.mrv.map((v: number) => -Math.abs(v)),
    staff_costs: inputs.costs.staff.map((v: number) => -Math.abs(v)),
    depreciation: inputs.years.map((_, i) => {
      const capex = inputs.capex[i] || 0;
      return -Math.abs(capex * (inputs.depreciation_rate || 0.1));
    }),
    income_tax_rate: 0.25, // Default if not specified
    
    // Working capital
    ar_rate: inputs.working_capital?.ar_rate || 0,
    ap_rate: inputs.working_capital?.ap_rate || 0,
    
    // CAPEX and financing
    capex: inputs.capex.map((v: number) => -Math.abs(v)),
    equity_injection: inputs.years.map(() => 0), // Default to no equity injection
    interest_rate: inputs.debt?.interest_rate || 0,
    debt_duration_years: inputs.debt?.term_years || 5,
    debt_draw: inputs.debt?.draw_years ? inputs.years.map((year: number) => 
      inputs.debt.draw_years.includes(year) ? inputs.debt.facility_size : 0
    ) : inputs.years.map(() => 0),
    
    // Pre-purchase agreements
    purchase_amount: inputs.purchase?.purchase_amounts || inputs.years.map(() => 0),
    purchase_share: inputs.purchase?.purchase_share || 0,
    
    // Returns
    discount_rate: inputs.equity_discount_rate || 0.12,
    initial_equity_t0: 0,
    opening_cash_y1: 0,
  };
  
  const engine = new FinancialCalculationEngine(engineInputs);
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
    const engineValues = getValueFromPath(engineData, enginePath);
    
    if (!Array.isArray(engineValues)) {
      missingFields.push(excelCol);
      continue;
    }
    
    // Compare year by year
    for (let i = 0; i < excelData.length; i++) {
      const excelRow = excelData[i];
      const year = excelRow[yearCol];
      const excelValue = excelRow[excelCol];
      const engineValue = engineValues[i];
      
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
  
  const fixturesDir = path.join(process.cwd(), 'parity', 'fixtures', scenarioName);
  const inputsPath = path.join(fixturesDir, 'engine_inputs.json');
  
  if (!fs.existsSync(inputsPath)) {
    throw new Error(`Engine inputs not found: ${inputsPath}`);
  }
  
  // Run engine
  const engineData = await runEngine(inputsPath);
  console.log(chalk.green('✓ Engine calculation completed'));
  
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
  
  // Validate invariants
  console.log(chalk.blue('Validating mathematical invariants...'));
  const invariants = validateInvariants(engineData);
  const invariantsPassed = invariants.filter(i => i.pass).length;
  console.log(chalk.blue(`Invariants: ${invariantsPassed}/${invariants.length} passed`));
  
  // Calculate summary
  const allComparisons = Object.values(statements).flatMap(s => s.comparisons);
  const totalComparisons = allComparisons.length;
  const passed = allComparisons.filter(c => c.match).length;
  const failed = totalComparisons - passed;
  
  const allMissingFields = Object.values(statements).flatMap(s => s.missingFields);
  const completeness = allMissingFields.length === 0 ? 1 : (totalComparisons / (totalComparisons + allMissingFields.length));
  
  const overall = failed === 0 && invariants.every(i => i.pass) && completeness === 1 ? 'PASS' : 'FAIL';
  
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
  const outputDir = path.join(process.cwd(), 'parity', 'out');
  saveReports(report, outputDir);
  
  console.log(chalk.green(`Reports saved to: ${outputDir}`));
  
  return report;
}

async function runAllScenarios(): Promise<void> {
  const fixturesDir = path.join(process.cwd(), 'parity', 'fixtures');
  const scenarios = fs.readdirSync(fixturesDir).filter(item => {
    const itemPath = path.join(fixturesDir, item);
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