import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { MetricCard } from "../components/shared/MetricCard";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { mockForecastTrend, mockSegmentTrend } from "../utils/mockData";
import { processForecastTrend } from "../utils/dataProcessing";
import { apiClient } from "../services/api/client";

export function AnalyticsPage() {
  const [forecastTrend, setForecastTrend] = useState(mockForecastTrend);
  const [segmentTrend, setSegmentTrend] = useState(mockSegmentTrend);
  const [insights, setInsights] = useState<
    Array<{ title: string; detail: string }>
  >([
    {
      title: "High-Value Forecast Correlation",
      detail: "Champions segment contributes strongly to projected revenue.",
    },
    {
      title: "At-Risk Segment Alert",
      detail: "At-risk customers need win-back campaigns to avoid churn.",
    },
    {
      title: "Seasonality Impact",
      detail: "Q2 shows elevated seasonal demand in forecast values.",
    },
    {
      title: "Revenue Opportunity",
      detail: "Potential segment can move to Champions with targeted engagement.",
    },
  ]);

  useEffect(() => {
    // Try to fetch uploaded data first
    apiClient.getCombinedData()
      .then((uploadedData) => {
        if (uploadedData.success && uploadedData.data?.length > 0) {
          // Process uploaded data for forecast trend
          const processedTrend = processForecastTrend(uploadedData.data);
          if (processedTrend.length > 0) {
            setForecastTrend(
              processedTrend.map((row, idx) => ({
                date: row.date ?? `D${idx + 1}`,
                value: row.value,
              }))
            );
          }

          return;
        }

        // Fallback to API endpoints if no uploaded data
        throw new Error("No uploaded data");
      })
      .catch(() => {
        // Fallback to original API endpoints
        Promise.all([
          apiClient.get<Array<{ date?: string; value: number }>>(
            "/analytics/forecast-trend"
          ),
          apiClient.get<
            Array<{ date?: string; week?: string; champions: number; loyal?: number; atRisk?: number }>
          >("/analytics/segment-trend"),
          apiClient.get<Array<{ title: string; detail: string }>>("/analytics/insights"),
        ])
          .then(([forecastRes, segmentRes, insightsRes]) => {
            if (forecastRes?.length) {
              setForecastTrend(
                forecastRes.map((row, idx) => ({
                  date: row.date ?? `D${idx + 1}`,
                  value: row.value,
                }))
              );
            }
            if (segmentRes?.length) {
              setSegmentTrend(
                segmentRes.map((row, idx) => ({
                  date: row.date ?? row.week ?? `P${idx + 1}`,
                  champions: row.champions ?? 0,
                  loyal: row.loyal ?? 0,
                  atRisk: row.atRisk ?? 0,
                }))
              );
            }
            if (insightsRes?.length) {
              setInsights(insightsRes);
            }
          })
          .catch(() => {
            // Keep mock fallback.
          });
      });
  }, []);

  const avgForecast = useMemo(() => {
    if (!forecastTrend.length) return 0;
    return (
      forecastTrend.reduce((sum, item) => sum + item.value, 0) / forecastTrend.length
    );
  }, [forecastTrend]);

  const avgFrequency = useMemo(() => {
    if (!segmentTrend.length) return 0;
    return (
      segmentTrend.reduce((sum, item) => sum + item.champions + item.loyal + item.atRisk, 0) /
      segmentTrend.length
    );
  }, [segmentTrend]);

  const topSegment = useMemo(() => {
    if (!segmentTrend.length) return "Champions";
    const totals = segmentTrend.reduce(
      (acc, row) => {
        acc.champions += row.champions;
        acc.loyal += row.loyal;
        acc.atRisk += row.atRisk;
        return acc;
      },
      { champions: 0, loyal: 0, atRisk: 0 }
    );
    const ordered = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return ordered[0]?.[0] ?? "Champions";
  }, [segmentTrend]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Analytics</h1>
        <p className="text-slate-400">
          Aggregated insights from sales forecasts and customer segments
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Avg Monthly Forecast"
          value={`$${(avgForecast / 1000).toFixed(1)}K`}
          icon={DollarSign}
          change="+12.5% from last month"
          changeType="positive"
        />
        <MetricCard
          title="Avg Customer Frequency"
          value={avgFrequency.toFixed(1)}
          icon={Activity}
          change="+3.1% from last week"
          changeType="positive"
        />
        <MetricCard
          title="Top Segment"
          value={topSegment}
          icon={Users}
          subtitle="28.5% of total"
        />
        <MetricCard
          title="Forecast Accuracy"
          value="91.8%"
          icon={TrendingUp}
          change="+2.1% from last month"
          changeType="positive"
        />
      </div>

      {/* Forecast Analytics */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Sales Forecast Trend</h2>
        <p className="text-sm text-slate-400 mb-6">
          Daily forecast values over the past week
        </p>
        <div className="h-80" style={{ minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quarterly Forecast Distribution */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm text-slate-400 mb-2">Q1 Forecast</h3>
          <p className="text-3xl font-bold text-slate-100 mb-2">$285K</p>
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span>+8.5% growth</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm text-slate-400 mb-2">Q2 Forecast</h3>
          <p className="text-3xl font-bold text-slate-100 mb-2">$344K</p>
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span>+20.7% growth</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm text-slate-400 mb-2">Q3 Forecast</h3>
          <p className="text-3xl font-bold text-slate-100 mb-2">$398K</p>
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span>+15.7% growth</span>
          </div>
        </div>
      </div>

      {/* Customer Segment Trends */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Customer Segment Evolution</h2>
        <p className="text-sm text-slate-400 mb-6">
          Segment growth trends over the past month
        </p>
        <div className="h-80" style={{ minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Legend />
              <Bar dataKey="champions" fill="#10b981" name="Champions" />
              <Bar dataKey="loyal" fill="#06b6d4" name="Loyal" />
              <Bar dataKey="atRisk" fill="#f59e0b" name="At Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Combined Insights - Forecast + Segmentation Correlation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Insight Cards */}
          <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-slate-100">High-Value Forecast Correlation</h3>
            </div>
            <p className="text-sm text-slate-300 mb-2">{insights[0]?.detail}</p>
            <p className="text-xs text-slate-400">
              Target retention strategies to maintain this high-value group.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="font-semibold text-slate-100">At-Risk Segment Alert</h3>
            </div>
            <p className="text-sm text-slate-300 mb-2">{insights[1]?.detail}</p>
            <p className="text-xs text-slate-400">
              Implement win-back campaigns to prevent customer churn.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-slate-100">Seasonality Impact</h3>
            </div>
            <p className="text-sm text-slate-300 mb-2">{insights[2]?.detail}</p>
            <p className="text-xs text-slate-400">
              Optimize inventory and staffing for Q2 peak demand.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-slate-100">Revenue Opportunity</h3>
            </div>
            <p className="text-sm text-slate-300 mb-2">{insights[3]?.detail}</p>
            <p className="text-xs text-slate-400">
              Launch targeted campaigns to accelerate customer progression.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
