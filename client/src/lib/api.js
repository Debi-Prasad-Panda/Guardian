/**
 * Guardian API utility — centralized fetch helpers
 */

const BASE_URL = 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error(`[API] ${endpoint}:`, err.message);
    return null;
  }
}

// ── Dashboard ──
export const fetchDashboardOverview = () => request('/api/dashboard/overview');
export const fetchAnalyticsSummary = () => request('/api/analytics/summary');

// ── Shipments ──
export const fetchShipments = () => request('/api/shipments');
export const fetchShipment = (id) => request(`/api/shipments/${id}`);
export const fetchShipmentShap = (id) => request(`/api/shipments/${id}/shap`);
export const fetchShipmentTimeline = (id) => request(`/api/shipments/${id}/timeline`);
export const fetchShipmentDice = (id) => request(`/api/shipments/${id}/dice`);
export const fetchShipmentKimi = (id) => request(`/api/shipments/${id}/kimi`);

// ── Chaos ──
export const fetchChaosPresets = () => request('/api/chaos/presets');
export const injectChaos = (params) =>
  request('/api/chaos/inject', {
    method: 'POST',
    body: JSON.stringify(params),
  });
/** Ripple-propagation for a single shipment node */
export const triggerRipple = (shipmentId, baseRisk = 0.78) =>
  request(`/api/chaos/ripple/${shipmentId}?base_risk=${baseRisk}`, { method: 'POST' });
/** Batch disruption — colours every node red simultaneously */
export const triggerBatchDisruption = (hub, severity) =>
  request(`/api/chaos/batch-disruption?hub=${encodeURIComponent(hub)}&severity=${severity}`, { method: 'POST' });

// ── Ports ──
export const fetchPorts = () => request('/api/ports');
export const fetchPortKpis = () => request('/api/ports/kpis');
export const fetchVessels = () => request('/api/ports/vessels');

// ── Network / Ripple ──
export const fetchNetwork = () => request('/api/shipments/network');
/** Graph-level summary: shipment count, connection count, high-risk node count */
export const fetchGraphSummary = () => request('/api/chaos/graph/summary');
export const fetchAnalyticsGraphSummary = () => request('/api/analytics/graph-summary');

// ── ML / Intervention ──
export const predictShipment = (shipmentId) =>
  request('/api/ml/predict-shipment', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shipmentId }),
  });

export const fetchIntervention = (shipmentId, horizonHours = 48) =>
  request('/api/ml/intervention', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: shipmentId,
      prediction_horizon: horizonHours,
      num_counterfactuals: 3
    }),
  });

export const fetchMLHealth = () => request('/api/ml/health');
export const fetchTower1Health = () => request('/api/ml/tower1/health');

// ── External / Live Data ──
export const fetchLiveContext = () => request('/api/external/live-context');
export const fetchWeather = () => request('/api/external/weather');

// ── WebSocket ──
export const createRiskSocket = (onMessage) => {
  const ws = new WebSocket('ws://localhost:8000/ws/risk-updates');
  ws.onmessage = (e) => onMessage(JSON.parse(e.data));
  ws.onerror = (e) => console.warn('[WS] error:', e);
  return ws;
};

// ── Health ──
export const checkHealth = () => request('/api/health');
