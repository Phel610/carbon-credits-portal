import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AICommentary {
  executiveSummary: string;
  riskAssessment: string;
  scenarioCommentary: string;
  investorHighlights: string;
}

interface ModelData {
  name: string;
  project_name?: string;
  country?: string;
  start_year: number;
  end_year: number;
}

export const generatePDF = async (
  financialData: any,
  modelData: ModelData,
  reportType: 'standard' | 'ai-assisted',
  aiCommentary?: AICommentary
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  
  let yPosition = margin;

  // Helper function to add page break if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return lines.length * (fontSize * 0.35); // Return height used
  };

  // Title Page
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const reportTitle = reportType === 'ai-assisted' ? 'AI-Assisted Financial Report' : 'Standard Financial Report';
  pdf.text(reportTitle, pageWidth / 2, 40, { align: 'center' });

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'normal');
  pdf.text(modelData.project_name || modelData.name, pageWidth / 2, 60, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`Country: ${modelData.country || 'Not specified'}`, pageWidth / 2, 75, { align: 'center' });
  pdf.text(`Projection Period: ${modelData.start_year} - ${modelData.end_year}`, pageWidth / 2, 85, { align: 'center' });
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 95, { align: 'center' });

  // Add new page for content
  pdf.addPage();
  yPosition = margin;

  // AI Commentary Sections (for AI-assisted reports only)
  if (reportType === 'ai-assisted' && aiCommentary) {
    // Executive Summary
    checkPageBreak(60);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const summaryHeight = addText(aiCommentary.executiveSummary, margin, yPosition, pageWidth - 2 * margin, 11);
    yPosition += summaryHeight + 15;

    // Risk Assessment
    checkPageBreak(60);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Risk Assessment', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const riskHeight = addText(aiCommentary.riskAssessment, margin, yPosition, pageWidth - 2 * margin, 11);
    yPosition += riskHeight + 15;
  }

  // Project Overview
  checkPageBreak(80);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Project Overview', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Project Name: ${modelData.project_name || modelData.name}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Country/Region: ${modelData.country || 'Not specified'}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Projection Period: ${modelData.start_year} - ${modelData.end_year}`, margin, yPosition);
  yPosition += 20;

  // Financial Metrics
  if (financialData && financialData.metrics) {
    checkPageBreak(100);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Metrics', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const metrics = [
      [`Net Present Value (NPV)`, `$${financialData.metrics.npv.toLocaleString()}`],
      [`Project IRR`, `${(financialData.metrics.project_irr * 100).toFixed(1)}%`],
      [`Payback Period`, `${financialData.metrics.payback_period.toFixed(1)} years`],
      [`EBITDA Margin`, `${(financialData.metrics.ebitda_margin * 100).toFixed(1)}%`],
      [`Net Income Margin`, `${(financialData.metrics.net_income_margin * 100).toFixed(1)}%`]
    ];

    metrics.forEach(([label, value]) => {
      pdf.text(`${label}:`, margin, yPosition);
      pdf.setFont('helvetica', 'bold');
      pdf.text(value, margin + 80, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition += 8;
    });
    yPosition += 10;
  }

  // Input Summary Section
  checkPageBreak(80);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Assumptions & Inputs', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  // Sample inputs - in practice, these would come from modelInputs
  const sampleInputs = [
    'Carbon Credits Generated: 10,000 - 15,000 per year',
    'Price per Credit: $15 - $17',
    'COGS Percentage: 30%',
    'CAPEX Investment: $300,000 total',
    'Income Tax Rate: 25%',
    'Discount Rate: 12%'
  ];

  sampleInputs.forEach(input => {
    pdf.text(`• ${input}`, margin, yPosition);
    yPosition += 7;
  });
  yPosition += 10;

  // Financial Statements Summary
  if (financialData && financialData.incomeStatements) {
    // Income Statement Summary
    checkPageBreak(100);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Income Statement Summary', margin, yPosition);
    yPosition += 15;

    // Create a simple table for key income statement items
    const years = financialData.incomeStatements.map((stmt: any) => stmt.year);
    const totalRevenues = financialData.incomeStatements.map((stmt: any) => stmt.total_revenue);
    const netIncomes = financialData.incomeStatements.map((stmt: any) => stmt.net_income);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    
    // Headers
    pdf.text('Year', margin, yPosition);
    years.forEach((year, index) => {
      pdf.text(year.toString(), margin + 30 + (index * 30), yPosition);
    });
    yPosition += 8;

    // Total Revenue
    pdf.setFont('helvetica', 'normal');
    pdf.text('Total Revenue', margin, yPosition);
    totalRevenues.forEach((revenue: number, index: number) => {
      pdf.text(`$${revenue.toLocaleString()}`, margin + 30 + (index * 30), yPosition);
    });
    yPosition += 6;

    // Net Income
    pdf.text('Net Income', margin, yPosition);
    netIncomes.forEach((income: number, index: number) => {
      pdf.text(`$${income.toLocaleString()}`, margin + 30 + (index * 30), yPosition);
    });
    yPosition += 15;
  }

  // AI Commentary for scenarios and investor highlights (AI-assisted reports only)
  if (reportType === 'ai-assisted' && aiCommentary) {
    // Scenario Commentary
    checkPageBreak(60);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Scenario Analysis', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const scenarioHeight = addText(aiCommentary.scenarioCommentary, margin, yPosition, pageWidth - 2 * margin, 11);
    yPosition += scenarioHeight + 15;

    // Investor Highlights
    checkPageBreak(60);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Investment Highlights', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const highlightsHeight = addText(aiCommentary.investorHighlights, margin, yPosition, pageWidth - 2 * margin, 11);
    yPosition += highlightsHeight + 15;
  }

  // Footer on last page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    pdf.text('Generated by Financial Platform', margin, pageHeight - 10);
  }

  // Save the PDF
  const fileName = `${modelData.project_name || modelData.name}_${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};