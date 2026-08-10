import request from "./client";

export const pdlAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/pdl-bookings/${qs ? `?${qs}` : ""}`);
  },
  create: (data) => request("/api/pdl-bookings/", { method: "POST", body: JSON.stringify(data) }),
  approve: (id) => request(`/api/pdl-bookings/${id}/approve/`, { method: "POST" }),
  reject: (id) => request(`/api/pdl-bookings/${id}/reject/`, { method: "POST" }),
};
