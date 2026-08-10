import request, { requestBlob } from "./client";

const BASE = "/api/targets";

function q(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.append(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const targetsAPI = {
  // KPIs — accept period params (year+week or year+month)
  revenueKpi:           (p = {}) => request(`${BASE}/revenue/kpi/${q(p)}`),
  registrationKpi:      (p = {}) => request(`${BASE}/registrations/kpi/${q(p)}`),

  // Branch breakdowns — accept period params
  revenueBranches:      (p = {}) => request(`${BASE}/revenue/branches/${q(p)}`),
  registrationBranches: (p = {}) => request(`${BASE}/registrations/branches/${q(p)}`),

  // Trends — always historical, no period filter
  revenueTrend:         (p = {}) => request(`${BASE}/revenue/trend/${q(p)}`),
  registrationTrend:    (p = {}) => request(`${BASE}/registrations/trend/${q(p)}`),

  // Summary table — accept period params
  summary:              (p = {}) => request(`${BASE}/summary/${q(p)}`),

  // Target CRUD (admin only)
  getRevenueTargets:    ()       => request(`${BASE}/revenue/`),
  setRevenueTarget:     (data)   => request(`${BASE}/revenue/`, { method: "POST", body: JSON.stringify(data) }),
  getRegTargets:        ()       => request(`${BASE}/registrations/`),
  setRegTarget:         (data)   => request(`${BASE}/registrations/`, { method: "POST", body: JSON.stringify(data) }),

  // Export — branch param persisted here too
  export: (p = {}) => requestBlob(`${BASE}/export/${q(p)}`, "targets_summary.xlsx"),
  // Server-side current period (year, week, month in Africa/Nairobi time)
  currentPeriod: () => request(`${BASE}/current-period/`),
};
