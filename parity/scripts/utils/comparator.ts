export interface ComparisonConfig {
  tolerance: {
    default_abs: number;
    percent_bps: number;
    irr_bps: number;
  };
}

export interface ComparisonResult {
  field: string;
  year?: number;
  excel: number | string;
  engine: number | string;
  match: boolean;
  delta?: number;
  tolerance?: number;
}

export function compareValues(
  excel: number | string,
  engine: number | string,
  field: string,
  config: ComparisonConfig,
  year?: number
): ComparisonResult {
  // Handle non-numeric comparisons
  if (typeof excel === 'string' || typeof engine === 'string') {
    return {
      field,
      year,
      excel,
      engine,
      match: excel === engine
    };
  }

  // Determine tolerance based on field type
  let tolerance: number;
  if (field.toLowerCase().includes('irr') || field.toLowerCase().includes('rate')) {
    tolerance = config.tolerance.irr_bps / 10000; // Convert bps to decimal
  } else if (field.toLowerCase().includes('percent') || field.toLowerCase().includes('%')) {
    tolerance = config.tolerance.percent_bps / 10000;
  } else {
    tolerance = config.tolerance.default_abs;
  }

  const delta = Math.abs(excel - engine);
  const match = delta <= tolerance;

  return {
    field,
    year,
    excel,
    engine,
    match,
    delta,
    tolerance
  };
}

export function getValueFromPath(obj: any, path: string): any {
  // Handle array notation like "incomeStatements[*].total_revenue"
  if (path.includes('[*]')) {
    const [arrayPath, fieldPath] = path.split('[*].');
    const array = getNestedValue(obj, arrayPath);
    if (Array.isArray(array)) {
      return array.map(item => getNestedValue(item, fieldPath));
    }
    return [];
  }

  return getNestedValue(obj, path);
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

export function alignDataByYear(
  excelData: any[],
  engineData: any[],
  yearCol: string
): { excel: any[]; engine: any[] } {
  // Create maps by year
  const excelMap = new Map();
  const engineMap = new Map();

  excelData.forEach(row => {
    if (row[yearCol]) {
      excelMap.set(row[yearCol], row);
    }
  });

  engineData.forEach((row, index) => {
    // For engine data, we need to match by index or a year field
    const year = row.year || (Array.isArray(engineData) ? index : undefined);
    if (year !== undefined) {
      engineMap.set(year, row);
    }
  });

  // Get common years
  const commonYears = Array.from(excelMap.keys()).filter(year => engineMap.has(year));
  
  return {
    excel: commonYears.map(year => excelMap.get(year)),
    engine: commonYears.map(year => engineMap.get(year))
  };
}