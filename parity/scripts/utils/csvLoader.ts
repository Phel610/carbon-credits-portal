import fs from 'fs';
import csv from 'fast-csv';

export interface CSVData {
  [key: string]: string | number;
}

export function loadCSV(filePath: string): Promise<CSVData[]> {
  return new Promise((resolve, reject) => {
    const results: CSVData[] = [];
    
    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', reject)
      .on('data', (row: any) => {
        // Convert numeric strings to numbers
        const converted: CSVData = {};
        for (const [key, value] of Object.entries(row)) {
          if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
            converted[key] = Number(value);
          } else {
            converted[key] = value as string;
          }
        }
        results.push(converted);
      })
      .on('end', () => resolve(results));
  });
}

export function loadScalarCSV(filePath: string): Promise<Record<string, number | string>> {
  return new Promise((resolve, reject) => {
    const results: Record<string, number | string> = {};
    
    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', reject)
      .on('data', (row: any) => {
        // Assume first column is key, second is value
        const [firstCol, secondCol] = Object.keys(row);
        const key = row[firstCol];
        const value = row[secondCol];
        
        if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
          results[key] = Number(value);
        } else {
          results[key] = value;
        }
      })
      .on('end', () => resolve(results));
  });
}