import {
  ArrowLeft,
  Database,
  RefreshCw,
  Settings2,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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

// Mock data — will be replaced with real API calls
const mockKpis = {
  revenue: { value: '৳4,50,000', change: '+12.3%', positive: true },
  orders: { value: '1,247', change: '+8.2%', positive: true },
  customers: { value: '892', change: '+5.1%', positive: true },
  avgOrder: { value: '৳2,250', change: '-2.1%', positive: false },
}

const mockRevenueTrend = Array.from({ length: 30 }, (_, i) => ({
  date: `Apr ${i + 1}`,
  revenue: Math.round(12000 + Math.random() * 8000),
  orders: Math.round(5 + Math.random() * 15),
}))

const mockOrderStatus = [
  { name: 'Delivered', value: 847, color: '#10b981' },
  { name: 'Pending', value: 234, color: '#f59e0b' },
  { name: 'Returned', value: 89, color: '#ef4444' },
  { name: 'Cancelled', value: 77, color: '#64748b' },
]

const mockTopProducts = [
  { name: 'Premium T-Shirt', revenue: 45000 },
  { name: 'Wireless Earbuds', revenue: 38000 },
  { name: 'Phone Case', revenue: 28000 },
  { name: 'Smart Watch', revenue: 25000 },
  { name: 'Laptop Stand', revenue: 22000 },
  { name: 'USB-C Hub', revenue: 18000 },
  { name: 'Backpack', revenue: 15000 },
  { name: 'Sunglasses', revenue: 12000 },
  { name: 'Water Bottle', revenue: 9000 },
  { name: 'Mouse Pad', revenue: 7000 },
]

const mockRecentOrders = [
  {
    id: 'ORD-1247',
    customer: 'Rahim Ahmed',
    amount: 3500,
    status: 'Delivered',
    date: '2026-04-13',
  },
  { id: 'ORD-1246', customer: 'Fatima Khan', amount: 1200, status: 'Pending', date: '2026-04-13' },
  {
    id: 'ORD-1245',
    customer: 'Karim Hassan',
    amount: 8900,
    status: 'Delivered',
    date: '2026-04-12',
  },
  {
    id: 'ORD-1244',
    customer: 'Nusrat Jahan',
    amount: 2100,
    status: 'Returned',
    date: '2026-04-12',
  },
  {
    id: 'ORD-1243',
    customer: 'Tanvir Rahman',
    amount: 5600,
    status: 'Delivered',
    date: '2026-04-12',
  },
  {
    id: 'ORD-1242',
    customer: 'Sumaiya Akter',
    amount: 750,
    status: 'Cancelled',
    date: '2026-04-11',
  },
]

const mockTables = [
  { name: 'orders', rows: 2450, size: '1.2 MB' },
  { name: 'customers', rows: 892, size: '0.4 MB' },
  { name: 'products', rows: 156, size: '0.1 MB' },
  { name: 'payments', rows: 2380, size: '0.9 MB' },
  { name: 'deliveries', rows: 1890, size: '0.7 MB' },
]

interface DashboardConnector {
  type: string
  status: string
  last_sync: string | null
  config?: Record<string, unknown>
}

export function DatabaseDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [connector, setConnector] = useState<DashboardConnector | null>(null)

  useEffect(() => {
    apiClient
      .getConnectors()
      .then((connectors) => {
        const db = connectors.find((c) => c.type === 'database')
        setConnector(db ?? null)
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
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              Website Database
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Orders, customers, products from your database
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={`${status.bg} ${status.color} border ${status.color.replace('animate-spin', '').replace('text-', 'border-')}/20`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          {connector?.last_sync && (
            <span className="text-xs text-slate-500">
              Last sync: {new Date(connector.last_sync).toLocaleString()}
            </span>
          )}
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Sync Now
          </Button>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <Settings2 className="w-3 h-3 mr-1.5" />
            Settings
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading database analytics...</div>
      ) : !connector ? (
        <div className="text-center py-20">
          <Database className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No Database Connected</h3>
          <p className="text-sm text-slate-500 mb-6">
            Connect your PostgreSQL or MySQL database to see analytics here.
          </p>
          <Link to="/connectors">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950">
              Connect Database
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(mockKpis).map(([key, data]) => (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-sm text-slate-400 capitalize mb-1">
                  {key === 'avgOrder' ? 'Avg Order Value' : key}
                </p>
                <p className="text-2xl font-bold text-slate-100">{data.value}</p>
                <p
                  className={`text-xs mt-1 ${data.positive ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {data.change} vs last 30 days
                </p>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Over Time */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">
                Revenue Over Time (30 days)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={mockRevenueTrend}>
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
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">Orders by Status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={mockOrderStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {mockOrderStatus.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
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

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Products */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">
                Top 10 Products by Revenue
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mockTopProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detected Tables */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4">Detected Tables</h3>
              <div className="space-y-3">
                {mockTables.map((table) => (
                  <div
                    key={table.name}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-mono text-slate-200">{table.name}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {table.rows.toLocaleString()} rows · {table.size}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-slate-100">Recent Orders</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Order ID</TableHead>
                  <TableHead className="text-slate-400">Customer</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecentOrders.map((order) => (
                  <TableRow key={order.id} className="border-slate-800/50">
                    <TableCell className="font-mono text-sm text-slate-300">{order.id}</TableCell>
                    <TableCell className="text-sm text-slate-300">{order.customer}</TableCell>
                    <TableCell className="text-sm text-slate-200 font-medium">
                      ৳{order.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.status === 'Delivered'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : order.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : order.status === 'Returned'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-slate-700 text-slate-400'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">{order.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
