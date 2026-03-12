import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  AlertTriangle,
  ChevronRight,
  Check,
  MapPin,
  Cloud,
  Route,
  BarChart3,
  Sparkles,
  ShieldCheck,
  UserX,
  Info,
  TrendingDown,
  Zap,
} from "lucide-react";
import {
  fetchShipment,
  fetchShipmentShap,
  fetchShipmentTimeline,
  fetchShipmentDice,
  fetchShipmentKimi,
} from "../lib/api";

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [shap, setShap] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [dice, setDice] = useState(null);
  const [kimi, setKimi] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchShipment(id).then((d) => d && setShipment(d));
    fetchShipmentShap(id).then((d) => d && setShap(d));
    fetchShipmentTimeline(id).then((d) => d && setTimeline(d));
    fetchShipmentDice(id).then((d) => d && setDice(d));
    fetchShipmentKimi(id).then((d) => d && setKimi(d));
  }, [id]);

  const risk = shipment
    ? Math.round((shipment.risk ?? 0.87) * 100)
    : dice?.baseline_risk != null
      ? Math.round(dice.baseline_risk * 100)
      : 87;
  const shipId = shipment?.id ?? id ?? "SHP-99283-IND";

  const shapValues = shap?.shap_values ?? [
    { feature: "Weather Severity", impact: 0.24, direction: "positive" },
    { feature: "Carrier Reliability", impact: -0.18, direction: "negative" },
    { feature: "Port Congestion", impact: 0.09, direction: "positive" },
  ];

  const checkpoints = timeline?.timeline ?? [
    {
      name: "Mumbai Port (Origin)",
      status: "completed",
      time: "Departure: Oct 12, 04:30 AM",
    },
    {
      name: "Dubai Transit Hub",
      status: "delayed",
      time: "Estimated Delay: 34 Hours",
      tags: ["DELAYED", "WEATHER"],
      vessel: "Ever Apex V.024",
    },
    {
      name: "London Gateway (Destination)",
      status: "pending",
      time: "Projected: Oct 19, 11:00 PM",
    },
  ];

  // DiCE interventions from API (new structure)
  const interventions = dice?.dice_interventions ?? [
    { label: "Use FedEx-2 (Optimal)", optimal: true },
    { label: "Wait 24h & Re-route", optimal: false },
    { label: "Switch to Rail Link", optimal: false },
  ];

  // Kimi K2.5 recommendation from API
  const kimiRec = kimi?.kimi_recommendation;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Breadcrumbs & Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <Link to="/" className="hover:text-white transition-colors">
            Shipments
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-dash-accent">{shipId}</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Shipment Detail: {shipId}
        </h2>
        <p className="text-gray-500 text-sm">
          Real-time predictive risk analysis and AI intervention recommendation
        </p>
      </div>

      {/* Risk Hero Card */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
        <div className="relative z-10">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-dash-accent/20 border border-dash-accent/30 text-dash-accent text-[10px] font-bold uppercase tracking-wider mb-6">
            Prediction interval: {risk - 8}% - {Math.min(risk + 8, 99)}%
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
              Calculated High Risk
            </p>
            <h3 className="text-6xl font-black text-white tracking-tighter">
              Risk Score: {risk}%{" "}
              <span className="text-3xl font-medium text-gray-400">± 5%</span>
            </h3>
          </div>
          <p className="text-gray-300 mt-4 max-w-xl text-lg leading-relaxed">
            Immediate action recommended to avoid{" "}
            <span className="text-dash-risk font-semibold underline decoration-dash-risk/30 underline-offset-4">
              SLA breach
            </span>{" "}
            at London Gateway Hub.
          </p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
          <AlertTriangle className="w-44 h-44 text-dash-accent" />
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Checkpoint Timeline */}
        <div className="col-span-12 lg:col-span-5 glass-card rounded-3xl p-6">
          <h4 className="text-sm font-semibold text-white mb-8 flex items-center gap-2">
            <Route className="w-5 h-5 text-dash-accent" />
            Checkpoint Timeline
          </h4>
          <div className="space-y-0 px-2">
            {checkpoints.map((cp, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      cp.status === "completed"
                        ? "bg-dash-green ring-4 ring-dash-green/10"
                        : cp.status === "delayed"
                          ? "bg-dash-risk ring-4 ring-dash-risk/20"
                          : "bg-gray-800 border border-gray-700"
                    }`}
                  >
                    {cp.status === "completed" && (
                      <Check className="w-3 h-3 text-black" />
                    )}
                    {cp.status === "delayed" && (
                      <AlertTriangle className="w-3 h-3 text-white" />
                    )}
                    {cp.status === "pending" && (
                      <MapPin className="w-3 h-3 text-gray-500" />
                    )}
                  </div>
                  {i < checkpoints.length - 1 && (
                    <div
                      className={`w-0.5 h-12 ${
                        cp.status === "completed"
                          ? "bg-dash-green/30"
                          : "border-l-2 border-dashed border-gray-700"
                      }`}
                    />
                  )}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-bold ${cp.status === "delayed" ? "text-dash-risk" : cp.status === "pending" ? "text-gray-500" : "text-white"}`}
                    >
                      {cp.name}
                    </p>
                    {cp.tags && (
                      <div className="flex gap-1">
                        {cp.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
                              tag === "DELAYED"
                                ? "bg-dash-risk/20 text-dash-risk"
                                : "bg-orange-500/20 text-orange-400"
                            }`}
                          >
                            {tag === "WEATHER" && (
                              <Cloud className="w-2 h-2 inline mr-0.5" />
                            )}
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{cp.time}</p>
                  {cp.vessel && (
                    <p className="text-[10px] text-gray-400 mt-1 italic">
                      Vessel: {cp.vessel}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Drivers (SHAP) */}
        <div className="col-span-12 lg:col-span-7 glass-card rounded-3xl p-6">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-dash-accent" />
              Risk Drivers (SHAP Analysis)
            </h4>
            <Info className="w-4 h-4 text-gray-500 cursor-help" />
          </div>
          <div className="space-y-8">
            {shapValues.map((sv) => {
              const absImpact = Math.abs(sv.impact);
              const widthPct = Math.round(absImpact * 300);
              const isPositive = sv.impact > 0 || sv.direction === "positive";
              return (
                <div key={sv.feature} className="space-y-3">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                    <span className="text-gray-400">{sv.feature}</span>
                    <span
                      className={
                        isPositive ? "text-dash-risk" : "text-dash-green"
                      }
                    >
                      {isPositive ? "+" : ""}
                      {sv.impact.toFixed(2)} Impact
                    </span>
                  </div>
                  <div
                    className={`h-2.5 w-full bg-white/5 rounded-full overflow-hidden ${!isPositive ? "flex justify-end" : ""}`}
                  >
                    <div
                      className={`h-full rounded-full ${
                        isPositive
                          ? "bg-dash-risk shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                          : "bg-dash-green shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      }`}
                      style={{ width: `${Math.min(widthPct, 90)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Intervention Engine */}
      <div className="glass-card rounded-3xl p-8 border border-dash-accent/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-dash-accent text-black text-[10px] font-black uppercase tracking-tighter rounded-bl-xl shadow-lg">
          AI Recommendation Engine
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-dash-accent flex items-center justify-center text-black glow-teal">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white tracking-tight">
                Recommended Intervention
              </h4>
              <p className="text-dash-accent font-semibold text-sm">
                Assign Alternative Carrier (FedEx-2) • Priority Express
              </p>
            </div>
          </div>

          {/* Metric sub-cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                Action Cost
              </p>
              <h5 className="text-3xl font-bold text-white tracking-tight">
                ₹12,000
              </h5>
              <p className="text-[10px] text-gray-500 mt-1">
                Expedited Handling Fee
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                SLA Saved
              </p>
              <h5 className="text-3xl font-bold text-dash-green tracking-tight">
                ₹85,000
              </h5>
              <p className="text-[10px] text-gray-500 mt-1">
                Potential Penalty Avoided
              </p>
            </div>
            <div className="bg-dash-accent/10 border border-dash-accent/20 rounded-2xl p-6">
              <p className="text-dash-accent text-[10px] font-bold uppercase tracking-widest mb-2">
                Net Saving
              </p>
              <h5 className="text-3xl font-bold text-white tracking-tight">
                ₹73,000
              </h5>
              <p className="text-[10px] text-dash-accent/70 mt-1">
                Total Economic Gain
              </p>
            </div>
          </div>

          {/* DiCE Counterfactuals — with real risk reduction */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-dash-green" />
              What-If Scenarios (DiCE Counterfactuals)
            </p>
            <div className="flex flex-wrap gap-3">
              {interventions.map((int, idx) => (
                <button
                  key={int.label || idx}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    int.optimal
                      ? "bg-dash-accent text-black shadow-lg shadow-dash-accent/20 hover:scale-[1.02]"
                      : "bg-white/5 border border-white/10 text-gray-300 font-semibold hover:bg-white/10"
                  }`}
                >
                  {int.label}
                  {int.risk_reduction != null && (
                    <span className="ml-2 text-[10px] opacity-70">
                      (-{Math.round(int.risk_reduction * 100)}%)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
            <button className="flex-1 h-14 bg-dash-accent hover:bg-dash-accent/90 text-black rounded-2xl font-black text-lg shadow-xl shadow-dash-accent/20 flex items-center justify-center gap-3 transition-all active:scale-95">
              <ShieldCheck className="w-6 h-6" />
              Accept AI Action
            </button>
            <button className="flex-1 h-14 bg-transparent border-2 border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-3">
              <UserX className="w-6 h-6" />
              Human Override
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
          Powered by Gemini Pro + DiCE Early Warning Engine
        </p>
      </footer>
    </div>
  );
}
