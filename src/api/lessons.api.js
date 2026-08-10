import request from "./client";

const qs = (params) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return q ? `?${q}` : "";
};

export const lessonsAPI = {
  getAll: (params = {}) => request(`/api/lessons/${qs(params)}`),
  getSummary: (studentId, studentCourseId) => request(`/api/lessons/summary/?student_id=${studentId}${studentCourseId ? `&student_course_id=${studentCourseId}` : ""}`),
  create: (data) => request("/api/lessons/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/lessons/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/api/lessons/${id}/`, { method: "DELETE" }),
};

export const instructorsAPI = {
  getAll: (params = {}) => {
    const q = Object.entries(params)
      .filter(([, v]) => v !== "" && v != null)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    return request(`/api/instructors/${q ? `?${q}` : ""}`);
  },
  create: (data) => request("/api/instructors/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/instructors/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/api/instructors/${id}/`, { method: "DELETE" }),
};
