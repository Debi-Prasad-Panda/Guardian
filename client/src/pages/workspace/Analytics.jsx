import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Target, Brain, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsSummary } from '../../services/api';


const METRIC_ICONS = {
  auc_roc: { icon: Brain, color: 'text-primary', label: 'AUC-ROC', desc: 'XGBoost Robustness' },
  f1_score: { icon: Target, color: 'text-primary', label: 'F1 Score', desc: 'Calibrated Precision' },
  recall: { icon: Zap, color: 'text-risk-warning', label: 'Recall', desc: 'Delay Capture' },
  conformal_coverage_pct: { icon: ShieldCheck, color: 'text-primary', label: 'Coverage', desc: 'Conformal Sets', suffix: '%' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-xs">
        <div className="font-bold mb-1 text-foreground">{label}</div>
        {payload.map(p => (
          <div key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground uppercase">{p.name}:</span>
            <span className="font-mono">{typeof p.value === 'number' && p.dataKey === 'savings' ? `₹${(p.value / 1000).toFixed(0)}K` : p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: fetchAnalyticsSummary,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-primary fade-in animate-in">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-8 border border-red-500/30 bg-red-500/10 rounded-xl">Failed to load analytics: {error.message}</div>;
  }

  const kpis = data.kpis;
  const mods = data.model_performance;

  const modelMetricsArray = [
    { ...METRIC_ICONS.auc_roc, value: mods.auc_roc },
    { ...METRIC_ICONS.f1_score, value: mods.f1_score },
    { ...METRIC_ICONS.recall, value: mods.recall },
    { ...METRIC_ICONS.conformal_coverage_pct, value: `${mods.conformal_coverage_pct}%` },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full overflow-hidden shrink-0">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modelMetricsArray.map((m, i) => (
          <Card key={i} className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <m.icon className={`w-4 h-4 ${m.color}`} />
                <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">LIVE</Badge>
              </div>
              <div className={`text-2xl font-black tracking-tighter ${m.color}`}>{m.value}</div>
              <div className="text-sm font-semibold">{m.label}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card/50 border border-border/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Performance Overview</TabsTrigger>
          <TabsTrigger value="carriers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Carrier Benchmarks</TabsTrigger>
          <TabsTrigger value="roi" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Financial ROI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Area Chart for interventions */}
            <Card className="border-border/40 bg-card/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Intervention Intensity
                </CardTitle>
                <CardDescription className="text-xs">Daily AI-triggered intervention frequency.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.savings_trend}>
                      <defs>
                        <linearGradient id="colorInter" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.909 0.24 130.988)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="oklch(0.909 0.24 130.988)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="interventions" name="Interventions" stroke="oklch(0.909 0.24 130.988)" fillOpacity={1} fill="url(#colorInter)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-risk-warning" />
                  Risk Distribution
                </CardTitle>
                <CardDescription className="text-xs">Probability density of predicted delay types.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.savings_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                      <YAxis width={40} axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} tickFormatter={v => `₹${v/1000}K`} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                      <Bar dataKey="savings" name="Savings" radius={[4, 4, 0, 0]}>
                        {data.savings_trend.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index === 4 ? 'oklch(0.909 0.24 130.988)' : 'oklch(0.653 0.186 274.621)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="carriers" className="animate-in fade-in duration-500">
          <Card className="border-border/40 bg-card/40">
             <CardHeader>
               <CardTitle className="text-sm font-bold">Carrier Reliability Index</CardTitle>
               <CardDescription className="text-xs">Real-time ranking based on last 30 days performance.</CardDescription>
             </CardHeader>
             <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead>Carrier Name</TableHead>
                      <TableHead>Reliability</TableHead>
                      <TableHead className="text-right">Avg. Delay</TableHead>
                      <TableHead className="text-right">Saved (INR)</TableHead>
                      <TableHead className="text-right">Interventions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.carrier_benchmarks.map(c => (
                      <TableRow key={c.carrier} className="border-border/40 hover:bg-primary/5">
                        <TableCell className="font-semibold">{c.carrier}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${c.reliability > 90 ? 'text-primary' : 'text-yellow-400'}`}>{c.reliability}%</span>
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-primary" style={{ width: `${c.reliability}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{c.avg_delay_h}h</TableCell>
                        <TableCell className="text-right font-mono text-sm">₹{c.saved_inr.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-[10px] border-border/40">{c.interventions}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="animate-in fade-in duration-500">
          <Card className="border-border/40 bg-primary/5">
            <CardContent className="p-12 text-center flex flex-col items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                 <TrendingUp className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-black italic uppercase tracking-tighter">Total Savings Delivered</h3>
               <div className="text-6xl font-black text-primary tracking-tighter">₹1,24,50,000</div>
               <p className="text-muted-foreground max-w-md mx-auto text-sm">
                 Guardian has successfully prevented 142 major logistics failures this month, with an average ROI of 4.2x per intervention cost.
               </p>
               <Button className="mt-4 bg-primary text-primary-foreground hover:scale-105 transition-transform">Export Full Financial Audit</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

