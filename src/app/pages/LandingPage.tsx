import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Cpu, Headphones, Layers, Menu, TrendingUp, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { Marquee } from '../components/ui/Marquee'
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
}

/* ── Feature Tag Cloud ─────────────────────────────────────── */

const FEATURE_TAGS = [
  { emoji: '📊', label: 'Sales Forecasting' },
  { emoji: '📈', label: 'Revenue Analytics' },
  { emoji: '👥', label: 'RFMQ Segmentation' },
  { emoji: '⭐', label: 'Customer Scoring' },
  { emoji: '🗄️', label: 'Database Connector' },
  { emoji: '🔔', label: 'Smart Alerts' },
  { emoji: '🎯', label: 'Google Ads' },
  { emoji: '📱', label: 'Facebook Ads' },
  { emoji: '🧠', label: 'ML Models' },
  { emoji: '📉', label: 'Churn Analysis' },
  { emoji: '🔄', label: 'Data Sync' },
]

/* ── Landing Page ──────────────────────────────────────────── */

export function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#121212] font-sans selection:bg-teal-500 selection:text-white pb-20">
      {/* --- HERO SECTION --- */}
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-[#cffafe] via-[#a7f3d0] to-[#6ee7b7] rounded-b-[3rem] md:rounded-b-[5rem] relative overflow-hidden px-4 pt-8 pb-40 md:pb-[22rem] w-full shadow-2xl"
        >
          {/* Navbar */}
          <motion.nav
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-5xl mx-auto bg-[#121212] text-white rounded-full px-6 py-3 flex items-center justify-between mb-16 shadow-2xl relative z-30"
          >
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-[#121212] rounded-full" />
              </div>
              NeuroSight
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
              <a href="#" className="hover:text-white transition">
                Home
              </a>
              <a href="#" className="hover:text-white transition">
                Product
              </a>
              <a href="#" className="hover:text-white transition">
                Solutions
              </a>
              <a href="#" className="hover:text-white transition">
                Pricing
              </a>
              <a href="#" className="hover:text-white transition">
                About
              </a>
              <a href="#" className="hover:text-white transition">
                Contact
              </a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/admin/portal"
                className="text-white border border-white/20 px-6 py-2 rounded-full text-sm font-bold hover:bg-white/10 hover:border-white/40 transition shadow-sm"
              >
                Admin
              </Link>
              <Link
                to="/auth"
                className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition shadow-sm"
              >
                Login
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-white/80 hover:text-white focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </motion.nav>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-24 left-4 right-4 bg-[#121212] rounded-3xl shadow-2xl z-40 p-6 md:hidden border border-white/10"
              >
                <div className="flex flex-col gap-6 text-center font-medium text-white/80">
                  <a href="#" className="hover:text-white transition">
                    Home
                  </a>
                  <a href="#" className="hover:text-white transition">
                    Product
                  </a>
                  <a href="#" className="hover:text-white transition">
                    Solutions
                  </a>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                  <Link
                    to="/admin/portal"
                    className="border border-white/20 text-white px-6 py-3 rounded-full font-bold mx-auto w-full shadow-sm hover:bg-white/10 hover:border-white/40 transition"
                  >
                    Admin Access
                  </Link>
                  <Link
                    to="/auth"
                    className="bg-white text-black px-6 py-3 rounded-full font-bold mx-auto w-full shadow-lg"
                  >
                    Login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero Content — Centered */}
          <div className="max-w-6xl mx-auto relative z-20 mt-10 md:mt-20">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="text-center w-full px-4"
            >
              <motion.div
                variants={fadeInUp}
                className="inline-block bg-white/40 backdrop-blur-md px-5 py-1.5 rounded-full text-xs font-bold tracking-widest text-[#121212]/80 mb-6 border border-white/50 shadow-sm uppercase"
              >
                AI POWERED SALES ANALYTICS
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-[5.5rem] font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-8 whitespace-nowrap"
              >
                Transform Your Sales Data <br className="hidden md:block" /> Into Actionable
                Insights
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-slate-700 text-lg md:text-2xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed"
              >
                Unlock the full potential of your business data with AI-driven forecasting, customer
                segmentation, and intelligent analytics.
              </motion.p>
              <motion.div variants={fadeInUp}>
                <Link
                  to="/auth"
                  className="inline-block bg-[#121212] text-white px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition shadow-2xl"
                >
                  Get Started
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Background Decorative Rings */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-200/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        </motion.div>
      </div>

      {/* --- FLOATING DASHBOARD CARDS --- */}
      <div className="max-w-[1300px] mx-auto px-6 relative z-30 -mt-24 md:-mt-64 mb-32">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col md:flex-row items-end justify-center gap-6"
        >
          {/* Card 1 (Left) */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -10 }}
            className="w-full md:w-80 bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 z-10 md:translate-x-12 md:-translate-y-6"
          >
            <h3 className="text-slate-500 font-medium text-sm mb-6">Total Sales This Month</h3>
            <div className="flex items-end gap-12 mb-8">
              <div>
                <p className="text-3xl font-extrabold text-teal-400">10.4K</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Orders</p>
                <p className="text-xl font-bold text-slate-800">700</p>
              </div>
            </div>
            <div className="h-20 bg-slate-50 rounded-xl relative overflow-hidden border border-slate-100/50">
              {/* Mock Chart Area */}
              <div className="absolute bottom-0 left-0 w-1/3 h-[40%] bg-blue-100 rounded-tr w-full border-t border-r border-blue-300" />
              <div className="absolute bottom-0 left-1/3 w-1/3 h-[60%] bg-blue-100 rounded-tl rounded-tr border border-blue-300" />
              <div className="absolute bottom-0 right-0 w-1/3 h-[85%] bg-teal-100 rounded-tl border-t border-l border-teal-300" />
            </div>
          </motion.div>

          {/* Card 2 (Center - Main) */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -10 }}
            className="w-full md:w-[26rem] bg-white rounded-[2rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-slate-50 z-30"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-800 font-bold text-lg">Total Sales</h3>
              <button className="text-xs font-semibold text-slate-400 hover:text-slate-800 transition">
                View Report
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-1">Balance</p>
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
              <p className="text-5xl font-extrabold text-teal-400">$43.4K</p>
              <div className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <ArrowUpRight size={12} strokeWidth={3} /> 10%
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">Online Store</p>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-bold text-teal-400">$20.00</p>
                  <div className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-14 justify-center">
                    <ArrowUpRight size={12} strokeWidth={3} /> 10%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">Retail</p>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-bold text-teal-400">$23.00</p>
                  <div className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-14 justify-center">
                    <ArrowUpRight size={12} strokeWidth={3} /> 8%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3 (Right) */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -10 }}
            className="w-full md:w-80 bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 z-10 md:-translate-x-12 md:-translate-y-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-800 font-bold">Revenue Overview</h3>
              <button className="text-xs font-semibold text-slate-400 hover:text-slate-800 transition">
                View Report
              </button>
            </div>

            <div className="flex items-center justify-between mb-8">
              <p className="text-4xl font-extrabold text-teal-400">$18K</p>
              <div className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <ArrowUpRight size={12} strokeWidth={3} /> 12%
              </div>
            </div>

            <div className="h-24 flex items-end justify-between gap-[2px] px-1 pb-1">
              {[30, 45, 30, 70, 50, 90, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-full bg-blue-50 rounded-sm relative overflow-hidden"
                  style={{ height: `${h}%` }}
                >
                  <div
                    className="absolute bottom-0 w-full bg-teal-400 rounded-sm"
                    style={{ height: i === 5 ? '100%' : '30%' }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* --- CSS Animations for Orbits --- */}
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes counter-orbit {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .orbit-spin-inner { animation: orbit 25s linear infinite; }
        .counter-orbit-inner { animation: counter-orbit 25s linear infinite; }
        
        .orbit-spin-middle { animation: orbit 35s linear infinite reverse; } /* Reverse direction */
        .counter-orbit-middle { animation: counter-orbit 35s linear infinite reverse; }
        
        .orbit-spin-outer { animation: orbit 45s linear infinite; }
        .counter-orbit-outer { animation: counter-orbit 45s linear infinite; }
      `}</style>

      {/* --- FEATURES BENTO SECTION --- */}
      <div className="max-w-6xl mx-auto px-6 mb-32">
        <div className="text-center mb-16">
          <p className="text-teal-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">
            FEATURES
          </p>
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Empower Your Analytics with AI
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Ask your AI Agent for real-time collaboration, seamless integrations, and actionable
            insights to streamline your operations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Box: Animated Forecasting Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden flex flex-col justify-end min-h-[500px] shadow-2xl"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-radial-gradient from-teal-500/5 to-transparent pointer-events-none" />

            <div className="relative z-10 flex-1 flex flex-col">
              {/* Chart Container */}
              <div className="flex-1 flex items-end gap-2 md:gap-4 mb-10 mt-auto min-h-[250px]">
                {[30, 45, 60, 50, 75, 90, 110].map((height, i) => {
                  const isForecast = i >= 5
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                      <div className="w-full h-[250px] flex items-end relative">
                        <motion.div
                          initial={{ height: 0 }}
                          whileInView={{ height: `${height}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.1, type: 'spring', bounce: 0.2 }}
                          className={`w-full rounded-t-md transition-all duration-300
                            ${
                              isForecast
                                ? 'bg-gradient-to-t from-emerald-500/20 to-teal-400/40 border-t border-l border-r border-teal-400/50 border-dashed backdrop-blur-sm'
                                : 'bg-gradient-to-t from-teal-600 to-emerald-400 hover:brightness-110'
                            }`}
                        >
                          {/* Value Tooltip on Hover */}
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded shadow-lg transition-opacity pointer-events-none z-10">
                            ${Math.round(height * 1.2)}k
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-[10px] md:text-xs text-slate-500 mt-3 font-medium uppercase tracking-wider">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">AI-Powered Forecasting</h3>
                <p className="text-slate-400 text-sm">
                  Predict future revenue trends and catch anomalies before they happen using our
                  advanced machine learning models.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Box: Orbiting Features (Solar System) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: 0.2 }}
            className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden flex flex-col justify-end min-h-[500px] shadow-2xl"
          >
            {/* Orbit Container */}
            <div className="absolute inset-0 flex items-center justify-center -translate-y-8 pointer-events-none">
              {/* Center Logo */}
              <div className="absolute z-30 w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 p-[2px] shadow-[0_0_60px_rgba(20,184,166,0.3)]">
                <div className="w-full h-full bg-[#121212] rounded-full flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-teal-400" />
                </div>
              </div>

              {/* Inner Ring */}
              <div className="absolute w-[200px] h-[200px] rounded-full border border-white/5 orbit-spin-inner z-20">
                {[0, 1, 2, 3].map((i) => {
                  const tag = FEATURE_TAGS[i]
                  // Calculate fixed position on the circle border
                  const angle = i * 90 * (Math.PI / 180)
                  const radius = 100
                  const x = Math.cos(angle) * radius + radius
                  const y = Math.sin(angle) * radius + radius
                  return (
                    <div
                      key={tag.label}
                      className="absolute translate-x-[-50%] translate-y-[-50%] pointer-events-auto"
                      style={{ left: x, top: y }}
                    >
                      {/* Counter-rotation to keep pill upright */}
                      <div className="counter-orbit-inner bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/90 whitespace-nowrap shadow-lg shadow-black/20 hover:border-teal-500/50 hover:bg-white/10 transition-colors cursor-default">
                        <span className="mr-1.5">{tag.emoji}</span>
                        {tag.label}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Middle Ring */}
              <div className="absolute w-[320px] h-[320px] rounded-full border border-white/5 orbit-spin-middle z-10 hidden sm:block">
                {[4, 5, 6, 7].map((i) => {
                  const tag = FEATURE_TAGS[i]
                  const angle = (i * 90 + 45) * (Math.PI / 180) // Offset by 45deg
                  const radius = 160
                  const x = Math.cos(angle) * radius + radius
                  const y = Math.sin(angle) * radius + radius
                  return (
                    <div
                      key={tag.label}
                      className="absolute translate-x-[-50%] translate-y-[-50%] pointer-events-auto"
                      style={{ left: x, top: y }}
                    >
                      <div className="counter-orbit-middle bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/90 whitespace-nowrap shadow-lg hover:border-teal-500/50 hover:bg-white/10 transition-colors cursor-default">
                        <span className="mr-1.5">{tag.emoji}</span>
                        {tag.label}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Outer Ring */}
              <div className="absolute w-[460px] h-[460px] rounded-full border border-white/5 orbit-spin-outer z-0 hidden md:block">
                {[8, 9, 10].map((i, index) => {
                  const tag = FEATURE_TAGS[i]
                  const angle = (index * 120 + 15) * (Math.PI / 180)
                  const radius = 230
                  const x = Math.cos(angle) * radius + radius
                  const y = Math.sin(angle) * radius + radius
                  return (
                    <div
                      key={tag.label}
                      className="absolute translate-x-[-50%] translate-y-[-50%] pointer-events-auto"
                      style={{ left: x, top: y }}
                    >
                      <div className="counter-orbit-outer bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/90 whitespace-nowrap shadow-lg hover:border-teal-500/50 hover:bg-white/10 transition-colors cursor-default">
                        <span className="mr-1.5">{tag.emoji}</span>
                        {tag.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Progressive Blur / Fade Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/90 to-transparent pointer-events-none z-10" />

            {/* Text Content */}
            <div className="relative z-20 mt-auto pt-10">
              <h3 className="text-xl font-bold text-white mb-2">Seamless Integrations</h3>
              <p className="text-slate-400 text-sm">
                Unite your favorite tools for effortless connectivity. Boost productivity through
                interconnected AI workflows.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      {/* --- 6-CARD BENTO GRID --- */}
      <div className="max-w-7xl mx-auto px-6 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Smart Data Ingestion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative bg-[#0a0a0a] border border-white/5 hover:border-teal-500/20 rounded-[2rem] overflow-hidden flex flex-col transition-colors duration-500 min-h-[400px]"
          >
            {/* Visual Header */}
            <div className="relative h-[220px] w-full bg-gradient-to-b from-[#111] to-[#0a0a0a] p-6 flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
              {/* Background ambient glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] group-hover:bg-blue-500/30 transition-colors" />
              <img
                src="/assets/features/smart_uploads.png"
                alt="Smart Uploads"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity mix-blend-screen scale-110"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
            {/* Text Content */}
            <div className="p-8 mt-auto">
              <h3 className="text-xl font-medium text-white mb-3 tracking-wide">
                Smart data ingestion
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Import sales data instantly—sync from your CRM or bulk upload CSV files. No manual
                data entry work.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Automated Pipelines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group relative bg-[#0a0a0a] border border-white/5 hover:border-teal-500/20 rounded-[2rem] overflow-hidden flex flex-col transition-colors duration-500 min-h-[400px]"
          >
            <div className="relative h-[220px] w-full bg-gradient-to-b from-[#111] to-[#0a0a0a] p-6 flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-32 bg-purple-500/20 rounded-full blur-[60px] group-hover:bg-purple-500/30 transition-colors" />
              <img
                src="/assets/features/automated_pipelines.png"
                alt="Automated Pipelines"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity mix-blend-screen"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
            <div className="p-8 mt-auto">
              <h3 className="text-xl font-medium text-white mb-3 tracking-wide">
                Automated pipelines
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Create data processing policies. Customize ML workflows, configure training params,
                and automate analysis.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Instant Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="group relative bg-[#0a0a0a] border border-white/5 hover:border-emerald-500/20 rounded-[2rem] overflow-hidden flex flex-col transition-colors duration-500 min-h-[400px]"
          >
            <div className="relative h-[220px] w-full bg-gradient-to-b from-[#111] to-[#0a0a0a] p-6 flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-20 bg-emerald-500/20 rounded-full blur-[50px] group-hover:bg-emerald-500/40 transition-colors" />
              {/* CSS fallback since image failed to generate */}
              <div className="relative z-10 w-48 h-12 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-shadow cursor-pointer">
                <span className="text-emerald-400 font-medium text-sm tracking-widest relative z-10">
                  One click generation
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-20 bg-gradient-to-b from-emerald-500/50 to-transparent" />
                <div className="absolute top-full left-1/4 -translate-x-1/2 w-[1px] h-12 bg-gradient-to-b from-emerald-500/30 to-transparent" />
                <div className="absolute top-full right-1/4 translate-x-1/2 w-[1px] h-16 bg-gradient-to-b from-emerald-500/40 to-transparent" />
              </div>
            </div>
            <div className="p-8 mt-auto">
              <h3 className="text-xl font-medium text-white mb-3 tracking-wide">
                Instant bulk predictions
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Batch process hundreds of customer datasets, run RFMQ segmentation, and predict
                revenue in one click.
              </p>
            </div>
          </motion.div>

          {/* Card 4: Pattern Matching */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="group relative bg-[#0a0a0a] border border-white/5 hover:border-pink-500/20 rounded-[2rem] overflow-hidden flex flex-col transition-colors duration-500 min-h-[400px]"
          >
            <div className="relative h-[220px] w-full bg-gradient-to-b from-[#111] to-[#0a0a0a] p-6 flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 bg-pink-500/10 rounded-full blur-[60px] group-hover:bg-pink-500/20 transition-colors" />
              <img
                src="/assets/features/pattern_matching.png"
                alt="Two way matching"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity mix-blend-screen scale-110"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
            <div className="p-8 mt-auto">
              <h3 className="text-xl font-medium text-white mb-3 tracking-wide">
                Two-way pattern matching
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Match historical sales patterns with future trends instantly. Stay in sync, identify
                churn risks, and save time.
              </p>
            </div>
          </motion.div>

          {/* Card 5: Real-Time Sync */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="group relative bg-[#0a0a0a] border border-white/5 hover:border-amber-500/20 rounded-[2rem] overflow-hidden flex flex-col transition-colors duration-500 min-h-[400px]"
          >
            <div className="relative h-[220px] w-full bg-gradient-to-b from-[#111] to-[#0a0a0a] p-6 flex items-center justify-center overflow-hidden border-b border-white/5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] group-hover:bg-amber-500/20 transition-colors" />
              {/* CSS fallback Since image failed to generate */}
              <div className="relative z-10 w-24 h-24 rounded-full border border-amber-500/20 flex items-center justify-center font-bold text-3xl text-white group-hover:border-amber-500/40 transition-colors">
                <div className="absolute inset-0 border border-amber-500/10 rounded-full scale-150 animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-0 border border-amber-500/10 rounded-full scale-[2] animate-[spin_15s_linear_infinite_reverse]" />
                <span>N</span>
              </div>
            </div>
            <div className="p-8 mt-auto">
              <h3 className="text-xl font-medium text-white mb-3 tracking-wide">
                Real-time synchronization
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Push transaction logs to your central database automatically—no delays, no manual
                export work.
              </p>
            </div>
          </motion.div>

          {/* Card 6: Audit Logs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="group relative bg-[#0a0a0a] border border-white/5 hover:border-red-500/20 rounded-[2rem] overflow-hidden flex flex-col transition-colors duration-500 min-h-[400px]"
          >
            <div className="relative h-[220px] w-full bg-gradient-to-b from-[#111] to-[#0a0a0a] p-6 flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 bg-red-500/10 rounded-full blur-[60px] group-hover:bg-red-500/20 transition-colors" />
              <img
                src="/assets/features/audit_logs.png"
                alt="Audit logs"
                className="w-[120%] h-[120%] object-cover opacity-90 group-hover:opacity-100 transition-opacity mix-blend-screen scale-[1.3]"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
            <div className="p-8 mt-auto">
              <h3 className="text-xl font-medium text-white mb-3 tracking-wide">
                Audit-ready compliance
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Track every data mutation and user action. Full visibility, audit-ready logs
                frameworks automatically managed.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- MARQUEE CUSTOMER REVIEWS --- */}
      <div className="mb-32 relative py-12 border-y border-white/5 bg-[#0a0a0a]">
        <div className="text-center mb-10">
          <p className="text-teal-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">
            TESTIMONIALS
          </p>
          <h2 className="text-3xl font-extrabold text-white">Trusted by Data-Driven Teams</h2>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Marquee pauseOnHover className="[--marquee-duration:35s] mb-4">
            {[
              {
                name: 'Sarah Chen',
                username: '@sarahchen',
                body: "NeuroSight's RFMQ segmentation transformed our marketing. We saw a 40% increase in customer retention.",
                img: 'https://avatar.vercel.sh/sarahchen',
              },
              {
                name: 'Marcus Rivera',
                username: '@mrivera',
                body: 'The forecasting accuracy is incredible. Our inventory planning has never been this precise.',
                img: 'https://avatar.vercel.sh/mrivera',
              },
              {
                name: 'Aisha Patel',
                username: '@aishap',
                body: 'Connecting our database took 2 minutes. The auto-analysis feature saved us weeks of manual work.',
                img: 'https://avatar.vercel.sh/aishap',
              },
              {
                name: 'David Kim',
                username: '@dkim',
                body: 'Smart Alerts caught a revenue anomaly that would have cost us $50K. Game changer.',
                img: 'https://avatar.vercel.sh/dkim',
              },
            ].map((review) => (
              <figure
                key={review.username}
                className="relative w-80 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <div className="flex flex-row items-center gap-3">
                  <img className="rounded-full" width="40" height="40" alt="" src={review.img} />
                  <div className="flex flex-col">
                    <figcaption className="text-sm font-bold text-white">{review.name}</figcaption>
                    <p className="text-xs font-medium text-white/50">{review.username}</p>
                  </div>
                </div>
                <blockquote className="mt-4 text-sm text-slate-300 leading-relaxed">
                  &quot;{review.body}&quot;
                </blockquote>
              </figure>
            ))}
          </Marquee>

          <Marquee reverse pauseOnHover className="[--marquee-duration:35s]">
            {[
              {
                name: 'Elena Volkov',
                username: '@elenav',
                body: 'The ML models page gives us full transparency into how predictions are made. Love it.',
                img: 'https://avatar.vercel.sh/elenav',
              },
              {
                name: 'Tom Bradley',
                username: '@tbradley',
                body: "Best analytics platform we've used. The dark UI is gorgeous and the insights are actionable.",
                img: 'https://avatar.vercel.sh/tbradley',
              },
              {
                name: 'Jessica Wei',
                username: '@jwei',
                body: 'Integrating Facebook Ads data directly saved our team endless CSV exports. So smooth.',
                img: 'https://avatar.vercel.sh/jwei',
              },
              {
                name: 'Michael Chang',
                username: '@mchang',
                body: 'The UI feels like the future. Fast, beautiful, and the customer scoring actually works.',
                img: 'https://avatar.vercel.sh/mchang',
              },
            ].map((review) => (
              <figure
                key={review.username}
                className="relative w-80 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <div className="flex flex-row items-center gap-3">
                  <img className="rounded-full" width="40" height="40" alt="" src={review.img} />
                  <div className="flex flex-col">
                    <figcaption className="text-sm font-bold text-white">{review.name}</figcaption>
                    <p className="text-xs font-medium text-white/50">{review.username}</p>
                  </div>
                </div>
                <blockquote className="mt-4 text-sm text-slate-300 leading-relaxed">
                  &quot;{review.body}&quot;
                </blockquote>
              </figure>
            ))}
          </Marquee>

          {/* Edge Fade Gradients */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent md:from-[#121212]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background to-transparent md:from-[#121212]" />
        </div>
      </div>

      {/* --- BENEFITS SECTION --- */}
      <div className="max-w-5xl mx-auto px-6 mb-32">
        <div className="text-center mb-16">
          <p className="text-teal-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">
            BENEFITS
          </p>
          <h2 className="text-4xl font-extrabold text-white">Business Applications</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-400/10 flex items-center justify-center text-teal-400 mb-6">
              <Headphones size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Customer Insights</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Analyze customer behavior and understand purchasing patterns.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-400/10 flex items-center justify-center text-teal-400 mb-6">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Product Metrics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track product performance and identify top-selling items.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-400/10 flex items-center justify-center text-teal-400 mb-6">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Campaign Optimization</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Improve marketing performance using data-driven insights.
            </p>
          </div>
        </div>
      </div>

      {/* --- SECOND CTA SECTION --- */}
      <div className="max-w-5xl mx-auto px-6 mb-24">
        <div className="bg-gradient-to-br from-emerald-100 to-[#a7f3d0] rounded-[2rem] p-12 md:p-16 text-center shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
              Discover How NeuroSight Can Grow Your Business
            </h2>
            <p className="text-slate-700 mb-10 max-w-xl mx-auto font-medium text-lg">
              Leverage AI forecasting and customer intelligence to make smarter, faster decisions.
            </p>
            <button className="bg-[#121212] text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition shadow-2xl">
              Get Demo
            </button>
          </div>
          {/* Subtle decorations inside CTA */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* --- FOOTER PREVIEW --- */}
      <footer className="text-center pb-8 border-t border-white/5 pt-12 max-w-6xl mx-auto px-6">
        <p className="text-slate-500 font-medium select-none hover:text-white transition cursor-pointer flex items-center justify-center gap-2">
          Discover More <ArrowUpRight size={16} />
        </p>
      </footer>
    </div>
  )
}
