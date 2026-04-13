import { Cpu, LogOut } from 'lucide-react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router'

import { sidebarRouteConfigs } from '../../config/appRoutes'
import { apiClient } from '../../services/api/client'

export function RootLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const role =
    apiClient.getStoredUser()?.role ??
    (typeof window !== 'undefined' ? window.localStorage.getItem('userRole') : null)
  const isAdmin = role === 'admin'
  const filteredNavItems = sidebarRouteConfigs.filter((item) => !item.adminOnly || isAdmin)

  const handleLogout = () => {
    apiClient.clearTokens()
    localStorage.removeItem('userRole')
    localStorage.removeItem('isAdmin')
    navigate('/auth', { replace: true })
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
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
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Logout</span>
          </button>
          <div className="text-xs text-slate-500">
            <p>v1.0.0</p>
            <p className="mt-1">© 2026 NeuroSight</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
