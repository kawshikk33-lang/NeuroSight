import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { apiClient } from "../services/api/client";

type ForecastType = "monthly" | "quarterly" | "yearly";
type ForecastModel = "xgboost" | "random_forest";

type ForecastPoint = {
  period: string;
  forecast: number;
  lower?: number;
  upper?: number;
};

type ForecastResponse = {
  forecast_type: ForecastType;
  horizon: number;
  model: ForecastModel;
  expected_revenue: number;
  growth_rate: number;
  trend: string;
  series: ForecastPoint[];
};

const forecastDefaults: Record<ForecastType, number> = {
  monthly: 3,
  quarterly: 2,
  yearly: 1,
};

const forecastUnits: Record<ForecastType, string> = {
  monthly: "months",
  quarterly: "quarters",
  yearly: "years",
};

const forecastLabels: Record<ForecastType, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export function ForecastPage() {
  const [forecastType, setForecastType] = useState<ForecastType>("monthly");
  const [horizon, setHorizon] = useState<number>(forecastDefaults.monthly);
  const [model, setModel] = useState<ForecastModel>("xgboost");
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [forecastResult, setForecastResult] = useState<ForecastResponse | null>(null);

  const forecastSummary = useMemo(() => {
    if (!forecastResult?.series.length) {
      return [];
    }

    const expectedRevenue = forecastResult.expected_revenue;
    const growthRate = forecastResult.growth_rate;
    const trend = forecastResult.trend;

    return [
      {
        label: "Expected Revenue",
        value: `$${expectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      },
      {
        label: "Growth Rate",
        value: `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(1)}%`,
      },
      {
        label: "Trend",
        value: trend,
      },
    ];
  }, [forecastResult]);

  const chartData = forecastResult?.series ?? [];

  const handleForecastTypeChange = (value: ForecastType) => {
    setForecastType(value);
    setHorizon(forecastDefaults[value]);
    setForecastResult(null);
    setErrorMessage("");
  };

  const handleGenerateForecast = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await apiClient.generateForecast({
        forecast_type: forecastType,
        horizon,
        model,
        show_confidence_interval: showConfidenceInterval,
      });
      setForecastResult(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Forecast generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Sales Forecast</h1>
        <p className="text-slate-400">
          Generate time-based business forecasts from the latest trained model
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 xl:col-span-1">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Forecast Control Panel</h2>

          <div className="space-y-5">
            <div>
              <Label className="text-slate-300 mb-2 block">Forecast Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(forecastLabels) as ForecastType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleForecastTypeChange(type)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      forecastType === type
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {forecastLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">
                Forecast Horizon
              </Label>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm whitespace-nowrap">Next:</span>
                <Input
                  type="number"
                  min={1}
                  max={forecastType === "yearly" ? 5 : 12}
                  value={horizon}
                  onChange={(event) => setHorizon(Math.max(1, Number(event.target.value) || 1))}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
                <span className="text-slate-400 text-sm whitespace-nowrap">
                  {forecastUnits[forecastType]}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Select Model</Label>
              <Select value={model} onValueChange={(value) => setModel(value as ForecastModel)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xgboost">XGBoost</SelectItem>
                  <SelectItem value="random_forest">Random Forest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm font-medium text-slate-300 mb-1">Dataset</p>
              <p className="text-sm text-slate-400">Use latest trained model</p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <Checkbox
                id="confidence-interval"
                checked={showConfidenceInterval}
                onCheckedChange={(checked) => setShowConfidenceInterval(Boolean(checked))}
              />
              <Label htmlFor="confidence-interval" className="text-sm text-slate-300">
                Show Confidence Interval
              </Label>
            </div>

            <Button
              onClick={handleGenerateForecast}
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold"
            >
              {loading ? "Generating..." : "Generate Forecast"}
            </Button>

            {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 xl:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-4">Forecast Output</h2>

            {forecastResult ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {forecastSummary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-800 bg-slate-800/50 p-5"
                  >
                    <p className="text-sm text-slate-400 mb-2">{item.label}</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center text-slate-500">
                Generate a forecast to see summary metrics, chart, and table output.
              </div>
            )}
          </div>

          {forecastResult ? (
            <>
              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">Forecast Chart</h3>
                    <p className="text-sm text-slate-400">
                      {forecastLabels[forecastType]} outlook for the next {horizon} {forecastUnits[forecastType]}
                    </p>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {showConfidenceInterval ? (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="period" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                          labelStyle={{ color: "#e2e8f0" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="forecast"
                          stroke="#22d3ee"
                          fill="url(#forecastFill)"
                          strokeWidth={3}
                        />
                        <Line type="monotone" dataKey="lower" stroke="#38bdf8" strokeDasharray="4 4" dot={false} />
                        <Line type="monotone" dataKey="upper" stroke="#38bdf8" strokeDasharray="4 4" dot={false} />
                      </AreaChart>
                    ) : (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="period" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                          labelStyle={{ color: "#e2e8f0" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="forecast"
                          stroke="#22d3ee"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#22d3ee" }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Forecast Table</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-800">
                        <th className="pb-3 text-sm font-medium text-slate-400">Period</th>
                        <th className="pb-3 text-sm font-medium text-slate-400">Forecast</th>
                        {showConfidenceInterval ? (
                          <>
                            <th className="pb-3 text-sm font-medium text-slate-400">Lower</th>
                            <th className="pb-3 text-sm font-medium text-slate-400">Upper</th>
                          </>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row) => (
                        <tr key={row.period} className="border-b border-slate-800/50">
                          <td className="py-3 text-slate-300">{row.period}</td>
                          <td className="py-3 text-cyan-300 font-semibold">
                            ${row.forecast.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          {showConfidenceInterval ? (
                            <>
                              <td className="py-3 text-slate-300">
                                ${Math.round(row.lower ?? row.forecast).toLocaleString()}
                              </td>
                              <td className="py-3 text-slate-300">
                                ${Math.round(row.upper ?? row.forecast).toLocaleString()}
                              </td>
                            </>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}