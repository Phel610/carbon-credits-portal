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
        // Convert numeric strings to numbers, handle whitespace
        const converted: CSVData = {};
        for (const [key, value] of Object.entries(row)) {
          const trimmedKey = String(key).trim();
          const trimmedValue = String(value).trim();
          
          if (trimmedValue === '') {
            // Preserve empty strings as missing values
            converted[trimmedKey] = '';
          } else if (!isNaN(Number(trimmedValue))) {
            converted[trimmedKey] = Number(trimmedValue);
          } else {
            converted[trimmedKey] = trimmedValue;
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
        const key = String(row[firstCol]).trim();
        const value = String(row[secondCol]).trim();
        
        if (value === '') {
          results[key] = '';
        } else if (!isNaN(Number(value))) {
          results[key] = Number(value);
        } else {
          results[key] = value;
        }
      })
      .on('end', () => resolve(results));
  });
}