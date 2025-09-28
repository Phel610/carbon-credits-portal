import fs from 'fs';
import path from 'path';
import { ComparisonResult } from './comparator';
import { InvariantResult } from './invariants';

export interface ParityReport {
  scenario: string;
  timestamp: string;
  summary: {
    totalComparisons: number;
    passed: number;
    failed: number;
    completeness: number;
  };
  statements: {
    [statementType: string]: {
      comparisons: ComparisonResult[];
      missingFields: string[];
    };
  };
  invariants: InvariantResult[];
  overall: 'PASS' | 'FAIL';
}

export function generateMarkdownReport(report: ParityReport): string {
  const { scenario, timestamp, summary, statements, invariants, overall } = report;
  
  let markdown = `# Model Parity Report: ${scenario}\n\n`;
  markdown += `**Generated:** ${timestamp}\n`;
  markdown += `**Overall Status:** ${overall === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`;
  
  // Summary
  markdown += `## Summary\n\n`;
  markdown += `- **Total Comparisons:** ${summary.totalComparisons}\n`;
  markdown += `- **Passed:** ${summary.passed} (${((summary.passed / summary.totalComparisons) * 100).toFixed(1)}%)\n`;
  markdown += `- **Failed:** ${summary.failed} (${((summary.failed / summary.totalComparisons) * 100).toFixed(1)}%)\n`;
  markdown += `- **Completeness:** ${(summary.completeness * 100).toFixed(1)}%\n\n`;
  
  // Statement-by-statement results
  markdown += `## Financial Statements\n\n`;
  
  for (const [statementType, data] of Object.entries(statements)) {
    markdown += `### ${statementType.replace('_', ' ').toUpperCase()}\n\n`;
    
    if (data.missingFields.length > 0) {
      markdown += `**Missing Fields:** ${data.missingFields.join(', ')}\n\n`;
    }
    
    if (data.comparisons.length > 0) {
      markdown += `| Field | Year | Excel | Engine | Status | Delta |\n`;
      markdown += `|-------|------|-------|--------|--------|-------|\n`;
      
      for (const comp of data.comparisons) {
        const status = comp.match ? '✅' : '❌';
        const deltaStr = comp.delta !== undefined ? comp.delta.toFixed(4) : 'N/A';
        const yearStr = comp.year !== undefined ? comp.year.toString() : 'N/A';
        
        markdown += `| ${comp.field} | ${yearStr} | ${comp.excel} | ${comp.engine} | ${status} | ${deltaStr} |\n`;
      }
      markdown += `\n`;
    }
  }
  
  // Invariants
  markdown += `## Mathematical Invariants\n\n`;
  
  for (const invariant of invariants) {
    const status = invariant.pass ? '✅' : '❌';
    markdown += `- **${invariant.name}:** ${status} ${invariant.description}\n`;
    if (invariant.details) {
      markdown += `  - ${invariant.details}\n`;
    }
  }
  
  return markdown;
}

export function generateJUnitXML(report: ParityReport): string {
  const total = report.summary.totalComparisons + report.invariants.length;
  const failures = report.summary.failed + report.invariants.filter(i => !i.pass).length;

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<testsuite name="ModelParity:${report.scenario}" tests="${total}" failures="${failures}">`);

  for (const [type, data] of Object.entries(report.statements)) {
    for (const c of data.comparisons) {
      const name = `${type}.${c.field}${c.year !== undefined ? '.' + c.year : ''}`;
      lines.push(`  <testcase classname="${type}" name="${name}">`);
      if (!c.match) {
        const msg = `Excel=${c.excel} Engine=${c.engine} Delta=${c.delta}`;
        lines.push(`    <failure message="${escapeXml(msg)}"/>`);
      }
      lines.push(`  </testcase>`);
    }
  }

  for (const inv of report.invariants) {
    lines.push(`  <testcase classname="invariant" name="${inv.name}">`);
    if (!inv.pass) {
      const msg = `${inv.description}${inv.details ? ' :: ' + inv.details : ''}`;
      lines.push(`    <failure message="${escapeXml(msg)}"/>`);
    }
    lines.push(`  </testcase>`);
  }

  lines.push(`</testsuite>`);
  return lines.join('\n');
}

function escapeXml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

export function saveReports(report: ParityReport, outputDir: string): void {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const baseName = report.scenario;
  
  // Save Markdown report
  const markdownContent = generateMarkdownReport(report);
  fs.writeFileSync(path.join(outputDir, `${baseName}.md`), markdownContent);
  
  // Save JUnit XML
  const junitContent = generateJUnitXML(report);
  fs.writeFileSync(path.join(outputDir, `${baseName}.junit.xml`), junitContent);
  
  // Save JSON report for programmatic access
  fs.writeFileSync(path.join(outputDir, `${baseName}.json`), JSON.stringify(report, null, 2));
}