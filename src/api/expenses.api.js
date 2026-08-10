import request, { requestBlob } from "./client";

const BASE = "/api/expenses";

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((item) => q.append(k, item));
    else if (v !== undefined && v !== null && v !== "") q.append(k, v);
  }
  return q.toString();
}

export const expensesAPI = {
  // ── Categories ────────────────────────────────────────────────────────────
  categories:     (params = {}) => request(`${BASE}/categories/?${buildQuery(params)}`),
  createCategory: (data)        => request(`${BASE}/categories/`, { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id, data)    => request(`${BASE}/categories/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCategory: (id)          => request(`${BASE}/categories/${id}/`, { method: "DELETE" }),

  // ── Expenses CRUD ─────────────────────────────────────────────────────────
  list:   (params = {}) => request(`${BASE}/?${buildQuery(params)}`),
  get:    (id)          => request(`${BASE}/${id}/`),
  create: (data)        => request(`${BASE}/`, { method: "POST", body: JSON.stringify(data) }),
  update: (id, data)    => request(`${BASE}/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id)          => request(`${BASE}/${id}/`, { method: "DELETE" }),

  // ── Analytics ─────────────────────────────────────────────────────────────
  profitabilityKpi:    (params = {}) => request(`${BASE}/analytics/profitability-kpi/?${buildQuery(params)}`),
  branchProfitability: (params = {}) => request(`${BASE}/analytics/branch-profitability/?${buildQuery(params)}`),
  generalExpenses:     (params = {}) => request(`${BASE}/analytics/general-expenses/?${buildQuery(params)}`),
  revenueTimeSeries:   (params = {}) => request(`${BASE}/analytics/revenue-time-series/?${buildQuery(params)}`),

  // ── Excel exports ────────────────────────────────────────────────────────────
  exportProfitability: (params = {}) => requestBlob(`${BASE}/export/profitability/?${buildQuery(params)}`, "profitability.xlsx"),
  exportExpenses:      (params = {}) => requestBlob(`${BASE}/export/expenses/?${buildQuery(params)}`, "expenses.xlsx"),

  // ── Shared ────────────────────────────────────────────────────────────────
  branches: () => request(`/api/reports/branches/`),
};