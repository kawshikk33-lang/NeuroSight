/**
 * Utilities for transforming uploaded CSV data into dashboard-compatible formats
 */

export interface UploadedData {
  success: boolean;
  total_rows: number;
  columns: string[];
  data: Record<string, unknown>[];
  message?: string;
}

/**
 * Process uploaded data for dashboard forecast trends
 */
export function processForecastTrend(data: Record<string, unknown>[]) {
  if (!data.length) return [];

  // Try to find date and value columns
  const dateCol = Object.keys(data[0]).find(
    (k) => k.toLowerCase().includes("date") || k.toLowerCase().includes("month") || k.toLowerCase().includes("week")
  );
  const valueCol = Object.keys(data[0]).find(
    (k) => k.toLowerCase().includes("value") || k.toLowerCase().includes("sales") || k.toLowerCase().includes("forecast")
  );

  if (!dateCol || !valueCol) return [];

  return data.slice(0, 30).map((row, idx) => ({
    date: String(row[dateCol] ?? `Day ${idx + 1}`),
    value: Number(row[valueCol]) || 0,
  }));
}

/**
 * Process uploaded data for RFMQ segment distribution
 */
export function processSegmentDistribution(data: Record<string, unknown>[]) {
  if (!data.length) return [];

  const segmentCol = Object.keys(data[0]).find(
    (k) => k.toLowerCase().includes("segment") || k.toLowerCase().includes("category")
  );

  if (!segmentCol) return [];

  // Group by segment and count
  const segments: Record<string, number> = {};
  data.forEach((row) => {
    const segment = String(row[segmentCol] ?? "Unknown");
    segments[segment] = (segments[segment] || 0) + 1;
  });

  const total = data.length;
  const colors = [
    "#10b981", "#06b6d4", "#3b82f6", "#f59e0b", "#ec4899", "#ef4444", "#8b5cf6", "#14b8a6",
  ];

  return Object.entries(segments).map(([segment, count], idx) => ({
    segment,
    count,
    percentage: (count / total) * 100,
    color: colors[idx % colors.length],
  }));
}

/**
 * Process uploaded data for customer/RFMQ segmentation
 */
export function processCustomerSegments(data: Record<string, unknown>[]) {
  if (!data.length) return [];

  return data.slice(0, 10).map((row, idx) => ({
    id: String(idx + 1),
    name: String(row.name || row.customer_name || row.customer || `Customer ${idx + 1}`),
    recency: Number(row.recency || row.days_since_last_order || 0),
    frequency: Number(row.frequency || row.order_count || 0),
    monetary: Number(row.monetary || row.total_spent || 0),
    quantity: Number(row.quantity || row.total_items || 0),
    segment: String(row.segment || row.category || "Unknown"),
  }));
}

/**
 * Process uploaded data for model metrics
 */
export function processModelMetrics(data: Record<string, unknown>[]) {
  if (!data.length) return [];

  const metrics: Record<string, number> = {};
  const row = data[0];

  // Try to find common metric columns
  ["rmse", "mae", "mape", "r2", "accuracy", "precision", "recall", "f1"].forEach((metric) => {
    const key = Object.keys(row).find((k) => k.toLowerCase() === metric.toLowerCase());
    if (key && row[key] !== null && row[key] !== undefined) {
      metrics[metric.toUpperCase()] = Number(row[key]);
    }
  });

  return Object.entries(metrics)
    .slice(0, 4)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      unit: name === "MAPE" ? "%" : "",
    }));
}

/**
 * Process uploaded data for feature importance
 */
export function processFeatureImportance(data: Record<string, unknown>[]) {
  if (!data.length) return [];

  const featureCol = Object.keys(data[0]).find(
    (k) => k.toLowerCase().includes("feature") || k.toLowerCase().includes("name")
  );
  const importanceCol = Object.keys(data[0]).find(
    (k) => k.toLowerCase().includes("importance") || k.toLowerCase().includes("score") || k.toLowerCase().includes("weight")
  );

  if (!featureCol || !importanceCol) return [];

  return data.slice(0, 5).map((row) => ({
    feature: String(row[featureCol]),
    importance: Math.min(1, Math.max(0, Number(row[importanceCol]) || 0)),
  }));
}

/**
 * Process uploaded data for time series forecast (actual vs forecast)
 */
export function processTimeSeriesForecast(data: Record<string, unknown>[]) {
  if (!data.length) return [];

  const dateCol = Object.keys(data[0]).find(
    (k) => k.toLowerCase().includes("date") || k.toLowerCase().includes("period") || k.toLowerCase().includes("month")
  );
  const actualCol = Object.keys(data[0]).find(
    (k) =>
      k.toLowerCase().includes("actual") ||
      k.toLowerCase().includes("real") ||
      k.toLowerCase().includes("revenue") ||
      k.toLowerCase().includes("sales") ||
      k.toLowerCase().includes("amount") ||
      k.toLowerCase().includes("value")
  );
  const forecastCol = Object.keys(data[0]).find(
    (k) => k.toLowerCase().includes("forecast") || k.toLowerCase().includes("predicted")
  );

  if (!dateCol || !actualCol) {
    return [];
  }

  const monthlyMap = new Map<string, { actual: number; forecast: number; hasForecast: boolean }>();

  data.forEach((row) => {
    const parsedDate = new Date(String(row[dateCol]));
    if (Number.isNaN(parsedDate.getTime())) {
      return;
    }

    const monthKey = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
    const current = monthlyMap.get(monthKey) ?? { actual: 0, forecast: 0, hasForecast: false };
    const actual = Number(row[actualCol]);
    const forecast = forecastCol ? Number(row[forecastCol]) : NaN;

    monthlyMap.set(monthKey, {
      actual: current.actual + (Number.isFinite(actual) ? actual : 0),
      forecast: current.forecast + (Number.isFinite(forecast) ? forecast : 0),
      hasForecast: current.hasForecast || Number.isFinite(forecast),
    });
  });

  const sorted = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12);

  if (!sorted.length) {
    return [];
  }

  return sorted.map(([key, value], idx, arr) => {
    const [year, month] = key.split("-");
    const monthLabel = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });

    let fallbackForecast = value.actual;
    if (!value.hasForecast) {
      const prevActual = idx > 0 ? arr[idx - 1][1].actual : value.actual;
      const momentum = value.actual - prevActual;
      fallbackForecast = Math.max(0, value.actual + momentum * 0.5);
    }

    return {
      month: monthLabel,
      actual: Math.round(value.actual),
      forecast: Math.round(value.hasForecast ? value.forecast : fallbackForecast),
    };
  });
}

/**
 * Get basic data statistics
 */
export function getDataStatistics(data: Record<string, unknown>[]) {
  if (!data.length) {
    return {
      totalRows: 0,
      totalColumns: 0,
      numericColumns: 0,
      categoricalColumns: 0,
    };
  }

  const row = data[0];
  const columns = Object.keys(row);
  let numericCount = 0;

  columns.forEach((col) => {
    const value = data.find((r) => r[col] !== null && r[col] !== undefined)?.[col];
    if (value !== undefined && !isNaN(Number(value))) {
      numericCount++;
    }
  });

  return {
    totalRows: data.length,
    totalColumns: columns.length,
    numericColumns: numericCount,
    categoricalColumns: columns.length - numericCount,
  };
}
