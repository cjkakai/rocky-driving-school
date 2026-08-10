import request from "./client";

export const sessionsAPI = {
  list: (date) =>
    request(`/api/auth/sessions/${date ? `?date=${date}` : ""}`),
};