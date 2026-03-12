import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet'
import { Sliders, TrendingUp, AlertTriangle, Zap } from 'lucide-react'
import { fetchChaosPresets, injectChaos, triggerBatchDisruption } from '../lib/api'

const LOG_COLORS = {
  CRITICAL: 'text-red-400',
  WARNING:  'text-yellow-400',
  INFO:     'text-gray-300',
  AI:       'text-dash-accent',
  SYSTEM:   'text-gray-400',
}

// Real geographic hub positions for India/Asia supply-chain network
const NETWORK_NODES = [
  { key: 'MUM', label: 'Mumbai',     lat: 18.9388, lng: 72.9356, hub: 'Mumbai' },
  { key: 'DEL', label: 'Delhi',      lat: 28.6139, lng: 77.2090, hub: 'Delhi' },
  { key: 'CHN', label: 'Chennai',    lat: 13.0827, lng: 80.2707, hub: 'Chennai' },
  { key: 'KOL', label: 'Kolkata',    lat: 22.5726, lng: 88.3639, hub: 'Kolkata' },
  { key: 'AMD', label: 'Ahmedabad',  lat: 23.0225, lng: 72.5714, hub: 'Ahmedabad' },
  { key: 'HYD', label: 'Hyderabad',  lat: 17.3850, lng: 78.4867, hub: 'Hyderabad' },
  { key: 'BLR', label: 'Bengaluru',  lat: 12.9716, lng: 77.5946, hub: 'Bengaluru' },
  { key: 'PNE', label: 'Pune',       lat: 18.5204, lng: 73.8567, hub: 'Pune' },
  { key: 'SGP', label: 'Singapore',  lat:  1.3521, lng: 103.8198, hub: 'Singapore' },
  { key: 'SHA', label: 'Shanghai',   lat: 31.2304, lng: 121.4737, hub: 'Shanghai' },
]

const NETWORK_EDGES = [
  ['MUM', 'DEL'], ['MUM', 'CHN'], ['MUM', 'AMD'], ['MUM', 'PNE'],
  ['DEL', 'AMD'], ['DEL', 'KOL'],
  ['CHN', 'KOL'], ['CHN', 'HYD'], ['CHN', 'BLR'], ['CHN', 'SGP'],
  ['AMD', 'HYD'],
  ['HYD', 'BLR'],
  ['BLR', 'PNE'],
  ['SGP', 'SHA'],
]

const HUBS = ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Ahmedabad', 'Hyderabad', 'Bengaluru', 'Singapore', 'Shanghai']

export default function ChaosInjector() {
  const [weather, setWeather]       = useState(6)
  const [portStrike, setPortStrike] = useState(8.5)
  const [congestion, setCongestion] = useState(4.2)

  const [batchHub, setBatchHub]           = useState('Mumbai')
  const [batchSeverity, setBatchSeverity] = useState(9)

  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  // 'normal' | 'firing' | 'red'
  const [nodeState, setNodeState]     = useState('normal')
  const [nodeRiskMap, setNodeRiskMap] = useState({})  // key → 0-100

  const [logs, setLogs] = useState([
    { time: '14:22:01', type: 'CRITICAL', text: 'Weather alert triggered in South China Sea. Severity level 8/10.' },
    { time: '14:22:15', type: 'INFO',     text: 'Rerouting initiated for SHP_082. Alternative: Sunda Strait.' },
    { time: '14:22:30', type: 'WARNING',  text: 'Predicted delay +14h for Mumbai Port (INBOM).' },
    { time: '14:22:45', type: 'SYSTEM',   text: 'Ripple Effect: 4 downstream fulfillment centers flagged.' },
    { time: '14:23:02', type: 'AI',       text: 'AI: Suggested pre-clearance for priority shipments at Port Kelang.' },
    { time: '14:23:18', type: 'SYSTEM',   text: 'Adjusting throughput capacity for Western Hub by -12%.' },
    { time: '14:23:35', type: 'INFO',     text: 'Simulation running... 482 alternate paths analyzed.' },
  ])
  const [presets, setPresets] = useState([])
  const logRef = useRef(null)

  useEffect(() => {
    fetchChaosPresets().then((p) => p && setPresets(p))
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const ts = () =>
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

  // Standard inject
  const handleInject = async () => {
    setLoading(true)
    const t = ts()
    setLogs((prev) => [
      ...prev,
      { time: t, type: 'CRITICAL', text: `Chaos injection — Weather: ${weather}/10, Strike: ${(portStrike * 10).toFixed(0)}%, Congestion: ${congestion}` },
    ])
    const data = await injectChaos({
      weather_severity: weather,
      port_strike: portStrike,
      affected_hub: 'Mumbai JNPT',
    })
    if (data) {
      setResult(data)
      const t2 = ts()
      setLogs((prev) => [
        ...prev,
        { time: t2, type: 'WARNING', text: `${data.directly_affected} shipments directly impacted.` },
        { time: t2, type: 'SYSTEM',  text: `${data.indirectly_affected} additional via ripple propagation.` },
        { time: t2, type: 'AI',      text: `Total disruption: ${data.total_affected} shipments.` },
      ])
    } else {
      setResult({ directly_affected: 0, total_affected: 0 })
      setLogs((prev) => [...prev, { time: ts(), type: 'WARNING', text: 'Simulation completed (offline mode).' }])
    }
    setLoading(false)
  }

  // ── BATCH DISRUPTION — standing ovation ──
  const handleBatchFire = async () => {
    if (loading) return
    setLoading(true)
    setNodeState('firing')
    setNodeRiskMap({})

    const t = ts()
    setLogs((prev) => [
      ...prev,
      { time: t, type: 'CRITICAL', text: `>>> BATCH DISRUPTION FIRED <<< Hub: ${batchHub} | Severity: ${batchSeverity}/10` },
    ])

    const data = await triggerBatchDisruption(batchHub, batchSeverity)
    const t2 = ts()

    // Build risk map — ALL nodes go red
    const map = {}
    NETWORK_NODES.forEach((n) => { map[n.key] = 95 + Math.round(Math.random() * 5) })

    if (data && Array.isArray(data.affected_nodes)) {
      data.affected_nodes.forEach((item) => {
        const matched = NETWORK_NODES.find(
          (n) => n.key === item.node_id || n.hub === item.hub || n.hub === item.node_id
        )
        if (matched) map[matched.key] = item.risk ?? 100
      })
    }

    setNodeRiskMap(map)
    setNodeState('red')
    setResult(data ?? { directly_affected: NETWORK_NODES.length, total_affected: NETWORK_NODES.length })

    setLogs((prev) => [
      ...prev,
      { time: t2, type: 'CRITICAL', text: `Network-wide alert: ALL nodes flagged RED. ${data?.total_affected ?? NETWORK_NODES.length} shipments disrupted.` },
      { time: t2, type: 'WARNING',  text: `${batchHub} cascade propagated across ${NETWORK_NODES.length} hubs simultaneously.` },
      { time: t2, type: 'AI',       text: `Severity ${batchSeverity}/10 — maximum propagation achieved.` },
    ])
    setLoading(false)
  }

  const getNodeColour = (key) => {
    if (nodeState === 'normal') {
      const defaults = { MUM: '#f43f5e', DEL: '#eab308', CHN: '#eab308', KOL: '#10b981', AMD: '#10b981', HYD: '#10b981', BLR: '#10b981', PNE: '#10b981', SGP: '#10b981', SHA: '#10b981' }
      return defaults[key] ?? '#4b5563'
    }
    if (nodeState === 'firing') return '#f97316'
    const risk = nodeRiskMap[key] ?? 100
    if (risk >= 80) return '#f43f5e'
    if (risk >= 50) return '#f97316'
    return '#eab308'
  }

  const getEdgeColour = (from, to) => {
    if (nodeState === 'normal') return '#374151'
    if (nodeState === 'firing') return '#f97316'
    return '#f43f5e'
  }

  const affected      = result?.total_affected ?? 1240
  const deltaExposure = result ? Math.round((result.total_affected ?? 0) * 198) : 245000

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">
          Chaos Injector Simulation
        </h2>
        <p className="text-gray-400 text-base max-w-2xl">
          Stress-test your global supply chain. Fire a batch disruption to watch the entire network go red simultaneously.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT — Controls */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-6 flex-1 flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Sliders className="w-5 h-5 text-dash-accent" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Disruption Controls</h3>
            </div>

            <div className="space-y-8">
              <SliderControl label="Weather Severity"        badge={`${weather}/10`}                value={weather}     max={10} onChange={setWeather}     leftLabel="CLEAR"    rightLabel="EXTREME" />
              <SliderControl label="Port Strike Probability" badge={`${Math.round(portStrike*10)}%`} value={portStrike}  max={10} onChange={setPortStrike} leftLabel="STABLE"   rightLabel="CRITICAL" />
              <SliderControl label="Port Congestion Index"   badge={congestion.toFixed(1)}           value={congestion}  max={10} onChange={setCongestion}  leftLabel="OPTIMAL"  rightLabel="GRIDLOCK" />
            </div>

            {presets.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button key={p.id} onClick={() => { setWeather(p.params.weather_severity); setPortStrike(p.params.port_strike) }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-gray-300 hover:bg-white/10 transition-colors">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleInject} disabled={loading}
              className="w-full py-3 bg-dash-accent/10 border border-dash-accent/40 text-dash-accent font-black text-sm uppercase tracking-[0.15em] italic rounded-xl hover:bg-dash-accent/20 transition-all disabled:opacity-50">
              {loading ? 'Running…' : 'Inject Chaos (Standard)'}
            </button>

            {/* BATCH DISRUPTION */}
            <div className="border-t border-white/10 pt-4 space-y-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3 text-dash-risk" /> Batch Disruption
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Hub</label>
                  <select value={batchHub} onChange={(e) => setBatchHub(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-dash-risk">
                    {HUBS.map((h) => <option key={h} value={h} className="bg-[#16191f]">{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                    Severity: <span className="text-dash-risk font-bold">{batchSeverity}</span>
                  </label>
                  <input type="range" min="1" max="10" step="1" value={batchSeverity} onChange={(e) => setBatchSeverity(Number(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer mt-2" />
                </div>
              </div>
              <button onClick={handleBatchFire} disabled={loading}
                className="w-full py-5 bg-dash-risk text-white font-black text-xl uppercase tracking-[0.2em] italic rounded-xl glow-risk hover:bg-dash-risk/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Injecting...' : '⚡ Fire Batch Disruption'}
              </button>
              <p className="text-center text-[10px] text-gray-500 uppercase tracking-tighter">
                Hits /api/chaos/batch-disruption — entire map goes RED
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Map + Metrics + Log */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-1 border-l-4 border-l-dash-accent">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Shipments Affected</p>
              <h4 className="text-4xl font-black text-white font-mono">{affected.toLocaleString('en-IN')}</h4>
              <div className="flex items-center gap-1 mt-2 text-dash-risk">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold font-mono">+12.5%</span>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-1 border-l-4 border-l-dash-risk">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Delta Exposure</p>
              <h4 className="text-4xl font-black text-white font-mono">+₹{deltaExposure.toLocaleString('en-IN')}</h4>
              <p className="text-[10px] text-gray-500 mt-2 uppercase">Projected daily revenue loss</p>
            </div>
          </div>

          {/* ── LEAFLET MAP ── */}
          <div
            className="glass-card rounded-2xl overflow-hidden"
            style={{ height: 340, position: 'relative' }}
          >
            <div className="absolute top-3 left-3 z-[999] flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-current" style={{ color: nodeState === 'red' ? '#f43f5e' : nodeState === 'firing' ? '#f97316' : '#9ca3af' }} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                nodeState === 'red'    ? 'text-dash-risk animate-pulse' :
                nodeState === 'firing' ? 'text-orange-400 animate-pulse' :
                'text-gray-500'
              }`}>
                {nodeState === 'red' ? '⚠ NETWORK-WIDE RED ALERT' : nodeState === 'firing' ? 'Propagating…' : 'Supply-Chain Node Map'}
              </span>
            </div>

            <MapContainer
              center={[20.5, 82.0]}
              zoom={4}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

              {/* Edges */}
              {NETWORK_EDGES.map(([from, to]) => {
                const fNode = NETWORK_NODES.find((n) => n.key === from)
                const tNode = NETWORK_NODES.find((n) => n.key === to)
                if (!fNode || !tNode) return null
                return (
                  <Polyline key={`${from}-${to}`}
                    positions={[[fNode.lat, fNode.lng], [tNode.lat, tNode.lng]]}
                    pathOptions={{
                      color: getEdgeColour(from, to),
                      weight: nodeState !== 'normal' ? 2.5 : 1,
                      opacity: nodeState !== 'normal' ? 0.75 : 0.2,
                    }}
                  />
                )
              })}

              {/* Node markers */}
              {NETWORK_NODES.map((node) => {
                const colour   = getNodeColour(node.key)
                const isActive = nodeState !== 'normal'
                return (
                  <CircleMarker key={node.key}
                    center={[node.lat, node.lng]}
                    radius={isActive ? 14 : 9}
                    pathOptions={{
                      color: colour,
                      fillColor: '#16191f',
                      fillOpacity: 0.92,
                      weight: isActive ? 4 : 2,
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -16]} className="leaflet-chaos-tooltip">
                      <span style={{ color: colour, fontWeight: 'bold', fontSize: 10 }}>
                        {node.key}
                        {nodeState === 'red' && nodeRiskMap[node.key] !== undefined && ` ${nodeRiskMap[node.key]}%`}
                      </span>
                    </Tooltip>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>

          {/* Terminal Log */}
          <div className="glass-card rounded-2xl flex flex-col overflow-hidden" style={{ minHeight: 220 }}>
            <div className="bg-white/5 px-6 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-3 h-3 rounded-full bg-dash-risk/40" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/40" />
                  <div className="w-3 h-3 rounded-full bg-dash-accent/40" />
                </div>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Real-time Risk Cascade</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-dash-risk animate-ping" />
                <span className="text-[10px] font-mono text-gray-500">LIVE FEED</span>
              </div>
            </div>
            <div ref={logRef} className="p-6 font-mono text-sm leading-relaxed overflow-y-auto space-y-2 flex-1" style={{ maxHeight: 200 }}>
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-gray-600 shrink-0">[{log.time}]</span>
                  <span className={LOG_COLORS[log.type] || 'text-gray-300'}>{log.text}</span>
                </div>
              ))}
              <div className="animate-pulse"><span className="text-dash-accent">_</span></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .leaflet-chaos-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-chaos-tooltip::before { display: none !important; }
      `}</style>
    </div>
  )
}

function SliderControl({ label, badge, value, max, onChange, leftLabel, rightLabel }) {
  const pct = (value / max) * 100
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-xs font-mono text-dash-accent bg-dash-accent/10 px-2 py-0.5 rounded">{badge}</span>
      </div>
      <div className="relative">
        <div className="relative h-1 bg-gray-800 rounded-full">
          <div className="absolute h-full bg-dash-accent rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <input type="range" min="0" max={max} step="0.1" value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute top-0 left-0 w-full h-1 opacity-0 cursor-pointer" style={{ marginTop: '-2px' }} />
        <div className="flex justify-between mt-2 text-[10px] font-mono text-gray-600">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  )
}
