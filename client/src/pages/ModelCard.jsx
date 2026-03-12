import { Archive, BrainCircuit, Activity, LineChart, FileText } from 'lucide-react'

export default function ModelCard() {
  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-6xl">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Guardian AI Model Card</h2>
        <p className="text-gray-500 mt-1">Transparency report for Tower 1 Machine Learning architecture</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl p-6 border-l-4 border-dash-accent">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Model Overview</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-dash-accent/20 rounded-xl flex items-center justify-center text-dash-accent border border-dash-accent/40 glows">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xl font-black text-white">Gradient Boost XG</p>
                <p className="text-xs text-gray-400">v4.0.0-rc.1</p>
              </div>
            </div>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500 font-bold uppercase">Architecture</span>
                <span className="text-white">XGBoost Ensemble</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500 font-bold uppercase">Target Task</span>
                <span className="text-white">Delay Classification</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500 font-bold uppercase">Training Data</span>
                <span className="text-white">1.2M Historical</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500 font-bold uppercase">Last Updated</span>
                <span className="text-dash-accent">2026-03-11</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 bg-dash-bg">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Limitations</h3>
            <ul className="text-xs text-gray-400 space-y-3 list-disc pl-4 leading-relaxed">
               <li>Geographic bias towards Indo-Pacific and sub-continental logistics corridors.</li>
               <li>Extreme weather prediction relies on external NOAA APIs which may introduce latency.</li>
               <li>Force Majeure events (pandemics, canal blockages) fall outside trained confidence intervals (&gt;3 sigma).</li>
            </ul>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Performance Metrics */}
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Activity className="w-4 h-4 text-dash-green" /> Validation Metrics
            </h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <Metric label="F1 Score" value="0.91" />
                 <Metric label="Precision" value="0.89" />
                 <Metric label="Recall" value="0.94" />
                 <Metric label="ROC AUC" value="0.96" color="text-dash-accent" />
             </div>
             
             {/* Fake ROC Curve graph */}
             <div className="mt-8 border border-white/5 rounded-xl bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] h-48 relative overflow-hidden flex items-end">
                <div className="absolute top-4 left-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  True Positive Rate
                </div>
                <div className="absolute bottom-4 right-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  False Positive Rate
                </div>
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid */}
                  <line x1="25" y1="0" x2="25" y2="100" stroke="#333" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#333" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="75" y1="0" x2="75" y2="100" stroke="#333" strokeDasharray="2" strokeWidth="0.5" />
                  
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#333" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#333" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#333" strokeDasharray="2" strokeWidth="0.5" />

                  {/* Diagonal */}
                  <line x1="0" y1="100" x2="100" y2="0" stroke="#555" strokeDasharray="4 4" strokeWidth="1" />
                  {/* Curve */}
                  <path d="M0 100 Q10 10, 50 5 T100 0" fill="none" stroke="#00f2ff" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
                </svg>
             </div>
          </div>

          <div className="glass-card rounded-3xl p-8 text-sm">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <FileText className="w-4 h-4 text-white" /> Feature Importance (Top 5)
             </h3>
             <div className="space-y-4">
                 <FeatureBar name="1. Route Historical Delay Rate" val={86} />
                 <FeatureBar name="2. Carrier Reliability Score" val={72} />
                 <FeatureBar name="3. Weather Severity Index" val={64} />
                 <FeatureBar name="4. Port Congestion Level" val={45} />
                 <FeatureBar name="5. Border Crossing Efficiency" val={32} />
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, color='text-white' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{label}</p>
      <h4 className={`text-2xl font-black ${color}`}>{value}</h4>
    </div>
  )
}

function FeatureBar({ name, val }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 tracking-widest">
         <span>{name}</span>
         <span className="text-white">{val} / 100</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
         <div className="h-full bg-dash-accent/80 rounded-full" style={{ width: `${val}%` }} />
      </div>
    </div>
  )
}
