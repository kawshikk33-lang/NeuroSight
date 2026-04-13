import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { apiClient } from '../../services/api/client'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface AlertRule {
  id: string
  name: string
  metric: string
  condition: string
  threshold_value: number | null
  is_active: boolean
  notification_type: string
  use_anomaly_detection: boolean
  cooldown_seconds: number
  description: string | null
  created_at: string
  last_triggered_at: string | null
}

interface AlertNotification {
  id: string
  rule_id: string
  metric: string
  current_value: number
  threshold_value: number | null
  condition: string
  title: string
  message: string
  severity: string
  trend: string | null
  recommended_action: string | null
  is_read: boolean
  created_at: string
}

type TabKey = 'rules' | 'notifications'

export function SmartAlertsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('rules')

  // Rules
  const [rules, setRules] = useState<AlertRule[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState<AlertNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Stats
  const [stats, setStats] = useState<{
    total_alerts: number
    unread: number
    critical: number
    active_rules: number
  } | null>(null)

  // Available metrics
  const [availableMetrics, setAvailableMetrics] = useState<
    Record<string, { label: string; unit: string; description: string }>
  >({})

  // Form
  const [formName, setFormName] = useState('')
  const [formMetric, setFormMetric] = useState('')
  const [formCondition, setFormCondition] = useState('below')
  const [formThreshold, setFormThreshold] = useState('')
  const [formCooldown, setFormCooldown] = useState('300')
  const [formDescription, setFormDescription] = useState('')
  const [formAnomaly, setFormAnomaly] = useState(false)
  const [formError, setFormError] = useState('')

  const loadRules = useCallback(() => {
    apiClient.getAlertRules().then(setRules).catch(console.error)
  }, [])

  const loadNotifications = useCallback(() => {
    apiClient
      .getAlertNotifications(false, 1, 50)
      .then((res) => {
        setNotifications(res.notifications)
        setUnreadCount(res.unread)
      })
      .catch(console.error)
  }, [])

  const loadStats = useCallback(() => {
    apiClient.getAlertStats(7).then(setStats).catch(console.error)
  }, [])

  const loadMetrics = useCallback(() => {
    apiClient
      .getAvailableMetrics()
      .then((res) => setAvailableMetrics(res.metrics))
      .catch(console.error)
  }, [])

  useEffect(() => {
    loadRules()
    loadNotifications()
    loadStats()
    loadMetrics()
  }, [loadRules, loadNotifications, loadStats, loadMetrics])

  const handleCreateRule = async () => {
    setFormError('')
    if (!formName.trim()) {
      setFormError('Name is required')
      return
    }
    if (!formMetric) {
      setFormError('Metric is required')
      return
    }
    if (!formAnomaly && !formThreshold) {
      setFormError('Threshold is required for non-anomaly rules')
      return
    }

    try {
      await apiClient.createAlertRule({
        name: formName.trim(),
        metric: formMetric,
        condition: formCondition,
        threshold_value: formAnomaly ? undefined : parseFloat(formThreshold),
        use_anomaly_detection: formAnomaly,
        cooldown_seconds: parseInt(formCooldown) || 300,
        description: formDescription || undefined,
      })
      setShowCreateDialog(false)
      setFormName('')
      setFormMetric('')
      setFormCondition('below')
      setFormThreshold('')
      setFormCooldown('300')
      setFormDescription('')
      setFormAnomaly(false)
      loadRules()
      loadStats()
    } catch {
      setFormError('Failed to create rule')
    }
  }

  const handleToggleRule = async (rule: AlertRule) => {
    try {
      await apiClient.updateAlertRule(rule.id, { is_active: !rule.is_active })
      loadRules()
    } catch {
      // ignore
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this alert rule?')) return
    try {
      await apiClient.deleteAlertRule(ruleId)
      loadRules()
      loadStats()
    } catch {
      // ignore
    }
  }

  const handleMarkRead = async (notifId: string) => {
    try {
      await apiClient.markAlertRead(notifId)
      loadNotifications()
      loadStats()
    } catch {
      // ignore
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllAlertsRead()
      loadNotifications()
      loadStats()
    } catch {
      // ignore
    }
  }

  const severityColors = {
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const conditionLabels = {
    above: 'Above',
    below: 'Below',
    equal: 'Equals',
    anomaly: 'Anomaly (3σ)',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Smart Alerts</h2>
          <p className="text-sm text-slate-400">Set thresholds, detect anomalies, get notified</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950">
              <Plus className="w-4 h-4 mr-2" />
              New Alert Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Alert Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Rule Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Revenue below $10K"
                  className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Metric</Label>
                <Select value={formMetric} onValueChange={setFormMetric}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Choose metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(availableMetrics).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label} ({meta.description})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Condition</Label>
                <Select value={formCondition} onValueChange={setFormCondition}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="below">Below threshold</SelectItem>
                    <SelectItem value="above">Above threshold</SelectItem>
                    <SelectItem value="equal">Equals value</SelectItem>
                    <SelectItem value="anomaly">Anomaly detection (statistical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!formAnomaly && formCondition !== 'anomaly' && (
                <div>
                  <Label className="text-slate-300">
                    Threshold Value{' '}
                    {availableMetrics[formMetric]?.unit && `(${availableMetrics[formMetric].unit})`}
                  </Label>
                  <Input
                    type="number"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    placeholder="e.g., 10000"
                    className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
              )}
              <div>
                <Label className="text-slate-300">Cooldown (seconds between alerts)</Label>
                <Input
                  type="number"
                  value={formCooldown}
                  onChange={(e) => setFormCooldown(e.target.value)}
                  placeholder="300"
                  className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Prevents alert spam. Default: 300s (5 min)
                </p>
              </div>
              <div>
                <Label className="text-slate-300">Description (optional)</Label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Why this alert matters..."
                  className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
              <Button
                onClick={handleCreateRule}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950"
              >
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Active Rules</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.active_rules}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <BellRing className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Total Alerts (7d)</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.total_alerts}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">Critical</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.critical}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Unread</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.unread}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'rules'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Alert Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Notifications
          {unreadCount > 0 && (
            <Badge className="bg-red-500/20 text-red-400 text-xs">{unreadCount}</Badge>
          )}
        </button>
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          {rules.length === 0 && (
            <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
              <Bell className="w-8 h-8 mx-auto mb-3 text-slate-600" />
              <p className="text-lg font-medium mb-1">No alert rules yet</p>
              <p className="text-sm">Create your first rule to start monitoring metrics.</p>
            </div>
          )}
          {rules.map((rule) => {
            const meta = availableMetrics[rule.metric]
            return (
              <div
                key={rule.id}
                className={`p-4 bg-slate-900 border rounded-xl transition-all ${
                  rule.is_active ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        rule.is_active ? 'bg-emerald-500/10' : 'bg-slate-800'
                      }`}
                    >
                      {rule.condition === 'anomaly' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : rule.condition === 'above' ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-100">{rule.name}</span>
                        {!rule.is_active && (
                          <Badge variant="default" className="text-xs bg-slate-700 text-slate-400">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {meta?.label || rule.metric}{' '}
                        {conditionLabels[rule.condition] || rule.condition}{' '}
                        {rule.threshold_value != null
                          ? `${rule.threshold_value}${meta?.unit || ''}`
                          : '(auto-detect)'}
                        {rule.description && ` — ${rule.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rule.last_triggered_at && (
                      <span className="text-xs text-slate-500">
                        Last: {new Date(rule.last_triggered_at).toLocaleString()}
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className="text-slate-400 hover:text-slate-200"
                      title={rule.is_active ? 'Disable' : 'Enable'}
                    >
                      {rule.is_active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-400 hover:text-red-400"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-slate-300 border-slate-700"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            </div>
          )}
          {notifications.length === 0 && (
            <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
              <p className="text-lg font-medium mb-1">All clear!</p>
              <p className="text-sm">No alert notifications triggered yet.</p>
            </div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 bg-slate-900 border rounded-xl transition-all ${
                !n.is_read ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={`border ${severityColors[n.severity as keyof typeof severityColors] || severityColors.warning}`}
                    >
                      {n.severity}
                    </Badge>
                    <span className="text-sm font-medium text-slate-100">{n.title}</span>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{n.message}</p>
                  {n.recommended_action && (
                    <div className="p-2 bg-slate-800 rounded text-xs text-slate-400">
                      <strong className="text-slate-300">Recommended:</strong>{' '}
                      {n.recommended_action}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    {n.trend && <span>Context: {n.trend}</span>}
                    <span>
                      Value: <strong className="text-slate-300">{n.current_value}</strong>
                      {n.threshold_value != null && ` / Threshold: ${n.threshold_value}`}
                    </span>
                  </div>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-slate-400 hover:text-emerald-400 shrink-0"
                    title="Mark as read"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
