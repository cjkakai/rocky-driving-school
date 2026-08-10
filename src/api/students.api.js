import request, { requestBlob } from "./client";

const qs = (params) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return q ? `?${q}` : "";
};

export const studentsAPI = {
  getAll: (params = {}) => request(`/api/students/${qs(params)}`),
  getSummary: (params = {}) => request(`/api/students/summary/${qs(params)}`),
  getOne: (id) => request(`/api/students/${id}/`),
  create: (data) => request("/api/students/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/students/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/api/students/${id}/`, { method: "DELETE" }),
  examRoster: (params = {}) => request(`/api/students/exam_roster/${qs(params)}`),
  exportExcel: (params = {}) => requestBlob(`/api/students/export/${qs(params)}`, "students_export.xlsx"),
};
