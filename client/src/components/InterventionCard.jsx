import { useState } from 'react'
import { TrendingDown, DollarSign, Leaf, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

/**
 * InterventionCard Component
 * Displays DiCE + Kimi K2.5 intervention recommendations
 * 
 * Usage:
 *   <InterventionCard shipmentId="SHP_001" />
 */
export default function InterventionCard({ shipmentId }) {
  const [intervention, setIntervention] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGetIntervention = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('http://localhost:8000/api/ml/intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: shipmentId,
          prediction_horizon: 48,
          num_counterfactuals: 3
        })
      })
      
      if (!res.ok) throw new Error('Intervention API failed')
      const data = await res.json()
      setIntervention(data)
    } catch (err) {
      console.error('Intervention error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    console.log('Intervention accepted:', intervention.intervention.action)
    // TODO: Send to backend to log acceptance
    alert('Intervention accepted! Carrier reassignment initiated.')
  }

  const handleOverride = () => {
    console.log('Intervention overridden')
    // TODO: Show manual action selector
    alert('Override logged. Manual action required.')
  }

  if (!intervention && !loading && !error) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-dash-accent" />
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">
            AI Intervention Recommendation
          </h3>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Get a mathematically-grounded intervention recommendation using DiCE counterfactuals + Kimi K2.5 AI.
        </p>
        <button 
          onClick={handleGetIntervention}
          className="w-full bg-dash-accent hover:bg-dash-accent/80 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 uppercase tracking-wider"
        >
          Generate Recommendation
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-dash-accent animate-pulse" />
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">
            Analyzing...
          </h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded animate-pulse"></div>
          <div className="h-4 bg-white/10 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-white/10 rounded animate-pulse w-1/2"></div>
        </div>
        <p className="text-gray-400 text-sm mt-4">
          Running three-tower prediction → DiCE counterfactuals → Kimi K2.5 selection...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-red-500/30">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-red-400 uppercase tracking-wider">
            Error
          </h3>
        </div>
        <p className="text-gray-300 mb-4">{error}</p>
        <button 
          onClick={handleGetIntervention}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
        >
          Retry
        </button>
      </div>
    )
  }

  const pred = intervention.prediction
  const dice = intervention.counterfactuals
  const rec = intervention.intervention

  const riskColor = pred.risk_score > 0.7 ? 'text-red-400' : pred.risk_score > 0.4 ? 'text-yellow-400' : 'text-green-400'
  const riskBg = pred.risk_score > 0.7 ? 'bg-red-500/10 border-red-500/30' : pred.risk_score > 0.4 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-dash-accent" />
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">
            AI Intervention
          </h3>
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-widest">
          {rec.source === 'kimi' ? '🤖 Kimi K2.5' : '⚙️ Fallback'}
        </div>
      </div>

      {/* Current Risk */}
      <div className={`${riskBg} border rounded-xl p-4`}>
        <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Current Risk</div>
        <div className={`text-4xl font-black ${riskColor}`}>
          {(pred.risk_score * 100).toFixed(0)}%
          <span className="text-lg ml-2 text-gray-400">
            ± {(pred.uncertainty * 100).toFixed(0)}%
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {pred.confidence_label} • Interval: [{(pred.interval_low * 100).toFixed(0)}%, {(pred.interval_high * 100).toFixed(0)}%]
        </div>
      </div>

      {/* Recommended Action */}
      <div className="bg-dash-accent/10 border border-dash-accent/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-dash-accent" />
          <div className="text-xs text-gray-400 uppercase tracking-widest">Recommended Action</div>
        </div>
        <div className="text-lg font-bold text-dash-accent mb-2">
          {rec.action}
        </div>
        <div className="text-sm text-gray-300">
          {rec.justification}
        </div>
      </div>

      {/* Cost-Benefit Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-orange-400" />
            <div className="text-xs text-gray-400">Intervention Cost</div>
          </div>
          <div className="text-xl font-bold text-orange-400">
            ₹{rec.cost_of_action.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <div className="text-xs text-gray-400">SLA Penalty</div>
          </div>
          <div className="text-xl font-bold text-red-400">
            ₹{rec.cost_of_sla_miss.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Net Saving */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="w-5 h-5 text-green-400" />
          <div className="text-xs text-gray-400 uppercase tracking-widest">Net Saving</div>
        </div>
        <div className="text-3xl font-black text-green-400">
          ₹{rec.net_saving.toLocaleString()}
        </div>
      </div>

      {/* CO2 Impact */}
      <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-white/5">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-green-400" />
          <span className="text-sm text-gray-400">CO2 Impact</span>
        </div>
        <span className={`text-sm font-bold ${rec.co2_delta_kg > 0 ? 'text-orange-400' : 'text-green-400'}`}>
          {rec.co2_delta_kg > 0 ? '+' : ''}{rec.co2_delta_kg.toFixed(1)} kg CO2e
        </span>
      </div>

      {/* DiCE Counterfactuals */}
      <div className="border-t border-white/10 pt-4">
        <div className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
          Alternative Options (DiCE)
        </div>
        <div className="space-y-2">
          {dice.counterfactuals.map((cf, i) => (
            <div 
              key={cf.id} 
              className={`bg-gray-800/30 rounded-lg p-3 border ${
                rec.counterfactual_used === cf.id 
                  ? 'border-dash-accent/50 bg-dash-accent/5' 
                  : 'border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-400">Option {i + 1}</div>
                {rec.counterfactual_used === cf.id && (
                  <div className="text-xs text-dash-accent font-bold uppercase">Selected</div>
                )}
              </div>
              <div className="text-sm text-gray-200 mb-1">{cf.description}</div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Risk: {(cf.new_risk * 100).toFixed(0)}%</span>
                <span className={cf.risk_reduction > 0 ? 'text-green-400' : 'text-red-400'}>
                  {cf.risk_reduction > 0 ? '↓' : '↑'} {Math.abs(cf.risk_reduction * 100).toFixed(0)}%
                </span>
                <span>Feasibility: {cf.feasibility}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button 
          onClick={handleAccept}
          className="flex-1 bg-dash-accent hover:bg-dash-accent/80 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 uppercase tracking-wider"
        >
          Accept Intervention
        </button>
        <button 
          onClick={handleOverride}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 uppercase tracking-wider"
        >
          Override
        </button>
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-white/5">
        Powered by DiCE Counterfactuals + NVIDIA Kimi K2.5 • {dice.source} + {rec.source}
      </div>
    </div>
  )
}
