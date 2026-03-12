import { useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Database, Download } from 'lucide-react'

export default function Analytics() {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Deep Analytics</h2>
          <p className="text-gray-500 mt-1">Cross-sectional analysis of supply chain operational performance</p>
        </div>
        <button className="px-5 py-2 glass-card rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-dash-accent/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-dash-accent" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">SLA Compliance</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-white">94.2%</h3>
            <span className="text-xs font-bold text-dash-green">+2.1% YoY</span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-dash-risk/10 flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5 text-dash-risk" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Demurrage Avoided</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-white">₹4.2M</h3>
            <span className="text-xs font-bold text-dash-green">+₹1.1M MTd</span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
            <Database className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Model Accuracy</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-white">89.4%</h3>
            <span className="text-xs font-bold text-purple-400">Stable</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card rounded-3xl p-8 min-h-[400px]">
          <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-6 border-b border-white/5 pb-4">Carrier Performance Breakdown</h3>
          <div className="space-y-6">
             {/* Chart placeholder with CSS bars */}
             {[
               { name: 'FedEx-2', val: 92, col: 'bg-dash-green' },
               { name: 'BlueDart', val: 78, col: 'bg-yellow-500' },
               { name: 'Delhivery', val: 85, col: 'bg-dash-accent' },
               { name: 'DHL-4', val: 62, col: 'bg-dash-risk' }
             ].map(carrier => (
               <div key={carrier.name}>
                 <div className="flex justify-between text-xs font-bold text-gray-300 mb-2 uppercase tracking-widest">
                   <span>{carrier.name}</span>
                   <span>{carrier.val}% SLA Hit Rate</span>
                 </div>
                 <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className={`h-full ${carrier.col}`} style={{ width: `${carrier.val}%`}} />
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 min-h-[400px]">
          <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-6 border-b border-white/5 pb-4">Demurrage Avoidance Trend</h3>
          <div className="flex items-end gap-2 h-64 mt-4 px-4 pb-4 border-b border-l border-white/10 relative">
             {/* Chart bars */}
             {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer relative">
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] font-bold px-2 py-1 rounded">
                     ₹{h * 10}k
                   </div>
                   <div className="w-full bg-dash-accent/40 rounded-t-sm group-hover:bg-dash-accent transition-colors" style={{ height: `${h}%` }}></div>
                </div>
             ))}
             <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] font-bold text-gray-500 uppercase">
               <span>Mon</span>
               <span>Tue</span>
               <span>Wed</span>
               <span>Thu</span>
               <span>Fri</span>
               <span>Sat</span>
               <span>Sun</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
