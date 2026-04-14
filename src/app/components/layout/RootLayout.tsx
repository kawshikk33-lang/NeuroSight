import { AnimatePresence, motion } from 'framer-motion'
import { Cpu, ChevronDown, ChevronRight, Database, Facebook, BarChart3, Link2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router'

import { sidebarRouteConfigs } from '../../config/appRoutes'
import { apiClient } from '../../services/api/client'
import { ProfileDropdown } from '../shared/ProfileDropdown'
import { SidebarDock } from '../shared/SidebarDock'

const dataHubItems = [
  { path: '/connectors/database', label: 'Database', icon: Database, color: 'text-emerald-400' },
  { path: '/connectors/facebook', label: 'Facebook Ads', icon: Facebook, color: 'text-blue-400' },
  { path: '/connectors/google', label: 'Google Ads', icon: BarChart3, color: 'text-amber-400' },
  { path: '/connectors', label: 'Manage Connectors', icon: Link2, color: 'text-slate-300' },
]

export function RootLayout() {
  const location = useLocation()
  const [dataHubOpen, setDataHubOpen] = useState(false)
  const dataHubBtnRef = useRef<HTMLButtonElement | null>(null)
  const [dataHubPopupPos, setDataHubPopupPos] = useState<{ left: number; top: number } | null>(null)
  const role =
    apiClient.getStoredUser()?.role ??
    (typeof window !== 'undefined' ? window.localStorage.getItem('userRole') : null)
  const isAdmin = role === 'admin'
  const filteredNavItems = sidebarRouteConfigs.filter((item) => !item.adminOnly || isAdmin)

  const isDataHubActive = dataHubItems.some((item) => location.pathname === item.path)

  useEffect(() => {
    if (!dataHubOpen) return

    const updatePos = () => {
      const el = dataHubBtnRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setDataHubPopupPos({
        left: rect.right + 12,
        top: Math.max(12, rect.top + rect.height / 2 - 12),
      })
    }

    const raf = requestAnimationFrame(updatePos)
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [dataHubOpen])

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 relative">
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <Cpu className="w-6 h-6 text-slate-950" />
            </div>
          </div>
        </div>

        {/* Navigation (Dock style) */}
        <nav className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <SidebarDock
            primaryItems={filteredNavItems
              .filter((item) => item.path !== 'connectors')
              .map((item) => ({
                path: `/${item.path}`,
                label: item.label,
                icon: item.icon,
              }))}
          />

          {/* Data Hub button (right under Models / dock) */}
          <div className="px-2 pb-4 mt-2">
            <button
              ref={dataHubBtnRef}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() =>
                setDataHubOpen((v) => {
                  const next = !v
                  if (!next) setDataHubPopupPos(null)
                  return next
                })
              }
              className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl transition-all border ${
                isDataHubActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'text-slate-300 bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
              aria-haspopup="menu"
              aria-expanded={dataHubOpen}
              aria-label="Data Hub"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5" />
              </div>
              {dataHubOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </nav>

        {/* Data Hub popup (items unchanged) */}
        <AnimatePresence>
          {dataHubOpen && (
            <>
              {/* click-outside backdrop */}
              <motion.button
                type="button"
                aria-label="Close Data Hub menu"
                className="fixed inset-0 z-40 cursor-default"
                onMouseDown={() => {
                  setDataHubOpen(false)
                  setDataHubPopupPos(null)
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                exit={{ opacity: 0 }}
                style={{ background: 'rgba(0,0,0,0.35)' }}
              />

              {/* popup panel (fixed so it's never clipped) */}
              {dataHubPopupPos && (
                <motion.div
                  className="fixed z-50 w-60 rounded-xl bg-slate-900 border border-slate-700 shadow-xl p-2"
                  style={{ left: dataHubPopupPos.left, top: dataHubPopupPos.top }}
                  initial={{ opacity: 0, x: -6, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  role="menu"
                >
                  <div className="px-2 py-2 text-xs font-medium text-slate-400">Data Hub</div>
                  <ul className="space-y-1">
                    {dataHubItems.map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.path
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={() => setDataHubOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                            role="menuitem"
                          >
                            <Icon className={`w-4 h-4 ${item.color}`} />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="text-[10px] text-slate-600 text-center">
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
