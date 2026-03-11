import { useState } from 'react';
import { Anchor, AlertTriangle, TrendingUp, Ship, Clock, DollarSign, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

const PORTS = [
  { id: 'INNSA', name: 'Nhava Sheva (JNPT)', city: 'Mumbai',  congestion: 91, delay: 38, demurrage: 2400, vessels: 142, status: 'CRITICAL', trend: 'up' },
  { id: 'INCHP', name: 'Chennai Port',        city: 'Chennai', congestion: 84, delay: 26, demurrage: 1800, vessels: 98,  status: 'HIGH',     trend: 'up' },
  { id: 'INKTP', name: 'Kolkata (Haldia)',     city: 'Kolkata', congestion: 67, delay: 14, demurrage: 1200, vessels: 61,  status: 'MODERATE', trend: 'down' },
  { id: 'INPAV', name: 'Mundra Port',          city: 'Kutch',   congestion: 58, delay: 10, demurrage: 900,  vessels: 84,  status: 'MODERATE', trend: 'up' },
  { id: 'INIXZ', name: 'Kochi Port',           city: 'Kochi',   congestion: 42, delay: 6,  demurrage: 600,  vessels: 44,  status: 'LOW',      trend: 'down' },
  { id: 'INVTZ', name: 'Visakhapatnam',        city: 'Vizag',   congestion: 39, delay: 5,  demurrage: 500,  vessels: 37,  status: 'LOW',      trend: 'stable' },
  { id: 'INMAA', name: 'Ennore Port',          city: 'Chennai', congestion: 28, delay: 3,  demurrage: 400,  vessels: 22,  status: 'CLEAR',    trend: 'down' },
];

const VESSELS = [
  { id: 'MV GUARDIAN-7',  port: 'Nhava Sheva', type: 'Container', eta: 'Mar 12, 14:00', status: 'DELAYED',  delay: '+8h',  cargo: '₹18.4L' },
  { id: 'MV TRADE WIND',  port: 'Chennai',     type: 'Bulk',      eta: 'Mar 12, 09:00', status: 'ON TIME',  delay: '—',    cargo: '₹6.2L'  },
  { id: 'MV DELTA STAR',  port: 'Nhava Sheva', type: 'RORO',      eta: 'Mar 13, 06:00', status: 'DELAYED',  delay: '+14h', cargo: '₹31.7L' },
  { id: 'MV KOCHI PEARL', port: 'Kochi',       type: 'Container', eta: 'Mar 12, 20:00', status: 'ON TIME',  delay: '—',    cargo: '₹4.1L'  },
  { id: 'MV SEA BREEZE',  port: 'Mundra',      type: 'Bulk',      eta: 'Mar 14, 11:00', status: 'AT RISK',  delay: '+3h',  cargo: '₹9.8L'  },
];

const STATUS_STYLE = {
  CRITICAL: 'text-red-400 border-red-400/30',
  HIGH:     'text-orange-400 border-orange-400/30',
  MODERATE: 'text-yellow-400 border-yellow-400/30',
  LOW:      'text-primary border-primary/30',
  CLEAR:    'text-muted-foreground border-border/40',
};

const congColor = (v) => v >= 80 ? '#f87171' : v >= 55 ? '#facc15' : '#84cc16';

export default function Ports() {
  const [search, setSearch] = useState('');
  const filtered = PORTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase()));
  const kpis = [
    { label: 'Critical Ports',  value: PORTS.filter(p => ['CRITICAL','HIGH'].includes(p.status)).length, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Avg Congestion',  value: `${Math.round(PORTS.reduce((s,p)=>s+p.congestion,0)/PORTS.length)}%`, icon: TrendingUp, color: 'text-yellow-400' },
    { label: 'Vessels Tracked', value: PORTS.reduce((s,p)=>s+p.vessels,0), icon: Ship, color: 'text-primary' },
    { label: 'Max Demurrage',   value: '₹2,400/d', icon: DollarSign, color: 'text-primary' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full overflow-hidden shrink-0">
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Anchor className="w-6 h-6 text-primary" /> Port Intelligence Monitor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time congestion, demurrage risk, and vessel tracking across Indian ports.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="bg-card/40 border-border/40">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <k.icon className={`w-4 h-4 ${k.color}`} />
                <Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground">LIVE</Badge>
              </div>
              <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="congestion" className="space-y-6">
        <TabsList className="bg-card/50 border border-border/50 p-1 flex-wrap h-auto gap-1">
          {['congestion','chart','vessels','demurrage'].map(t => (
            <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
              {t === 'congestion' ? 'Congestion Table' : t === 'chart' ? 'Congestion Chart' : t === 'vessels' ? 'Vessel Tracker' : 'Demurrage'}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="congestion" className="space-y-4 animate-in fade-in duration-500">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search port…" value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 bg-card/40 border-border/40 text-sm" />
          </div>
          <Card className="border-border/40 bg-card/30 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  {['Port','Status','Congestion','Avg Delay','Vessels','Demurrage/day'].map(h=>(
                    <TableHead key={h} className={`text-[11px] uppercase tracking-wider ${h==='Demurrage/day'?'text-right':''}`}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(port => (
                  <TableRow key={port.id} className="border-border/30 hover:bg-primary/5 cursor-pointer">
                    <TableCell>
                      <div className="font-semibold text-sm">{port.name}</div>
                      <div className="text-xs text-muted-foreground">{port.city} · {port.id}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] font-bold ${STATUS_STYLE[port.status]}`}>{port.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-28">
                        <Progress value={port.congestion} className="h-1.5 flex-1" />
                        <span className="text-xs font-mono font-bold" style={{color:congColor(port.congestion)}}>{port.congestion}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-bold ${port.delay>20?'text-red-400':port.delay>10?'text-yellow-400':'text-muted-foreground'}`}>+{port.delay}h</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{port.vessels}</span>
                        {port.trend==='up'&&<ChevronUp className="w-3 h-3 text-red-400"/>}
                        {port.trend==='down'&&<ChevronDown className="w-3 h-3 text-primary"/>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-yellow-400">₹{port.demurrage.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="animate-in fade-in duration-500">
          <Card className="bg-card/30 border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Port Congestion Index</CardTitle>
              <CardDescription className="text-xs">🔴 Critical ≥80%  🟡 Moderate ≥55%  🟢 Clear below 55%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={PORTS} margin={{top:10,right:10,left:-20,bottom:60}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#666',fontSize:10,textAnchor:'end'}} angle={-35} interval={0}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fill:'#666',fontSize:10}} tickFormatter={v=>`${v}%`} domain={[0,100]}/>
                    <Tooltip contentStyle={{background:'var(--popover)',border:'1px solid var(--border)',borderRadius:'8px',fontSize:12}} formatter={v=>[`${v}%`,'Congestion']}/>
                    <Bar dataKey="congestion" radius={[4,4,0,0]} barSize={40}>
                      {PORTS.map((p,i)=><Cell key={i} fill={congColor(p.congestion)}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vessels" className="animate-in fade-in duration-500">
          <Card className="border-border/40 bg-card/30 overflow-x-auto">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2"><Ship className="w-4 h-4 text-primary"/>Live Vessel Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    {['Vessel','Port','Type','ETA','Status','Cargo Value'].map(h=>(
                      <TableHead key={h} className={`text-[11px] uppercase tracking-wider ${h==='Cargo Value'?'text-right':''}`}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {VESSELS.map(v=>(
                    <TableRow key={v.id} className="border-border/30 hover:bg-primary/5">
                      <TableCell className="font-bold font-mono text-sm">{v.id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.port}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground">{v.type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.eta}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-mono ${v.status==='DELAYED'?'text-red-400 border-red-400/30':v.status==='AT RISK'?'text-yellow-400 border-yellow-400/30':'text-primary border-primary/30'}`}>
                          {v.status} {v.delay!=='—'?v.delay:''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm text-primary">{v.cargo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demurrage" className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2"><DollarSign className="w-4 h-4 text-yellow-400"/>Demurrage Exposure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {PORTS.filter(p=>p.congestion>40).map(port=>{
                  const days = Math.max(1, Math.round(port.delay/8));
                  const total = port.demurrage * days;
                  return (
                    <div key={port.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                      <div>
                        <div className="text-sm font-semibold">{port.name}</div>
                        <div className="text-xs text-muted-foreground">₹{port.demurrage.toLocaleString()}/day × ~{days} day{days>1?'s':''}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-yellow-400 font-mono">₹{total.toLocaleString()}</div>
                        <Badge variant="outline" className={`text-[10px] mt-1 ${STATUS_STYLE[port.status]}`}>{port.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20 flex flex-col items-center justify-center text-center p-8 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-primary"/>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Total Weekly Exposure</div>
                <div className="text-5xl font-black text-primary tracking-tighter">₹8.4L</div>
                <div className="text-sm text-muted-foreground mt-2">Across 4 congested ports this week</div>
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 mt-2">
                <AlertTriangle className="w-4 h-4"/> Export Demurrage Report
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
