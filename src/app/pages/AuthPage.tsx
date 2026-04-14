import { motion } from 'framer-motion'
import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'

import { apiClient } from '../services/api/client'

export function AuthPage() {
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignup) {
        if (form.password !== form.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        await apiClient.signup(form.name, form.email, form.password)
      }
      const { me } = await apiClient.login(form.email, form.password)
      if (me.role === 'admin') {
        navigate('/admin/portal')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const visualPanelInner = (
    <div className="w-full h-full relative overflow-hidden z-0">
      <div className="h-full min-h-[360px] p-10 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#cffafe] via-[#a7f3d0] to-[#6ee7b7]">
        <div className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#121212]">
            <div className="w-2.5 h-2.5 bg-teal-400 rounded-full" />
          </div>
          NeuroSight
        </div>
        <div className="space-y-4 relative z-10">
          <p className="text-4xl font-extrabold leading-tight tracking-tight">You can easily</p>
          <p className="text-slate-800 max-w-sm font-medium leading-relaxed">
            Predict your future sales and understand customer behavior with AI-driven insights.
          </p>
        </div>

        {/* Decorative Rings */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      </div>
    </div>
  )

  const formPanelInner = (
    <div className="w-full h-full bg-[#121212] border-x border-white/5 p-8 lg:p-12 z-20">
      <form onSubmit={onSubmit} className="h-full flex flex-col justify-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          {isSignup ? 'Create your account' : 'Welcome Back'}
        </h1>
        <p className="text-gray-400 mb-8">
          {isSignup
            ? 'Start forecasting your business growth with NeuroSight AI.'
            : 'Forecast your sales with AI-powered insights. Analyze trends, predict growth, and make smarter business decisions with NeuroSight.'}
        </p>

        <div className="space-y-5">
          {isSignup && (
            <input
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-teal-400 outline-none transition shadow-inner"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          )}
          <input
            type="email"
            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-teal-400 outline-none transition shadow-inner"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <input
            type="password"
            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-teal-400 outline-none transition shadow-inner"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          {isSignup && (
            <input
              type="password"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-teal-400 outline-none transition shadow-inner"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              required
            />
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-8 bg-teal-400 text-slate-900 font-bold py-4 rounded-full shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:bg-teal-300 hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] hover:scale-[1.02] transition disabled:opacity-60"
        >
          {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
        </button>

        <p className="mt-8 text-sm text-slate-400 text-center">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-teal-400 font-bold hover:text-teal-300 transition ml-1"
          >
            {isSignup ? 'Login' : 'Sign up'}
          </button>
        </p>
      </form>
    </div>
  )

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0A0F1C] font-sans p-4 text-white relative overflow-hidden selection:bg-teal-500 selection:text-white">
      {/* 0. Background Glow wrapper for parallax depth */}
      <motion.div
        animate={{ x: isSignup ? '-5%' : '5%' }}
        transition={{ type: 'spring', stiffness: 100, damping: 40 }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        {/* 1. Animated Radial Glows (Cyan & Purple) */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none z-0"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none z-0"
        />
      </motion.div>

      {/* 2. Intelligent Perspective Neural Grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.25] mix-blend-screen"
        style={{
          maskImage: 'radial-gradient(ellipse at center, black 10%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 10%, transparent 80%)',
        }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="perspectiveGrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#22d3ee" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#perspectiveGrid)" />
          {/* Radial Rays from Center extending outwards */}
          <line x1="50%" y1="50%" x2="-50%" y2="-50%" stroke="#c084fc" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="150%" y2="-50%" stroke="#c084fc" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="-50%" y2="150%" stroke="#c084fc" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="150%" y2="150%" stroke="#c084fc" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="50%" y2="-100%" stroke="#22d3ee" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="50%" y2="200%" stroke="#22d3ee" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="-100%" y2="50%" stroke="#22d3ee" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="200%" y2="50%" stroke="#22d3ee" strokeWidth="1.5" />
        </svg>
      </div>

      {/* 3. High-End Minimal Noise Texture */}
      <div
        className="absolute inset-0 z-0 opacity-[0.25] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-[1050px] min-h-[600px] bg-transparent border border-white/5 rounded-[2rem] shadow-[0_0_80px_rgba(6,182,212,0.1),_0_40px_80px_rgba(0,0,0,0.6)] flex overflow-hidden relative z-10 perspective-[1200px]">
        <div
          className={`w-full flex flex-col lg:flex-row relative ${isSignup ? 'lg:flex-row-reverse' : ''}`}
        >
          {/* Visual/Mid Layer */}
          <motion.div
            layout
            initial={false}
            animate={{
              scale: isSignup ? [1, 0.98, 1] : [1, 0.98, 1],
              opacity: isSignup ? [1, 0.85, 1] : [1, 0.85, 1],
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 1 }}
            className="w-full lg:w-1/2 h-full z-10"
          >
            {visualPanelInner}
          </motion.div>

          {/* Form/Foreground Layer */}
          <motion.div
            layout
            initial={false}
            animate={{
              scale: 1,
              opacity: 1,
              boxShadow: isSignup ? '20px 0 60px rgba(0,0,0,0.8)' : '-20px 0 60px rgba(0,0,0,0.8)',
            }}
            transition={{ type: 'spring', stiffness: 250, damping: 23, mass: 1.1 }}
            className="w-full lg:w-1/2 h-full z-20"
          >
            {formPanelInner}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
