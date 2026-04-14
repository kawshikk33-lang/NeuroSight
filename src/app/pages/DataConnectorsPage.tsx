import {
  Database,
  Facebook,
  BarChart3,
  Plus,
  Settings2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Link,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog'
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

type ConnectorType = 'database' | 'facebook_ads' | 'google_ads'

interface Connector {
  id: string
  type: ConnectorType
  name: string
  status: 'connected' | 'error' | 'syncing' | 'disconnected'
  last_sync: string | null
  sync_frequency: string
  config: Record<string, unknown>
  created_at: string
}

interface ConnectorDef {
  type: ConnectorType
  name: string
  description: string
  icon: React.ElementType
  color: string
  gradient: string
  fields: { key: string; label: string; type: string; placeholder: string; required?: boolean }[]
}

const CONNECTOR_DEFS: ConnectorDef[] = [
  {
    type: 'database',
    name: 'Website Database',
    description:
      'Connect your PostgreSQL or MySQL database to pull orders, customers, products automatically.',
    icon: Database,
    color: 'text-emerald-400',
    gradient: 'from-emerald-400 to-emerald-600',
    fields: [
      {
        key: 'db_type',
        label: 'Database Type',
        type: 'select',
        placeholder: 'PostgreSQL',
        required: true,
      },
      {
        key: 'host',
        label: 'Host',
        type: 'text',
        placeholder: 'db.example.com or 127.0.0.1',
        required: true,
      },
      { key: 'port', label: 'Port', type: 'number', placeholder: '5432', required: true },
      {
        key: 'database',
        label: 'Database Name',
        type: 'text',
        placeholder: 'my_database',
        required: true,
      },
      {
        key: 'username',
        label: 'Username',
        type: 'text',
        placeholder: 'read_only_user',
        required: true,
      },
      {
        key: 'password',
        label: 'Password',
        type: 'password',
        placeholder: '••••••••',
        required: true,
      },
    ],
  },
  {
    type: 'facebook_ads',
    name: 'Facebook Ads',
    description:
      'Connect your Facebook ad account to track ad spend, ROAS, and campaign performance.',
    icon: Facebook,
    color: 'text-blue-400',
    gradient: 'from-blue-400 to-blue-600',
    fields: [
      {
        key: 'ad_account_id',
        label: 'Ad Account ID',
        type: 'text',
        placeholder: 'act_xxxxxxxxxx',
        required: true,
      },
      {
        key: 'access_token',
        label: 'Access Token',
        type: 'password',
        placeholder: 'EAA... (from Facebook Developer)',
        required: true,
      },
    ],
  },
  {
    type: 'google_ads',
    name: 'Google Ads',
    description: 'Connect your Google Ads account to analyze keyword performance and campaign ROI.',
    icon: BarChart3,
    color: 'text-amber-400',
    gradient: 'from-amber-400 to-amber-600',
    fields: [
      {
        key: 'customer_id',
        label: 'Customer ID',
        type: 'text',
        placeholder: 'xxx-xxx-xxxx',
        required: true,
      },
      {
        key: 'developer_token',
        label: 'Developer Token',
        type: 'password',
        placeholder: 'Your Google Ads API token',
        required: true,
      },
      {
        key: 'refresh_token',
        label: 'Refresh Token',
        type: 'password',
        placeholder: 'OAuth refresh token',
        required: true,
      },
    ],
  },
]

const SYNC_OPTIONS = [
  { value: 'hourly', label: 'Every Hour' },
  { value: '6hours', label: 'Every 6 Hours' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
]

export function DataConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [selectedType, setSelectedType] = useState<ConnectorType | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [formSyncFreq, setFormSyncFreq] = useState('daily')
  const [formName, setFormName] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  const loadConnectors = useCallback(() => {
    apiClient
      .getConnectors()
      .then(setConnectors)
      .catch(() => setConnectors([]))
  }, [])

  useEffect(() => {
    loadConnectors()
  }, [loadConnectors])

  const openConnectDialog = (type: ConnectorType) => {
    setSelectedType(type)
    setFormValues({})
    setFormName('')
    setFormSyncFreq('daily')
    setTestStatus('idle')
    setTestMessage('')
    setShowDialog(true)
  }

  const handleTestConnection = async () => {
    if (!selectedType) return
    setTestStatus('testing')
    setTestMessage('Testing connection...')
    try {
      await apiClient.testConnector(selectedType, formValues)
      setTestStatus('success')
      setTestMessage('Connection successful! You can now save.')
    } catch {
      setTestStatus('error')
      setTestMessage('Connection failed. Please check your credentials.')
    }
  }

  const handleSaveConnector = async () => {
    if (!selectedType) return
    setConnecting(true)
    try {
      await apiClient.createConnector({
        type: selectedType,
        name: (formName || CONNECTOR_DEFS.find((d) => d.type === selectedType)?.name) ?? '',
        config: formValues,
        sync_frequency: formSyncFreq,
      })
      setShowDialog(false)
      loadConnectors()
    } catch {
      alert('Failed to save connector')
    } finally {
      setConnecting(false)
    }
  }

  const handleDeleteConnector = async (id: string) => {
    if (!confirm('Delete this connector? Historical data will be preserved.')) return
    try {
      await apiClient.deleteConnector(id)
      loadConnectors()
    } catch {
      alert('Failed to delete connector')
    }
  }

  const handleSyncNow = async (id: string) => {
    try {
      await apiClient.syncConnector(id)
      loadConnectors()
    } catch {
      alert('Sync failed')
    }
  }

  const statusIcons = {
    connected: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <XCircle className="w-4 h-4 text-red-400" />,
    syncing: <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />,
    disconnected: <Clock className="w-4 h-4 text-slate-500" />,
  }

  const statusLabels = {
    connected: 'Connected',
    error: 'Error',
    syncing: 'Syncing...',
    disconnected: 'Disconnected',
  }

  const connectedCount = connectors.filter((c) => c.status === 'connected').length

  const selectedDef = CONNECTOR_DEFS.find((d) => d.type === selectedType)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Data Connectors</h1>
        <p className="text-slate-400 mt-1">
          Connect your data sources for automatic analytics — no CSV uploads needed
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Link className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-slate-400">Active Connectors</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{connectedCount}</p>
          <p className="text-xs text-slate-500 mt-1">of {connectors.length} total</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-slate-400">Last Sync</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {connectors.filter((c) => c.last_sync).length > 0
              ? new Date(
                  Math.max(
                    ...connectors
                      .filter((c) => c.last_sync)
                      .map((c) => new Date(c.last_sync!).getTime())
                  )
                ).toLocaleTimeString()
              : 'Never'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Across all connectors</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-slate-400">Errors</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {connectors.filter((c) => c.status === 'error').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Needs attention</p>
        </div>
      </div>

      {/* Available Connectors */}
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Available Connectors</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {CONNECTOR_DEFS.map((def) => {
          const Icon = def.icon
          const existing = connectors.find((c) => c.type === def.type)
          return (
            <div
              key={def.type}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${def.gradient} rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {existing && (
                  <Badge
                    className={
                      existing.status === 'connected'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : existing.status === 'error'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-slate-700 text-slate-400'
                    }
                  >
                    {statusLabels[existing.status]}
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-1">{def.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{def.description}</p>
              <Button
                onClick={() => openConnectDialog(def.type)}
                className={`w-full ${
                  existing
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                }`}
              >
                {existing ? (
                  <>
                    <Settings2 className="w-4 h-4 mr-2" />
                    Manage
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Connected Sources */}
      {connectors.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Connected Sources</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Connector
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Last Sync
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Frequency
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {connectors.map((conn) => {
                  const def = CONNECTOR_DEFS.find((d) => d.type === conn.type)
                  const Icon = def?.icon ?? Database
                  return (
                    <tr key={conn.id} className="border-b border-slate-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 bg-gradient-to-br ${def?.gradient ?? 'from-slate-500 to-slate-600'} rounded flex items-center justify-center`}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{conn.name}</p>
                            <p className="text-xs text-slate-500">{conn.type.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {statusIcons[conn.status]}
                          <span className="text-sm text-slate-300">
                            {statusLabels[conn.status]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400">
                        {conn.last_sync ? new Date(conn.last_sync).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="default" className="bg-slate-800 text-slate-300 text-xs">
                          {SYNC_OPTIONS.find((s) => s.value === conn.sync_frequency)?.label ??
                            conn.sync_frequency}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSyncNow(conn.id)}
                            className="text-slate-400 hover:text-emerald-400"
                            disabled={conn.status === 'syncing'}
                          >
                            <RefreshCw
                              className={`w-4 h-4 ${conn.status === 'syncing' ? 'animate-spin' : ''}`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConnector(conn.id)}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Connect Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedDef && (
                <>
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${selectedDef.gradient} rounded-lg flex items-center justify-center`}
                  >
                    <selectedDef.icon className="w-5 h-5 text-white" />
                  </div>
                  Connect {selectedDef.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedDef?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Connector Name */}
            <div>
              <Label className="text-slate-300">Connector Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={selectedDef?.name}
                className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            {/* Dynamic Fields */}
            {selectedDef?.fields.map((field) => (
              <div key={field.key}>
                <Label className="text-slate-300">{field.label}</Label>
                {field.type === 'select' ? (
                  <Select
                    value={formValues[field.key] ?? ''}
                    onValueChange={(val) =>
                      setFormValues((prev) => ({ ...prev, [field.key]: val }))
                    }
                  >
                    <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                      <SelectItem value="MySQL">MySQL</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative mt-1.5">
                    <Input
                      type={showPasswords[field.key] ? 'text' : field.type}
                      value={formValues[field.key] ?? ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="bg-slate-800 border-slate-700 text-slate-100 pr-10"
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            [field.key]: !prev[field.key],
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPasswords[field.key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Sync Frequency */}
            <div>
              <Label className="text-slate-300">Sync Frequency</Label>
              <Select value={formSyncFreq} onValueChange={setFormSyncFreq}>
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYNC_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test Connection Status */}
            {testStatus !== 'idle' && (
              <div
                className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                  testStatus === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : testStatus === 'error'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-slate-800 text-slate-300'
                }`}
              >
                {testStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {testStatus === 'error' && <XCircle className="w-4 h-4" />}
                {testStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin" />}
                {testMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
              <Button
                onClick={handleSaveConnector}
                disabled={connecting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950"
              >
                {connecting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Save Connector
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
