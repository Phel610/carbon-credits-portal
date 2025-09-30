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
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="sticky left-0 z-10 bg-background border-r-2 text-left py-2 px-3 font-semibold min-w-[160px]">
              Metric
            </th>
            {years.map((year) => (
              <th key={year} className="text-right py-2 px-3 font-semibold whitespace-nowrap min-w-[100px]">
                {year}
              </th>
            ))}
            {showTotal && (
              <th className="text-right py-2 px-3 font-semibold whitespace-nowrap min-w-[100px] bg-muted/30">
                {totalLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={`border-b ${row.className || ''}`}>
              <td className="sticky left-0 z-10 bg-background border-r-2 py-2 px-3 font-medium">
                {row.metric}
              </td>
              {row.values.map((value, valIdx) => (
                <td key={valIdx} className="text-right py-2 px-3 font-mono">
                  {value}
                </td>
              ))}
              {showTotal && (
                <td className="text-right py-2 px-3 font-mono font-bold bg-muted/30">
                  {row.total || ''}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
