import { ChangeEvent, useMemo, useState } from "react";
import { Users, Upload } from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { apiClient } from "../services/api/client";

export function RFQUPage() {
  const [showResults, setShowResults] = useState(false);
  const [datasetId, setDatasetId] = useState("");
  const [datasetName, setDatasetName] = useState("");
  const [datasetColumns, setDatasetColumns] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [columnMapping, setColumnMapping] = useState({
    customer_id: "",
    recency: "",
    frequency: "",
    monetary: "",
    quantity: "",
  });
  const [segments, setSegments] = useState<
    Array<{ segment: string; count: number; percentage: number; color?: string }>
  >([]);
  const [customers, setCustomers] = useState<
    Array<{
      id: number;
      name: string;
      recency: number;
      frequency: number;
      monetary: number;
      quantity: number;
      segment: string;
    }>
  >([]);

  const averageMetrics = useMemo(() => {
    if (!customers.length) {
      return [
        { label: "Avg Recency", value: "-" },
        { label: "Avg Frequency", value: "-" },
        { label: "Avg Monetary", value: "-" },
        { label: "Avg Quantity", value: "-" },
      ];
    }

    const total = customers.length;
    const avgRecency = customers.reduce((sum, c) => sum + c.recency, 0) / total;
    const avgFrequency = customers.reduce((sum, c) => sum + c.frequency, 0) / total;
    const avgMonetary = customers.reduce((sum, c) => sum + c.monetary, 0) / total;
    const avgQuantity = customers.reduce((sum, c) => sum + c.quantity, 0) / total;

    return [
      { label: "Avg Recency", value: `${avgRecency.toFixed(1)} days` },
      { label: "Avg Frequency", value: avgFrequency.toFixed(1) },
      { label: "Avg Monetary", value: `$${avgMonetary.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
      { label: "Avg Quantity", value: avgQuantity.toFixed(1) },
    ];
  }, [customers]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage("");
    setIsUploading(true);
    try {
      const response = await apiClient.uploadRfquFile(file);
      const uploadedId = response.file?.id ?? "";
      if (!uploadedId) {
        throw new Error("Upload succeeded but dataset ID is missing");
      }

      setDatasetId(uploadedId);
      setDatasetName(response.file?.name ?? file.name);
      setDatasetColumns(response.columns ?? response.file?.column_names ?? []);
      setShowResults(false);
      setSegments([]);
      setCustomers([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleAnalyze = async () => {
    setErrorMessage("");
    if (!datasetId) {
      setErrorMessage("Upload a CSV file first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const validation = await apiClient.validateRfquMappings(datasetId, columnMapping);
      if (!validation.valid) {
        const issues = [
          validation.missing.length ? `missing keys: ${validation.missing.join(", ")}` : "",
          validation.missing_columns.length
            ? `missing columns: ${validation.missing_columns.join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join(" | ");
        throw new Error(`Invalid mappings (${issues})`);
      }

      const response = await apiClient.analyzeRfqu(datasetId, columnMapping);
      setSegments(response.segments ?? []);
      setCustomers(response.customers ?? []);
      setShowResults(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Analysis failed");
      setShowResults(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadResults = () => {
    const headers = ["segment", "customers", "percentage"];
    const rows = segments.map((segment) => [
      segment.segment,
      String(segment.count),
      segment.percentage.toFixed(2),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "rfqu-segment-results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const handleDownloadSegment = (segmentName: string) => {
    const headers = [
      "customer",
      "recency_days",
      "frequency",
      "monetary",
      "quantity",
      "segment",
    ];
    const rows = customers
      .filter((customer) => customer.segment === segmentName)
      .map((customer) => [
        customer.name,
        String(customer.recency),
        String(customer.frequency),
        String(customer.monetary),
        String(customer.quantity),
        customer.segment,
      ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    const fileName = `rfqu-${segmentName.toLowerCase().replace(/\s+/g, "-")}.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">RFQU Analysis</h1>
        <p className="text-slate-400">
          Customer segmentation based on Recency, Frequency, Monetary, and Quantity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Input Mapping */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Upload Data</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Customer Data CSV</Label>
              <label className="mt-1.5 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-slate-600 transition-colors cursor-pointer block">
                <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
                <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-sm text-slate-300 mb-1">
                  {isUploading ? "Uploading..." : "Upload CSV file"}
                </p>
                <p className="text-xs text-slate-500">Only CSV files are allowed</p>
                {datasetName ? (
                  <p className="text-xs text-cyan-400 mt-2">Current file: {datasetName}</p>
                ) : null}
              </label>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Map Required Columns:
              </h4>
              <div className="space-y-3">
                {[
                  { key: "customer_id", label: "customer_id" },
                  { key: "recency", label: "recency (days)" },
                  { key: "frequency", label: "frequency (count)" },
                  { key: "monetary", label: "monetary (value)" },
                  { key: "quantity", label: "quantity (items)" },
                ].map((field) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center"
                  >
                    <span className="text-xs text-slate-400">{field.label}</span>
                    <Select
                      value={columnMapping[field.key as keyof typeof columnMapping]}
                      onValueChange={(value) =>
                        setColumnMapping((prev) => ({
                          ...prev,
                          [field.key]: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 bg-slate-900 border-slate-700 text-slate-200 text-xs">
                        <SelectValue placeholder="Select dataset column" />
                      </SelectTrigger>
                      <SelectContent>
                        {datasetColumns.map((column) => (
                          <SelectItem key={`${field.key}-${column}`} value={column}>
                            {column}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950"
              disabled={isAnalyzing || isUploading}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Segments"}
            </Button>
            {errorMessage ? <p className="text-xs text-red-400">{errorMessage}</p> : null}
          </div>
        </div>

        {/* Segment Distribution */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Segment Distribution</h2>
          
          {showResults ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div>
                <div className="h-72" style={{ minHeight: '288px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segments}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        dataKey="count"
                        nameKey="segment"
                        label={({ segment, percentage }) => 
                          `${segment} ${percentage.toFixed(1)}%`
                        }
                      >
                        {segments.map((entry) => (
                          <Cell key={`rfqu-cell-${entry.segment}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Segment Details */}
              <div className="space-y-3">
                {segments.map((segment) => (
                  <div
                    key={segment.segment}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="font-medium text-slate-100">
                          {segment.segment}
                        </span>
                      </div>
                      <span className="text-sm text-slate-400">
                        {segment.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">
                      {segment.count}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Upload customer data to see segment distribution</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Segment Table */}
      {showResults && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-slate-100">Customer Segments</h2>
            <Button
              onClick={handleDownloadResults}
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Download Results
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-800">
                  <th className="pb-3 text-sm font-medium text-slate-400">Customer</th>
                  <th className="pb-3 text-sm font-medium text-slate-400">Recency</th>
                  <th className="pb-3 text-sm font-medium text-slate-400">Frequency</th>
                  <th className="pb-3 text-sm font-medium text-slate-400">Monetary</th>
                  <th className="pb-3 text-sm font-medium text-slate-400">Quantity</th>
                  <th className="pb-3 text-sm font-medium text-slate-400">Segment</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const segment = segments.find(
                    (s) => s.segment === customer.segment
                  );
                  return (
                    <tr key={customer.id} className="border-b border-slate-800/50">
                      <td className="py-3 text-slate-300">{customer.name}</td>
                      <td className="py-3 text-slate-300">{customer.recency} days</td>
                      <td className="py-3 text-slate-300">{customer.frequency}</td>
                      <td className="py-3 text-emerald-400 font-semibold">
                        ${customer.monetary.toLocaleString()}
                      </td>
                      <td className="py-3 text-slate-300">{customer.quantity}</td>
                      <td className="py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${segment?.color}20`,
                            color: segment?.color,
                          }}
                        >
                          {customer.segment}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {showResults && (
        <div className="mt-6 space-y-6">
          {segments.map((segment) => {
            const customersInSegment = customers.filter(
              (customer) => customer.segment === segment.segment
            );
            return (
              <div
                key={`segment-card-${segment.segment}`}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <h3 className="text-lg font-bold text-slate-100">{segment.segment}</h3>
                    <span className="text-sm text-slate-400">
                      {segment.percentage.toFixed(1)}% of total
                    </span>
                  </div>
                  <Button
                    onClick={() => handleDownloadSegment(segment.segment)}
                    variant="outline"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
                  >
                    Download {segment.segment} Results
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-800">
                        <th className="pb-3 text-sm font-medium text-slate-400">Customer</th>
                        <th className="pb-3 text-sm font-medium text-slate-400">Recency</th>
                        <th className="pb-3 text-sm font-medium text-slate-400">Frequency</th>
                        <th className="pb-3 text-sm font-medium text-slate-400">Monetary</th>
                        <th className="pb-3 text-sm font-medium text-slate-400">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customersInSegment.map((customer) => (
                        <tr key={`${segment.segment}-${customer.id}`} className="border-b border-slate-800/50">
                          <td className="py-3 text-slate-300">{customer.name}</td>
                          <td className="py-3 text-slate-300">{customer.recency} days</td>
                          <td className="py-3 text-slate-300">{customer.frequency}</td>
                          <td className="py-3 text-emerald-400 font-semibold">
                            ${customer.monetary.toLocaleString()}
                          </td>
                          <td className="py-3 text-slate-300">{customer.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Average Metrics */}
      {showResults && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          {averageMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6"
            >
              <p className="text-sm text-slate-400 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-slate-100">{metric.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}