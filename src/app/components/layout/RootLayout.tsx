import { Cpu } from 'lucide-react'
import { Outlet, Link, useLocation } from 'react-router'

import { sidebarRouteConfigs } from '../../config/appRoutes'
import { apiClient } from '../../services/api/client'
import { ProfileDropdown } from '../shared/ProfileDropdown'

export function RootLayout() {
  const location = useLocation()
  const role =
    apiClient.getStoredUser()?.role ??
    (typeof window !== 'undefined' ? window.localStorage.getItem('userRole') : null)
  const isAdmin = role === 'admin'
  const filteredNavItems = sidebarRouteConfigs.filter((item) => !item.adminOnly || isAdmin)

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
            {filteredNavItems.map((item) => {
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
            <span className="capitalize">{location.pathname.split('/')[1] || 'dashboard'}</span>
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
