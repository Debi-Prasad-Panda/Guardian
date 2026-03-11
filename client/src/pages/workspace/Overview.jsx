import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Package, TrendingUp, Activity, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fetchDashboardOverview, connectRiskWebSocket } from '@/services/api';

const TIER_STYLE = {
  CRITICAL: 'text-red-400 border-red-400/30 bg-red-400/10',
  PRIORITY: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  STANDARD: 'text-primary border-primary/30 bg-primary/10',
};

const RISK_COLOR = (r) => r >= 70 ? 'text-red-400' : r >= 40 ? 'text-yellow-400' : 'text-primary';

// Animated counter for the "Saved Today" number
function AnimatedCounter({ target, prefix = '₹', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  const formatted = display >= 100000
    ? `${prefix}${(display / 100000).toFixed(1)}L`
    : `${prefix}${display.toLocaleString('en-IN')}`;
  return <span>{formatted}{suffix}</span>;
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [liveRisks, setLiveRisks] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const cleanupRef = useRef(null);

  // Fetch dashboard overview data
  useEffect(() => {
    fetchDashboardOverview()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Connect WebSocket for live risk updates
  useEffect(() => {
    const cleanup = connectRiskWebSocket(
      (wsData) => {
        setWsConnected(true);
        if (wsData.type === 'risk_update') {
          const riskMap = {};
          wsData.updates.forEach(u => { riskMap[u.id] = u.risk; });
          setLiveRisks(riskMap);
        }
      },
      () => setWsConnected(false)
    );
    cleanupRef.current = cleanup;
    return () => cleanup && cleanup();
  }, []);

  const kpi = data?.kpi;
  const atRisk = kpi?.shipments_at_risk;
  const alerts = data?.recent_alerts ?? [];
  const heatmap = data?.horizon_heatmap ?? [];
  const topInt = data?.top_interventions ?? [];

  const kpiCards = loading ? [] : [
    {
      label: 'Active Alerts', icon: AlertTriangle, color: 'text-red-400', pulse: true,
      value: kpi?.active_alerts ?? '—',
      sub: 'Real-time from Guardian AI',
    },
    {
      label: 'Shipments At Risk', icon: Package, color: 'text-yellow-400', pulse: false,
      value: atRisk ? `${atRisk.count} / ${atRisk.total}` : '—',
      sub: 'Above risk threshold',
    },
    {
      label: 'Saved Today', icon: TrendingUp, color: 'text-primary', pulse: false,
      value: kpi ? <AnimatedCounter target={kpi.saved_today_inr} /> : '—',
      sub: '↑ via accepted interventions',
      wsLive: true,
    },
    {
      label: 'Model AUC', icon: Activity, color: 'text-primary', pulse: false,
      value: kpi?.model_confidence_auc?.toFixed(3) ?? '—',
      sub: '90% MAPIE conformal coverage',
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time supply chain intelligence across all active shipments.</p>
        </div>
        <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border ${wsConnected ? 'border-primary/30 text-primary bg-primary/5' : 'border-border/40 text-muted-foreground'}`}>
          {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {wsConnected ? 'Live' : 'Connecting…'}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <Card key={i} className="bg-card/40 border-border/40 animate-pulse"><CardContent className="p-5 h-28" /></Card>
            ))
          : kpiCards.map((k) => (
              <Card key={k.label} className="bg-card/40 border-border/40 hover:border-border/70 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-current/10 ${k.color}`}>
                      <k.icon className="w-4 h-4" />
                    </div>
                    {k.pulse && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />
                      </span>
                    )}
                    {k.wsLive && wsConnected && (
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">LIVE</Badge>
                    )}
                  </div>
                  <div className={`text-2xl font-black tracking-tight ${k.color}`}>{k.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium">{k.label}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">{k.sub}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Row 2: Alerts + Horizon Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Live Alert Feed
            </CardTitle>
            <CardDescription className="text-xs">Guardian AI flags — updated in real-time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {alerts.length === 0 && loading && (
              <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted/20 animate-pulse" />)}</div>
            )}
            {alerts.map(alert => {
              const liveRisk = liveRisks[alert.id] ?? alert.risk;
              return (
                <Link key={alert.id} to={`/workspace/shipments/${alert.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:border-border/60 hover:bg-card/60 transition-all group">
                  <div className={`w-1.5 h-10 rounded-full shrink-0 ${liveRisk >= 70 ? 'bg-red-400' : 'bg-yellow-400'} ${wsConnected ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs">{alert.id}</span>
                      <Badge variant="outline" className={`text-[9px] ${TIER_STYLE[alert.tier]}`}>{alert.tier}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{alert.route}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-sm font-black font-mono ${RISK_COLOR(liveRisk)}`}>{liveRisk}%</span>
                    <span className="text-[9px] text-muted-foreground">{alert.time}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors ml-1" />
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" asChild className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground">
              <Link to="/workspace/shipments">View all shipments →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Multi-Horizon Heatmap */}
        <Card className="bg-card/40 border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Multi-Horizon Risk Heatmap
            </CardTitle>
            <CardDescription className="text-xs">T+24h / T+48h / T+72h risk trajectory per shipment.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/30">
                    <th className="text-left pb-2 font-bold">Shipment</th>
                    <th className="text-center pb-2 font-bold">T+24h</th>
                    <th className="text-center pb-2 font-bold">T+48h</th>
                    <th className="text-center pb-2 font-bold">T+72h</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {(loading ? [] : heatmap).map(row => (
                    <tr key={row.id} className="border-b border-border/20 last:border-0 hover:bg-primary/5 transition-colors">
                      <td className="py-2 pr-2">
                        <div className="font-mono font-bold text-[11px]">{row.id}</div>
                        <div className="text-[9px] text-muted-foreground">{row.route}</div>
                      </td>
                      {[row.t24, row.t48, row.t72].map((risk, i) => (
                        <td key={i} className="py-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                            risk >= 70 ? 'bg-red-400/15 text-red-400' :
                            risk >= 40 ? 'bg-yellow-400/15 text-yellow-400' :
                            'bg-primary/15 text-primary'
                          }`}>{risk}%</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {loading && Array(4).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={4} className="py-2"><div className="h-6 bg-muted/20 animate-pulse rounded" /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Top Interventions */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Top Interventions Today
          </CardTitle>
          <CardDescription className="text-xs">Highest-impact actions recommended by Kimi K2.5 + DiCE.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {(loading ? [] : topInt).map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border/30 bg-card/20 hover:bg-card/40 transition-all">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.action}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-primary font-mono font-bold">−{item.risk_reduction}% risk</span>
                    <span className="text-[10px] text-muted-foreground">₹{(item.savings_inr / 100000).toFixed(1)}L saved</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${item.status === 'Accepted' ? 'text-primary border-primary/30' : 'text-yellow-400 border-yellow-400/30'}`}>
                  {item.status}
                </Badge>
              </div>
            ))}
            {loading && Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
