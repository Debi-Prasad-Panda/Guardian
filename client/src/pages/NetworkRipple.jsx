import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import { Network, Activity, Filter, RefreshCw } from 'lucide-react'
import { triggerRipple, fetchNetwork } from '../lib/api'

// ── Supply-chain node definitions (lat/lng for real map placement) ──
const NODES = [
  { key: 'MUM', label: 'Mumbai (JNPT)',   lat: 18.9388, lng: 72.9356, shipmentId: 'SHP_001' },
  { key: 'DEL', label: 'Delhi NCR',       lat: 28.6139, lng: 77.2090, shipmentId: 'SHP_002' },
  { key: 'CHN', label: 'Chennai',         lat: 13.0827, lng: 80.2707, shipmentId: 'SHP_003' },
  { key: 'AMD', label: 'Ahmedabad',       lat: 23.0225, lng: 72.5714, shipmentId: 'SHP_004' },
  { key: 'KOL', label: 'Kolkata',         lat: 22.5726, lng: 88.3639, shipmentId: 'SHP_005' },
  { key: 'HYD', label: 'Hyderabad',       lat: 17.3850, lng: 78.4867, shipmentId: 'SHP_006' },
  { key: 'BLR', label: 'Bengaluru',       lat: 12.9716, lng: 77.5946, shipmentId: 'SHP_007' },
  { key: 'PNE', label: 'Pune',            lat: 18.5204, lng: 73.8567, shipmentId: 'SHP_008' },
]

const EDGES = [
  ['MUM', 'DEL'], ['MUM', 'CHN'], ['MUM', 'AMD'], ['MUM', 'PNE'],
  ['DEL', 'AMD'], ['DEL', 'KOL'],
  ['CHN', 'KOL'], ['CHN', 'HYD'], ['CHN', 'BLR'],
  ['AMD', 'HYD'],
  ['HYD', 'BLR'],
  ['BLR', 'PNE'],
]

// Colour helpers
function riskToHex(risk) {
  if (risk === undefined || risk === null) return '#4b5563'
  if (risk >= 80) return '#f43f5e'
  if (risk >= 55) return '#f97316'
  if (risk >= 30) return '#eab308'
  return '#10b981'
}

function propagatedHex(factor) {
  // factor 0-1 → light yellow to deep amber
  const lightness = Math.round(78 - factor * 28) // 78% → 50%
  return `hsl(48, 96%, ${lightness}%)`
}

// ── Helper component: invalidate Leaflet size when container resizes ──
function MapResizer() {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200)
  }, [map])
  return null
}

export default function NetworkRippleGraph() {
  const [loading, setLoading] = useState(true)
  const [networkData, setNetworkData] = useState(null)

  const [selectedNode, setSelectedNode] = useState(null)
  const [rippleLoading, setRippleLoading] = useState(false)
  const [rippleResult, setRippleResult]  = useState(null)
  const [nodeRiskMap, setNodeRiskMap]    = useState({})  // nodeKey → 0-100

  // Load network on mount
  useEffect(() => {
    fetchNetwork().then((data) => {
      setNetworkData(data)
      setLoading(false)
    }).catch(() => setLoading(false))
    const t = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(t)
  }, [])

  // Node click → ripple API
  const handleNodeClick = useCallback(async (node) => {
    if (rippleLoading) return
    setSelectedNode(node)
    setRippleLoading(true)
    setNodeRiskMap({})
    setRippleResult(null)

    const data = await triggerRipple(node.shipmentId, 0.78)
    setRippleLoading(false)
    if (!data) {
      // Graceful offline fallback: simulate proportional ripple from click node
      const fallback = {}
      fallback[node.key] = 100
      EDGES.forEach(([from, to]) => {
        if (from === node.key) fallback[to] = Math.round(65 + Math.random() * 20)
        if (to === node.key)   fallback[from] = Math.round(40 + Math.random() * 20)
      })
      setNodeRiskMap(fallback)
      return
    }

    setRippleResult(data)
    const map = {}
    map[node.key] = data.origin_risk ?? 100
    if (Array.isArray(data.affected)) {
      data.affected.forEach((item) => {
        const matched = NODES.find(
          (n) => n.shipmentId === item.node_id || n.key === item.node_id
        )
        if (matched) map[matched.key] = item.propagated_risk ?? (item.factor ?? 0) * 100
      })
    }
    setNodeRiskMap(map)
  }, [rippleLoading])

  const handleRecalculate = useCallback(() => {
    setLoading(true)
    setSelectedNode(null)
    setNodeRiskMap({})
    setRippleResult(null)
    fetchNetwork().then((data) => {
      setNetworkData(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const nodeColour = (key) => {
    if (Object.keys(nodeRiskMap).length === 0) {
      const defaults = { MUM: '#f43f5e', DEL: '#eab308', CHN: '#eab308', AMD: '#10b981', KOL: '#10b981', HYD: '#10b981', BLR: '#10b981', PNE: '#10b981' }
      return defaults[key] ?? '#4b5563'
    }
    const risk = nodeRiskMap[key]
    if (risk === undefined) return '#4b5563'
    if (key === selectedNode?.key) return riskToHex(risk)
    return propagatedHex(risk / 100)
  }

  const edgeColour = (from, to) => {
    if (Object.keys(nodeRiskMap).length === 0) return '#374151'
    const risk = nodeRiskMap[to] ?? nodeRiskMap[from]
    if (risk === undefined) return '#374151'
    return propagatedHex(risk / 100)
  }

  // Ripple table rows
  const rippleRows = EDGES.map(([from, to]) => {
    const toRisk = nodeRiskMap[to]
    const type =
      toRisk >= 80 ? 'critical' :
      toRisk >= 55 ? 'warning'  :
      toRisk >= 30 ? 'monitor'  : 'safe'
    return { from, to, risk: toRisk, type }
  }).filter((r) => r.risk !== undefined)

  const staticRows = EDGES.slice(0, 5).map(([from, to], i) => ({
    from, to,
    risk: [85, 65, 45, 25, 15][i],
    type: ['critical', 'warning', 'monitor', 'safe', 'safe'][i],
  }))

  const displayRows = rippleRows.length > 0 ? rippleRows : staticRows

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Network Ripple Map
          </h2>
          <p className="text-gray-500 mt-1">
            Click any port/hub on the map to propagate risk cascades across the supply&nbsp;chain.
            {selectedNode && !rippleLoading && (
              <span className="text-dash-accent ml-2">
                Ripple from <strong>{selectedNode.label}</strong>
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 glass-card rounded-xl text-sm font-bold text-gray-300 hover:text-white flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button
            onClick={handleRecalculate}
            className="px-4 py-2 bg-dash-accent/10 border border-dash-accent/30 rounded-xl text-sm font-bold text-dash-accent hover:bg-dash-accent/20 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || rippleLoading) ? 'animate-spin' : ''}`} />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* MAP PANEL */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-3xl overflow-hidden" style={{ height: 520, position: 'relative' }}>
          {rippleLoading && (
            <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/50 rounded-3xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
                <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                  Propagating Ripple…
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-dash-accent border-t-transparent animate-spin" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Map…</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={4}
              style={{ height: '100%', width: '100%', background: '#0a0b0d' }}
              zoomControl={true}
              attributionControl={false}
            >
              <MapResizer />

              {/* Dark tile layer (CartoDB Dark Matter) */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />

              {/* Edges (Polylines) */}
              {EDGES.map(([from, to]) => {
                const fNode = NODES.find((n) => n.key === from)
                const tNode = NODES.find((n) => n.key === to)
                if (!fNode || !tNode) return null
                const colour = edgeColour(from, to)
                const isActive = nodeRiskMap[from] !== undefined || nodeRiskMap[to] !== undefined
                return (
                  <Polyline
                    key={`${from}-${to}`}
                    positions={[[fNode.lat, fNode.lng], [tNode.lat, tNode.lng]]}
                    pathOptions={{
                      color: colour,
                      weight: isActive ? 3 : 1.5,
                      opacity: isActive ? 0.85 : 0.25,
                      dashArray: isActive ? '8 5' : undefined,
                    }}
                  />
                )
              })}

              {/* Node markers */}
              {NODES.map((node) => {
                const colour     = nodeColour(node.key)
                const isSelected = selectedNode?.key === node.key
                const isAffected = nodeRiskMap[node.key] !== undefined
                const radius     = isSelected ? 18 : isAffected ? 14 : 10

                return (
                  <CircleMarker
                    key={node.key}
                    center={[node.lat, node.lng]}
                    radius={radius}
                    pathOptions={{
                      color: colour,
                      fillColor: '#16191f',
                      fillOpacity: 0.9,
                      weight: isSelected ? 4 : isAffected ? 3 : 2,
                    }}
                    eventHandlers={{
                      click: () => handleNodeClick(node),
                    }}
                  >
                    <Tooltip
                      permanent
                      direction="top"
                      offset={[0, -(radius + 4)]}
                      className="leaflet-ripple-tooltip"
                    >
                      <span style={{ color: colour, fontWeight: 'bold', fontSize: 11 }}>
                        {node.key}
                        {isAffected && ` ${Math.round(nodeRiskMap[node.key])}%`}
                      </span>
                    </Tooltip>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          )}
        </div>

        {/* Right panel */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Ripple origin card */}
          <div className="glass-card rounded-2xl p-6 border-l-4 border-dash-risk">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-dash-risk" />
              <h3 className="text-white font-bold uppercase tracking-wider text-sm">
                {selectedNode ? 'Ripple Origin' : 'Primary Disruption'}
              </h3>
            </div>
            {selectedNode ? (
              <>
                <p className="text-2xl font-black text-white">{selectedNode.label}</p>
                <p className="text-xs text-dash-accent mt-1 font-bold">{selectedNode.shipmentId}</p>
                {rippleResult ? (
                  <div className="mt-3 space-y-1 text-xs text-gray-400">
                    <p>Origin risk: <span className="text-white font-bold">{rippleResult.origin_risk ?? '—'}%</span></p>
                    <p>Nodes exposed: <span className="text-white font-bold">{rippleResult.affected?.length ?? Object.keys(nodeRiskMap).length - 1}</span></p>
                    {rippleResult.total_propagated_delay && (
                      <p>Cascaded delay: <span className="text-yellow-400 font-bold">{rippleResult.total_propagated_delay}</span></p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 space-y-1 text-xs text-gray-400">
                    <p>Nodes exposed: <span className="text-white font-bold">{Math.max(0, Object.keys(nodeRiskMap).length - 1)}</span></p>
                    <p className="text-yellow-500 text-[10px] italic">(offline simulation)</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-white">Mumbai JNPT</p>
                <p className="text-xs text-dash-risk mt-1 font-bold">+18h estimated delay overhead</p>
                <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
                  Congestion at Mumbai JNPT is propagating delays to 48 upstream shipments.
                  <span className="block mt-2 text-dash-accent">↑ Click any map node to run a live ripple.</span>
                </p>
              </>
            )}
          </div>

          {/* Downstream impact table */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-5">
              {selectedNode ? 'Affected Corridors' : 'Downstream Impact'}
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {displayRows.map((row, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div>
                    <p className="text-sm font-bold text-gray-200">{row.from} → {row.to}</p>
                    {row.risk !== undefined && (
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                        Risk: {Math.round(row.risk)}%
                      </p>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                    row.type === 'critical' ? 'bg-dash-risk/20 text-dash-risk' :
                    row.type === 'warning'  ? 'bg-yellow-500/20 text-yellow-500' :
                    row.type === 'monitor'  ? 'bg-dash-accent/20 text-dash-accent' :
                    'bg-dash-green/20 text-dash-green'
                  }`}>
                    {row.type}
                  </div>
                </div>
              ))}
              {displayRows.length === 0 && (
                <p className="text-xs text-gray-600 italic">No ripple data yet — click a node.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leaflet tooltip dark style */}
      <style>{`
        .leaflet-ripple-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-ripple-tooltip::before { display: none !important; }
        .leaflet-container { background: #0a0b0d; }
      `}</style>
    </div>
  )
}
