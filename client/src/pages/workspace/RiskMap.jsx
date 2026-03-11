import MapView from '../../components/workspace/MapView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Map, AlertCircle, Info, Activity } from 'lucide-react';

const MOCK_SHIPMENTS = [
  { id: 'SHP_001', route: 'Bangalore → Delhi', tier: 'CRITICAL', risk_score: 87, longitude: 77.2090, latitude: 28.6139 },
  { id: 'SHP_047', route: 'Mumbai → Chennai', tier: 'PRIORITY', risk_score: 52, longitude: 80.2707, latitude: 13.0827 },
  { id: 'SHP_093', route: 'Delhi → Kolkata', tier: 'STANDARD', risk_score: 18, longitude: 88.3639, latitude: 22.5726 },
  { id: 'SHP_112', route: 'Chennai → Pune', tier: 'CRITICAL', risk_score: 92, longitude: 73.8567, latitude: 18.5204 },
  { id: 'SHP_214', route: 'Kolkata → Mumbai', tier: 'PRIORITY', risk_score: 65, longitude: 72.8777, latitude: 19.0760 },
  { id: 'SHP_330', route: 'Hyderabad → Jaipur', tier: 'STANDARD', risk_score: 11, longitude: 75.7873, latitude: 26.9124 },
];

const HEATMAP_DATA = [
  { route: 'BLR→DEL', mon: 42, tue: 55, wed: 78, thu: 87, fri: 91 },
  { route: 'BOM→MAA', mon: 30, tue: 38, wed: 48, thu: 52, fri: 50 },
  { route: 'DEL→CCU', mon: 12, tue: 15, wed: 18, thu: 18, fri: 22 },
  { route: 'CHN→PNE', mon: 60, tue: 70, wed: 85, thu: 90, fri: 92 },
];

export default function RiskMap() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-140px)]">
        {/* Map View */}
        <Card className="lg:col-span-3 border-border/40 bg-card/30 backdrop-blur-sm relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between z-10 pointer-events-none">
             <div className="bg-background/80 backdrop-blur-md p-3 rounded-xl border border-border/50 shadow-2xl">
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <Map className="w-4 h-4 text-primary" />
                 LIVE GLOBAL RISK DISTRIBUTION
               </CardTitle>
               <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                 Last updated: Just now
               </CardDescription>
             </div>
             
             <div className="flex gap-4 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border/50">
               <LegendItem color="bg-destructive" label="CRITICAL" />
               <LegendItem color="bg-risk-warning" label="PRIORITY" />
               <LegendItem color="bg-primary" label="STANDARD" />
             </div>
          </CardHeader>
          <div className="absolute inset-0 z-0">
             <MapView shipments={MOCK_SHIPMENTS} />
          </div>
        </Card>

        {/* Intelligence Sidebar */}
        <div className="flex flex-col gap-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                <Activity className="w-4 h-4 text-primary" />
                Risk Tier Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <TierProgress tier="CRITICAL" count={2} total={6} color="bg-destructive" />
               <TierProgress tier="PRIORITY" count={2} total={6} color="bg-risk-warning" />
               <TierProgress tier="STANDARD" count={2} total={6} color="bg-primary" />
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl flex-1 overflow-hidden">
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-primary/10 py-1 rounded">
                Dynamic Heatmap (5D)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader>
                   <TableRow className="border-border/20 hover:bg-transparent">
                     <TableHead className="text-[10px] font-bold">ROUTE</TableHead>
                     <TableHead className="text-center text-[10px] font-bold">M</TableHead>
                     <TableHead className="text-center text-[10px] font-bold">W</TableHead>
                     <TableHead className="text-center text-[10px] font-bold">F</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {HEATMAP_DATA.map((row) => (
                     <TableRow key={row.route} className="border-border/10 hover:bg-primary/5">
                        <TableCell className="text-[10px] font-mono font-bold leading-none">{row.route}</TableCell>
                        <TableCell className="text-center">
                           <HeatCell value={row.mon} />
                        </TableCell>
                        <TableCell className="text-center">
                           <HeatCell value={row.wed} />
                        </TableCell>
                        <TableCell className="text-center">
                           <HeatCell value={row.fri} />
                        </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>

          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-pulse">
             <div className="flex items-center gap-2 text-destructive mb-1 text-xs font-bold">
                <AlertCircle size={14} />
                ANOMALY DETECTED
             </div>
             <p className="text-[10px] text-muted-foreground leading-relaxed">
                Inter-state congestion on **NH-44** causing ripple effect on 4 CRITICAL shipmetns.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeatCell({ value }) {
  const color = value >= 75 ? 'bg-destructive/80' : value >= 45 ? 'bg-risk-warning/80' : value >= 20 ? 'bg-primary/60' : 'bg-muted';
  return (
    <div className={`w-5 h-5 mx-auto rounded flex items-center justify-center text-[8px] font-black text-white ${color}`}>
       {value}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[9px] font-black tracking-widest">{label}</span>
    </div>
  );
}

function TierProgress({ tier, count, total, color }) {
  const value = (count / total) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black uppercase text-secondary-foreground">{tier}</span>
        <span className="text-[10px] font-mono text-muted-foreground">{count}/{total}</span>
      </div>
      <Progress value={value} className={`h-1 bg-muted ${color === 'bg-destructive' ? '[&>div]:bg-destructive' : color === 'bg-risk-warning' ? '[&>div]:bg-risk-warning' : '[&>div]:bg-primary'}`} />
    </div>
  );
}

