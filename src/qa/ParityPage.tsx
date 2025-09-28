import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ComparisonResult {
  field: string;
  year?: number;
  excel: number | string;
  engine: number | string;
  match: boolean;
  delta?: number;
  tolerance?: number;
}

interface InvariantResult {
  name: string;
  description: string;
  pass: boolean;
  details?: string;
}

interface ParityReport {
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

// Mock data for demo purposes - in real implementation this would call the parity engine
const mockScenarios = ['scenario_simple', 'scenario_edgecases'];

const mockReport: ParityReport = {
  scenario: 'scenario_simple',
  timestamp: new Date().toISOString(),
  summary: {
    totalComparisons: 45,
    passed: 44,
    failed: 1,
    completeness: 0.98
  },
  statements: {
    income_statement: {
      comparisons: [
        {
          field: 'Total Revenue',
          year: 2024,
          excel: 635000,
          engine: 635000,
          match: true,
          delta: 0,
          tolerance: 0.005
        },
        {
          field: 'COGS',
          year: 2024,
          excel: 95250,
          engine: 95245,
          match: false,
          delta: 5,
          tolerance: 0.005
        }
      ],
      missingFields: []
    },
    balance_sheet: {
      comparisons: [
        {
          field: 'Cash',
          year: 2024,
          excel: 215000,
          engine: 215000,
          match: true,
          delta: 0,
          tolerance: 0.005
        }
      ],
      missingFields: ['Goodwill']
    }
  },
  invariants: [
    {
      name: 'Revenue Identity Year 1',
      description: 'Total Revenue = Spot Revenue + Pre-purchase Revenue',
      pass: true
    },
    {
      name: 'Balance Sheet Balance Year 1',
      description: 'Balance sheet balances (balance_check ≈ 0)',
      pass: true
    },
    {
      name: 'OPEX Total Year 1',
      description: 'OPEX Total = Feasibility + PDD + MRV + Staff',
      pass: false,
      details: 'Expected: 375000, Actual: 374995, Delta: 5'
    }
  ],
  overall: 'FAIL'
};

export default function ParityPage() {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [report, setReport] = useState<ParityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<string>('');

  // Only show this page if QA mode is enabled
  const isQAMode = import.meta.env.VITE_QA_MODE === 'true';

  if (!isQAMode) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            QA Mode is not enabled. Set VITE_QA_MODE=true to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const runParityCheck = async () => {
    if (!selectedScenario) {
      toast({
        title: "No scenario selected",
        description: "Please select a scenario to run parity check.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Call the actual parity engine
      const { runParityCheckClient } = await import('../pages/api/parity');
      const reportData = await runParityCheckClient(selectedScenario);
      setReport(reportData);
      
      toast({
        title: "Parity check completed",
        description: `Scenario: ${selectedScenario} - ${reportData.overall}`,
        variant: reportData.overall === 'PASS' ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: "Error running parity check",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    
    const markdownContent = generateMarkdownReport(report);
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parity-report-${report.scenario}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMarkdownReport = (report: ParityReport): string => {
    return `# Model Parity Report: ${report.scenario}

**Generated:** ${report.timestamp}
**Overall Status:** ${report.overall === 'PASS' ? '✅ PASS' : '❌ FAIL'}

## Summary
- **Total Comparisons:** ${report.summary.totalComparisons}
- **Passed:** ${report.summary.passed}
- **Failed:** ${report.summary.failed}
- **Completeness:** ${(report.summary.completeness * 100).toFixed(1)}%

## Details
${Object.entries(report.statements).map(([type, data]) => `
### ${type.toUpperCase()}
${data.comparisons.map(c => `- ${c.field}: ${c.match ? '✅' : '❌'}`).join('\n')}
`).join('\n')}

## Invariants
${report.invariants.map(i => `- ${i.name}: ${i.pass ? '✅' : '❌'} ${i.description}`).join('\n')}
`;
  };

  const getStatusColor = (status: 'PASS' | 'FAIL') => {
    return status === 'PASS' ? 'text-green-600' : 'text-red-600';
  };

  const getMatchIcon = (match: boolean) => {
    return match ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Model Parity Verification</h1>
          <p className="text-muted-foreground">
            Compare financial engine output against Excel reference data
          </p>
        </div>
        <Badge variant="secondary">QA Mode</Badge>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Run Parity Check</CardTitle>
          <CardDescription>
            Select a scenario and run the parity verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Scenario</label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scenario..." />
                </SelectTrigger>
                <SelectContent>
                  {mockScenarios.map(scenario => (
                    <SelectItem key={scenario} value={scenario}>
                      {scenario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={runParityCheck} 
                disabled={loading || !selectedScenario}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {loading ? 'Running...' : 'Run Check'}
              </Button>
              {report && (
                <Button variant="outline" onClick={exportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {report && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Summary
                <Badge variant={report.overall === 'PASS' ? 'default' : 'destructive'}>
                  {report.overall}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold">{report.summary.totalComparisons}</div>
                  <div className="text-sm text-muted-foreground">Total Comparisons</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{report.summary.passed}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{report.summary.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{(report.summary.completeness * 100).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Completeness</div>
                  <Progress value={report.summary.completeness * 100} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statement Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Statements</CardTitle>
              <CardDescription>
                Select a statement to view detailed comparisons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(report.statements).map(statementType => {
                  const data = report.statements[statementType];
                  const passed = data.comparisons.filter(c => c.match).length;
                  const total = data.comparisons.length;
                  
                  return (
                    <Button
                      key={statementType}
                      variant={selectedStatement === statementType ? 'default' : 'outline'}
                      onClick={() => setSelectedStatement(statementType)}
                      className="flex items-center gap-2"
                    >
                      {statementType.replace('_', ' ').toUpperCase()}
                      <Badge variant="secondary" className="ml-1">
                        {passed}/{total}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Statement Details */}
          {selectedStatement && report.statements[selectedStatement] && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedStatement.replace('_', ' ').toUpperCase()} - Detailed Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.statements[selectedStatement].missingFields.length > 0 && (
                  <Alert className="mb-4">
                    <AlertDescription>
                      <strong>Missing Fields:</strong> {report.statements[selectedStatement].missingFields.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Excel</TableHead>
                        <TableHead>Engine</TableHead>
                        <TableHead>Delta</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.statements[selectedStatement].comparisons.map((comp, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{comp.field}</TableCell>
                          <TableCell>{comp.year || 'N/A'}</TableCell>
                          <TableCell>{typeof comp.excel === 'number' ? comp.excel.toLocaleString() : comp.excel}</TableCell>
                          <TableCell>{typeof comp.engine === 'number' ? comp.engine.toLocaleString() : comp.engine}</TableCell>
                          <TableCell>{comp.delta !== undefined ? comp.delta.toFixed(4) : 'N/A'}</TableCell>
                          <TableCell>{getMatchIcon(comp.match)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invariants */}
          <Card>
            <CardHeader>
              <CardTitle>Mathematical Invariants</CardTitle>
              <CardDescription>
                Validation of business rule calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.invariants.map((invariant, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getMatchIcon(invariant.pass)}
                    <div className="flex-1">
                      <div className="font-medium">{invariant.name}</div>
                      <div className="text-sm text-muted-foreground">{invariant.description}</div>
                      {invariant.details && (
                        <div className="text-sm text-red-600 mt-1">{invariant.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}