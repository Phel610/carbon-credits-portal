#!/usr/bin/env node

// Simple verification script for parity system
import { runParityCheck } from './parity/scripts/runParity.js';
import fs from 'fs';
import path from 'path';

async function verifyParitySystem() {
  console.log('🔍 Verifying Model Parity System...\n');
  
  try {
    // Test scenario_simple
    console.log('Testing scenario_simple...');
    const report = await runParityCheck('scenario_simple');
    
    console.log(`✅ Scenario: ${report.scenario}`);
    console.log(`📊 Summary: ${report.summary.passed}/${report.summary.totalComparisons} comparisons passed`);
    console.log(`📈 Completeness: ${(report.summary.completeness * 100).toFixed(1)}%`);
    console.log(`🏁 Overall: ${report.overall}`);
    
    // Check if reports were generated
    const outDir = './parity/out';
    if (fs.existsSync(outDir)) {
      const files = fs.readdirSync(outDir);
      console.log(`📁 Generated reports: ${files.join(', ')}`);
    }
    
    console.log('\n✅ Parity system verification complete!');
    
    if (report.overall === 'FAIL') {
      console.log('❌ Scenario failed - check the generated reports for details');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyParitySystem();