import request, { requestBlob } from "./client";

export const examsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return request(`/api/exams/${qs ? `?${qs}` : ""}`);
  },
  getSummary: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return request(`/api/exams/summary/${qs ? `?${qs}` : ""}`);
  },
  create: (data) => request("/api/exams/", { method: "POST", body: JSON.stringify(data) }),
  closeExam: (id) => request(`/api/exams/${id}/close_exam/`, { method: "POST" }),

  getBookings: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return request(`/api/exam-bookings/${qs ? `?${qs}` : ""}`);
  },
  createBooking: (data) =>
    request("/api/exam-bookings/", { method: "POST", body: JSON.stringify(data) }),
  approve: (id, admin2_comment = "") =>
    request(`/api/exam-bookings/${id}/approve/`, { method: "POST", body: JSON.stringify({ admin2_comment }) }),
  patchBooking: (id, data) =>
    request(`/api/exam-bookings/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  removeBooking: (id) => request(`/api/exam-bookings/${id}/remove_student/`, { method: "POST" }),

  createResult: (data) =>
    request("/api/exam-results/", { method: "POST", body: JSON.stringify(data) }),

  exportExam: (id) => requestBlob(`/api/exams/${id}/export/`, `exam_${id}.xlsx`),
};
