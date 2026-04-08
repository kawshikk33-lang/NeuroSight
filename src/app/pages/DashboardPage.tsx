import { useEffect, useState } from "react";
import { Activity, Users, TrendingUp, DollarSign } from "lucide-react";
import { MetricCard } from "../components/shared/MetricCard";
import { Cell, Pie, PieChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  mockTimeSeriesForecast,
  mockRFMQSegments,
  mockRecentActivity,
} from "../utils/mockData";
import { processForecastTrend, processSegmentDistribution, processTimeSeriesForecast } from "../utils/dataProcessing";
import { apiClient } from "../services/api/client";

export function DashboardPage() {
  const [forecastSeries, setForecastSeries] = useState(mockTimeSeriesForecast);
  const [segments, setSegments] = useState(mockRFMQSegments);
  const [activity, setActivity] = useState(mockRecentActivity);

  useEffect(() => {
    // Try to fetch uploaded data first
    apiClient.getCombinedData()
      .then((uploadedData) => {
        if (uploadedData.success && uploadedData.data?.length > 0) {
          // Process uploaded data
          const processedTrend = processTimeSeriesForecast(uploadedData.data);
          const processedSegments = processSegmentDistribution(uploadedData.data);

          const hasMeaningfulTrend = processedTrend.some(
            (item) => item.actual > 0 || item.forecast > 0
          );

          if (processedTrend.length > 0 && hasMeaningfulTrend) {
            setForecastSeries(
              processedTrend.map((item) => ({
                month: item.month,
                actual: item.actual,
                forecast: item.forecast,
              }))
            );
          }

          if (processedSegments.length > 0) {
            setSegments(processedSegments);
          }

          return;
        }

        // Fallback to API endpoints if no uploaded data
        throw new Error("No uploaded data");
      })
      .catch(() => {
        // Fallback to original API endpoints
        Promise.all([
          apiClient.get<Array<{ month: string; actual?: number; forecast?: number; value?: number }>>(
            "/dashboard/forecast-trend"
          ),
          apiClient.get<Array<{ segment: string; count: number; percentage: number; color?: string }>>(
            "/dashboard/segment-distribution"
          ),
          apiClient.get<Array<{ title?: string; action?: string; time: string; type?: string }>>(
            "/dashboard/activity"
          ),
        ])
          .then(([trendRes, segmentRes, activityRes]) => {
            if (trendRes?.length) {
              setForecastSeries(
                trendRes.map((item, idx) => ({
                  month: item.month ?? `M${idx + 1}`,
                  actual: item.actual ?? item.value ?? 0,
                  forecast: item.forecast ?? item.value ?? 0,
                }))
              );
            }
            if (segmentRes?.length) {
              setSegments(
                segmentRes.map((item, idx) => ({
                  ...item,
                  color: item.color ?? mockRFMQSegments[idx % mockRFMQSegments.length]?.color ?? "#06b6d4",
                }))
              );
            }
            if (activityRes?.length) {
              setActivity(
                activityRes.map((item, idx) => ({
                  id: idx + 1,
                  action: item.action ?? item.title ?? "Activity",
                  time: item.time,
                  type: item.type ?? "info",
                }))
              );
            }
          })
          .catch(() => {
            // Keep mock fallback when backend is unavailable.
          });
      });
  }, []);

  // Calculate total expected revenue from forecast
  const expectedRevenue = forecastSeries
    .filter(item => item.forecast > 0)
    .reduce((sum, item) => sum + item.forecast, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Dashboard</h1>
        <p className="text-slate-400">Sales forecast overview and customer segmentation insights</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Expected Revenue"
          value={`$${(expectedRevenue / 1000).toFixed(0)}K`}
          icon={DollarSign}
          change="+15.2% from last quarter"
          changeType="positive"
        />
        <MetricCard
          title="Growth Rate"
          value="18.7%"
          icon={TrendingUp}
          change="+3.5% from target"
          changeType="positive"
        />
        <MetricCard
          title="Customers Segmented"
          value="509"
          icon={Users}
          change="+8.2% from last week"
          changeType="positive"
        />
        <MetricCard
          title="Forecast Accuracy"
          value="91.8%"
          icon={Activity}
          subtitle="MAPE: 8.2%"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Forecast Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-2">Sales Forecast (Time Series)</h2>
          <p className="text-sm text-slate-400 mb-6">Monthly sales with 3-month forecast projection</p>
          <div className="h-80" style={{ minHeight: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="month"
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
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  name="Actual Sales"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#06b6d4", r: 4 }}
                  name="Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Segmentation Insights */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Customer Segmentation</h2>
          <div className="h-64 mb-4" style={{ minHeight: '256px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="count"
                  nameKey="segment"
                >
                  {segments.map((entry, index) => (
                    <Cell key={`cell-${entry.segment}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {segments.slice(0, 3).map((segment) => (
              <div key={segment.segment} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm text-slate-300">{segment.segment}</span>
                </div>
                <span className="text-sm font-semibold text-slate-100">
                  {segment.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forecast KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-6">
          <h3 className="text-sm text-slate-400 mb-2">Next Month Forecast</h3>
          <p className="text-3xl font-bold text-emerald-400 mb-1">$108K</p>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">+7.8% growth</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
          <h3 className="text-sm text-slate-400 mb-2">Quarterly Forecast</h3>
          <p className="text-3xl font-bold text-cyan-400 mb-1">$344K</p>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400">+15.2% growth</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-sm text-slate-400 mb-2">Trend Direction</h3>
          <p className="text-3xl font-bold text-purple-400 mb-1">↑ Upward</p>
          <p className="text-sm text-slate-400">Strong positive momentum</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "success" ? "bg-emerald-400" : "bg-cyan-400"
                  }`}
                />
                <span className="text-slate-300">{activity.action}</span>
              </div>
              <span className="text-sm text-slate-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
