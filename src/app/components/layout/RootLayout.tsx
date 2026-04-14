import {
  Cpu,
  ChevronDown,
  ChevronRight,
  Database,
  Facebook,
  BarChart3,
  Link,
  Settings,
} from 'lucide-react'
import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router'

import { sidebarRouteConfigs } from '../../config/appRoutes'
import { apiClient } from '../../services/api/client'
import { ProfileDropdown } from '../shared/ProfileDropdown'

const dataHubItems = [
  { path: '/connectors/database', label: 'Database', icon: Database, color: 'text-emerald-400' },
  { path: '/connectors/facebook', label: 'Facebook Ads', icon: Facebook, color: 'text-blue-400' },
  { path: '/connectors/google', label: 'Google Ads', icon: BarChart3, color: 'text-amber-400' },
  { path: '/connectors', label: 'Manage Connectors', icon: Link, color: 'text-slate-300' },
]

export function RootLayout() {
  const location = useLocation()
  const [dataHubOpen, setDataHubOpen] = useState(false)
  const role =
    apiClient.getStoredUser()?.role ??
    (typeof window !== 'undefined' ? window.localStorage.getItem('userRole') : null)
  const isAdmin = role === 'admin'
  const filteredNavItems = sidebarRouteConfigs.filter((item) => !item.adminOnly || isAdmin)

  const isDataHubActive = dataHubItems.some((item) => location.pathname === item.path)

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <Cpu className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                NeuroSight
              </h1>
              <p className="text-xs text-slate-400">ML Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {/* Regular nav items (excluding connectors which is in Data Hub) */}
            {filteredNavItems
              .filter((item) => item.path !== 'connectors')
              .map((item) => {
                const Icon = item.icon
                const itemPath = `/${item.path}`
                const isActive = location.pathname === itemPath

                return (
                  <li key={itemPath}>
                    <Link
                      to={itemPath}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                )
              })}

            {/* Data Hub Dropdown */}
            <li className="mt-2">
              <button
                onClick={() => setDataHubOpen(!dataHubOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                  isDataHubActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5" />
                  <span className="font-medium">Data Hub</span>
                </div>
                {dataHubOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Dropdown items */}
              {dataHubOpen && (
                <ul className="mt-1 ml-4 pl-4 border-l border-slate-800 space-y-1">
                  {dataHubItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${item.color}`} />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-600">
            <p>v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Right Side */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="capitalize">{location.pathname.split('/').pop() || 'dashboard'}</span>
          </div>
          <div className="flex items-center gap-4">
            <ProfileDropdown />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
