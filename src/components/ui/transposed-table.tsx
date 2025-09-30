import { ReactNode } from 'react';

interface TransposedTableRow {
  metric: string;
  values: (string | number | ReactNode)[];
  total?: string | number | ReactNode;
  className?: string;
}

interface TransposedTableProps {
  years: (string | number)[];
  rows: TransposedTableRow[];
  showTotal?: boolean;
  totalLabel?: string;
}

export function TransposedTable({ years, rows, showTotal = false, totalLabel = 'Total' }: TransposedTableProps) {
  const formatValue = (value: string | number | ReactNode) => {
    if (typeof value === 'string' && value.startsWith('$')) {
      const numValue = parseFloat(value.replace(/[$,]/g, ''));
      if (!isNaN(numValue)) {
        if (numValue < 0) return <span className="text-destructive font-semibold">{value}</span>;
        if (numValue > 0) return <span className="text-success font-semibold">{value}</span>;
        return <span className="text-muted-foreground">{value}</span>;
      }
    }
    // Format special values like "> horizon", "n/a"
    if (typeof value === 'string' && (value.includes('horizon') || value === 'n/a' || value === '–')) {
      return <span className="text-muted-foreground italic font-medium">{value}</span>;
    }
    // Format percentage values
    if (typeof value === 'string' && value.includes('%')) {
      return <span className="font-semibold">{value}</span>;
    }
    return <span className="font-medium">{value}</span>;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border/50 shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/50 border-r border-border text-left py-3 px-4 font-semibold min-w-[160px]">
              Metric
            </th>
            {years.map((year) => (
              <th key={year} className="text-right py-3 px-4 font-semibold whitespace-nowrap min-w-[100px]">
                {year}
              </th>
            ))}
            {showTotal && (
              <th className="text-right py-3 px-4 font-semibold whitespace-nowrap min-w-[100px] bg-muted/70 border-l border-border">
                {totalLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr 
              key={idx} 
              className={`border-b border-border/30 transition-colors hover:bg-accent/30 ${
                idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
              } ${row.className || ''}`}
            >
              <td className="sticky left-0 z-10 border-r border-border py-3.5 px-4 font-semibold bg-inherit">
                {row.metric}
              </td>
              {row.values.map((value, valIdx) => (
                <td key={valIdx} className="text-right py-3.5 px-4 font-mono text-base">
                  {formatValue(value)}
                </td>
              ))}
              {showTotal && (
                <td className="text-right py-3.5 px-4 font-mono text-base font-bold bg-muted/70 border-l border-border">
                  {formatValue(row.total || '')}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
