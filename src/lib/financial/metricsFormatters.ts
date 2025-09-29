// Formatting utilities for comprehensive financial metrics

export const formatCurrency = (amount: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatRatio = (value: number, decimals = 2): string => {
  return `${value.toFixed(decimals)}x`;
};

export const formatSafeValue = (value: number | string, fallback = "–"): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined || !isFinite(value)) return fallback;
  return value.toString();
};

export const formatSafeCurrency = (value: number | string, decimals = 2): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined || !isFinite(value)) return "–";
  return formatCurrency(value, decimals);
};

export const formatSafePercentage = (value: number | string, decimals = 1): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined || !isFinite(value)) return "–";
  return formatPercentage(value, decimals);
};

export const formatSafeRatio = (value: number | string, decimals = 2): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined || !isFinite(value)) return "–";
  return formatRatio(value, decimals);
};

export const formatInteger = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDecimal = (value: number, decimals = 2): string => {
  return value.toFixed(decimals);
};

// Status determination for metrics
export const getMetricStatus = (metricName: string, value: number): {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'neutral';
  color: string;
} => {
  switch (metricName) {
    case 'irr':
    case 'equity_irr':
      if (value >= 20) return { status: 'excellent', color: 'text-green-600' };
      if (value >= 15) return { status: 'good', color: 'text-blue-600' };
      if (value >= 10) return { status: 'fair', color: 'text-yellow-600' };
      return { status: 'poor', color: 'text-red-600' };
    
    case 'npv':
    case 'npv_equity':
      if (value >= 1000000) return { status: 'excellent', color: 'text-green-600' };
      if (value >= 500000) return { status: 'good', color: 'text-blue-600' };
      if (value >= 0) return { status: 'fair', color: 'text-yellow-600' };
      return { status: 'poor', color: 'text-red-600' };
    
    case 'payback_period':
      if (value <= 3) return { status: 'excellent', color: 'text-green-600' };
      if (value <= 5) return { status: 'good', color: 'text-blue-600' };
      if (value <= 7) return { status: 'fair', color: 'text-yellow-600' };
      return { status: 'poor', color: 'text-red-600' };
    
    case 'current_ratio':
      if (value >= 2.0) return { status: 'excellent', color: 'text-green-600' };
      if (value >= 1.5) return { status: 'good', color: 'text-blue-600' };
      if (value >= 1.0) return { status: 'fair', color: 'text-yellow-600' };
      return { status: 'poor', color: 'text-red-600' };
    
    case 'dscr':
    case 'min_dscr':
      if (value >= 1.5) return { status: 'excellent', color: 'text-green-600' };
      if (value >= 1.25) return { status: 'good', color: 'text-blue-600' };
      if (value >= 1.0) return { status: 'fair', color: 'text-yellow-600' };
      return { status: 'poor', color: 'text-red-600' };
    
    case 'ebitda_margin':
    case 'net_margin':
      if (value >= 30) return { status: 'excellent', color: 'text-green-600' };
      if (value >= 20) return { status: 'good', color: 'text-blue-600' };
      if (value >= 10) return { status: 'fair', color: 'text-yellow-600' };
      return { status: 'poor', color: 'text-red-600' };
    
    default:
      return { status: 'neutral', color: 'text-muted-foreground' };
  }
};

// Progress bar values for metrics
export const getProgressValue = (metricName: string, value: number): number => {
  switch (metricName) {
    case 'irr':
    case 'equity_irr':
      return Math.min(value * 2.5, 100); // 40% IRR = 100%
    case 'ebitda_margin':
    case 'net_margin':
      return Math.min(Math.abs(value), 100);
    case 'payback_period':
      return Math.max(100 - (value * 10), 0); // Lower is better
    case 'current_ratio':
      return Math.min(value * 40, 100); // 2.5 ratio = 100%
    case 'dscr':
    case 'min_dscr':
      return Math.min(value * 50, 100); // 2.0 DSCR = 100%
    default:
      return 50;
  }
};