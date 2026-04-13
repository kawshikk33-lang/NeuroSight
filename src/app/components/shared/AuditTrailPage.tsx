import { Shield, AlertTriangle, Users, FileText, Download, Search, Eye } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { apiClient } from '../../services/api/client'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

interface AuditLog {
  id: string
  user_email: string | null
  event_type: string
  resource_type: string | null
  resource_name: string | null
  action: string
  description: string
  ip_address: string | null
  status_code: number | null
  is_sensitive: boolean
  created_at: string
}

interface AuditLogDetail extends AuditLog {
  user_id: number | null
  resource_id: string | null
  user_agent: string | null
  request_id: string | null
  method: string | null
  path: string | null
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  metadata: Record<string, unknown>
  error_message: string | null
  retention_days: number
}

interface AuditStats {
  total_events: number
  events_by_type: Record<string, number>
  events_by_user: Record<string, number>
  sensitive_events: number
  date_range: { start: string; end: string }
}

type TabKey = 'overview' | 'logs' | 'compliance' | 'gdpr'

export function AuditTrailPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [eventType, setEventType] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // GDPR
  const [gdprEmail, setGdprEmail] = useState('')
  const [gdprStatus, setGdprStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [gdprMessage, setGdprMessage] = useState('')

  const loadStats = useCallback(() => {
    apiClient.getAuditStats(30).then(setStats).catch(console.error)
  }, [])

  const loadLogs = useCallback(() => {
    setLoading(true)
    apiClient
      .getAuditLogs({
        event_type: eventType || undefined,
        user_email: userEmail || undefined,
        page,
        page_size: 50,
      })
      .then((res) => {
        setLogs(res.logs)
        setTotalPages(res.total_pages)
        setTotalLogs(res.total)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [eventType, userEmail, page])

  useEffect(() => {
    loadStats()
    loadLogs()
  }, [loadStats, loadLogs])

  const handleViewDetail = async (logId: string) => {
    setDetailLoading(true)
    try {
      const detail = await apiClient.getAuditLogDetail(logId)
      setSelectedLog(detail)
    } catch {
      // ignore
    } finally {
      setDetailLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/audit/compliance/export-csv`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      })
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Failed to export CSV')
    }
  }

  const handleGdprExport = async () => {
    if (!gdprEmail) {
      setGdprStatus('error')
      setGdprMessage('Please enter an email address')
      return
    }
    setGdprStatus('loading')
    try {
      await apiClient.gdprExport(gdprEmail)
      setGdprStatus('success')
      setGdprMessage(`Export initiated for ${gdprEmail}`)
    } catch (err) {
      setGdprStatus('error')
      setGdprMessage(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const handleGdprDelete = async (dryRun: boolean) => {
    if (!gdprEmail) {
      setGdprStatus('error')
      setGdprMessage('Please enter an email address')
      return
    }
    setGdprStatus('loading')
    try {
      const result = await apiClient.gdprDelete(gdprEmail, dryRun)
      setGdprStatus('success')
      setGdprMessage(JSON.stringify(result))
    } catch (err) {
      setGdprStatus('error')
      setGdprMessage(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleGenerateReport = async () => {
    try {
      const report = await apiClient.getComplianceReport('soc2')
      alert(`Report generated!\n${JSON.stringify(report.summary, null, 2)}`)
    } catch {
      alert('Failed to generate report')
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'logs', label: 'Audit Logs' },
    { key: 'compliance', label: 'Compliance' },
    { key: 'gdpr', label: 'GDPR' },
  ]

  const eventColors: Record<string, string> = {
    file_upload: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    file_delete: 'bg-red-500/10 text-red-400 border-red-500/20',
    analysis_run: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    model_train: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    model_predict: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    login: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    register: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    gdpr_export: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    gdpr_delete: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    compliance_report: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  }

  if (loading && !logs.length) {
    return <div className="p-8 text-slate-400">Loading audit trail...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm text-slate-400">Total Events</span>
              </div>
              <p className="text-3xl font-bold text-slate-100">
                {stats.total_events.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-sm text-slate-400">Sensitive Events</span>
              </div>
              <p className="text-3xl font-bold text-slate-100">{stats.sensitive_events}</p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.sensitive_events > 0 ? 'Review required' : 'All clear'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-400">Active Users</span>
              </div>
              <p className="text-3xl font-bold text-slate-100">
                {Object.keys(stats.events_by_user).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">With audit activity</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-400">Compliance Score</span>
              </div>
              <p className="text-3xl font-bold text-slate-100">
                {stats.sensitive_events === 0
                  ? '100%'
                  : `${Math.round((1 - stats.sensitive_events / stats.total_events) * 100)}%`}
              </p>
              <p className="text-xs text-slate-500 mt-1">Based on sensitive event ratio</p>
            </div>
          </div>

          {/* Events by Type */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Events by Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(stats.events_by_type).map(([type, count]) => (
                <div key={type} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 capitalize">{type.replace(/_/g, ' ')}</p>
                  <p className="text-xl font-bold text-slate-100">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Top Users by Activity</h3>
            <div className="space-y-2">
              {Object.entries(stats.events_by_user)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([email, count]) => (
                  <div
                    key={email}
                    className="flex justify-between items-center p-3 bg-slate-800 rounded-lg"
                  >
                    <span className="text-sm text-slate-300">{email}</span>
                    <Badge variant="default">{count} events</Badge>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'logs' && (
        <>
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Filter by event type..."
                  value={eventType}
                  onChange={(e) => {
                    setEventType(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9 bg-slate-800 border-slate-700 text-slate-100 w-56"
                />
              </div>
              <Input
                placeholder="Filter by user email..."
                value={userEmail}
                onChange={(e) => {
                  setUserEmail(e.target.value)
                  setPage(1)
                }}
                className="bg-slate-800 border-slate-700 text-slate-100 w-56"
              />
            </div>
            <Button
              onClick={handleExportCSV}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Timestamp</TableHead>
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Event</TableHead>
                  <TableHead className="text-slate-400">Resource</TableHead>
                  <TableHead className="text-slate-400">IP</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-slate-800/50">
                    <TableCell className="text-slate-300 text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {log.user_email || 'System'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border ${eventColors[log.event_type] || 'bg-slate-700 text-slate-300 border-slate-600'}`}
                      >
                        {log.event_type.replace(/_/g, ' ')}
                      </Badge>
                      {log.is_sensitive && (
                        <AlertTriangle className="w-3 h-3 text-red-400 inline ml-1" />
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm max-w-[200px] truncate">
                      {log.resource_name || '-'}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm font-mono">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status_code && log.status_code >= 400 ? 'destructive' : 'default'
                        }
                      >
                        {log.status_code || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(log.id)}
                        className="text-slate-400 hover:text-slate-100"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center text-sm text-slate-400">
            <span>
              Showing {logs.length} of {totalLogs.toLocaleString()} logs
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="px-3 py-1">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">SOC 2 Report</h3>
            <p className="text-sm text-slate-400 mb-4">
              Generate a comprehensive SOC 2 compliance report covering the last 90 days.
            </p>
            <Button
              onClick={handleGenerateReport}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate SOC 2 Report
            </Button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Export Audit Logs</h3>
            <p className="text-sm text-slate-400 mb-4">
              Download all audit logs as a CSV file for external review or archiving.
            </p>
            <Button
              onClick={handleExportCSV}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Permission Changes</h3>
            <p className="text-sm text-slate-400 mb-4">
              View all permission and role changes in the last 30 days.
            </p>
            <Button
              onClick={async () => {
                try {
                  const result = await apiClient.getPermissionChanges(30)
                  alert(`${result.total} permission changes found`)
                } catch {
                  alert('Failed to fetch permission changes')
                }
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950"
            >
              <Shield className="w-4 h-4 mr-2" />
              View Permission Changes
            </Button>
          </div>
        </div>
      )}

      {/* GDPR Tab */}
      {activeTab === 'gdpr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">GDPR Data Export</h3>
            <p className="text-sm text-slate-400 mb-4">
              Export all personal data for a specific user (GDPR Article 20).
            </p>
            <Input
              type="email"
              placeholder="user@example.com"
              value={gdprEmail}
              onChange={(e) => setGdprEmail(e.target.value)}
              className="mb-4 bg-slate-800 border-slate-700 text-slate-100"
            />
            <Button
              onClick={handleGdprExport}
              disabled={gdprStatus === 'loading'}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950"
            >
              {gdprStatus === 'loading' ? 'Processing...' : 'Start Export'}
            </Button>
            {gdprMessage && (
              <div
                className={`mt-3 p-3 rounded-lg text-sm ${
                  gdprStatus === 'error'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {gdprMessage}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">GDPR Data Deletion</h3>
            <p className="text-sm text-slate-400 mb-4">
              Request deletion of all personal data (GDPR Article 17).
              <br />
              <strong className="text-amber-400">Note:</strong> Audit logs are immutable and cannot
              be deleted.
            </p>
            <Input
              type="email"
              placeholder="user@example.com"
              value={gdprEmail}
              onChange={(e) => setGdprEmail(e.target.value)}
              className="mb-4 bg-slate-800 border-slate-700 text-slate-100"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => handleGdprDelete(true)}
                disabled={gdprStatus === 'loading'}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950"
              >
                Dry Run
              </Button>
              <Button
                onClick={() => handleGdprDelete(false)}
                disabled={gdprStatus === 'loading'}
                className="flex-1 bg-red-500 hover:bg-red-600 text-slate-950"
              >
                Execute Delete
              </Button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">About GDPR Compliance</h3>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">Article 15</span>
                <span>
                  Right of access — Users can request confirmation that their data is being
                  processed
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">Article 17</span>
                <span>
                  Right to be forgotten — Users can request deletion of their personal data
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">Article 20</span>
                <span>
                  Right to data portability — Users can receive their data in a machine-readable
                  format
                </span>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-4">
                <strong className="text-amber-400">Important:</strong> Audit logs are immutable and
                retained for compliance purposes even after user data deletion.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Audit Log Detail</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <p className="text-slate-400">Loading...</p>
          ) : selectedLog ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Event Type:</span>
                  <p className="text-slate-100">{selectedLog.event_type}</p>
                </div>
                <div>
                  <span className="text-slate-400">User:</span>
                  <p className="text-slate-100">{selectedLog.user_email || 'System'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Action:</span>
                  <p className="text-slate-100">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-400">Resource:</span>
                  <p className="text-slate-100">{selectedLog.resource_name || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400">IP Address:</span>
                  <p className="text-slate-100 font-mono">{selectedLog.ip_address || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Timestamp:</span>
                  <p className="text-slate-100">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Method / Path:</span>
                  <p className="text-slate-100 font-mono text-xs">
                    {selectedLog.method} {selectedLog.path}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="text-slate-100">{selectedLog.status_code || 'N/A'}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-sm">Description:</span>
                <p className="text-slate-100 text-sm mt-1">{selectedLog.description}</p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-slate-400 text-sm">Metadata:</span>
                  <pre className="mt-1 p-3 bg-slate-800 rounded text-xs text-slate-300 overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.error_message && (
                <div>
                  <span className="text-red-400 text-sm">Error:</span>
                  <p className="text-red-400 text-sm mt-1">{selectedLog.error_message}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
