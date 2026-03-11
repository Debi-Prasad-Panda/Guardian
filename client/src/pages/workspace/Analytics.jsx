import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Target, Brain, ShieldCheck, Zap } from 'lucide-react';


const SAVINGS_DATA = [
  { day: 'Mon', savings: 120000, interventions: 8 },
  { day: 'Tue', savings: 98000, interventions: 6 },
  { day: 'Wed', savings: 210000, interventions: 14 },
  { day: 'Thu', savings: 175000, interventions: 11 },
  { day: 'Fri', savings: 340000, interventions: 22 },
  { day: 'Sat', savings: 88000, interventions: 5 },
  { day: 'Sun', savings: 218000, interventions: 13 },
];

const CARRIER_DATA = [
  { name: 'Blue Dart', onTime: 94, delayed: 6, cancellations: 1, volume: 'High' },
  { name: 'DHL', onTime: 91, delayed: 8, cancellations: 1.5, volume: 'Medium' },
  { name: 'FedEx IN', onTime: 88, delayed: 10, cancellations: 2, volume: 'High' },
  { name: 'DTDC', onTime: 79, delayed: 18, cancellations: 3, volume: 'Medium' },
];

const MODEL_METRICS = [
  { label: 'AUC-ROC', value: '0.841', color: 'text-primary', icon: Brain, desc: 'XGBoost Robustness' },
  { label: 'F1 Score', value: '0.89', color: 'text-primary', icon: Target, desc: 'Calibrated Precision' },
  { label: 'Recall', value: '0.87', color: 'text-risk-warning', icon: Zap, desc: 'Delay Capture' },
  { label: 'Coverage', value: '90%', color: 'text-primary', icon: ShieldCheck, desc: 'Conformal Sets' },
];

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
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MODEL_METRICS.map((m, i) => (
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
                    <AreaChart data={SAVINGS_DATA}>
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
                    <BarChart data={SAVINGS_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} tickFormatter={v => `₹${v/1000}K`} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                      <Bar dataKey="savings" name="Savings" radius={[4, 4, 0, 0]}>
                        {SAVINGS_DATA.map((entry, index) => (
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
                      <TableHead>On-Time Rate</TableHead>
                      <TableHead>Avg. Delay</TableHead>
                      <TableHead>Load Volume</TableHead>
                      <TableHead className="text-right">Risk Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CARRIER_DATA.map((c) => (
                      <TableRow key={c.name} className="border-border/40 hover:bg-primary/5">
                        <TableCell className="font-bold">{c.name}</TableCell>
                        <TableCell className="text-primary font-mono">{c.onTime}%</TableCell>
                        <TableCell className="text-muted-foreground">{c.delayed}%</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px] uppercase border-border/50">{c.volume}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          <div className="flex justify-end gap-1">
                            {Array.from({length: 5}).map((_, i) => (
                              <div key={i} className={`w-1.5 h-3 rounded-full ${i < Math.round(c.onTime/20) ? 'bg-primary' : 'bg-muted'}`} />
                            ))}
                          </div>
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

