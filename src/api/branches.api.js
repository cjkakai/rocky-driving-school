import request from "./client";

export const branchesAPI = {
  getAll: () => request("/api/branches/"),
  getById: (id) => request(`/api/branches/${id}/`),
  create: (data) => request("/api/branches/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/branches/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/api/branches/${id}/`, { method: "DELETE" }),
};
