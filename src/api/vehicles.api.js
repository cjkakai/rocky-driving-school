import request from "./client";

const BASE = "/api/vehicles";

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.append(k, v);
  }
  return q.toString();
}

export const vehiclesAPI = {
  list: (params = {}) => request(`${BASE}/?${buildQuery(params)}`),
  get: (id) => request(`${BASE}/${id}/`),
  create: (data) => request(`${BASE}/`, { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`${BASE}/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`${BASE}/${id}/`, { method: "DELETE" }),
  stats: () => request(`${BASE}/stats/`),
  forReport: () => request(`${BASE}/for-report/`),
  tripAnalytics: (params = {}) => request(`${BASE}/analytics/trips/?${buildQuery(params)}`),
};
