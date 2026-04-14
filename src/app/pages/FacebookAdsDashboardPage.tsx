import {
  ArrowLeft,
  Facebook,
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
  ComposedChart,
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
  { label: 'Ad Spend', value: '৳85,000', change: '+15.2%', positive: true },
  { label: 'Impressions', value: '2.4M', change: '+22.1%', positive: true },
  { label: 'Clicks', value: '48,200', change: '+8.7%', positive: true },
  { label: 'Purchases', value: '1,847', change: '+3.4%', positive: true },
  { label: 'CTR', value: '2.01%', change: '+0.15pp', positive: true },
  { label: 'CPC', value: '৳1.76', change: '-৳0.12', positive: true },
  { label: 'CPP', value: '৳46.02', change: '+৳3.50', positive: false },
  { label: 'ROAS', value: '2.8x', change: '-0.3x', positive: false },
]

const mockSpendVsRevenue = Array.from({ length: 30 }, (_, i) => ({
  date: `Apr ${i + 1}`,
  spend: Math.round(2000 + Math.random() * 2000),
  revenue: Math.round(5000 + Math.random() * 8000),
}))

const mockCampaigns = [
  { name: 'Winter Sale 2026', spend: 25000, roas: 4.2, clicks: 12000, conv: 480 },
  { name: 'Brand Awareness Q2', spend: 18000, roas: 2.1, clicks: 8500, conv: 180 },
  { name: 'Retargeting - Cart Abandon', spend: 15000, roas: 3.8, clicks: 6200, conv: 320 },
  { name: 'New Product Launch', spend: 12000, roas: 1.9, clicks: 5800, conv: 95 },
  { name: 'Lookalike - VIP Customers', spend: 10000, roas: 3.5, clicks: 4200, conv: 210 },
  { name: 'Engagement Boost', spend: 5000, roas: 1.2, clicks: 3100, conv: 42 },
]

const mockDemographics = [
  { age: '18-24', male: 1200, female: 1800 },
  { age: '25-34', male: 4500, female: 5200 },
  { age: '35-44', male: 2800, female: 2100 },
  { age: '45-54', male: 1200, female: 800 },
  { age: '55+', male: 400, female: 300 },
]

const mockCreatives = [
  { name: 'Video - Product Demo', type: 'Video', ctr: 3.2, spend: 8000, conv: 180 },
  { name: 'Image - Sale Banner', type: 'Image', ctr: 2.1, spend: 12000, conv: 220 },
  { name: 'Carousel - Top 5 Products', type: 'Carousel', ctr: 2.8, spend: 6000, conv: 145 },
  { name: 'Video - Customer Review', type: 'Video', ctr: 3.5, spend: 5000, conv: 160 },
  { name: 'Image - New Arrival', type: 'Image', ctr: 1.8, spend: 9000, conv: 110 },
]

const mockGeo = [
  { name: 'Dhaka', value: 42, color: '#10b981' },
  { name: 'Chittagong', value: 18, color: '#06b6d4' },
  { name: 'Sylhet', value: 12, color: '#8b5cf6' },
  { name: 'Rajshahi', value: 10, color: '#f59e0b' },
  { name: 'Khulna', value: 8, color: '#ef4444' },
  { name: 'Others', value: 10, color: '#64748b' },
]

const mockInsights = [
  {
    type: 'tip',
    text: "Campaign 'Winter Sale' has 4.2x ROAS — consider increasing budget by ৳5,000/day",
  },
  {
    type: 'warning',
    text: "Ad set 'Dhaka 25-34 Female' CPA is 40% higher than average — review targeting",
  },
  {
    type: 'tip',
    text: 'Video ads outperform image ads by 2.3x CTR — shift creative budget toward video',
  },
]

interface DashboardConnector {
  type: string
  status: string
  last_sync?: string
  config?: Record<string, string>
}

export function FacebookAdsDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [connector, setConnector] = useState<DashboardConnector | null>(null)

  useEffect(() => {
    apiClient
      .getConnectors()
      .then((connectors) => {
        const fb = connectors.find((c) => c.type === 'facebook_ads')
        setConnector(fb)
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Facebook className="w-5 h-5 text-white" />
              </div>
              Facebook Ads
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {connector
                ? `Account: ${connector.config?.ad_account_id || 'N/A'}`
                : 'Connect your Facebook ad account'}
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
        <div className="text-center py-20 text-slate-500">Loading Facebook Ads data...</div>
      ) : !connector ? (
        <div className="text-center py-20">
          <Facebook className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No Facebook Ads Connected</h3>
          <p className="text-sm text-slate-500 mb-6">
            Connect your Facebook ad account to track ad performance and ROAS.
          </p>
          <Link to="/connectors">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Connect Facebook Ads
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
            {/* Spend vs Revenue */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">
                Spend vs Revenue (30 days)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={mockSpendVsRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="spend" fill="#3b82f6" name="Ad Spend" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Revenue"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Campaign Performance */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">Campaign Performance</h3>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400 text-xs">Campaign</TableHead>
                    <TableHead className="text-slate-400 text-xs">Spend</TableHead>
                    <TableHead className="text-slate-400 text-xs">ROAS</TableHead>
                    <TableHead className="text-slate-400 text-xs">Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCampaigns.map((c) => (
                    <TableRow key={c.name} className="border-slate-800/50">
                      <TableCell className="text-sm text-slate-200 max-w-[140px] truncate">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">
                        ৳{c.spend.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            c.roas >= 3
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : c.roas >= 2
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }
                        >
                          {c.roas}x
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">{c.conv}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Demographics */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">Audience Demographics</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mockDemographics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="male" fill="#3b82f6" name="Male" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="female" fill="#ec4899" name="Female" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Geographic */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">
                Geographic Distribution
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={mockGeo}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {mockGeo.map((entry, i) => (
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
          </div>

          {/* Creative Performance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-slate-100">Top Ad Creatives</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Creative</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">CTR</TableHead>
                  <TableHead className="text-slate-400">Spend</TableHead>
                  <TableHead className="text-slate-400">Conversions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCreatives.map((c) => (
                  <TableRow key={c.name} className="border-slate-800/50">
                    <TableCell className="text-sm text-slate-200">{c.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-slate-800 text-slate-300 text-xs">{c.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-300">{c.ctr}%</TableCell>
                    <TableCell className="text-sm text-slate-300">
                      ৳{c.spend.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-slate-300">{c.conv}</TableCell>
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
