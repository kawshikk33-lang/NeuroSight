import {
  Settings,
  Database,
  Play,
  Upload,
  CheckCircle,
  Clock,
  Wrench,
  Plus,
  Trash2,
  FileText,
  Shield,
  Bell,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { AuditTrailPage } from '../components/shared/AuditTrailPage'
import { FileUploadComponent } from '../components/shared/FileUploadComponent'
import { SmartAlertsPage } from '../components/shared/SmartAlertsPage'
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
import { mockDatasets, mockFeatures } from '../utils/mockData'

export function AdminPage() {
  const [adminTab, setAdminTab] = useState<'admin' | 'audit' | 'alerts'>('admin')
  const [isTraining, setIsTraining] = useState(false)
  const [newFeatureFormula, setNewFeatureFormula] = useState('')
  const [datasets, setDatasets] = useState(mockDatasets)
  const [features, setFeatures] = useState(mockFeatures)
  const [trainingStatus, setTrainingStatus] = useState('Idle')
  const [uploadedColumns, setUploadedColumns] = useState<string[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>('')
  const [trainingType, setTrainingType] = useState<'forecasting' | 'rfmq'>('forecasting')
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedDateColumn, setSelectedDateColumn] = useState<string>('')
  const [selectedFeatureColumns, setSelectedFeatureColumns] = useState<string[]>([])
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('randomforest')
  const [selectedCustomerIdColumn, setSelectedCustomerIdColumn] = useState<string>('')
  const [selectedPriceColumn, setSelectedPriceColumn] = useState<string>('')
  const [selectedQuantityColumn, setSelectedQuantityColumn] = useState<string>('')
  const [featureName, setFeatureName] = useState('')
  const [featureType, setFeatureType] = useState('numeric')
  const [modelName, setModelName] = useState('Sales Forecasting Engine v2.1')
  const [lastTrainingDate, setLastTrainingDate] = useState('Not trained yet')
  const [lastTrainingDuration, setLastTrainingDuration] = useState('0 hours')

  const loadDatasetColumns = useCallback(async (datasetId: string) => {
    if (!datasetId) {
      setUploadedColumns([])
      return
    }
    try {
      const preview = await apiClient.getFilePreview(datasetId, 1)
      setUploadedColumns(preview.columns)
      if (preview.columns.length > 0) {
        const first = preview.columns[0]
        setSelectedTarget(first)
        setSelectedDateColumn(first)
        setSelectedCustomerIdColumn(first)
        setSelectedPriceColumn(first)
        setSelectedQuantityColumn(first)
        setSelectedFeatureColumns([])
      }
    } catch (error) {
      setUploadedColumns([])
      console.error('Failed to fetch columns:', error)
    }
  }, [])

  const syncDatasetsFromUploadedFiles = useCallback(
    (
      uploadedFiles: Array<{
        id: string
        name: string
        size: number
        columns: number
        uploadDate: string
        status: string
      }>
    ) => {
      if (!uploadedFiles?.length) {
        setDatasets([])
        setSelectedDataset('')
        setUploadedColumns([])
        return
      }

      setDatasets(
        uploadedFiles.map((f) => ({
          id: f.id,
          name: f.name,
          size: `${(f.size / 1024).toFixed(1)} KB`,
          columns: f.columns,
          uploadDate: new Date(f.uploadDate).toLocaleDateString(),
          status: f.status,
        }))
      )
      const nextSelected = uploadedFiles.some((file) => file.id === selectedDataset)
        ? selectedDataset
        : uploadedFiles[0].id
      setSelectedDataset(nextSelected)
      void loadDatasetColumns(nextSelected)
    },
    [loadDatasetColumns, selectedDataset]
  )

  useEffect(() => {
    // Load uploaded files to populate datasets
    apiClient
      .getUploadedFiles()
      .then((uploadedFiles) => {
        if (uploadedFiles?.length > 0) {
          syncDatasetsFromUploadedFiles(uploadedFiles)
        }
      })
      .catch(() => {
        // Keep mock fallback
      })

    // Fetch model information from backend
    Promise.all([
      apiClient
        .get<{ id: string; name?: string; version?: string }>('/models/active')
        .then((model) => {
          if (model?.name) {
            setModelName(`${model.name} (${model.version || 'v1.0'})`)
          }
          return model
        })
        .catch(() => null),
      apiClient
        .get<{ last_training_date?: string; last_training_duration?: number }>(
          '/models/training-info'
        )
        .then((info) => {
          if (info?.last_training_date) {
            setLastTrainingDate(new Date(info.last_training_date).toLocaleDateString())
          }
          if (info?.last_training_duration) {
            setLastTrainingDuration(`${info.last_training_duration.toFixed(1)} hours`)
          }
          return info
        })
        .catch(() => null),
    ]).catch(() => {
      // Keep defaults
    })
  }, [syncDatasetsFromUploadedFiles])

  const handleTrainModel = async () => {
    if (!selectedDataset) return alert('Please select a dataset')

    if (trainingType === 'forecasting') {
      if (!selectedTarget || !selectedDateColumn) {
        return alert('Forecasting requires target column and date column')
      }
    } else {
      if (
        !selectedCustomerIdColumn ||
        !selectedDateColumn ||
        !selectedPriceColumn ||
        !selectedQuantityColumn
      ) {
        return alert('RFMQ requires customer ID, date, price and quantity columns')
      }
    }

    setIsTraining(true)
    setTrainingStatus('Running...')
    try {
      const columns =
        trainingType === 'forecasting'
          ? {
              target_column: selectedTarget,
              date_column: selectedDateColumn,
            }
          : {
              customer_id_column: selectedCustomerIdColumn,
              date_column: selectedDateColumn,
              price_column: selectedPriceColumn,
              quantity_column: selectedQuantityColumn,
            }

      const result = await apiClient.post<{ job_id: string; status: string; model_name?: string }>(
        '/admin/training/start',
        {
          trigger: 'manual',
          dataset_id: selectedDataset,
          training_type: trainingType,
          columns,
          algorithm: trainingType === 'forecasting' ? selectedAlgorithm : undefined,
          feature_columns: trainingType === 'forecasting' ? selectedFeatureColumns : [],
        }
      )
      setTrainingStatus(`${result.status} (${result.job_id})`)
      if (result.model_name) {
        setModelName(result.model_name)
      }
      setLastTrainingDate(new Date().toLocaleDateString())
      setLastTrainingDuration('Training in progress...')
    } catch (error) {
      setTrainingStatus('Error: Check console')
      console.error('Training failed:', error)
    } finally {
      setTimeout(() => setIsTraining(false), 1500)
    }
  }

  const handleCreateFeature = async () => {
    if (!featureName || !newFeatureFormula) {
      alert('Please enter feature name and formula')
      return
    }

    try {
      const newFeature = {
        id: String(Date.now()),
        name: featureName,
        type: featureType as 'numeric' | 'categorical' | 'date',
        status: 'engineered' as const,
      }
      setFeatures([...features, newFeature])
      setFeatureName('')
      setNewFeatureFormula('')
      alert('Feature created successfully!')
    } catch (error) {
      alert('Failed to create feature')
      console.error(error)
    }
  }

  const handleDeleteFeature = (featureId: string) => {
    setFeatures(features.filter((f) => f.id !== featureId))
  }

  const handleFetchDatasetColumns = async (datasetId: string) => {
    setSelectedDataset(datasetId)
    await loadDatasetColumns(datasetId)
  }

  const toggleFeatureColumn = (column: string) => {
    setSelectedFeatureColumns((prev) =>
      prev.includes(column) ? prev.filter((item) => item !== column) : [...prev, column]
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              {adminTab === 'admin' ? 'Admin Panel' : 'Audit Trail & Compliance'}
            </h1>
            <p className="text-slate-400">
              {adminTab === 'admin'
                ? 'System control for datasets, model training, and feature engineering'
                : adminTab === 'audit'
                  ? 'Security monitoring, compliance reporting, and GDPR management'
                  : 'Threshold monitoring, anomaly detection, and real-time notifications'}
            </p>
          </div>
          {/* Tab Toggle */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setAdminTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                adminTab === 'admin'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              Admin
            </button>
            <button
              onClick={() => setAdminTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                adminTab === 'audit'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Audit & Compliance
            </button>
            <button
              onClick={() => setAdminTab('alerts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                adminTab === 'alerts'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-4 h-4" />
              Smart Alerts
            </button>
          </div>
        </div>
      </div>

      {adminTab === 'audit' ? (
        <AuditTrailPage />
      ) : adminTab === 'alerts' ? (
        <SmartAlertsPage />
      ) : (
        <>
          {/* File Upload Component */}
          <div className="mb-8">
            <FileUploadComponent onFilesChanged={syncDatasetsFromUploadedFiles} />
          </div>

          {/* Dataset Manager */}
          <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-100">Dataset Manager</h2>
              </div>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950">
                <Upload className="w-4 h-4 mr-2" />
                Upload Dataset
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-800">
                    <th className="pb-3 text-sm font-medium text-slate-400">Dataset Name</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">Size</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">Columns</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">Upload Date</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">Status</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((dataset) => (
                    <tr key={dataset.id} className="border-b border-slate-800/50">
                      <td className="py-3 text-slate-300">{dataset.name}</td>
                      <td className="py-3 text-slate-300">{dataset.size}</td>
                      <td className="py-3 text-slate-300">{dataset.columns}</td>
                      <td className="py-3 text-slate-400">{dataset.uploadDate}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            dataset.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {dataset.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-100"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Training Control */}
          <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Training Control</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Training Configuration */}
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Training Type</Label>
                  <div className="mt-2 space-y-2 rounded border border-slate-700 bg-slate-800 p-3">
                    <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="trainingType"
                        checked={trainingType === 'forecasting'}
                        onChange={() => setTrainingType('forecasting')}
                      />
                      <span>Sales Forecasting</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="trainingType"
                        checked={trainingType === 'rfmq'}
                        onChange={() => setTrainingType('rfmq')}
                      />
                      <span>Customer Segmentation (RFMQ)</span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {trainingType === 'forecasting'
                      ? 'Predict future sales using historical data'
                      : 'Analyze customer behavior and segment users'}
                  </p>
                </div>

                <div>
                  <Label className="text-slate-300">Select Dataset</Label>
                  <Select value={selectedDataset} onValueChange={handleFetchDatasetColumns}>
                    <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder="Choose dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets
                        .filter((d) => d.status === 'active')
                        .map((dataset) => (
                          <SelectItem key={dataset.id} value={dataset.id}>
                            {dataset.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {trainingType === 'forecasting' && (
                  <>
                    <div>
                      <Label className="text-slate-300">
                        Forecast Target (e.g., Sales, Revenue)
                      </Label>
                      <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                        <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue placeholder="Select target column" />
                        </SelectTrigger>
                        <SelectContent>
                          {uploadedColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-300">Date Column</Label>
                      <Select value={selectedDateColumn} onValueChange={setSelectedDateColumn}>
                        <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue placeholder="Select date column" />
                        </SelectTrigger>
                        <SelectContent>
                          {uploadedColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-300">Feature Selection (Optional)</Label>
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-1 p-2 rounded border border-slate-700 bg-slate-800">
                        {uploadedColumns
                          .filter((col) => col !== selectedTarget && col !== selectedDateColumn)
                          .map((col) => (
                            <label
                              key={col}
                              className="flex items-center gap-2 text-sm text-slate-300"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFeatureColumns.includes(col)}
                                onChange={() => toggleFeatureColumn(col)}
                              />
                              {col}
                            </label>
                          ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300">Algorithm Selection</Label>
                      <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                        <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue placeholder="Choose algorithm" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="randomforest">Random Forest</SelectItem>
                          <SelectItem value="xgboost">XGBoost Regressor</SelectItem>
                          <SelectItem value="lightgbm">LightGBM</SelectItem>
                          <SelectItem value="lstm">LSTM (Time Series)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-slate-400">
                      Predict future sales (monthly / quarterly)
                    </p>
                  </>
                )}

                {trainingType === 'rfmq' && (
                  <>
                    <div>
                      <Label className="text-slate-300">Customer ID Column</Label>
                      <Select
                        value={selectedCustomerIdColumn}
                        onValueChange={setSelectedCustomerIdColumn}
                      >
                        <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue placeholder="Select customer ID column" />
                        </SelectTrigger>
                        <SelectContent>
                          {uploadedColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-300">Date Column</Label>
                      <Select value={selectedDateColumn} onValueChange={setSelectedDateColumn}>
                        <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue placeholder="Select date column" />
                        </SelectTrigger>
                        <SelectContent>
                          {uploadedColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-300">Price Column</Label>
                      <Select value={selectedPriceColumn} onValueChange={setSelectedPriceColumn}>
                        <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue placeholder="Select price column" />
                        </SelectTrigger>
                        <SelectContent>
                          {uploadedColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-300">Quantity Column</Label>
                      <Select
                        value={selectedQuantityColumn}
                        onValueChange={setSelectedQuantityColumn}
                      >
                        <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue placeholder="Select quantity column" />
                        </SelectTrigger>
                        <SelectContent>
                          {uploadedColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-slate-400">
                      Segment customers using RFMQ clustering
                    </p>
                  </>
                )}

                {uploadedColumns.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Upload a file to configure training columns
                  </p>
                )}

                <Button
                  onClick={handleTrainModel}
                  disabled={isTraining}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                >
                  {isTraining ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Training in Progress...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {trainingType === 'forecasting'
                        ? 'Train Forecast Model'
                        : 'Run RFMQ Segmentation'}
                    </>
                  )}
                </Button>
              </div>

              {/* Model Status */}
              <div className="space-y-4">
                <div className="p-6 bg-slate-800/50 rounded-lg">
                  <h3 className="text-sm text-slate-400 mb-2">Current Model</h3>
                  <p className="text-xl font-bold text-slate-100 mb-1">{modelName}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">Deployed & Active</span>
                  </div>
                </div>

                <div className="p-6 bg-slate-800/50 rounded-lg">
                  <h3 className="text-sm text-slate-400 mb-2">Training Status</h3>
                  <p className="text-xl font-bold text-slate-100 mb-1">
                    {isTraining ? 'Running...' : trainingStatus}
                  </p>
                  {isTraining && (
                    <div className="mt-3">
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full animate-pulse w-3/4"></div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Processing data...</p>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-800/50 rounded-lg">
                  <h3 className="text-sm text-slate-400 mb-2">Last Training</h3>
                  <p className="text-xl font-bold text-slate-100 mb-1">{lastTrainingDate}</p>
                  <p className="text-sm text-slate-400">Duration: {lastTrainingDuration}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Engineering */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Feature Engineering</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feature List */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Feature List</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {features.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-100">{feature.name}</span>
                          <span className="text-xs text-slate-500">{feature.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            feature.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : feature.status === 'engineered'
                                ? 'bg-cyan-500/10 text-cyan-400'
                                : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {feature.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFeature(feature.id)}
                          className="text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Creation */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Create New Feature</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Feature Name</Label>
                    <Input
                      placeholder="e.g., revenue_per_unit"
                      value={featureName}
                      onChange={(e) => setFeatureName(e.target.value)}
                      className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Formula</Label>
                    <Input
                      placeholder="e.g., revenue / quantity"
                      value={newFeatureFormula}
                      onChange={(e) => setNewFeatureFormula(e.target.value)}
                      className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Feature Type</Label>
                    <Select value={featureType} onValueChange={setFeatureType}>
                      <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numeric">Numeric</SelectItem>
                        <SelectItem value="categorical">Categorical</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleCreateFeature}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-slate-950"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Feature
                  </Button>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t border-slate-700">
                    <h4 className="text-xs font-medium text-slate-400 mb-3">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-300 border-slate-700"
                      >
                        Normalize All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-300 border-slate-700"
                      >
                        Encode Categorical
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-300 border-slate-700"
                      >
                        Extract Dates
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-300 border-slate-700"
                      >
                        Drop Missing
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
