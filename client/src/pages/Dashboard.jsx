import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { TrendingUp, Users, ShieldCheck, Plus, Minus, Search, Zap } from 'lucide-react'
import { fetchDashboardOverview, fetchShipments, createRiskSocket } from '../lib/api'

export default function Dashboard() {
  const [overview, setOverview] = useState(null)
  const [shipments, setShipments] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchDashboardOverview().then((d) => d && setOverview(d))
    fetchShipments().then((s) => s && setShipments(s))
  }, [])

  useEffect(() => {
    const ws = createRiskSocket((data) => {
      setShipments(prev => prev.map(s =>
        s.id === data.shipment_id
          ? { ...s, risk: data.risk_score, uncertainty: data.uncertainty }
          : s
      ))
    })
    return () => ws.close()
  }, [])

  const filteredShipments = shipments.filter((s) => {
    if (filter === 'all') return true
    if (filter === 'critical') return (s.risk ?? 0) >= 0.8
    if (filter === 'monitor') return (s.risk ?? 0) >= 0.5 && (s.risk ?? 0) < 0.8
    return true
  })

  const totalSavings = overview?.total_sla_savings ?? 420000
  const activeHighRisk = overview?.active_high_risk ?? (shipments.filter((s) => (s.risk ?? 0) >= 0.6).length || 0)
  const carrierReliability = overview?.carrier_reliability ?? 78
  const interventionsToday = overview?.interventions_today ?? 14

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* TOP SECTION — Hero + Metrics */}
      <div className="grid grid-cols-12 gap-6">
        {/* Hero Card */}
        <div className="col-span-12 lg:col-span-7 glass-card rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[340px]">
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Total SLA Savings</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-white tracking-tight">
                    ₹{totalSavings.toLocaleString('en-IN')}
                  </span>
                  <span className="text-dash-green text-sm font-bold flex items-center">+12.4%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Yearly Avg: ₹3,15,200.00</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <TrendingUp className="w-6 h-6 text-dash-accent" />
              </div>
            </div>
            <div className="mt-12 max-w-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-dash-accent animate-pulse" />
                <p className="text-xs font-bold text-dash-accent uppercase tracking-widest">Gemini AI Active</p>
              </div>
              <p className="text-lg text-white font-medium leading-tight">
                Analyzing {activeHighRisk} high-risk shipments across 5 global datasets for intervention.
              </p>
            </div>
          </div>
          {/* Abstract visual */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-50 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hero-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path d="M50 300 L150 100 L250 250 L350 50" fill="none" stroke="url(#hero-g1)" strokeWidth="20" strokeLinecap="round" opacity="0.4" />
              <path d="M30 320 L130 120 L230 270 L330 70" fill="none" stroke="url(#hero-g1)" strokeWidth="10" strokeLinecap="round" opacity="0.2" />
            </svg>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-6">
          {/* Active High-Risk */}
          <div className="glass-card rounded-2xl p-6 border-l-4 border-dash-accent">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-4">Active High-Risk</p>
            <h4 className="text-4xl font-bold text-white">{activeHighRisk}</h4>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-[10px] text-gray-400">Critical: {Math.round(activeHighRisk * 0.04)}</div>
              <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-dash-accent w-2/3" />
              </div>
            </div>
          </div>

          {/* Carrier Reliability */}
          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-4">Carrier Reliability</p>
            <div className="flex items-center gap-3">
              <h4 className="text-4xl font-bold text-white">{carrierReliability}%</h4>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-dash-card bg-blue-400" />
                <div className="w-6 h-6 rounded-full border-2 border-dash-card bg-teal-400" />
                <div className="w-6 h-6 rounded-full border-2 border-dash-card bg-gray-600 flex items-center justify-center text-[8px]">+4</div>
              </div>
            </div>
            <p className="text-[10px] text-dash-green mt-4 font-bold flex items-center gap-1">
              <Plus className="w-2 h-2" /> Top performance
            </p>
          </div>

          {/* Interventions Today */}
          <div className="col-span-2 glass-card rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Interventions Today</p>
              <div className="flex items-center gap-3">
                <h4 className="text-4xl font-bold text-white">{interventionsToday}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] bg-dash-green/20 text-dash-green font-bold">SUCCESS</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 border border-dash-border rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer text-xl text-gray-400">
                <Plus className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 border border-dash-border rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer text-xl text-gray-400">
                <Minus className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION — Exposure + Table */}
      <div className="grid grid-cols-12 gap-6">
        {/* Demurrage & Penalty Exposure */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-semibold text-white">Demurrage &amp; Penalty Exposure</h3>
            <button className="p-1 hover:bg-white/5 rounded-md text-gray-500">•••</button>
          </div>
          <div className="mb-8">
            <p className="text-2xl font-bold text-white">
              ₹1,250,000 <span className="text-xs font-normal text-dash-risk ml-1">at risk</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-dash-risk/10 text-dash-risk text-[10px] font-bold">+8% increase</span>
              <span className="text-[10px] text-gray-500">vs yesterday</span>
            </div>
          </div>
          <div className="space-y-6 flex-1">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Regional Risk Breakdown</p>
              <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
                <div className="bg-dash-accent w-[40%]" />
                <div className="bg-indigo-500 w-[35%]" />
                <div className="bg-gray-600 w-[25%]" />
              </div>
              <div className="grid grid-cols-2 gap-y-3 mt-4">
                {[
                  { color: 'bg-dash-accent', label: 'India Hubs (40%)' },
                  { color: 'bg-indigo-500', label: 'Euro Ports (35%)' },
                  { color: 'bg-gray-600', label: 'USA (25%)' },
                  { color: 'bg-emerald-400', label: 'Others (0%)' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-[11px]">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-gray-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-dash-accent/5 border border-dash-accent/10 rounded-xl mt-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-dash-accent">System Insights</p>
                <Zap className="w-3 h-3 text-dash-accent" />
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                70% Care, 20% Preventive measures applied. Redirecting NHAVA SHEVA cargo to reduce wait time.
              </p>
            </div>
          </div>
        </div>

        {/* Shipments Alerts Table */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-3xl flex flex-col min-h-[500px]">
          {/* Table Header */}
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search health metrics..."
                className="w-full bg-white/5 border-none text-xs rounded-lg pl-10 pr-4 py-2 text-gray-200 placeholder:text-gray-600 focus:ring-1 focus:ring-dash-accent outline-none transition-all"
              />
            </div>
            <div className="flex bg-white/5 p-1 rounded-lg">
              {['all', 'critical', 'monitor'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    filter === f
                      ? 'bg-dash-accent text-black shadow-lg shadow-dash-accent/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All Alerts' : f === 'critical' ? 'Critical' : 'Monitor'}
                </button>
              ))}
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 text-[11px] font-bold uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-4">Shipment ID</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Risk Score</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredShipments.slice(0, 8).map((s) => {
                  const risk = Math.round((s.risk ?? 0) * 100)
                  const origin = (s.origin ?? '').slice(0, 3).toUpperCase()
                  const dest = (s.destination ?? '').slice(0, 3).toUpperCase()
                  let riskColor = 'text-dash-green'
                  let statusLabel = 'Stable'
                  let statusClass = 'bg-dash-green/10 text-dash-green'
                  if (risk >= 80) {
                    riskColor = 'text-dash-risk'
                    statusLabel = 'Intervene'
                    statusClass = 'bg-dash-accent/20 text-dash-accent border border-dash-accent/30'
                  } else if (risk >= 50) {
                    riskColor = 'text-orange-400'
                    statusLabel = 'Monitoring'
                    statusClass = 'bg-white/10 text-white'
                  }
                  return (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/shipments/${s.id}`}>
                      <td className="px-6 py-4 font-medium text-white">{s.id}</td>
                      <td className="px-6 py-4 text-gray-400">{origin} → {dest}</td>
                      <td className={`px-6 py-4 font-bold ${riskColor}`}>{risk}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filteredShipments.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-sm">
                      No shipments found. Start the backend server to load data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-[11px] text-gray-500 italic">Auto-refreshing in 42s</p>
            <div className="flex gap-1">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  className={`w-8 h-8 rounded border border-white/5 flex items-center justify-center hover:bg-white/5 text-xs ${
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
    </div>
  )
}
