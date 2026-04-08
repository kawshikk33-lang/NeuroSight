import { useEffect, useMemo, useState } from "react";
import { Cpu, Activity, Zap, Database } from "lucide-react";
import { MetricCard } from "../components/shared/MetricCard";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { mockModelMetrics, mockFeatureImportance, mockTimeSeriesForecast } from "../utils/mockData";
import { processModelMetrics, processFeatureImportance, processTimeSeriesForecast } from "../utils/dataProcessing";
import { apiClient } from "../services/api/client";

export function ModelsPage() {
  const [activeModel, setActiveModel] = useState<{ id: string; task?: string } | null>(
    null
  );
  const [versions, setVersions] = useState<Array<{ id: string; status: string }>>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>(mockModelMetrics[0] ?? {});
  const [featureImportance, setFeatureImportance] = useState(mockFeatureImportance);
  const [accuracySeries, setAccuracySeries] = useState(mockTimeSeriesForecast.filter((d) => d.actual > 0));

  useEffect(() => {
    // Try to fetch uploaded data first
    apiClient.getCombinedData()
      .then((uploadedData) => {
        if (uploadedData.success && uploadedData.data?.length > 0) {
          // Process uploaded data
          const processedMetrics = processModelMetrics(uploadedData.data);
          const processedFeatures = processFeatureImportance(uploadedData.data);
          const processedSeries = processTimeSeriesForecast(uploadedData.data);

          if (processedMetrics.length > 0) {
            const metricsObj: Record<string, number> = {};
            processedMetrics.forEach((m) => {
              metricsObj[m.name.toLowerCase()] = m.value;
            });
            setMetrics(metricsObj);
          }

          if (processedFeatures.length > 0) {
            setFeatureImportance(processedFeatures);
          }

          if (processedSeries.length > 0) {
            setAccuracySeries(processedSeries.filter((d) => d.actual > 0));
          }

          return;
        }

        // Fallback to API endpoints if no uploaded data
        throw new Error("No uploaded data");
      })
      .catch(() => {
        // Fallback to original API endpoints
        Promise.all([
          apiClient.get<{ id: string; task?: string }>("/models/active"),
          apiClient.get<Array<{ id: string; status: string }>>("/models/versions"),
          apiClient.get<Record<string, number>>("/models/metrics"),
          apiClient.get<Array<{ feature: string; importance: number }>>("/models/feature-importance"),
          apiClient.get<Array<{ month?: string; value: number }>>("/dashboard/forecast-trend"),
        ])
          .then(([activeRes, versionsRes, metricsRes, featureRes, trendRes]) => {
            setActiveModel(activeRes);
            setVersions(versionsRes);
            setMetrics(metricsRes);
            if (featureRes?.length) {
              setFeatureImportance(featureRes);
            }
            if (trendRes?.length) {
              setAccuracySeries(
                trendRes.map((item, idx) => ({
                  month: item.month ?? `M${idx + 1}`,
                  actual: item.value,
                  forecast: item.value * 1.03,
                }))
              );
            }
          })
          .catch(() => {
            // Keep mock fallback.
          });
      });
  }, []);

  const activeModelName = useMemo(() => activeModel?.id ?? "Sales Forecasting Engine v2.1", [activeModel]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Models</h1>
        <p className="text-slate-400">
          Forecasting model performance, accuracy metrics, and feature importance
        </p>
      </div>

      {/* Model Info Card */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              {activeModelName}
            </h2>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
              <span className="text-sm text-slate-400">{activeModel?.task ?? "Time Series Forecasting"}</span>
              <span className="text-sm text-slate-400">•</span>
              <span className="text-sm text-slate-400">XGBoost Regressor</span>
            </div>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
            <Cpu className="w-8 h-8 text-slate-950" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Dataset Size</p>
            <p className="text-xl font-bold text-slate-100">18,542</p>
            <p className="text-xs text-slate-500 mt-1">training samples</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Features Used</p>
            <p className="text-xl font-bold text-slate-100">15</p>
            <p className="text-xs text-slate-500 mt-1">input features</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Training Date</p>
            <p className="text-xl font-bold text-slate-100">Apr 1</p>
            <p className="text-xs text-slate-500 mt-1">2026</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Training Time</p>
            <p className="text-xl font-bold text-slate-100">5.8h</p>
            <p className="text-xs text-slate-500 mt-1">with validation</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics - Forecasting Specific */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="RMSE"
          value={(metrics.rmse ?? 1250.5).toFixed(1)}
          icon={Activity}
          subtitle="Root Mean Squared Error"
        />
        <MetricCard
          title="MAE"
          value={(metrics.mae ?? 980.3).toFixed(1)}
          icon={Activity}
          subtitle="Mean Absolute Error"
        />
        <MetricCard
          title="MAPE"
          value={`${(metrics.mape ?? 8.2).toFixed(1)}%`}
          icon={Zap}
          subtitle="Mean Absolute % Error"
          change="Key metric for forecasting"
          changeType="neutral"
        />
        <MetricCard
          title="R²"
          value={(metrics.r2 ?? 0.94).toFixed(3)}
          icon={Cpu}
          subtitle="Variance explained"
        />
      </div>

      {/* Forecast Accuracy Chart - Actual vs Predicted */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Forecast Accuracy</h2>
        <p className="text-sm text-slate-400 mb-6">
          Actual sales vs predicted values - model validation
        </p>
        <div className="h-80" style={{ minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accuracySeries}>
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
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 5 }}
                name="Actual Sales"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ fill: "#06b6d4", r: 5 }}
                name="Predicted Sales"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Importance */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Feature Importance</h2>
        <p className="text-sm text-slate-400 mb-6">
          Most influential features in the sales forecasting model
        </p>
        <div className="h-80" style={{ minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={featureImportance}
              layout="vertical"
              margin={{ left: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                type="number"
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                type="category"
                dataKey="feature"
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
                {featureImportance.map((entry, index) => (
                  <Cell
                    key={`feature-${entry.feature}`}
                    fill={
                      index === 0
                        ? "#10b981"
                        : index === 1
                        ? "#06b6d4"
                        : index === 2
                        ? "#3b82f6"
                        : "#8b5cf6"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Training Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hyperparameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Hyperparameters</h2>
          </div>
          <div className="space-y-3">
            {[
              { name: "n_estimators", value: "300" },
              { name: "max_depth", value: "12" },
              { name: "learning_rate", value: "0.05" },
              { name: "subsample", value: "0.8" },
              { name: "colsample_bytree", value: "0.8" },
            ].map((param) => (
              <div
                key={param.name}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
              >
                <span className="text-sm text-slate-300">{param.name}</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {param.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Model Versioning */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Version History</h2>
          </div>
          <div className="space-y-3">
            {(versions.length
              ? versions.map((v, idx) => ({
                  version: v.id,
                  date: idx === 0 ? "Latest" : "Previous",
                  mape: `${(metrics.mape ?? 8.2).toFixed(1)}%`,
                  status: v.status,
                }))
              : [
                  {
                    version: "v2.1",
                    date: "Apr 1, 2026",
                    mape: "8.2%",
                    status: "active",
                  },
                ]
            ).map((version) => (
              <div
                key={version.version}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-100">
                      {version.version}
                    </span>
                    {version.status === "active" && (
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{version.date}</p>
                </div>
                <span className="text-sm font-semibold text-cyan-400">
                  MAPE: {version.mape}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
