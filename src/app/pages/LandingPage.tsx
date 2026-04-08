import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Layers, TrendingUp, ArrowUpRight, Menu, X } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-5xl mx-auto bg-[#121212] text-white rounded-full px-6 py-3 flex items-center justify-between mb-16 shadow-2xl relative z-30"
          >
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-[#121212] rounded-full" />
              </div>
              NeuroSight
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
              <a href="#" className="hover:text-white transition">Home</a>
              <a href="#" className="hover:text-white transition">Product</a>
              <a href="#" className="hover:text-white transition">Solutions</a>
              <a href="#" className="hover:text-white transition">Pricing</a>
              <a href="#" className="hover:text-white transition">About</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              <Link to="/admin/portal" className="text-white border border-white/20 px-6 py-2 rounded-full text-sm font-bold hover:bg-white/10 hover:border-white/40 transition shadow-sm">
                Admin
              </Link>
              <Link to="/auth" className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition shadow-sm">
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
                  <a href="#" className="hover:text-white transition">Home</a>
                  <a href="#" className="hover:text-white transition">Product</a>
                  <a href="#" className="hover:text-white transition">Solutions</a>
                  <a href="#" className="hover:text-white transition">Pricing</a>
                  <a href="#" className="hover:text-white transition">About</a>
                  <a href="#" className="hover:text-white transition">Contact</a>
                  <Link to="/admin/portal" className="border border-white/20 text-white px-6 py-3 rounded-full font-bold mx-auto w-full shadow-sm hover:bg-white/10 hover:border-white/40 transition">
                    Admin Access
                  </Link>
                  <Link to="/auth" className="bg-white text-black px-6 py-3 rounded-full font-bold mx-auto w-full shadow-lg">
                    Login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero Content */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto text-center relative z-20 mt-10 md:mt-20"
          >
            <motion.div variants={fadeInUp} className="inline-block bg-white/40 backdrop-blur-md px-5 py-1.5 rounded-full text-xs font-bold tracking-widest text-[#121212]/80 mb-6 border border-white/50 shadow-sm uppercase">
              AI POWERED SALES ANALYTICS
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-[5rem] font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-8">
              Transform Your Sales Data <br className="hidden md:block" /> Into Actionable Insights
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-slate-700 text-lg md:text-2xl max-w-3xl mx-auto mb-10 font-medium leading-relaxed">
              Unlock the full potential of your business data with AI-driven forecasting, customer segmentation, and intelligent analytics.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link to="/auth" className="inline-block bg-[#121212] text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition shadow-2xl">
                Get Started
              </Link>
            </motion.div>
          </motion.div>

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
               <button className="text-xs font-semibold text-slate-400 hover:text-slate-800 transition">View Report</button>
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
               <button className="text-xs font-semibold text-slate-400 hover:text-slate-800 transition">View Report</button>
             </div>
             
             <div className="flex items-center justify-between mb-8">
               <p className="text-4xl font-extrabold text-teal-400">$18K</p>
               <div className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                 <ArrowUpRight size={12} strokeWidth={3} /> 12%
               </div>
             </div>
             
             <div className="h-24 flex items-end justify-between gap-[2px] px-1 pb-1">
               {[30, 45, 30, 70, 50, 90, 40].map((h, i) => (
                 <div key={i} className="w-full bg-blue-50 rounded-sm relative overflow-hidden" style={{ height: `${h}%` }}>
                   <div className="absolute bottom-0 w-full bg-teal-400 rounded-sm" style={{ height: i === 5 ? '100%' : '30%' }} />
                 </div>
               ))}
             </div>
          </motion.div>

        </motion.div>
      </div>

      {/* --- BENEFITS SECTION --- */}
      <div className="max-w-5xl mx-auto px-6 mb-32">
        <div className="text-center mb-16">
          <p className="text-teal-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">BENEFITS</p>
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
  );
}
