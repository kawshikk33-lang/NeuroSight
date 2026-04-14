import { Settings, LogOut, Shield, ChevronDown, Mail } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

import { apiClient } from '../../services/api/client'

export function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  const user = apiClient.getStoredUser()
  const email = user?.email ?? ''
  const name = user?.full_name ?? email.split('@')[0] ?? 'User'
  const role = user?.role ?? 'viewer'
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleLogout = () => {
    apiClient.clearTokens()
    localStorage.removeItem('userRole')
    localStorage.removeItem('isAdmin')
    navigate('/auth', { replace: true })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-slate-950">
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-slate-200 leading-tight">{name}</p>
          <p className="text-xs text-slate-500 leading-tight">{role}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          {/* Profile Header */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-lg font-bold text-slate-950">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">{name}</p>
                <div className="flex items-center gap-1 text-slate-400">
                  <Mail className="w-3 h-3" />
                  <p className="text-xs truncate">{email}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  role === 'admin'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                <Shield className="w-3 h-3 inline mr-1" />
                {role}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => {
                setOpen(false)
                navigate('/settings')
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>

            <div className="my-1 border-t border-slate-800" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
