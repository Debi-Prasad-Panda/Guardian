import { useState, useEffect, useRef } from 'react'
import { Sliders, TrendingUp, AlertTriangle } from 'lucide-react'
import { fetchChaosPresets, injectChaos } from '../lib/api'

const LOG_COLORS = {
  CRITICAL: 'text-red-400',
  WARNING: 'text-yellow-400',
  INFO: 'text-gray-300',
  AI: 'text-dash-accent',
  SYSTEM: 'text-gray-400',
}

export default function ChaosInjector() {
  const [weather, setWeather] = useState(6)
  const [portStrike, setPortStrike] = useState(8.5)
  const [congestion, setCongestion] = useState(4.2)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([
    { time: '14:22:01', type: 'CRITICAL', text: 'Weather alert triggered in South China Sea. Severity level 8/10.' },
    { time: '14:22:15', type: 'INFO', text: 'Rerouting initiated for SHP_082. Alternative route: Sunda Strait.' },
    { time: '14:22:30', type: 'WARNING', text: 'Predicted delay +14h for Mumbai Port (INBOM).' },
    { time: '14:22:45', type: 'SYSTEM', text: 'Ripple Effect: 4 downstream fulfillment centers flagged for low inventory.' },
    { time: '14:23:02', type: 'AI', text: 'AI Optimization: Suggested pre-clearance for priority shipments at Port Kelang.' },
    { time: '14:23:18', type: 'SYSTEM', text: 'Adjusting throughput capacity for Western Hub by -12%.' },
    { time: '14:23:35', type: 'INFO', text: 'Simulation running... 482 alternate paths analyzed.' },
  ])
  const [presets, setPresets] = useState([])
  const logRef = useRef(null)

  useEffect(() => {
    fetchChaosPresets().then((p) => p && setPresets(p))
  }, [])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const handleInject = async () => {
    setLoading(true)
    const now = new Date()
    const ts = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

    setLogs((prev) => [
      ...prev,
      { time: ts, type: 'CRITICAL', text: `Chaos injection initiated — Weather: ${weather}/10, Strike: ${(portStrike * 10).toFixed(0)}%, Congestion: ${congestion}` },
    ])

    const data = await injectChaos({
      weather_severity: weather,
      port_strike: portStrike,
      affected_hub: 'Mumbai JNPT',
    })

    if (data) {
      setResult(data)
      const ts2 = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setLogs((prev) => [
        ...prev,
        { time: ts2, type: 'WARNING', text: `${data.directly_affected} shipments directly impacted.` },
        { time: ts2, type: 'SYSTEM', text: `${data.indirectly_affected} additional via ripple propagation.` },
        { time: ts2, type: 'AI', text: `Total network disruption: ${data.total_affected} shipments. Analyzing mitigation paths...` },
      ])
    } else {
      const ts2 = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setLogs((prev) => [
        ...prev,
        { time: ts2, type: 'WARNING', text: 'Simulation completed locally. Backend not connected for live propagation.' },
      ])
      setResult({ directly_affected: 0, total_affected: 0 })
    }
    setLoading(false)
  }

  const affected = result?.total_affected ?? 1240
  const deltaExposure = result ? Math.round(result.total_affected * 198) : 245000

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">
          Chaos Injector Simulation
        </h2>
        <p className="text-gray-400 text-base max-w-2xl">
          Stress-test your global supply chain infrastructure by injecting synthetic disruptions across various parameters.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Panel: Controls */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-6 flex-1 flex flex-col gap-8">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Sliders className="w-5 h-5 text-dash-accent" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Disruption Controls</h3>
            </div>

            <div className="space-y-10">
              {/* Weather Severity */}
              <SliderControl
                label="Weather Severity"
                badge={`${weather}/10`}
                value={weather}
                max={10}
                onChange={setWeather}
                leftLabel="CLEAR"
                rightLabel="EXTREME"
              />

              {/* Port Strike */}
              <SliderControl
                label="Port Strike Probability"
                badge={`${Math.round(portStrike * 10)}%`}
                value={portStrike}
                max={10}
                onChange={setPortStrike}
                leftLabel="STABLE"
                rightLabel="CRITICAL"
              />

              {/* Congestion */}
              <SliderControl
                label="Port Congestion Index"
                badge={congestion.toFixed(1)}
                value={congestion}
                max={10}
                onChange={setCongestion}
                leftLabel="OPTIMAL"
                rightLabel="GRIDLOCK"
              />
            </div>

            {/* Presets */}
            {presets.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setWeather(p.params.weather_severity)
                        setPortStrike(p.params.port_strike)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-8">
              <button
                onClick={handleInject}
                disabled={loading}
                className="w-full py-5 bg-dash-risk text-white font-black text-xl uppercase tracking-[0.2em] italic rounded-xl glow-risk hover:bg-dash-risk/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Injecting...' : 'Inject Chaos'}
              </button>
              <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-tighter">
                Warning: Simulation affects all live model prediction streams
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Impact */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-1 border-l-4 border-l-dash-accent">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Shipments Affected</p>
              <h4 className="text-4xl font-black text-white font-mono tracking-tighter">
                {affected.toLocaleString('en-IN')}
              </h4>
              <div className="flex items-center gap-1 mt-2 text-dash-risk">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold font-mono">+12.5%</span>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-1 border-l-4 border-l-dash-risk">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Delta Exposure</p>
              <h4 className="text-4xl font-black text-white font-mono tracking-tighter">
                +₹{deltaExposure.toLocaleString('en-IN')}
              </h4>
              <p className="text-[10px] text-gray-500 mt-2 uppercase">Projected daily revenue loss</p>
            </div>
          </div>

          {/* Terminal Log */}
          <div className="glass-card rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[400px]">
            <div className="bg-white/5 px-6 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-3 h-3 rounded-full bg-dash-risk/40" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/40" />
                  <div className="w-3 h-3 rounded-full bg-dash-accent/40" />
                </div>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                  Real-time Risk Cascade
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-dash-risk animate-ping" />
                <span className="text-[10px] font-mono text-gray-500">LIVE FEED</span>
              </div>
            </div>
            <div ref={logRef} className="p-6 font-mono text-sm leading-relaxed overflow-y-auto space-y-2 flex-1">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-gray-600 shrink-0">[{log.time}]</span>
                  <span className={LOG_COLORS[log.type] || 'text-gray-300'}>{log.text}</span>
                </div>
              ))}
              <div className="animate-pulse">
                <span className="text-dash-accent">_</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SliderControl({ label, badge, value, max, onChange, leftLabel, rightLabel }) {
  const pct = (value / max) * 100
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-xs font-mono text-dash-accent bg-dash-accent/10 px-2 py-0.5 rounded">{badge}</span>
      </div>
      <div className="relative">
        <div className="relative h-1 bg-gray-800 rounded-full">
          <div
            className="absolute h-full bg-dash-accent rounded-full shadow-[0_0_10px_rgba(0,229,255,0.4)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={max}
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute top-0 left-0 w-full h-1 opacity-0 cursor-pointer"
          style={{ marginTop: '-2px' }}
        />
        <div className="flex justify-between mt-3 text-[10px] font-mono text-gray-600">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  )
}
