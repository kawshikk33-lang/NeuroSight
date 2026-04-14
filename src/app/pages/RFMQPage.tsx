import { Database, Upload, Users } from 'lucide-react'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { apiClient } from '../services/api/client'

type RangeType = 'last_1_month' | 'last_3_months' | 'last_6_months' | 'last_1_year' | 'custom'

type SourceMode = 'manual' | 'database'

interface ConnectorInfo {
  id: string
  type: string
  name: string
  status: string
}

const RANGE_OPTIONS: Array<{ value: RangeType; label: string }> = [
  { value: 'last_1_month', label: 'Last 1 Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_1_year', label: 'Last 1 Year' },
  { value: 'custom', label: 'Custom Range' },
]

export function RFMQPage() {
  // --- shared state ---
  const [showResults, setShowResults] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [columnMapping, setColumnMapping] = useState({
    customer_id: '',
    transaction_date: '',
    item_quantity: '',
    unit_price: '',
  })
  const [segments, setSegments] = useState<
    Array<{ segment: string; count: number; percentage: number; color?: string }>
  >([])
  const [customers, setCustomers] = useState<
    Array<{
      id: number
      name: string
      recency: number
      frequency: number
      monetary: number
      quantity: number
      segment: string
    }>
  >([])
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [rangeType, setRangeType] = useState<RangeType>('last_3_months')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [analysisMeta, setAnalysisMeta] = useState({
    analysisPeriod: '-',
    customersAnalyzed: 0,
    transactionsAnalyzed: 0,
  })
  const [comparisonMeta, setComparisonMeta] = useState<{
    available: boolean
    compareLabel: string
    activeCustomersDeltaPct: number | null
    churnReductionPct: number | null
    currentActiveCustomers: number
    previousActiveCustomers: number
  } | null>(null)
  const itemsPerPage = 10

  // --- source mode ---
  const [sourceMode, setSourceMode] = useState<SourceMode>('manual')

  // --- CSV (manual) state ---
  const [datasetId, setDatasetId] = useState('')
  const [datasetName, setDatasetName] = useState('')
  const [datasetColumns, setDatasetColumns] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // --- database (auto) state ---
  const [dbConnectors, setDbConnectors] = useState<ConnectorInfo[]>([])
  const [selectedConnectorId, setSelectedConnectorId] = useState('')
  const [dbTables, setDbTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState('')
  const [dbColumns, setDbColumns] = useState<string[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [isLoadingColumns, setIsLoadingColumns] = useState(false)

  // ─── fetch available DB connectors on mount ──────────────────────
  useEffect(() => {
    apiClient
      .getConnectors()
      .then((all) => {
        const dbs = all.filter((c) => c.type === 'database' && c.status === 'connected')
        setDbConnectors(dbs)
        // auto-switch to database mode when a connected DB exists
        if (dbs.length > 0) {
          setSourceMode('database')
          setSelectedConnectorId(dbs[0].id)
        }
      })
      .catch(() => setDbConnectors([]))
  }, [])

  // ─── load tables when connector changes ──────────────────────────
  const loadTables = useCallback(async (connectorId: string) => {
    if (!connectorId) return
    setIsLoadingTables(true)
    setDbTables([])
    setSelectedTable('')
    setDbColumns([])
    try {
      const res = await apiClient.getConnectorTables(connectorId)
      setDbTables(res.tables)
    } catch {
      setDbTables([])
    } finally {
      setIsLoadingTables(false)
    }
  }, [])

  useEffect(() => {
    if (sourceMode === 'database' && selectedConnectorId) {
      loadTables(selectedConnectorId)
    }
  }, [sourceMode, selectedConnectorId, loadTables])

  // ─── load columns when table changes ─────────────────────────────
  useEffect(() => {
    if (!selectedConnectorId || !selectedTable) {
      setDbColumns([])
      return
    }
    let cancelled = false
    setIsLoadingColumns(true)
    apiClient
      .getConnectorColumns(selectedConnectorId, selectedTable)
      .then((res) => {
        if (!cancelled) setDbColumns(res.columns)
      })
      .catch(() => {
        if (!cancelled) setDbColumns([])
      })
      .finally(() => {
        if (!cancelled) setIsLoadingColumns(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedConnectorId, selectedTable])

  // ─── the column list used in the mapping selects ─────────────────
  const activeColumns = sourceMode === 'database' ? dbColumns : datasetColumns

  // ─── computed ────────────────────────────────────────────────────
  const averageMetrics = useMemo(() => {
    if (!customers.length) {
      return [
        { label: 'Avg Recency', value: '-' },
        { label: 'Avg Frequency', value: '-' },
        { label: 'Avg Monetary', value: '-' },
        { label: 'Avg Quantity', value: '-' },
      ]
    }
    const total = customers.length
    const avgRecency = customers.reduce((sum, c) => sum + c.recency, 0) / total
    const avgFrequency = customers.reduce((sum, c) => sum + c.frequency, 0) / total
    const avgMonetary = customers.reduce((sum, c) => sum + c.monetary, 0) / total
    const avgQuantity = customers.reduce((sum, c) => sum + c.quantity, 0) / total

    return [
      { label: 'Avg Recency', value: `${avgRecency.toFixed(1)} days` },
      { label: 'Avg Frequency', value: avgFrequency.toFixed(1) },
      {
        label: 'Avg Monetary',
        value: `$${avgMonetary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      },
      { label: 'Avg Quantity', value: avgQuantity.toFixed(1) },
    ]
  }, [customers])

  const filteredCustomers = useMemo(
    () => (selectedSegment ? customers.filter((c) => c.segment === selectedSegment) : customers),
    [customers, selectedSegment]
  )

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedCustomers = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredCustomers.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredCustomers, currentPage])

  // ─── CSV upload handler (manual mode) ────────────────────────────
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setErrorMessage('')
    setIsUploading(true)
    try {
      const response = await apiClient.uploadRfmqFile(file)
      const uploadedId = response.file?.id ?? ''
      if (!uploadedId) {
        throw new Error('Upload succeeded but dataset ID is missing')
      }

      setDatasetId(uploadedId)
      setDatasetName(response.file?.name ?? file.name)
      setDatasetColumns(response.columns ?? response.file?.column_names ?? [])
      setShowResults(false)
      setSegments([])
      setCustomers([])
      setAnalysisMeta({
        analysisPeriod: '-',
        customersAnalyzed: 0,
        transactionsAnalyzed: 0,
      })
      setComparisonMeta(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  // ─── helper: apply analysis response to state ────────────────────
  const applyAnalysisResult = (response: {
    segments?: Array<{
      segment: string
      count: number
      percentage: number
      color?: string
    }>
    customers?: Array<{
      id: number
      name: string
      recency: number
      frequency: number
      monetary: number
      quantity: number
      segment: string
    }>
    analysis_period?: string
    customers_analyzed?: number
    transactions_analyzed?: number
    comparison?: {
      available: boolean
      compare_label: string
      active_customers_delta_pct: number | null
      churn_reduction_pct: number | null
      current_active_customers: number
      previous_active_customers: number
    } | null
  }) => {
    setSegments(response.segments ?? [])
    setCustomers(response.customers ?? [])
    setAnalysisMeta({
      analysisPeriod: response.analysis_period ?? '-',
      customersAnalyzed: response.customers_analyzed ?? 0,
      transactionsAnalyzed: response.transactions_analyzed ?? 0,
    })
    setComparisonMeta(
      response.comparison
        ? {
            available: response.comparison.available,
            compareLabel: response.comparison.compare_label,
            activeCustomersDeltaPct: response.comparison.active_customers_delta_pct,
            churnReductionPct: response.comparison.churn_reduction_pct,
            currentActiveCustomers: response.comparison.current_active_customers,
            previousActiveCustomers: response.comparison.previous_active_customers,
          }
        : null
    )
    setCurrentPage(1)
    setShowResults(true)
  }

  // ─── unified analyze handler ─────────────────────────────────────
  const handleAnalyze = async () => {
    setErrorMessage('')

    // common validation
    if (rangeType === 'custom') {
      if (!startDate || !endDate) {
        setErrorMessage('Select both start and end date for custom range')
        return
      }
      if (new Date(startDate) > new Date(endDate)) {
        setErrorMessage('From Date must be before or equal to To Date')
        return
      }
    }

    setIsAnalyzing(true)
    try {
      const rangePayload = {
        range_type: rangeType,
        start_date: rangeType === 'custom' ? startDate : null,
        end_date: rangeType === 'custom' ? endDate : null,
      }

      if (sourceMode === 'database') {
        if (!selectedConnectorId) {
          throw new Error('Select a database connector first')
        }
        if (!selectedTable) {
          throw new Error('Select a database table first')
        }
        const response = await apiClient.analyzeRfmqFromConnector(
          selectedConnectorId,
          selectedTable,
          columnMapping,
          rangePayload
        )
        applyAnalysisResult(response)
      } else {
        if (!datasetId) {
          throw new Error('Upload a CSV file first')
          return
        }
        const validation = await apiClient.validateRfmqMappings(datasetId, columnMapping)
        if (!validation.valid) {
          const issues = [
            validation.missing.length ? `missing keys: ${validation.missing.join(', ')}` : '',
            validation.missing_columns.length
              ? `missing columns: ${validation.missing_columns.join(', ')}`
              : '',
          ]
            .filter(Boolean)
            .join(' | ')
          throw new Error(`Invalid mappings (${issues})`)
        }
        const response = await apiClient.analyzeRfmq(datasetId, columnMapping, rangePayload)
        applyAnalysisResult(response)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Analysis failed')
      setShowResults(false)
      setComparisonMeta(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ─── CSV download ────────────────────────────────────────────────
  const handleDownloadResults = () => {
    const headers = ['segment', 'customers', 'percentage']
    const rows = segments.map((segment) => [
      segment.segment,
      String(segment.count),
      segment.percentage.toFixed(2),
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${value}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'rfmq-segment-results.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // ─── helper: whether the "Run Analysis" button should be enabled ─
  const canAnalyze =
    !isAnalyzing &&
    !isUploading &&
    (sourceMode === 'database' ? Boolean(selectedConnectorId && selectedTable) : Boolean(datasetId))

  // ─── render ──────────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">RFMQ Analysis</h1>
        <p className="text-slate-400">
          Customer segmentation based on Recency, Frequency, Monetary, and Quantity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* ── Input Panel ─────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          {/* Source Mode Toggle */}
          <div className="flex rounded-lg bg-slate-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => setSourceMode('database')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                sourceMode === 'database'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              disabled={dbConnectors.length === 0}
              title={
                dbConnectors.length === 0
                  ? 'No database connector is connected'
                  : 'Auto analysis via connected database'
              }
            >
              <Database className="w-4 h-4" />
              Auto (Database)
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                sourceMode === 'manual'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              Manual (CSV)
            </button>
          </div>

          <div className="space-y-4">
            {/* ── DATABASE MODE ────────────────────────────────── */}
            {sourceMode === 'database' && (
              <>
                {dbConnectors.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
                    <Database className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 mb-1">No database connected</p>
                    <p className="text-xs text-slate-500">
                      Go to Settings → Integrations to connect your database
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Connector selector */}
                    <div>
                      <Label className="text-slate-300">Database Connector</Label>
                      <Select
                        value={selectedConnectorId}
                        onValueChange={(val) => {
                          setSelectedConnectorId(val)
                          setSelectedTable('')
                          setDbColumns([])
                          setColumnMapping({
                            customer_id: '',
                            transaction_date: '',
                            item_quantity: '',
                            unit_price: '',
                          })
                        }}
                      >
                        <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue placeholder="Select connector" />
                        </SelectTrigger>
                        <SelectContent>
                          {dbConnectors.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Table selector */}
                    <div>
                      <Label className="text-slate-300">
                        Table
                        {isLoadingTables && (
                          <span className="ml-2 text-xs text-slate-500">Loading...</span>
                        )}
                      </Label>
                      <Select
                        value={selectedTable}
                        onValueChange={(val) => {
                          setSelectedTable(val)
                          setColumnMapping({
                            customer_id: '',
                            transaction_date: '',
                            item_quantity: '',
                            unit_price: '',
                          })
                        }}
                        disabled={dbTables.length === 0}
                      >
                        <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue
                            placeholder={isLoadingTables ? 'Loading tables...' : 'Select table'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {dbTables.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTable && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                        <Database className="w-4 h-4 shrink-0" />
                        <span>
                          Connected to <strong>{selectedTable}</strong> table
                          {dbColumns.length > 0 && ` (${dbColumns.length} columns)`}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── MANUAL / CSV MODE ────────────────────────────── */}
            {sourceMode === 'manual' && (
              <div>
                <Label className="text-slate-300">Customer Data CSV</Label>
                <label className="mt-1.5 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-slate-600 transition-colors cursor-pointer block">
                  <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
                  <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-300 mb-1">
                    {isUploading ? 'Uploading...' : 'Upload CSV file'}
                  </p>
                  <p className="text-xs text-slate-500">Only CSV files are allowed</p>
                  {datasetName ? (
                    <p className="text-xs text-cyan-400 mt-2">Current file: {datasetName}</p>
                  ) : null}
                </label>
              </div>
            )}

            {/* ── Column Mapping (shared) ──────────────────────── */}
            {activeColumns.length > 0 && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-300 mb-2">
                  Map RFMQ Required Columns:
                </h4>
                {isLoadingColumns && (
                  <p className="text-xs text-slate-500 mb-2">Loading columns...</p>
                )}
                <div className="space-y-3">
                  {[
                    {
                      key: 'customer_id',
                      label: 'customer_id (Customer Identifier)',
                    },
                    {
                      key: 'transaction_date',
                      label: 'transaction_date (Transaction Date)',
                    },
                    {
                      key: 'item_quantity',
                      label: 'item_quantity (Item Quantity)',
                    },
                    {
                      key: 'unit_price',
                      label: 'unit_price (Unit Price)',
                    },
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
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeColumns.map((column) => (
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
            )}

            {/* ── Range Selector (shared) ──────────────────────── */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-300 mb-2">RFMQ Analysis Range</h4>
              <div className="space-y-2 mb-3">
                {RANGE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-slate-300"
                  >
                    <input
                      type="radio"
                      name="rfmq-range"
                      value={option.value}
                      checked={rangeType === option.value}
                      onChange={() => setRangeType(option.value)}
                      className="accent-cyan-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>

              {rangeType === 'custom' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-400">From Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="mt-1 h-8 bg-slate-900 border-slate-700 text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">To Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="mt-1 h-8 bg-slate-900 border-slate-700 text-slate-200 text-xs"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── Run Analysis Button ──────────────────────────── */}
            <Button
              onClick={handleAnalyze}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950"
              disabled={!canAnalyze}
            >
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
            {errorMessage ? <p className="text-xs text-red-400">{errorMessage}</p> : null}
          </div>
        </div>

        {/* ── Segment Distribution (unchanged) ────────────────── */}
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
                        label={({ segment, percentage }) => `${segment} ${percentage.toFixed(1)}%`}
                      >
                        {segments.map((entry) => (
                          <Cell key={`rfmq-cell-${entry.segment}`} fill={entry.color} />
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
                        <span className="font-medium text-slate-100">{segment.segment}</span>
                      </div>
                      <span className="text-sm text-slate-400">
                        {segment.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">{segment.count}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>
                  {sourceMode === 'database'
                    ? 'Select a table and map columns, then run analysis'
                    : 'Upload customer data to see segment distribution'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Analysis Meta Cards ──────────────────────────────── */}
      {showResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Analysis Period</p>
            <p className="text-lg font-bold text-slate-100">{analysisMeta.analysisPeriod}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Customers Analyzed</p>
            <p className="text-lg font-bold text-cyan-300">
              {analysisMeta.customersAnalyzed.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Transactions Analyzed</p>
            <p className="text-lg font-bold text-slate-100">
              {analysisMeta.transactionsAnalyzed.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Segment Types</p>
            <p className="text-lg font-bold text-slate-100">{segments.length}</p>
          </div>
        </div>
      )}

      {/* ── Comparison Meta ──────────────────────────────────── */}
      {showResults && comparisonMeta ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Comparison Window</p>
            <p className="text-sm text-slate-300">{comparisonMeta.compareLabel}</p>
            <p className="text-xs text-slate-500 mt-1">
              Current: {comparisonMeta.currentActiveCustomers.toLocaleString()} | Previous:{' '}
              {comparisonMeta.previousActiveCustomers.toLocaleString()}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Active Customers Delta</p>
              <p
                className={`text-lg font-bold ${
                  comparisonMeta.activeCustomersDeltaPct === null
                    ? 'text-slate-300'
                    : comparisonMeta.activeCustomersDeltaPct >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                }`}
              >
                {comparisonMeta.activeCustomersDeltaPct === null
                  ? 'N/A'
                  : `${comparisonMeta.activeCustomersDeltaPct >= 0 ? '+' : ''}${comparisonMeta.activeCustomersDeltaPct.toFixed(2)}%`}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Churn Reduction</p>
              <p
                className={`text-lg font-bold ${
                  comparisonMeta.churnReductionPct === null
                    ? 'text-slate-300'
                    : comparisonMeta.churnReductionPct >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                }`}
              >
                {comparisonMeta.churnReductionPct === null
                  ? 'N/A'
                  : `${comparisonMeta.churnReductionPct >= 0 ? '+' : ''}${comparisonMeta.churnReductionPct.toFixed(2)}%`}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Customer Segment Table ───────────────────────────── */}
      {showResults && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-slate-100">Customer Segments</h2>
            <Button
              onClick={handleDownloadResults}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold"
            >
              Download Results
            </Button>
          </div>

          {/* Segment Filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setSelectedSegment(null)
                setCurrentPage(1)
              }}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                selectedSegment === null
                  ? 'bg-cyan-500 text-slate-950 font-medium'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              All Segments
            </Button>
            {segments.map((segment) => (
              <button
                key={segment.segment}
                onClick={() => {
                  setSelectedSegment(segment.segment)
                  setCurrentPage(1)
                }}
                className={`text-sm px-4 py-2 rounded-lg transition-colors font-medium ${
                  selectedSegment === segment.segment
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-100 hover:opacity-90'
                }`}
                style={{
                  backgroundColor:
                    selectedSegment === segment.segment ? segment.color : `${segment.color}20`,
                  color: selectedSegment === segment.segment ? '#000000' : segment.color,
                }}
              >
                {segment.segment}
              </button>
            ))}
          </div>

          {/* Results Info */}
          <div className="mb-4 text-sm text-slate-400">
            Showing {paginatedCustomers.length} of {filteredCustomers.length} customers
            {selectedSegment && ` in ${selectedSegment}`}
          </div>

          {/* Table */}
          <div className="overflow-x-auto mb-4">
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
                {paginatedCustomers.map((customer) => {
                  const segment = segments.find((s) => s.segment === customer.segment)
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
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={
                  currentPage === 1
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold'
                }
              >
                Previous
              </Button>
              {currentPage < totalPages && (
                <Button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950"
                >
                  Show More
                </Button>
              )}
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold'
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Average Metrics ──────────────────────────────────── */}
      {showResults && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          {averageMetrics.map((metric, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-slate-100">{metric.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
