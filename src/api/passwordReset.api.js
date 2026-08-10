import request from "./client";

export const passwordResetAPI = {
  requestOTP: (data) =>
    request("/api/auth/password-reset/request-otp/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyOTP: (data) =>
    request("/api/auth/password-reset/verify-otp/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data) =>
    request("/api/auth/password-reset/reset/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};