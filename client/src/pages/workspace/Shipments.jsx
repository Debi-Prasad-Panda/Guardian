import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { fetchShipments } from '@/services/api';
import { Search, Download, ChevronDown, ChevronUp, Filter, X, ArrowUpDown, MoreHorizontal, ExternalLink, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";

// Fallback static data in case backend is offline
const MOCK_SHIPMENTS = [
  { id: 'SHP_001', route: 'Bangalore → Delhi', carrier: 'Blue Dart', tier: 'CRITICAL', risk_score: 87, eta: '2026-03-13', value: 420000, weight_kg: 1240 },
  { id: 'SHP_047', route: 'Mumbai → Chennai', carrier: 'FedEx IN', tier: 'PRIORITY', risk_score: 52, eta: '2026-03-12', value: 180000, weight_kg: 320 },
  { id: 'SHP_093', route: 'Delhi → Kolkata', carrier: 'DTDC', tier: 'STANDARD', risk_score: 18, eta: '2026-03-14', value: 60000, weight_kg: 90 },
  { id: 'SHP_112', route: 'Chennai → Pune', carrier: 'DHL', tier: 'CRITICAL', risk_score: 92, eta: '2026-03-12', value: 710000, weight_kg: 2100 },
  { id: 'SHP_214', route: 'Kolkata → Mumbai', carrier: 'Blue Dart', tier: 'PRIORITY', risk_score: 65, eta: '2026-03-15', value: 230000, weight_kg: 480 },
  { id: 'SHP_330', route: 'Hyderabad → Jaipur', carrier: 'DTDC', tier: 'STANDARD', risk_score: 11, eta: '2026-03-16', value: 40000, weight_kg: 60 },
  { id: 'SHP_451', route: 'Pune → Ahmedabad', carrier: 'FedEx IN', tier: 'PRIORITY', risk_score: 58, eta: '2026-03-13', value: 300000, weight_kg: 750 },
  { id: 'SHP_502', route: 'Delhi → Bangalore', carrier: 'DHL', tier: 'STANDARD', risk_score: 22, eta: '2026-03-17', value: 110000, weight_kg: 200 },
];

const TIER_ORDER = { CRITICAL: 0, PRIORITY: 1, STANDARD: 2 };

export default function Shipments() {
  const navigate = useNavigate();
  const [apiShipments, setApiShipments] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    fetchShipments()
      .then(data => { setApiShipments(data); setApiLoading(false); })
      .catch(() => { setApiShipments(MOCK_SHIPMENTS); setApiLoading(false); });
  }, []);

  const ALL_SHIPMENTS = apiLoading ? [] : apiShipments.map(s => ({
    ...s,
    risk: s.risk_score ?? s.risk,
    value: s.value >= 100000 ? `₹${(s.value/100000).toFixed(1)}L` : `₹${s.value}`,
    weight: `${s.weight_kg} kg`,
  }));
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('risk');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedShipment, setSelectedShipment] = useState(null);

  const filtered = useMemo(() => {
    let rows = ALL_SHIPMENTS.filter(s => {
      const matchSearch = !search || s.id.toLowerCase().includes(search.toLowerCase()) || s.route.toLowerCase().includes(search.toLowerCase()) || s.carrier.toLowerCase().includes(search.toLowerCase());
      const matchTier = tierFilter === 'ALL' || s.tier === tierFilter;
      return matchSearch && matchTier;
    });
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'tier') { av = TIER_ORDER[av]; bv = TIER_ORDER[bv]; }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return rows;
  }, [search, tierFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleExport = () => {
    const headers = 'ID,Route,Carrier,Tier,Risk %,ETA,Value,Weight\n';
    const rows = filtered.map(s => `${s.id},${s.route},${s.carrier},${s.tier},${s.risk},${s.eta},${s.value},${s.weight}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'guardian_shipments.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full overflow-hidden shrink-0">
      {/* Search & Statistics */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">Transit Monitor</h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Tracking {ALL_SHIPMENTS.length} active global assets</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9 border-border/40 text-xs font-bold uppercase">
               <Download className="w-3.5 h-3.5 mr-2" /> Export Inventory
            </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search ID, carrier, route..." 
                className="pl-10 h-10 border-border/30 bg-background/50 focus-visible:ring-primary/30"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              {['ALL', 'CRITICAL', 'PRIORITY', 'STANDARD'].map(t => (
                <Button 
                  key={t}
                  variant={tierFilter === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTierFilter(t)}
                  className={`h-8 text-[10px] uppercase font-black tracking-widest ${tierFilter === t ? 'bg-primary text-primary-foreground' : 'border-border/30'}`}
                >
                  {t === 'ALL' ? `Total (${ALL_SHIPMENTS.length})` : t}
                </Button>
              ))}
            </div>

            <div className="ml-auto text-xs text-muted-foreground font-mono">
               Showing {filtered.length} of {ALL_SHIPMENTS.length}
            </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="border-border/40 bg-card/40 overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40 hover:bg-transparent uppercase font-black">
              <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('id')}>
                ID <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('route')}>Route</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('tier')}>Tier</TableHead>
              <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort('risk')}>Risk Index</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} className="border-border/40 hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => navigate(`/workspace/shipments/${s.id}`)}>
                <TableCell className="font-mono font-bold text-xs">{s.id}</TableCell>
                <TableCell className="text-xs font-medium">{s.route}</TableCell>
                <TableCell className="text-xs text-muted-foreground uppercase">{s.carrier}</TableCell>
                <TableCell>
                  <Badge 
                    variant={s.tier === 'CRITICAL' ? 'destructive' : s.tier === 'PRIORITY' ? 'secondary' : 'outline'}
                    className="text-[9px] h-4 font-black tracking-tighter"
                  >
                    {s.tier}
                  </Badge>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-3">
                      <Progress 
                        value={s.risk} 
                        className={`h-1.5 w-full bg-muted ${s.risk >= 75 ? '[&>div]:bg-destructive' : s.risk >= 45 ? '[&>div]:bg-risk-warning' : '[&>div]:bg-primary'}`} 
                      />
                      <span className={`text-[10px] font-black font-mono w-8 ${s.risk >= 75 ? 'text-destructive' : s.risk >= 45 ? 'text-risk-warning' : 'text-primary'}`}>{s.risk}%</span>
                   </div>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">{s.value}</TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" className="group-hover:text-primary transition-colors">
                      <ChevronRight className="w-4 h-4" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="py-20 text-center space-y-3">
             <Package className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
             <p className="text-muted-foreground text-sm italic font-medium">No matching shipments found in the network.</p>
          </div>
        )}
      </Card>

      {/* Shipment Detail Sheet */}
      <Sheet open={!!selectedShipment} onOpenChange={(open) => !open && setSelectedShipment(null)}>
        <SheetContent className="w-[400px] border-l-border/30 bg-card/80 backdrop-blur-xl">
           {selectedShipment && (
             <div className="flex flex-col h-full py-6 gap-8 animate-in slide-in-from-right duration-500">
                <SheetHeader>
                   <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-primary/20 text-primary uppercase font-black text-[9px] tracking-widest px-2">Live Asset</Badge>
                      <Badge variant="outline" className="text-muted-foreground uppercase font-black text-[9px]">{selectedShipment.tier}</Badge>
                   </div>
                   <SheetTitle className="text-3xl font-black italic tracking-tighter uppercase">{selectedShipment.id}</SheetTitle>
                   <SheetDescription className="text-xs uppercase tracking-widest font-bold">Transit Insight & Recommendation</SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-4">
                   <StatItem label="Origin -> Destination" value={selectedShipment.route} />
                   <StatItem label="Carrier Entity" value={selectedShipment.carrier} />
                   <StatItem label="Estimated ETA" value={selectedShipment.eta} />
                   <StatItem label="Cargo Weight" value={selectedShipment.weight} />
                   <StatItem label="Asset Value" value={selectedShipment.value} />
                   <StatItem label="Risk Score" value={`${selectedShipment.risk}%`} />
                </div>

                <Separator className="bg-border/30" />

                <div className="space-y-4">
                   <h4 className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <Brain className="w-4 h-4" /> AI Predictive Intervention
                   </h4>
                   <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 relative">
                      <p className="text-sm leading-relaxed">
                        {selectedShipment.risk >= 75
                          ? '🚨 CRITICAL ANOMALY: Highly likely to miss destination window by 24h+. Recommend immediate re-routing via AIR-Express or secondary carrier assignment.'
                          : selectedShipment.risk >= 45
                          ? '⚠️ ELEVATED RISK: Weather bottleneck approaching near transit hub. Monitor sensor feeds and consider buffer slot booking.'
                          : '✅ OPTIMAL STATE: Routing efficiency at 98%. No manual intervention required at this stage.'}
                      </p>
                      <Button variant="link" className="text-xs p-0 h-auto mt-4 text-primary font-bold">
                         Deploy Mitigation Protocol <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                   </div>
                </div>

                <div className="mt-auto pt-6 flex flex-col gap-2">
                   <Button className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest italic h-12">Confirm Intervention</Button>
                   <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-xs h-12" onClick={() => setSelectedShipment(null)}>Close Monitoring</Button>
                </div>
             </div>
           )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="p-3 bg-background/40 border border-border/40 rounded-lg">
       <div className="text-[9px] font-black uppercase text-muted-foreground mb-1 tracking-widest">{label}</div>
       <div className="text-sm font-bold truncate leading-none">{value}</div>
    </div>
  );
}

function Separator({ className }) {
  return <div className={`h-px w-full ${className}`} />;
}

function Brain({ className }) {
  return <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54Z" />
  </svg>;
}

function ChevronRight({ className }) {
    return <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>;
}

