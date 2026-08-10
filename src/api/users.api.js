import request from "./client";

export const usersAPI = {
  getAll: () => request("/api/auth/users/"),
  create: (data) => request("/api/auth/users/", { method: "POST", body: JSON.stringify(data) }),
  delete: (id) => request(`/api/auth/users/${id}/`, { method: "DELETE" }),
  changePassword: (data) => request("/api/auth/users/change-password/", { method: "POST", body: JSON.stringify(data) }),
};
