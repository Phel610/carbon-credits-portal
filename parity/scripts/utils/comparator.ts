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

  const e = Number(excel);
  const a = Number(engine);
  
  // Handle NaN values
  if (isNaN(e) || isNaN(a)) {
    return {
      field,
      year,
      excel,
      engine,
      match: false,
      delta: NaN
    };
  }

  const isPercent = /rate|irr|discount/i.test(field);
  let match = false;
  let delta: number;
  let tolerance: number;

  if (isPercent) {
    // Compare in basis points
    delta = Math.abs((a - e) * 10000);
    tolerance = field.toLowerCase().includes('irr') ? config.tolerance.irr_bps : config.tolerance.percent_bps;
    match = delta <= tolerance;
  } else {
    // Compare absolute values
    delta = Math.abs(a - e);
    tolerance = config.tolerance.default_abs;
    match = delta <= tolerance;
  }

  return {
    field,
    year,
    excel: e,
    engine: a,
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