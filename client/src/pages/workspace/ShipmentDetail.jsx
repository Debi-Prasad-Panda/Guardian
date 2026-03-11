import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, AlertTriangle, Clock, Package, Zap, History, Brain, Cpu, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { fetchShipmentDetail, overrideIntervention } from '@/services/api';

// ─── SHAP Waterfall Chart ───────────────────────────────────────────────────────
function SHAPWaterfall({ features, base, prediction }) {
  if (!features?.length) return null;
  const maxAbs = Math.max(...features.map(f => Math.abs(f.value)));
  const total = features.reduce((s, f) => s + f.value, 0);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-3 font-mono">
        <span>Base Value: {base}%</span>
        <span>Predicted: <span className="text-red-400 font-black">{prediction}%</span></span>
      </div>
      {features.map((f, i) => {
        const pct = (Math.abs(f.value) / maxAbs) * 100;
        const isPos = f.direction === 'positive';
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium truncate max-w-[55%]">{f.feature}</span>
              <span className={`font-black font-mono text-[11px] ${isPos ? 'text-red-400' : 'text-primary'}`}>
                {isPos ? '+' : ''}{f.value}%
              </span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isPos ? 'bg-red-400' : 'bg-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      <div className="pt-3 border-t border-border/30 flex justify-between text-xs">
        <span className="text-muted-foreground">Net SHAP contribution</span>
        <span className={`font-black font-mono ${total > 0 ? 'text-red-400' : 'text-primary'}`}>+{total.toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ─── D3-style NetworkX Risk Graph ──────────────────────────────────────────────
function RiskNetworkGraph({ nodes = [], edges = [], highlightId }) {
  const svgRef = useRef(null);
  const W = 520, H = 320;

  // Map node positions scaled to SVG
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  const scale = (v, from, to, svgSize) => ((v - from) / (to - from)) * svgSize;
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const px = (x) => 30 + scale(x, minX, maxX, W - 60);
  const py = (y) => 30 + scale(y, minY, maxY, H - 60);

  const riskColor = (r) => r >= 70 ? '#f87171' : r >= 40 ? '#facc15' : '#4ade80';

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ background: 'transparent' }}>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#6b7280" />
        </marker>
      </defs>
      {/* Edges */}
      {edges.map((e, i) => {
        const s = nodeMap[e.source], t = nodeMap[e.target];
        if (!s || !t) return null;
        const opacity = 0.2 + e.congestion * 0.7;
        return (
          <line key={i}
            x1={px(s.x)} y1={py(s.y)} x2={px(t.x)} y2={py(t.y)}
            stroke={`rgba(251,191,36,${opacity})`}
            strokeWidth={1 + e.congestion * 3}
            markerEnd="url(#arrow)"
          />
        );
      })}
      {/* Nodes */}
      {nodes.map((n) => {
        const cx = px(n.x), cy = py(n.y);
        const r = n.id === highlightId ? 20 : 14;
        const color = riskColor(n.risk);
        return (
          <g key={n.id}>
            {n.id === highlightId && (
              <circle cx={cx} cy={cy} r={r + 6} fill={color} opacity={0.15}>
                <animate attributeName="r" values={`${r+3};${r+9};${r+3}`} dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize={8} fontWeight="800" fill={color} fontFamily="monospace">
              {n.risk}%
            </text>
            <text x={cx} y={cy + r + 9} textAnchor="middle"
              fontSize={7} fill="#9ca3af" fontFamily="sans-serif">
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Horizon Chart ─────────────────────────────────────────────────────────────
function HorizonChart({ horizons, mc }) {
  const data = [
    { name: 'Now',   risk: 0,           lower: 0,   upper: 0 },
    { name: 'T+24h', risk: horizons?.t24, lower: Math.max(0, horizons?.t24 - 8), upper: Math.min(100, horizons?.t24 + 8) },
    { name: 'T+48h', risk: horizons?.t48, lower: Math.max(0, horizons?.t48 - 10), upper: Math.min(100, horizons?.t48 + 10) },
    { name: 'T+72h', risk: horizons?.t72, lower: Math.max(0, horizons?.t72 - mc?.mean + mc?.lower || horizons?.t72 - 12), upper: Math.min(100, mc?.upper || horizons?.t72 + 12) },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.2)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
        <ReferenceLine y={65} stroke="#facc15" strokeDasharray="4 4" label={{ value: 'Alert threshold', fontSize: 9, fill: '#facc15', position: 'insideLeft' }} />
        <Area type="monotone" dataKey="upper"   stroke="transparent" fill="hsl(var(--primary)/0.08)" fillOpacity={1} />
        <Area type="monotone" dataKey="lower"   stroke="transparent" fill="hsl(var(--card))"          fillOpacity={1} />
        <Area type="monotone" dataKey="risk"    stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [accepted, setAccepted] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchShipmentDetail(id)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAccept = async (idx) => {
    setAccepting(idx);
    await new Promise(r => setTimeout(r, 800));
    setAccepted(idx);
    setAccepting(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  const ship = data;
  if (!ship) return <div className="text-muted-foreground">Shipment not found.</div>;

  const riskColor = ship.risk_score >= 70 ? 'text-red-400' : ship.risk_score >= 40 ? 'text-yellow-400' : 'text-primary';
  const tierBadge = { CRITICAL: 'destructive', PRIORITY: 'secondary', STANDARD: 'default' }[ship.tier] ?? 'default';

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 mt-0.5" onClick={() => navigate('/workspace/shipments')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-black font-mono">{ship.id}</h1>
            <Badge variant={tierBadge}>{ship.tier}</Badge>
            <Badge variant="outline" className="text-muted-foreground text-[10px]">{ship.carrier}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{ship.route} · ETA {ship.eta} · ₹{(ship.value / 100000).toFixed(1)}L · {ship.weight_kg} kg</p>
        </div>
        {/* Risk Gauge */}
        <div className="text-right shrink-0">
          <div className={`text-3xl font-black font-mono ${riskColor}`}>{ship.risk_score}%</div>
          <div className="text-[10px] text-muted-foreground">RISK INDEX</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card/50 border border-border/50 p-1 flex-wrap h-auto gap-1">
          {[
            { v: 'overview',     icon: Package,       label: 'Overview' },
            { v: 'shap',         icon: Cpu,           label: 'SHAP Analysis' },
            { v: 'timeline',     icon: Clock,         label: 'Timeline' },
            { v: 'intervention', icon: Zap,           label: 'AI Intervention' },
            { v: 'history',      icon: History,       label: 'History' },
          ].map(t => (
            <TabsTrigger key={t.v} value={t.v}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 text-xs">
              <t.icon className="w-3 h-3" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="space-y-4 animate-in fade-in duration-300">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Multi-Horizon Risk Projection</CardTitle>
              <CardDescription className="text-xs">MC Dropout uncertainty bands (1,000 forward passes).</CardDescription>
            </CardHeader>
            <CardContent>
              <HorizonChart horizons={ship.horizons} mc={ship.mc_dropout} />
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[['T+24h', ship.horizons?.t24], ['T+48h', ship.horizons?.t48], ['T+72h', ship.horizons?.t72]].map(([label, val]) => (
                  <div key={label} className={`p-3 rounded-xl text-center border ${val >= 70 ? 'border-red-400/30 bg-red-400/5' : val >= 40 ? 'border-yellow-400/30 bg-yellow-400/5' : 'border-primary/30 bg-primary/5'}`}>
                    <div className={`text-2xl font-black font-mono ${val >= 70 ? 'text-red-400' : val >= 40 ? 'text-yellow-400' : 'text-primary'}`}>{val}%</div>
                    <div className="text-[10px] text-muted-foreground font-bold">{label}</div>
                  </div>
                ))}
              </div>
              {ship.mc_dropout && (
                <div className="mt-3 p-3 rounded-lg bg-muted/10 border border-border/30 text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground">MC Dropout Confidence: </span>
                  Mean {ship.mc_dropout.mean}% · 95% CI [{ship.mc_dropout.lower}% – {ship.mc_dropout.upper}%]
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Network */}
          {ship.network && (
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Risk Propagation Network
                </CardTitle>
                <CardDescription className="text-xs">NetworkX graph — node colour = risk level, edge thickness = congestion.</CardDescription>
              </CardHeader>
              <CardContent>
                <RiskNetworkGraph {...ship.network} highlightId={ship.origin_hub} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── SHAP ── */}
        <TabsContent value="shap" className="animate-in fade-in duration-300">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> SHAP Feature Contributions
              </CardTitle>
              <CardDescription className="text-xs">XGBoost Tower 1 — additive explanation of the {ship.risk_score}% risk prediction.</CardDescription>
            </CardHeader>
            <CardContent>
              <SHAPWaterfall
                features={ship.shap_values}
                base={42}
                prediction={ship.risk_score}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TIMELINE ── */}
        <TabsContent value="timeline" className="animate-in fade-in duration-300">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Checkpoint Timeline
              </CardTitle>
              <CardDescription className="text-xs">ETA predictions per transit node with accumulated risk.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative pl-8 space-y-6">
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-border/30" />
                {(ship.checkpoints ?? []).map((cp, i) => {
                  const isCompleted = cp.status === 'completed';
                  const isCurrent = cp.status === 'current';
                  return (
                    <div key={i} className="relative flex gap-4 items-start">
                      <div className={`absolute -left-[25px] w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                        isCompleted ? 'bg-primary border-primary' :
                        isCurrent ? 'bg-yellow-400 border-yellow-400 animate-pulse' :
                        'bg-card border-border/40'
                      }`}>
                        {isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                        {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-yellow-900" />}
                      </div>
                      <div className={`flex-1 p-3 rounded-lg border transition-all ${isCurrent ? 'border-yellow-400/40 bg-yellow-400/5' : 'border-border/30 bg-card/20'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm">{cp.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{cp.time}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`font-black font-mono text-sm ${cp.risk >= 70 ? 'text-red-400' : cp.risk >= 40 ? 'text-yellow-400' : 'text-primary'}`}>
                              {cp.risk}%
                            </div>
                            {cp.eta_delta > 0 && <div className="text-[10px] text-muted-foreground">+{cp.eta_delta}h delay</div>}
                          </div>
                        </div>
                        <Progress value={cp.risk} className="h-1.5 mt-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI INTERVENTION ── */}
        <TabsContent value="intervention" className="space-y-4 animate-in fade-in duration-300">
          {/* Kimi K2.5 */}
          <Card className="bg-card/40 border-primary/20 border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> Kimi K2.5 AI Recommendation
                <Badge variant="outline" className="ml-auto text-[9px] text-primary border-primary/30">Live Analysis</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/90">{ship.kimi_recommendation}</p>
            </CardContent>
          </Card>

          {/* DiCE Counterfactuals */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> DiCE Counterfactual Interventions
              </CardTitle>
              <CardDescription className="text-xs">What-if scenarios that would lower risk below threshold.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(ship.dice_interventions ?? []).map((d, i) => (
                <div key={i} className={`p-4 rounded-xl border transition-all ${i === 0 ? 'border-primary/30 bg-primary/5' : 'border-border/30 bg-card/20'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {i === 0 && <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded-full">Recommended</span>}
                        <span className="font-semibold text-sm">{d.action}</span>
                      </div>
                      <div className="flex gap-4 mt-2 flex-wrap">
                        <span className="text-[11px] font-mono text-red-400 font-bold">
                          Risk: <span className="text-2xl">{d.risk_new}</span>%
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Cost: +₹{d.cost_delta_inr?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-primary font-bold">
                          Save: ₹{d.estimated_savings_inr?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          CO₂: +{d.co2_delta_kg}kg
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={accepted === i ? 'default' : 'outline'}
                      className={`shrink-0 text-xs ${accepted === i ? 'bg-primary text-primary-foreground' : 'border-border/40'}`}
                      onClick={() => handleAccept(i)}
                      disabled={accepting !== null || accepted !== null}
                    >
                      {accepting === i ? <Loader2 className="w-3 h-3 animate-spin" /> : accepted === i ? '✓ Accepted' : 'Accept'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HISTORY ── */}
        <TabsContent value="history" className="animate-in fade-in duration-300">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Intervention & Event Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(ship.history ?? []).map((h, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 rounded-lg border border-border/30 bg-card/20">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      h.outcome === 'Alert' ? 'bg-red-400' :
                      h.outcome === 'Pending' ? 'bg-yellow-400' : 'bg-primary'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{h.action}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{h.date} · {h.actor}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{h.outcome}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
