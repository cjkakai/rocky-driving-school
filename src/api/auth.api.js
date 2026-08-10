import request from "./client";

export const authAPI = {
  login: async (username, password) => {
    const data = await request("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    return {
      id: data.id,
      username: data.username,
      role: data.role,
      branch_id: data.branch_id,
      branch_name: data.branch_name,
    };
  },
  logout: async () => {
    try {
      await request("/api/auth/logout/", { method: "POST" });
    } catch {
      // ignore — clear tokens regardless
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  },
};
