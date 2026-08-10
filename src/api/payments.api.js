import request, { requestBlob } from "./client";

export const paymentsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return request(`/api/payments/${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => request(`/api/payments/${id}/`),
  getSummary: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return request(`/api/payments/summary/${qs ? `?${qs}` : ""}`);
  },
  getByStudentCourse: (student_course_id) => request(`/api/payments/?student_course_id=${student_course_id}`),
  getByStudent: (student_id) => request(`/api/payments/?student_id=${student_id}`),
  create: (data) => request("/api/payments/", { method: "POST", body: JSON.stringify(data) }),
  searchStudentCourse: (payment_reference) =>
    request(`/api/payments/search-student-course/?payment_reference=${encodeURIComponent(payment_reference)}`),
  allocate: (id, student_course_id) =>
    request(`/api/payments/${id}/allocate/`, { method: "POST", body: JSON.stringify({ student_course_id }) }),
  recordPrint: (id) =>
    request(`/api/payments/${id}/record-print/`, { method: "POST" }),
  export: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return requestBlob(`/api/payments/export/${qs ? `?${qs}` : ""}`, "payments_export.xlsx");
  },
};

export const mpesaAPI = {
  stkPush: (student_course_id, phone, amount) =>
    request("/api/payments/coop/stk-push/", {
      method: "POST",
      body: JSON.stringify({ student_course_id, phone, amount }),
    }),
  getStatus: (checkout_request_id, isFinal = false, pollNum = 1) => {
    const params = new URLSearchParams();
    if (isFinal) params.set("final", "1");
    if (pollNum) params.set("poll", String(pollNum));
    const qs = params.toString();
    return request(`/api/payments/coop/status/${checkout_request_id}/${qs ? `?${qs}` : ""}`);
  },
};
