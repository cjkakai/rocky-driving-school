import request, { requestBlob } from "./client";

const BASE = "/api/reports";

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (Array.isArray(v)) v.forEach((item) => q.append(k, item));
    else if (v !== undefined && v !== null && v !== "") q.append(k, v);
  }
  return q.toString();
}

export const reportsAPI = {
  // ── Core CRUD ─────────────────────────────────────────────────────────────
  daily:   (date)   => request(`${BASE}/daily/?date=${date}`),
  list:    (params) => request(`${BASE}/?${buildQuery(params)}`),
  get:     (id)     => request(`${BASE}/${id}/`),
  create:  (data)   => request(`${BASE}/`, { method: "POST", body: JSON.stringify(data) }),
  preview: (params) => request(`${BASE}/preview/?${buildQuery(params)}`),

  // ── Drilldown ─────────────────────────────────────────────────────────────
  drilldown: (id, metric, extra = {}) =>
    request(`${BASE}/${id}/drilldown/?${buildQuery({ metric, ...extra })}`),

  /**
   * Returns trip entries for a specific report.
   * Used by ReportDetailPanel to show the per-vehicle trip breakdown.
   * Returns: [{ vehicle_registration, vehicle_name, number_of_students }]
   */
  tripEntries: (reportId) =>
    request(`${BASE}/${reportId}/trips/`),

  // ── Analytics (live aggregation) ─────────────────────────────────────────
  kpiSummary:          (params) => request(`${BASE}/analytics/kpi-summary/?${buildQuery(params)}`),
  branchComparison:    (params) => request(`${BASE}/analytics/branch-comparison/?${buildQuery(params)}`),
  timeSeries:          (params) => request(`${BASE}/analytics/time-series/?${buildQuery(params)}`),
  paymentTypeBreakdown:(params) => request(`${BASE}/analytics/payment-type-breakdown/?${buildQuery(params)}`),
  exportSummary:       (params) => request(`${BASE}/analytics/export-summary/?${buildQuery(params)}`),
  exportExcel:         (params) => requestBlob(`${BASE}/export/excel/?${buildQuery(params)}`, "reports_export.xlsx"),

  // ── Reference data ─────────────────────────────────────────────────────────
  courses:  () => request(`${BASE}/courses/`),
  branches: () => request(`${BASE}/branches/`),
};

// ── Practical lessons / trip entries ──────────────────────────────────────────

const PL_BASE = "/api/practical-lessons";

export const practicalLessonsAPI = {
  list:      (params)   => request(`${PL_BASE}/?${buildQuery(params)}`),
  create:    (data)     => request(`${PL_BASE}/`, { method: "POST", body: JSON.stringify(data) }),
  update:    (id, data) => request(`${PL_BASE}/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete:    (id)       => request(`${PL_BASE}/${id}/`, { method: "DELETE" }),
  analytics: (params)   => request(`${PL_BASE}/analytics/?${buildQuery(params)}`),
};