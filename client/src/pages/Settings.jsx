import { useState } from 'react'
import { Bell, Key, ShieldCheck, Database, Sliders, Monitor } from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-5xl">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">System Settings</h2>
        <p className="text-gray-500 mt-1">Configure your Guardian ML environment and alert preferences</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-3">
          <nav className="flex flex-col space-y-1">
             {[
               { id: 'general', i: Sliders, l: 'General Preferences' },
               { id: 'alerts', i: Bell, l: 'Alert Thresholds' },
               { id: 'api', i: Key, l: 'API Keys' },
               { id: 'data', i: Database, l: 'Data Integrations' },
               { id: 'display', i: Monitor, l: 'Interface' },
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                   activeTab === tab.id ? 'bg-dash-accent/10 border border-dash-accent/20 text-dash-accent group' : 'text-gray-500 hover:text-white hover:bg-white/5'
                 }`}
               >
                 <tab.i className="w-4 h-4" />
                 {tab.l}
                 {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-dash-accent animate-pulse" />}
               </button>
             ))}
          </nav>
        </div>

        <div className="col-span-12 md:col-span-9 space-y-6">
          <div className="glass-card rounded-2xl p-8 min-h-[500px]">
            <div className="border-b border-white/10 pb-4 mb-6 flex items-center gap-3">
               <ShieldCheck className="w-6 h-6 text-dash-green" />
               <h3 className="text-white font-black uppercase tracking-wider text-xl">Guardian Core Configuration</h3>
            </div>

            <div className="space-y-8 max-w-xl">
               {/* Forms */}
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base Risk Threshold</label>
                 <div className="flex items-center gap-4">
                   <input type="range" className="flex-1" defaultValue="65" />
                   <span className="text-dash-accent font-mono font-bold w-12 text-right">0.65</span>
                 </div>
                 <p className="text-[11px] text-gray-400 mt-1">Alerts trigger when shipment risk exceeds this value.</p>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Backend Inference URL</label>
                 <input type="text" className="w-full bg-dash-bg border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-dash-accent font-mono" defaultValue="http://localhost:8000" />
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">LLM Agent Backend (Gemini API)</label>
                 <input type="password" className="w-full bg-dash-bg border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-dash-accent font-mono" defaultValue="AIzaSyA***********" />
               </div>

               <div className="space-y-4 pt-6 mt-6 border-t border-white/5">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Notification Channels</label>
                 <div className="space-y-3">
                   {['Email Daily Digest', 'High Risk SMS Alerts', 'Slack Webhook via Zapier'].map(item => (
                     <label key={item} className="flex items-center gap-3 cursor-pointer group">
                       <div className="w-5 h-5 rounded border border-dash-accent/50 group-hover:border-dash-accent bg-dash-accent/10 flex items-center justify-center transition-colors">
                         <div className="w-2.5 h-2.5 bg-dash-accent rounded-[2px]" />
                       </div>
                       <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">{item}</span>
                     </label>
                   ))}
                 </div>
               </div>
               
               <div className="pt-8">
                 <button className="px-6 py-3 bg-dash-accent text-black font-black uppercase text-sm rounded-xl shadow-[0_4px_15px_rgba(0,242,255,0.2)] hover:scale-[1.02] transition-transform">
                   Save Configuration
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
