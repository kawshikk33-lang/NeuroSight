// Mock data for NeuroSight Dashboard

export interface Forecast {
  id: string;
  customer: string;
  monthlySales: number;
  quarterlySales: number;
  growthRate: number;
  timestamp: string;
}

export interface TimeSeriesForecast {
  month: string;
  actual: number;
  forecast: number;
}

export interface RFMQSegment {
  segment: string;
  count: number;
  percentage: number;
  color: string;
}

export interface Customer {
  id: string;
  name: string;
  recency: number;
  frequency: number;
  monetary: number;
  quantity: number;
  segment: string;
}

export interface ModelMetric {
  name: string;
  value: number;
  unit?: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface Dataset {
  id: string;
  name: string;
  size: string;
  columns: number;
  uploadDate: string;
  status: "active" | "archived";
}

export interface Feature {
  id: string;
  name: string;
  type: "numeric" | "categorical" | "date";
  status: "active" | "engineered" | "dropped";
}

// Latest Forecasts
export const mockForecasts: Forecast[] = [
  {
    id: "1",
    customer: "Customer A",
    monthlySales: 8750,
    quarterlySales: 26250,
    growthRate: 12.5,
    timestamp: "2026-04-07 14:32",
  },
  {
    id: "2",
    customer: "Customer B",
    monthlySales: 12400,
    quarterlySales: 37200,
    growthRate: 18.3,
    timestamp: "2026-04-07 14:28",
  },
  {
    id: "3",
    customer: "Customer C",
    monthlySales: 5200,
    quarterlySales: 15600,
    growthRate: -3.2,
    timestamp: "2026-04-07 14:15",
  },
  {
    id: "4",
    customer: "Customer D",
    monthlySales: 15800,
    quarterlySales: 47400,
    growthRate: 22.7,
    timestamp: "2026-04-07 13:58",
  },
  {
    id: "5",
    customer: "Customer E",
    monthlySales: 3400,
    quarterlySales: 10200,
    growthRate: 5.1,
    timestamp: "2026-04-07 13:42",
  },
];

// Time Series Forecast
export const mockTimeSeriesForecast: TimeSeriesForecast[] = [
  { month: "Jan", actual: 82000, forecast: 81500 },
  { month: "Feb", actual: 91000, forecast: 90000 },
  { month: "Mar", actual: 88000, forecast: 89500 },
  { month: "Apr", actual: 102000, forecast: 100000 },
  { month: "May", actual: 0, forecast: 108000 },
  { month: "Jun", actual: 0, forecast: 115000 },
  { month: "Jul", actual: 0, forecast: 121000 },
];

// RFMQ Segments
export const mockRFMQSegments: RFMQSegment[] = [
  { segment: "Champions", count: 145, percentage: 28.5, color: "#10b981" },
  { segment: "Loyal", count: 98, percentage: 19.3, color: "#06b6d4" },
  { segment: "Potential", count: 87, percentage: 17.1, color: "#3b82f6" },
  { segment: "At Risk", count: 76, percentage: 15.0, color: "#f59e0b" },
  { segment: "Hibernating", count: 58, percentage: 11.4, color: "#ec4899" },
  { segment: "Lost", count: 45, percentage: 8.7, color: "#ef4444" },
];

// Customer Segments Table
export const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Alice Johnson",
    recency: 5,
    frequency: 45,
    monetary: 12500,
    quantity: 180,
    segment: "Champions",
  },
  {
    id: "2",
    name: "Bob Smith",
    recency: 12,
    frequency: 32,
    monetary: 8900,
    quantity: 124,
    segment: "Loyal",
  },
  {
    id: "3",
    name: "Carol White",
    recency: 45,
    frequency: 8,
    monetary: 2400,
    quantity: 32,
    segment: "At Risk",
  },
  {
    id: "4",
    name: "David Brown",
    recency: 3,
    frequency: 52,
    monetary: 18700,
    quantity: 245,
    segment: "Champions",
  },
  {
    id: "5",
    name: "Emma Davis",
    recency: 90,
    frequency: 2,
    monetary: 450,
    quantity: 8,
    segment: "Lost",
  },
];

// Model Performance Metrics (Forecasting)
export const mockModelMetrics: ModelMetric[] = [
  { name: "RMSE", value: 1250.5, unit: "" },
  { name: "MAE", value: 980.3, unit: "" },
  { name: "MAPE", value: 8.2, unit: "%" },
  { name: "R²", value: 0.94, unit: "" },
];

// Feature Importance
export const mockFeatureImportance: FeatureImportance[] = [
  { feature: "Historical Sales", importance: 0.42 },
  { feature: "Seasonality", importance: 0.28 },
  { feature: "Customer Frequency", importance: 0.18 },
  { feature: "Market Trend", importance: 0.12 },
];

// Forecast Analytics Trend
export const mockForecastTrend = [
  { date: "Apr 1", value: 82000 },
  { date: "Apr 2", value: 91000 },
  { date: "Apr 3", value: 88000 },
  { date: "Apr 4", value: 102000 },
  { date: "Apr 5", value: 95000 },
  { date: "Apr 6", value: 114000 },
  { date: "Apr 7", value: 121000 },
];

// RFMQ Analytics Trend
export const mockSegmentTrend = [
  { date: "Week 1", champions: 120, loyal: 85, atRisk: 65 },
  { date: "Week 2", champions: 128, loyal: 90, atRisk: 70 },
  { date: "Week 3", champions: 135, loyal: 92, atRisk: 72 },
  { date: "Week 4", champions: 145, loyal: 98, atRisk: 76 },
];

// Recent Activity
export const mockRecentActivity = [
  {
    id: "1",
    action: "Sales forecast updated",
    time: "5 minutes ago",
    type: "success",
  },
  {
    id: "2",
    action: "Customer segmentation refreshed",
    time: "15 minutes ago",
    type: "info",
  },
  {
    id: "3",
    action: "New model deployed",
    time: "1 hour ago",
    type: "success",
  },
  {
    id: "4",
    action: "Training completed",
    time: "2 hours ago",
    type: "success",
  },
];

// Datasets
export const mockDatasets: Dataset[] = [
  {
    id: "1",
    name: "sales_data_2026_q1.csv",
    size: "2.4 MB",
    columns: 15,
    uploadDate: "2026-04-01",
    status: "active",
  },
  {
    id: "2",
    name: "customer_transactions.csv",
    size: "5.8 MB",
    columns: 22,
    uploadDate: "2026-03-15",
    status: "active",
  },
  {
    id: "3",
    name: "historical_sales_2025.csv",
    size: "12.3 MB",
    columns: 18,
    uploadDate: "2026-01-10",
    status: "archived",
  },
];

// Features
export const mockFeatures: Feature[] = [
  { id: "1", name: "revenue", type: "numeric", status: "active" },
  { id: "2", name: "quantity", type: "numeric", status: "active" },
  { id: "3", name: "price", type: "numeric", status: "active" },
  { id: "4", name: "customer_id", type: "categorical", status: "active" },
  { id: "5", name: "order_date", type: "date", status: "active" },
  { id: "6", name: "revenue_per_unit", type: "numeric", status: "engineered" },
  { id: "7", name: "month", type: "categorical", status: "engineered" },
  { id: "8", name: "day_of_week", type: "categorical", status: "engineered" },
];