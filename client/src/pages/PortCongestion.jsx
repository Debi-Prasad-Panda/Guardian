import { useState, useEffect } from 'react'
import { Calendar, Search, Bell, SlidersHorizontal } from 'lucide-react'
import { fetchPorts, fetchPortKpis } from '../lib/api'

const DEFAULT_PORTS = [
  { name: 'Mumbai Port', code: 'IN', congestion_index: 8.2, avg_wait_days: 12, demurrage_risk: 480000, status: 'Critical', trend: '+12%' },
  { name: 'Singapore', code: 'SG', congestion_index: 4.1, avg_wait_days: 3, demurrage_risk: 120500, status: 'Optimal', trend: '-4%' },
  { name: 'Rotterdam', code: 'NL', congestion_index: 5.5, avg_wait_days: 6, demurrage_risk: 245000, status: 'Moderate', trend: '+2%' },
  { name: 'Los Angeles', code: 'US', congestion_index: 7.8, avg_wait_days: 10, demurrage_risk: 910000, status: 'Critical', trend: '+8%' },
]

const TREND_CARDS = [
  {
    name: 'Mumbai Port',
    index: 8.2,
    change: '+12%',
    changeColor: 'text-dash-green',
    indexColor: 'text-dash-accent',
    path: 'M0 35 Q10 32, 20 38 T40 25 T60 30 T80 15 T100 5',
    strokeColor: '#00f2ff',
    hasFill: true,
  },
  {
    name: 'Singapore',
    index: 4.1,
    change: '-4%',
    changeColor: 'text-dash-risk',
    indexColor: 'text-gray-400',
    path: 'M0 10 Q20 15, 40 12 T70 20 T100 25',
    strokeColor: '#2a2e37',
    hasFill: false,
  },
  {
    name: 'Rotterdam',
    index: 5.5,
    change: '+2%',
    changeColor: 'text-dash-green',
    indexColor: 'text-gray-400',
    path: 'M0 25 Q25 20, 50 25 T75 15 T100 18',
    strokeColor: '#2a2e37',
    hasFill: false,
  },
]

export default function PortCongestion() {
  const [ports, setPorts] = useState(DEFAULT_PORTS)
  const [kpis, setKpis] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchPorts().then((p) => {
      if (p && p.length > 0) setPorts(p)
    })
    fetchPortKpis().then((k) => k && setKpis(k))
  }, [])

  const globalAvg = kpis?.global_avg_index ?? 6.4
  const highRiskPorts = kpis?.high_risk_ports ?? 12
  const avgWaitTime = kpis?.avg_wait_time ?? 8.4
  const totalDemurrage = kpis?.potential_demurrage ?? 2450000

  const statusConfig = {
    Critical: { bg: 'bg-dash-risk/5', text: 'text-dash-risk/80', border: 'border-dash-risk/20' },
    Optimal: { bg: 'bg-dash-green/5', text: 'text-dash-green/80', border: 'border-dash-green/20' },
    Moderate: { bg: 'bg-yellow-500/5', text: 'text-yellow-500/80', border: 'border-yellow-500/20' },
  }

  const filteredPorts = filter === 'all'
    ? ports
    : ports.filter((p) => (p.status ?? '').toLowerCase() === 'critical')

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Port Congestion Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time maritime bottleneck analysis and demurrage risk forecasting</p>
        </div>
        <div className="flex gap-3">
          <div className="glass-card px-4 py-2 rounded-xl border border-dash-accent/10 flex items-center gap-3">
            <div className="p-2 bg-dash-accent/10 rounded-lg text-dash-accent">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Last Refresh</p>
              <p className="text-sm font-bold text-white">2 mins ago</p>
            </div>
          </div>
          <button className="bg-dash-accent text-black px-6 py-2 rounded-xl font-bold text-sm shadow-[0_4px_20px_rgba(0,242,255,0.2)] hover:scale-105 transition-transform">
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard label="Global Avg Index" value={`${globalAvg}`} suffix="/10" change="+1.2%" changeColor="text-dash-green" />
        <KpiCard label="High Risk Ports" value={`${highRiskPorts}`} change="+2" changeColor="text-dash-accent" />
        <KpiCard label="Avg Wait Time" value={`${avgWaitTime}`} suffix="Days" change="-0.5%" changeColor="text-dash-risk" />
        <KpiCard label="Potential Demurrage" value={`₹${(totalDemurrage / 1000000).toFixed(2)}M`} change="-2.1%" changeColor="text-dash-risk" accent />
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {TREND_CARDS.map((tc) => (
          <div key={tc.name} className="glass-card p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="font-bold text-white">{tc.name}</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">30D Congestion Trend</p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black tracking-tight ${tc.indexColor}`}>{tc.index}</p>
                <p className={`text-[10px] font-bold ${tc.changeColor}`}>{tc.change}</p>
              </div>
            </div>
            <div className="h-24 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                {tc.hasFill && (
                  <>
                    <defs>
                      <linearGradient id={`grad-${tc.name}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#00f2ff', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#00f2ff', stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                    <path d={`${tc.path} V40 H0 Z`} fill={`url(#grad-${tc.name})`} opacity="0.1" />
                  </>
                )}
                <path
                  d={tc.path}
                  fill="none"
                  stroke={tc.strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Port Rankings Table */}
      <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h4 className="text-lg font-bold text-white italic uppercase tracking-tight">
            Global Port Congestion Rankings
          </h4>
          <div className="flex bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === 'all' ? 'bg-dash-accent text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              All Ports
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === 'critical' ? 'bg-dash-accent text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              High Risk
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase font-bold tracking-widest text-gray-500">
              <tr>
                <th className="px-8 py-4">Port Name</th>
                <th className="px-6 py-4">Congestion Index</th>
                <th className="px-6 py-4">Avg Wait Time</th>
                <th className="px-6 py-4">Demurrage Risk Cost</th>
                <th className="px-6 py-4">Health Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredPorts.map((port) => {
                const ci = port.congestion_index ?? 0
                const barWidth = `${(ci / 10) * 100}%`
                const status = port.status ?? 'Moderate'
                const sc = statusConfig[status] ?? statusConfig.Moderate
                const isHighRisk = ci >= 7
                return (
                  <tr key={port.name} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px] text-gray-400">
                          {port.code ?? port.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-white/90">{port.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className={`font-black w-8 ${isHighRisk ? 'text-dash-accent' : 'text-gray-400'}`}>{ci}</span>
                        <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHighRisk
                                ? 'bg-dash-accent shadow-[0_0_8px_rgba(0,242,255,0.4)]'
                                : ci >= 5
                                ? 'bg-yellow-500/40'
                                : 'bg-white/20'
                            }`}
                            style={{ width: barWidth }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-400">{port.avg_wait_days ?? 0} Days</td>
                    <td className="px-6 py-5 font-bold text-white/80">
                      ₹{(port.demurrage_risk ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase ${sc.bg} ${sc.text} ${sc.border}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-dash-accent hover:underline text-xs font-bold uppercase tracking-wider">
                        Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-[11px] text-gray-600 italic ml-4">Auto-refreshing in 42s</p>
          <div className="flex gap-1 mr-4">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={`w-8 h-8 rounded border border-white/10 flex items-center justify-center hover:bg-white/5 text-xs ${
                  n === 1 ? 'font-bold text-dash-accent bg-dash-accent/10' : 'text-gray-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, suffix, change, changeColor, accent }) {
  return (
    <div className={`glass-card p-6 rounded-2xl relative overflow-hidden ${accent ? 'border-l-2 border-l-dash-accent' : ''}`}>
      {!accent && <div className="absolute top-0 right-0 w-12 h-12 bg-dash-accent/5 rounded-bl-full" />}
      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2 mt-3">
        <h3 className="text-3xl font-black text-white">
          {value}
          {suffix && <span className="text-sm text-gray-600 font-medium">{suffix}</span>}
        </h3>
        <span className={`text-xs font-bold ${changeColor}`}>{change}</span>
      </div>
    </div>
  )
}
