import {
  ArrowLeft,
  BarChart3,
  RefreshCw,
  Settings2,
  CheckCircle2,
  Clock,
  XCircle,
  Lightbulb,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { apiClient } from '../services/api/client'

const mockKpis = [
  { label: 'Ad Spend', value: '৳32,000', change: '+8.5%', positive: true },
  { label: 'Clicks', value: '12,450', change: '+12.3%', positive: true },
  { label: 'Conversions', value: '847', change: '+6.7%', positive: true },
  { label: 'Conv. Rate', value: '6.8%', change: '-0.3pp', positive: false },
  { label: 'CPC', value: '৳2.57', change: '-৳0.18', positive: true },
  { label: 'CPA', value: '৳37.78', change: '+৳2.10', positive: false },
  { label: 'Quality Score', value: '7.2/10', change: '+0.4', positive: true },
  { label: 'ROAS', value: '3.1x', change: '+0.4x', positive: true },
]

const mockSpendConversions = Array.from({ length: 30 }, (_, i) => ({
  date: `Apr ${i + 1}`,
  spend: Math.round(800 + Math.random() * 600),
  conversions: Math.round(20 + Math.random() * 25),
}))

const mockSearchTerms = [
  { term: 'best ecommerce platform bd', clicks: 450, conv: 38, cpa: '৳28', spend: '৳1,200' },
  { term: 'online shopping dhaka', clicks: 380, conv: 22, cpa: '৳45', spend: '৳990' },
  { term: 'buy phone accessories bd', clicks: 320, conv: 28, cpa: '৳32', spend: '৳896' },
  { term: 'cheapest gadget store', clicks: 280, conv: 5, cpa: '৳180', spend: '৳900' },
  { term: 'free delivery online bd', clicks: 250, conv: 18, cpa: '৳38', spend: '৳684' },
  { term: 'laptop accessories dhaka', clicks: 210, conv: 15, cpa: '৳42', spend: '৳630' },
  { term: 'tech shop bangladesh', clicks: 180, conv: 12, cpa: '৳35', spend: '₳420' },
]

const mockCampaigns = [
  { name: 'Search - Brand', type: 'Search', spend: 8000, clicks: 4200, conv: 320, roas: 4.2 },
  { name: 'Search - Generic', type: 'Search', spend: 12000, clicks: 5100, conv: 280, roas: 2.8 },
  {
    name: 'Display - Retargeting',
    type: 'Display',
    spend: 6000,
    clicks: 1800,
    conv: 95,
    roas: 2.1,
  },
  {
    name: 'Shopping - All Products',
    type: 'Shopping',
    spend: 4000,
    clicks: 980,
    conv: 110,
    roas: 3.5,
  },
  { name: 'Video - Brand Story', type: 'Video', spend: 2000, clicks: 370, conv: 42, roas: 1.8 },
]

const mockDeviceBreakdown = [
  { name: 'Mobile', value: 92, color: '#10b981' },
  { name: 'Desktop', value: 7, color: '#3b82f6' },
  { name: 'Tablet', value: 1, color: '#64748b' },
]

const mockQualityScoreDist = [
  { score: '1-2', count: 45, color: '#ef4444' },
  { score: '3-4', count: 120, color: '#f59e0b' },
  { score: '5-6', count: 280, color: '#eab308' },
  { score: '7-8', count: 350, color: '#22c55e' },
  { score: '9-10', count: 180, color: '#10b981' },
]

const mockInsights = [
  {
    type: 'warning',
    text: '12 keywords have high spend but zero conversions — consider pausing or adding negative keywords',
  },
  { type: 'tip', text: 'Mobile CPA is ৳28 vs Desktop ৳65 — shift budget toward mobile' },
  {
    type: 'tip',
    text: 'Impression share lost due to budget: 34% — increasing daily budget by ৳2,000 could capture ~200 more clicks/month',
  },
]

interface DashboardConnector {
  type: string
  status: string
  last_sync?: string
  config?: Record<string, string>
}

export function GoogleAdsDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [connector, setConnector] = useState<DashboardConnector | null>(null)

  useEffect(() => {
    apiClient
      .getConnectors()
      .then((connectors) => {
        const ga = connectors.find((c) => c.type === 'google_ads')
        setConnector(ga)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      label: 'Connected',
    },
    syncing: {
      icon: RefreshCw,
      color: 'text-amber-400 animate-spin',
      bg: 'bg-amber-500/10',
      label: 'Syncing...',
    },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
    disconnected: {
      icon: Clock,
      color: 'text-slate-500',
      bg: 'bg-slate-700',
      label: 'Disconnected',
    },
  }

  const status = statusConfig[(connector?.status || 'disconnected') as keyof typeof statusConfig]
  const StatusIcon = status.icon

  const insightColors = {
    tip: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/connectors" className="text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              Google Ads
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {connector
                ? `Account: ${connector.config?.customer_id || 'N/A'}`
                : 'Connect your Google Ads account'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {connector && (
            <>
              <Badge
                className={`${status.bg} ${status.color} border ${status.color.replace('animate-spin', '').replace('text-', 'border-')}/20`}
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Sync Now
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <Settings2 className="w-3 h-3 mr-1.5" />
            Settings
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading Google Ads data...</div>
      ) : !connector ? (
        <div className="text-center py-20">
          <BarChart3 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No Google Ads Connected</h3>
          <p className="text-sm text-slate-500 mb-6">
            Connect your Google Ads account to track search campaign performance and keyword ROI.
          </p>
          <Link to="/connectors">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950">
              Connect Google Ads
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* KPI Rows */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
            {mockKpis.map((kpi) => (
              <div key={kpi.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">{kpi.label}</p>
                <p className="text-lg font-bold text-slate-100">{kpi.value}</p>
                <p
                  className={`text-xs mt-0.5 ${kpi.positive ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {kpi.change}
                </p>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Spend & Conversions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">
                Spend & Conversions (30 days)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={mockSpendConversions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="spend"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="Spend (৳)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversions"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Conversions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Campaign Comparison */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">Campaign Comparison</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mockCampaigns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="spend" fill="#f59e0b" name="Spend (৳)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conv" fill="#10b981" name="Conversions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Device Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">Device Breakdown</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={mockDeviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockDeviceBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Quality Score Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">
                Quality Score Distribution
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mockQualityScoreDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="score" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" name="Keywords" radius={[4, 4, 0, 0]}>
                    {mockQualityScoreDist.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Search Terms Report */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-slate-100">Search Terms Report</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Search Term</TableHead>
                  <TableHead className="text-slate-400">Clicks</TableHead>
                  <TableHead className="text-slate-400">Conv.</TableHead>
                  <TableHead className="text-slate-400">CPA</TableHead>
                  <TableHead className="text-slate-400">Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSearchTerms.map((t) => (
                  <TableRow key={t.term} className="border-slate-800/50">
                    <TableCell className="text-sm text-slate-200 font-mono text-xs">
                      {t.term}
                    </TableCell>
                    <TableCell className="text-sm text-slate-300">{t.clicks}</TableCell>
                    <TableCell className="text-sm text-slate-300">{t.conv}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          t.cpa.replace(/[৳,]/g, '') < '50'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : t.cpa.replace(/[৳,]/g, '') < '100'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }
                      >
                        {t.cpa}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-300">{t.spend}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* AI Insights */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              AI Insights
            </h3>
            <div className="space-y-3">
              {mockInsights.map((insight, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border text-sm ${insightColors[insight.type as keyof typeof insightColors]}`}
                >
                  {insight.text}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
