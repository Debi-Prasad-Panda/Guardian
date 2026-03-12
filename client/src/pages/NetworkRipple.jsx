import { useState, useEffect } from 'react'
import { Network, Activity, Filter, RefreshCw } from 'lucide-react'

// Mock Data for Ripple Graph
const RIPPLE_DATA = [
  { id: 1, origin: 'Mumbai', target: 'Transit Hub', risk: 85, delay: '+14h', type: 'critical' },
  { id: 2, origin: 'Transit Hub', target: 'Delhi', risk: 65, delay: '+8h', type: 'warning' },
  { id: 3, origin: 'Transit Hub', target: 'Ahmedabad', risk: 45, delay: '+4h', type: 'monitor' },
  { id: 4, origin: 'Mumbai', target: 'Chennai', risk: 25, delay: '+1h', type: 'safe' },
  { id: 5, origin: 'Chennai', target: 'Kolkata', risk: 15, delay: 'On time', type: 'safe' },
]

export default function NetworkRippleGraph() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading to show off the skeleton UI
    setTimeout(() => setLoading(false), 800)
  }, [])

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Network Ripple Graph</h2>
          <p className="text-gray-500 mt-1">Cascading delay impact visualization across your supply chain</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 glass-card rounded-xl text-sm font-bold text-gray-300 hover:text-white flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> Filter Connections
          </button>
          <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800) }} className="px-4 py-2 bg-dash-accent/10 border border-dash-accent/30 rounded-xl text-sm font-bold text-dash-accent hover:bg-dash-accent/20 flex items-center gap-2 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Recalculate Ripple
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 glass-card rounded-3xl p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-dash-accent border-t-transparent animate-spin" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Computing Matrix...</p>
            </div>
          ) : (
            <div className="w-full h-full absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 800 500">
                <defs>
                   <linearGradient id="line-grad-crit" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#f43f5e" />
                     <stop offset="100%" stopColor="#eab308" />
                   </linearGradient>
                </defs>
                {/* Lines */}
                <path d="M 200 250 Q 300 150 400 250" fill="none" stroke="url(#line-grad-crit)" strokeWidth="6" strokeDasharray="8 8" className="animate-pulse" />
                <path d="M 400 250 Q 500 150 600 200" fill="none" stroke="#eab308" strokeWidth="4" opacity="0.6"/>
                <path d="M 400 250 Q 500 350 600 300" fill="none" stroke="#10b981" strokeWidth="3" opacity="0.4"/>
                <path d="M 200 250 Q 300 350 400 380" fill="none" stroke="#10b981" strokeWidth="3" opacity="0.4"/>
                
                {/* Nodes */}
                <g transform="translate(200, 250)">
                  <circle r="30" fill="#16191f" stroke="#f43f5e" strokeWidth="4" className="glow-risk" />
                  <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">MUM</text>
                  <circle r="40" fill="none" stroke="#f43f5e" strokeWidth="1" className="animate-ping opacity-20" />
                </g>
                <g transform="translate(400, 250)">
                  <circle r="25" fill="#16191f" stroke="#eab308" strokeWidth="3" />
                  <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">HUB</text>
                </g>
                <g transform="translate(600, 200)">
                  <circle r="20" fill="#16191f" stroke="#eab308" strokeWidth="2" />
                  <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">DEL</text>
                </g>
                <g transform="translate(600, 300)">
                  <circle r="20" fill="#16191f" stroke="#10b981" strokeWidth="2" />
                  <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">AMD</text>
                </g>
                <g transform="translate(400, 380)">
                  <circle r="20" fill="#16191f" stroke="#10b981" strokeWidth="2" />
                  <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">CHN</text>
                </g>
              </svg>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl p-6 border-l-4 border-dash-risk">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-dash-risk" />
              <h3 className="text-white font-bold uppercase tracking-wider text-sm">Primary Disruption</h3>
            </div>
            <p className="text-3xl font-black text-white">Mumbai Port</p>
            <p className="text-xs text-dash-risk mt-1 font-bold">+18h estimated delay overhead</p>
            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
              Congestion node identified at Mumbai JNPT is propagating delays to 48 upstream shipments.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-6">Downstream Impact</h3>
            <div className="space-y-4">
              {RIPPLE_DATA.map((path) => (
                <div key={path.id} className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-200">{path.origin} → {path.target}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Risk Exposure: {path.risk}%</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                    path.type === 'critical' ? 'bg-dash-risk/20 text-dash-risk' :
                    path.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                    path.type === 'monitor' ? 'bg-dash-accent/20 text-dash-accent' :
                    'bg-dash-green/20 text-dash-green'
                  }`}>
                    {path.delay}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
