/**
 * Guardian API Service Layer
 * All frontend → backend communication goes through here.
 * Base URL auto-detects dev vs prod.
 */

export const API_BASE = 'http://localhost:8000';
export const WS_BASE  = 'ws://localhost:8000';

// ─── Generic fetch helper ──────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchDashboardOverview = () =>
  apiFetch('/api/dashboard/overview');

// ─── Shipments ─────────────────────────────────────────────────────────────────
export const fetchShipments = () =>
  apiFetch('/api/shipments/');

export const fetchShipmentDetail = (id) =>
  apiFetch(`/api/shipments/${id}`);

export const fetchShipmentSHAP = (id) =>
  apiFetch(`/api/shipments/${id}/shap`);

export const fetchShipmentTimeline = (id) =>
  apiFetch(`/api/shipments/${id}/timeline`);

export const fetchShipmentIntervention = (id) =>
  apiFetch(`/api/shipments/${id}/intervention`, { method: 'POST', body: '{}' });

export const acceptIntervention = (id, payload) =>
  apiFetch(`/api/shipments/${id}/intervention`, { method: 'POST', body: JSON.stringify(payload) });

export const overrideIntervention = (id) =>
  apiFetch(`/api/shipments/${id}/override`, { method: 'POST', body: '{}' });

export const fetchNetworkGraph = () =>
  apiFetch('/api/shipments/network');

// ─── Chaos Lab ─────────────────────────────────────────────────────────────────
export const fetchChaosPresets = () =>
  apiFetch('/api/chaos/presets');

export const injectChaos = (params) =>
  apiFetch('/api/chaos/inject', { method: 'POST', body: JSON.stringify(params) });

export const fetchBaselineNetwork = () =>
  apiFetch('/api/chaos/network');

// ─── Ports ─────────────────────────────────────────────────────────────────────
export const fetchPorts = () =>
  apiFetch('/api/ports/');

export const fetchPortVessels = () =>
  apiFetch('/api/ports/vessels');

export const fetchPortKpis = () =>
  apiFetch('/api/ports/kpis');

// ─── Analytics ─────────────────────────────────────────────────────────────────
export const fetchAnalyticsSummary = () =>
  apiFetch('/api/analytics/summary');

// ─── Settings ──────────────────────────────────────────────────────────────────
export const fetchSettings = () =>
  apiFetch('/api/settings/');

export const updateSettings = (payload) =>
  apiFetch('/api/settings/', { method: 'PUT', body: JSON.stringify(payload) });

// ─── Shipment Detail Sub-endpoints ─────────────────────────────────────────────
export const fetchShipmentDiCE = (id) =>
  apiFetch(`/api/shipments/${id}/dice`);

export const fetchShipmentKimi = (id) =>
  apiFetch(`/api/shipments/${id}/kimi`);

// ─── Health Check ──────────────────────────────────────────────────────────────
export const fetchHealthCheck = () =>
  apiFetch('/api/health');

// ─── WebSocket — Live Risk Updates ────────────────────────────────────────────
/**
 * Opens WebSocket connection to /ws/risk-updates.
 * Calls `onMessage(data)` on each message.
 * Returns a cleanup function.
 */
export function connectRiskWebSocket(onMessage, onError) {
  const ws = new WebSocket(`${WS_BASE}/ws/risk-updates`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('WS parse error:', e);
    }
  };

  ws.onerror = (e) => {
    console.warn('Guardian WS error:', e);
    onError && onError(e);
  };

  ws.onclose = () => console.log('Guardian WS closed');

  return () => ws.readyState === WebSocket.OPEN && ws.close();
}

