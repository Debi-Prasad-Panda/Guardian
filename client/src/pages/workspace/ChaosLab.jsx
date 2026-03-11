import { useState, useEffect } from 'react';
import { injectChaos, fetchChaosPresets } from '@/services/api';
import { Zap, RotateCcw, AlertTriangle, TrendingDown, Play, Info, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const BASE_SHIPMENTS = [
  { id: 'SHP_001', route: 'Bangalore → Delhi', tier: 'CRITICAL', risk_score: 87, longitude: 77.2090, latitude: 28.6139 },
  { id: 'SHP_047', route: 'Mumbai → Chennai', tier: 'PRIORITY', risk_score: 52, longitude: 80.2707, latitude: 13.0827 },
  { id: 'SHP_093', route: 'Delhi → Kolkata', tier: 'STANDARD', risk_score: 18, longitude: 88.3639, latitude: 22.5726 },
  { id: 'SHP_112', route: 'Chennai → Pune', tier: 'CRITICAL', risk_score: 92, longitude: 73.8567, latitude: 18.5204 },
  { id: 'SHP_214', route: 'Kolkata → Mumbai', tier: 'PRIORITY', risk_score: 65, longitude: 72.8777, latitude: 19.0760 },
];

const PRESETS = [
  { id: 'normal', label: 'Normal Ops', color: 'text-primary', weather: 2, port: 0, carrier: 0 },
  { id: 'suez', label: 'Suez Blockage', color: 'text-destructive', weather: 7, port: 80, carrier: 20 },
  { id: 'cyclone', label: 'Cyclone', color: 'text-risk-warning', weather: 10, port: 50, carrier: 10 },
  { id: 'strike', label: 'Port Strike', color: 'text-destructive', weather: 1, port: 95, carrier: 5 },
];

export default function ChaosLab() {
  const [weather, setWeather] = useState([3]);
  const [portStrike, setPortStrike] = useState([0]);
  const [carrierFail, setCarrierFail] = useState([0]);
  const [injected, setInjected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [activePreset, setActivePreset] = useState('normal');
  const [apiPresets, setApiPresets] = useState([]);

  useEffect(() => {
    fetchChaosPresets().then(setApiPresets).catch(() => {});
  }, []);

  const applyPreset = (p) => {
    setActivePreset(p.id);
    const weatherVal = p.weather ?? Math.round((p.weather ?? 0));
    const portVal    = p.strike ?? p.port ?? 0;
    setWeather([Math.min(10, Math.round(weatherVal / 10))]);
    setPortStrike([portVal]);
    setCarrierFail([0]);
    setInjected(false);
    setResult(null);
  };

  const handleInject = async () => {
    setLoading(true);
    setInjected(false);
    setProgress(0);

    // Animate progress while waiting for API
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + 7;
      });
    }, 120);

    try {
      const data = await injectChaos({
        weather: weather[0] * 10,   // scale 0-10 slider to 0-100
        strike:  portStrike[0],
        hub: activePreset === 'monsoon' ? 'BOM' :
             activePreset === 'cyclone' ? 'MAA' :
             activePreset === 'strike'  ? 'NAG' : 'DEL',
      });
      clearInterval(interval);
      setProgress(100);
      setResult(data);
      setInjected(true);
    } catch (e) {
      // fallback mock
      const boost = (weather[0] / 10) * 0.4 + (portStrike[0] / 100) * 0.4 + (carrierFail[0] / 100) * 0.2;
      const affected = Math.max(1, Math.round(boost * 6) + 1);
      setResult({ affected_shipments: affected, interventions_triggered: affected - 1, savings_potential_inr: affected * 68000, severity_score: Math.round(boost * 100), before_after: [], network_graph: null });
      setInjected(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShipments(BASE_SHIPMENTS);
    setWeather([3]); setPortStrike([0]); setCarrierFail([0]);
    setInjected(false); setResult(null); setActivePreset('normal');
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-700 w-full overflow-hidden shrink-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
        {/* Interaction Map */}
        <Card className="lg:col-span-2 border-border/40 bg-card/30 backdrop-blur-sm relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pointer-events-none z-10">
            <div className="bg-background/80 backdrop-blur-md p-3 rounded-xl border border-border/50 shadow-2xl">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                {injected ? <Flame className="w-4 h-4 text-destructive animate-pulse" /> : <Play className="w-4 h-4 text-primary" />}
                {injected ? "SIMULATED DISRUPTION IMPACT" : "LIVE SCENARIO CANVAS"}
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                Guardian Engine v3.0
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border/50">
               <span className={`w-2 h-2 rounded-full ${injected ? 'bg-destructive animate-ping' : 'bg-primary'}`} />
               <span className="text-[11px] font-bold uppercase tracking-tighter">
                  {injected ? 'DISRUPTION PROPAGATING' : 'ENGINE COLD'}
               </span>
            </div>
          </CardHeader>
          <div className="absolute inset-0 z-0">
             <MapView shipments={shipments} />
          </div>
        </Card>

        {/* Chaos Controls */}
        <div className="flex flex-col gap-6">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 uppercase tracking-tight">
                 Chaos Modulator
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
               {/* Presets Grid */}
               <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map(p => (
                    <Button 
                      key={p.id} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyPreset(p)}
                      className={`text-[10px] h-8 justify-start font-bold uppercase ${activePreset === p.id ? 'bg-primary/20 border-primary text-primary' : 'bg-background/40'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${p.color.replace('text-', 'bg-')}`} />
                      {p.label}
                    </Button>
                  ))}
               </div>

               <Separator className="bg-border/30" />

               {/* Manual Controls */}
               <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase">
                       <span className="text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> Weather Intensity</span>
                       <span className="text-primary">{weather}%</span>
                    </div>
                    <Slider value={weather} onValueChange={setWeather} max={100} step={1} className="[&_[role=slider]]:bg-primary" />
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase">
                       <span className="text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-risk-warning" /> Port Bottleneck</span>
                       <span className="text-risk-warning">{portStrike}%</span>
                    </div>
                    <Slider value={portStrike} onValueChange={setPortStrike} max={100} step={1} className="[&_[role=slider]]:bg-risk-warning" />
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase">
                       <span className="text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3 text-destructive" /> Carrier Volatility</span>
                       <span className="text-destructive">{carrierFail}%</span>
                    </div>
                    <Slider value={carrierFail} onValueChange={setCarrierFail} max={100} step={1} className="[&_[role=slider]]:bg-destructive" />
                 </div>
               </div>

               <div className="pt-2">
                 {loading && <Progress value={progress} className="h-1 mb-2 bg-destructive/10 [&>div]:bg-destructive" />}
                 <Button 
                   onClick={handleInject} 
                   disabled={loading} 
                   className="w-full h-12 bg-destructive hover:bg-destructive/80 text-destructive-foreground font-black italic tracking-tighter uppercase transition-all active:scale-95"
                 >
                   {loading ? 'CALCULATING IMPACT...' : '⚡ INJECT SYSTEM CHAOS'}
                 </Button>
               </div>
            </CardContent>
          </Card>

          {/* Results Analysis */}
          {result && (
            <Card className="border-destructive/30 bg-destructive/5 animate-in slide-in-from-right-4 duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <AlertTriangle className="w-16 h-16 text-destructive" />
              </div>
              <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-black uppercase text-destructive tracking-widest">Post-Chaos Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background/50 rounded-lg border border-destructive/20">
                       <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Ships Impacted</div>
                       <div className="text-xl font-black text-destructive tracking-tighter">{result.affected_shipments ?? result.affected} <span className="text-xs font-normal">UNITS</span></div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg border border-destructive/20">
                       <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Severity</div>
                       <div className="text-xl font-black text-destructive tracking-tighter">{result.severity_score ?? '—'}%</div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg border border-primary/20">
                       <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Auto-Interventions</div>
                       <div className="text-xl font-black text-primary tracking-tighter">{result.interventions_triggered ?? result.interventions}</div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg border border-primary/20">
                       <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Savings Target</div>
                       <div className="text-xl font-black text-primary tracking-tighter">₹{((result.savings_potential_inr ?? result.savings ?? 0) / 100000).toFixed(1)}L</div>
                    </div>
                 </div>
                 {(result.before_after ?? []).slice(0, 4).map((row, i) => (
                   <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border/20 last:border-0">
                     <span className="font-mono font-bold">{row.shipment}</span>
                     <span className="text-muted-foreground">{row.risk_before}% <span className="text-destructive">→ {row.risk_after}%</span></span>
                     <span className="text-[10px] text-yellow-400 font-bold">{row.action_recommended}</span>
                   </div>
                 ))}
                 <Button variant="outline" onClick={handleReset} className="w-full text-xs font-bold uppercase border-destructive/20 text-destructive hover:bg-destructive/10">
                    <RotateCcw className="w-3 h-3 mr-2" /> Reset Environment
                 </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

function Separator({ className }) {
  return <div className={`h-px w-full ${className}`} />;
}

