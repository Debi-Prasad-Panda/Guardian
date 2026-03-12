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

// ── Ports ──
export const fetchPorts = () => request('/api/ports');
export const fetchPortKpis = () => request('/api/ports/kpis');
export const fetchVessels = () => request('/api/ports/vessels');

// ── Network / Ripple ──
export const fetchNetwork = () => request('/api/shipments/network');

// ── Health ──
export const checkHealth = () => request('/api/health');
